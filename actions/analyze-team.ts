"use server";

import type { Team } from "@/lib/types";
import { requireAnalysisAccess } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { getTeamSimulation, type TeamSimResult } from "@/lib/simulation";
import type { TeamAnalysisData } from "@/lib/analysis-schema";

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

RÈGLES : 2 à 3 forces, 2 à 3 faiblesses, 2 à 3 joueurs (tirés de l'effectif fourni, sans inventer de stats), 2 à 3 idées de paris (ex. se qualifie de son groupe, atteint les 8es, marque +1.5 but, tel joueur buteur). Base-toi UNIQUEMENT sur les données fournies. Si une info manque, reste prudent. Pas de stat inventée.`;

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

  const squad = team.lineup.players.length
    ? team.lineup.players.slice(0, 26).map((p) => `${p.name} (${p.position})`).join(", ")
    : "Effectif non communiqué";

  const simStr = sim
    ? `NOTRE SIMULATION (probabilités, à lire en clair) :
- Victoire finale : ${sim.title}% · Étape probable : ${sim.probableStage}
- Atteindre : 16es ${sim.reachR32}% · 8es ${sim.reachR16}% · 1/4 ${sim.reachQF}% · 1/2 ${sim.reachSF}% · finale ${sim.reachFinal}%
- 1er de son groupe : ${sim.winGroup}% · qualifié (top 2) : ${(sim.winGroup + sim.runnerUp).toFixed(0)}%
- Buts projetés sur le tournoi : ${sim.projGoals}${sim.probableScorer ? ` · buteur probable : ${sim.probableScorer.name} (~${sim.probableScorer.expectedGoals} buts)` : ""}`
    : "Simulation non disponible.";

  return `ÉQUIPE : ${team.flag} ${team.name} — #${team.fifaRanking} FIFA${team.coach ? ` · Sélectionneur : ${team.coach}` : ""}

FORME RÉCENTE (plus récent → ancien · V/N/D, score, lieu, adversaire) :
${formStr}

MOMENTUM : ${momentumStr}

EFFECTIF (noms et postes réels) :
${squad}

${simStr}`;
}

async function generate(team: Team, slug: string): Promise<TeamAnalysisData> {
  const sim = await getTeamSimulation(slug);
  return callClaudeJson<TeamAnalysisData>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(team, sim),
    maxTokens: 1400,
  });
}

export async function analyzeTeam(team: Team, slug: string): Promise<Result> {
  const guard = await requireAnalysisAccess();
  if ("error" in guard) return { ok: false, error: guard.error };

  // Re-key by finished WC matches so the team analysis refreshes as results land.
  const day = new Date().toISOString().slice(0, 10);
  const finished = await getWcFinishedCount().catch(() => 0);
  const key = `analysis:team:${slug}:${day}:wc${finished}`;

  try {
    // Shared daily cache → one Claude call per team per day, reused by everyone.
    const data = await getCachedOrFetch(key, 86400, () => generate(team, slug));
    // Record in this user's history (best-effort).
    await saveAnalysis(guard.userId, {
      kind: "team",
      target: slug,
      title: team.name,
      homeFlag: team.flag,
      data,
    });
    return { ok: true, data };
  } catch (err) {
    console.error("[analyze-team] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de l'analyse." };
  }
}
