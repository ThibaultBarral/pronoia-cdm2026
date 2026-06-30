"use server";

import type { Team } from "@/lib/types";
import { getAnalysisAccess, commitAnalysisUsage } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { getTeamSimulation, type TeamSimResult } from "@/lib/simulation";
import type { TeamAnalysisData } from "@/lib/analysis-schema";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type Result = { ok: true; data: TeamAnalysisData } | { ok: false; error: string };

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui présente une ÉQUIPE de la Coupe du Monde 2026 à des DÉBUTANTS, pour les aider à parier malin. Ton chaleureux, simple, un peu fun, tutoiement, zéro jargon non expliqué. Tu traduis chaque chiffre en clair et rappelles de miser petit, pour le plaisir.

Tu réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) respectant EXACTEMENT ce format :
{
  "numbersRead": "2-3 phrases qui lisent les probabilités de notre simulation en langage clair (chances d'aller loin, parcours probable, buteur probable)",
  "analysisText": "2-3 phrases d'analyse qualitative (style de jeu, forme, ce qui rend cette équipe (in)intéressante à suivre)",
  "strengths": [{"label": "force courte", "detail": "explication simple"}],
  "weaknesses": [{"label": "faiblesse courte", "detail": "explication simple"}],
  "keyPlayers": [{"name": "Nom", "note": "pourquoi le surveiller"}],
  "betIdeas": [{"label": "idée de pari concrète sur CETTE équipe", "rationale": "pourquoi, en clair", "confidence": "Faible|Moyen|Élevé"}]
}

RÈGLES : 2 à 3 forces, 2 à 3 faiblesses, 2 à 3 joueurs choisis EXCLUSIVEMENT dans la liste "JOUEURS RÉELLEMENT EN FORME" (privilégie ceux avec le plus de matchs/buts ; n'invente JAMAIS un nom et ne cite JAMAIS un grand nom du passé absent de la liste — s'il n'y est pas, il ne joue pas), 2 à 3 idées de paris (ex. se qualifie de son groupe, atteint les 8es, marque +1.5 but, tel joueur buteur). Base-toi UNIQUEMENT sur les données fournies. Si une info manque, reste prudent. Pas de stat inventée.`;

function buildPrompt(team: Team, sim: TeamSimResult | null): string {
  const formStr = team.recentForm.length
    ? team.recentForm
        .slice(0, 10)
        .map((f) => `${f.result}${f.score}(${f.venue ?? ""}${f.opponent.slice(0, 3).toUpperCase()})`)
        .join(" · ")
    : "Données de forme non disponibles";

  const m = team.momentum;
  const momentumStr = m
    ? `${m.last5Pts}/15 pts (5 derniers) · ${m.goalsForAvg} but marqué / ${m.goalsAgainstAvg} encaissé par match · ${m.cleanSheets} clean sheets · ${m.trend === "hot" ? "en forme 🔥" : m.trend === "cold" ? "en méforme ❄️" : "irrégulier"}`
    : "—";

  // Prefer real WC 2026 involvement (who actually plays/scores) over the raw
  // registered roster, so the AI never highlights an uncapped / bench name.
  const contributors = team.recentContributors ?? [];
  const squad = contributors.length
    ? contributors
        .slice(0, 20)
        .map((p) => {
          const bits = [`${p.apps} match${p.apps > 1 ? "s" : ""}`];
          if (p.goals) bits.push(`${p.goals} but${p.goals > 1 ? "s" : ""}`);
          return `${p.name} (${p.position}, ${bits.join(", ")})`;
        })
        .join(", ")
    : team.lineup.players.length
      ? team.lineup.players.slice(0, 26).map((p) => `${p.name} (${p.position})`).join(", ")
      : "Effectif non communiqué";

  // Prefer the REAL tournament top scorer (involvement is sorted goals-first) over
  // the static keyPlayers[0] guess, so the "buteur probable" hint never names a
  // player who isn't actually scoring.
  const realTopScorer = contributors.find((p) => p.goals > 0);
  const scorerHint = realTopScorer
    ? ` · meilleur buteur réel : ${realTopScorer.name} (${realTopScorer.goals} but${realTopScorer.goals > 1 ? "s" : ""} CDM)`
    : sim?.probableScorer
      ? ` · buteur probable : ${sim.probableScorer.name} (~${sim.probableScorer.expectedGoals} buts)`
      : "";
  const simStr = sim
    ? `NOTRE SIMULATION (probabilités, à lire en clair) :
- Victoire finale : ${sim.title}% · Étape probable : ${sim.probableStage}
- Atteindre : 16es ${sim.reachR32}% · 8es ${sim.reachR16}% · 1/4 ${sim.reachQF}% · 1/2 ${sim.reachSF}% · finale ${sim.reachFinal}%
- 1er de son groupe : ${sim.winGroup}% · qualifié (top 2) : ${(sim.winGroup + sim.runnerUp).toFixed(0)}%
- Buts projetés sur le tournoi : ${sim.projGoals}${scorerHint}`
    : "Simulation non disponible.";

  return `ÉQUIPE : ${team.flag} ${team.name} — #${team.fifaRanking} FIFA${team.coach ? ` · Sélectionneur : ${team.coach}` : ""}

FORME RÉCENTE (plus récent → ancien · V/N/D, score, lieu, adversaire) :
${formStr}

MOMENTUM : ${momentumStr}

JOUEURS RÉELLEMENT EN FORME (classés par implication CDM 2026 : matchs joués, buts — cite UNIQUEMENT ces joueurs, jamais un grand nom absent de la liste) :
${squad}

${simStr}`;
}

function langDirective(locale: Locale): string {
  return locale === "en"
    ? `\n\nLANGUE DE SORTIE (IMPÉRATIF) : rédige TOUTES les valeurs textuelles du JSON en ANGLAIS (US), ton amical et accessible pour débutants. Les clés JSON restent inchangées.`
    : "";
}

async function generate(team: Team, slug: string, userId: string, locale: Locale): Promise<TeamAnalysisData> {
  const sim = await getTeamSimulation(slug);
  return callClaudeJson<TeamAnalysisData>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(team, sim) + langDirective(locale),
    maxTokens: 1400,
    kind: "team",
    userId,
  });
}

export async function analyzeTeam(team: Team, slug: string, locale: Locale = defaultLocale): Promise<Result> {
  // Check access WITHOUT consuming the free analysis (committed only on success).
  const access = await getAnalysisAccess();
  if ("error" in access) return { ok: false, error: access.error };

  // Re-key by finished WC matches AND locale so each language refreshes/caches apart.
  const day = new Date().toISOString().slice(0, 10);
  const finished = await getWcFinishedCount().catch(() => 0);
  const key = `analysis:team:${slug}:${day}:wc${finished}:realpool1:${locale}`;

  try {
    // Shared daily cache → one Claude call per team per day per language, reused by everyone.
    const data = await getCachedOrFetch(key, 86400, () => generate(team, slug, access.userId, locale));
    // Success → only now do we consume the free credit + record usage.
    await commitAnalysisUsage(access.isFree);
    await saveAnalysis(access.userId, {
      kind: "team",
      target: slug,
      title: team.name,
      homeFlag: team.flag,
      data,
    });
    return { ok: true, data };
  } catch (err) {
    console.error("[analyze-team] error:", err);
    return {
      ok: false,
      error: locale === "en"
        ? "The analysis is temporarily unavailable. Try again in a moment."
        : "L'analyse est momentanément indisponible. Réessaie dans un instant.",
    };
  }
}
