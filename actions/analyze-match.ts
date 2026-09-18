"use server";

import type { Match } from "@/lib/types";
import { getAnalysisAccess, commitAnalysisUsage } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { isMatchAnalyzable } from "@/lib/club-data";
import { logMatchPrediction } from "@/lib/predictions";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { predictMatch, type MatchPrediction } from "@/lib/match-model";
import type {
  MatchAnalysisData,
  ProbableScorer,
  MatchKeyPlayer,
} from "@/lib/analysis-schema";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

/**
 * Hard language directive appended to the prompt so Claude writes every text
 * field in the user's language. The instructions stay in French; only the
 * OUTPUT language changes.
 */
function langDirective(locale: Locale): string {
  return locale === "en"
    ? `\n\nLANGUE DE SORTIE (IMPÉRATIF) : rédige TOUTES les valeurs textuelles du JSON en ANGLAIS (US), ton amical et accessible pour débutants. Les clés JSON restent inchangées. Utilise "you" plutôt qu'un ton formel.`
    : "";
}

type Result = { ok: true; data: MatchAnalysisData } | { ok: false; error: string };

/** The qualitative fields Claude writes (numbers come from our model). */
interface ClaudeMatchText {
  summary: string;
  scenario: string;
  secondaryScenarios: { title: string; detail: string }[];
  keyStrengths: { team: "home" | "away"; points: string[] }[];
  factors: { label: string; kind: "pos" | "neg" | "neutral" }[];
  /** Probable scorers + key players, picked from the real squad (see prompt). */
  probableScorers?: ProbableScorer[];
  firstScorer?: string;
  keyPlayers?: MatchKeyPlayer[];
}

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui décrypte un match à des supporters qui veulent COMPRENDRE ce qui va se passer sur le terrain. Ton chaleureux, simple, tutoiement, zéro jargon non expliqué. Tu traduis chaque chiffre en clair.

On te fournit déjà les CHIFFRES calculés par notre modèle (probabilités, buts attendus, comparaison). Ne les recalcule pas et ne les contredis pas : appuie-toi dessus. Ton rôle est d'écrire le TEXTE de l'analyse. INTERDIT : toute mention de pari, de cote, de mise, de bookmaker, d'argent ou de gain. Tu analyses un match, tu ne conseilles jamais de parier.

Tu réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) au format EXACT :
{
  "summary": "2-3 phrases : qui part favori et l'ambiance du match, en clair",
  "scenario": "3-4 phrases : le déroulé le plus probable du match",
  "secondaryScenarios": [{"title": "ex. Un match à plus de 2 buts", "detail": "explication simple basée sur les chiffres fournis"}],
  "keyStrengths": [{"team": "home", "points": ["force 1", "force 2"]}, {"team": "away", "points": ["force 1"]}],
  "factors": [{"label": "ex. Supériorité offensive", "kind": "pos|neg|neutral"}],
  "probableScorers": [{"name": "Nom EXACT depuis l'effectif fourni", "team": "home|away", "note": "1 phrase courte : pourquoi (forme, rôle, penalties…)"}],
  "firstScorer": "Nom EXACT (depuis l'effectif) du buteur le plus probable d'ouvrir le score",
  "keyPlayers": [{"name": "Nom EXACT depuis l'effectif", "team": "home|away", "role": "ex. Attaquant, Meneur de jeu", "note": "1 phrase : pourquoi le surveiller"}]
}

RÈGLES : 2 à 3 secondaryScenarios, 3 à 5 factors, "home"=équipe à domicile/1ère citée. Base-toi UNIQUEMENT sur les données et chiffres fournis.
RÈGLE JOUEURS (capitale) : pour "probableScorers", "firstScorer" et "keyPlayers", choisis EXCLUSIVEMENT des noms de la liste "JOUEURS RÉELLEMENT EN FORME" fournie plus bas — n'INVENTE JAMAIS un joueur et ne devine pas un nom de mémoire (un grand nom du passé qui n'apparaît PAS dans la liste = il ne joue pas, ne le cite pas). Cette liste est classée par implication réelle (matchs joués, buts) : privilégie les joueurs avec le plus de matchs/buts, JAMAIS un remplaçant peu utilisé. Si la liste est vide, renvoie [] pour probableScorers/keyPlayers et "" pour firstScorer. 2 à 4 probableScorers (favorise les buteurs réels et le côté favori), 2 à 4 keyPlayers répartis entre les 2 équipes. Recopie les noms à l'identique.`;

function buildPrompt(match: Match, pred: MatchPrediction): string {
  const { homeTeam: h, awayTeam: a } = match;

  const formStr = (team: typeof h): string => {
    if (!team.recentForm.length) return "Données non disponibles";
    return team.recentForm
      .slice(0, 8)
      .map((f) => `${f.result}${f.score}(${f.venue ?? ""}${f.opponent.slice(0, 3).toUpperCase()})`)
      .join(" · ");
  };

  const h2hStr = match.h2h.length
    ? match.h2h.map((m) => `${m.date.slice(0, 4)} ${m.homeTeam.slice(0, 3)}-${m.awayTeam.slice(0, 3)} ${m.score}`).join(" | ")
    : "Pas de H2H";

  const cmp = pred.comparison.map((c) => `${c.label} ${c.home}/${c.away}`).join(" · ");

  // Pool the AI must pick scorers / key players from. PREFER real WC involvement
  // (who actually plays + scores this tournament) so it can't elevate uncapped /
  // bench names. Each line carries minutes + goals so Claude favours the regulars
  // and real scorers. Falls back to the registered squad only before kick-off.
  const ATTACK = /(ATT|FW|ST|CF|SS|LW|RW|RF|LF|AIL|AM|CAM|MO|MF|CM|LM|RM|MIL)/i;
  const squadStr = (team: typeof h): string => {
    const contributors = team.recentContributors ?? [];
    if (contributors.length) {
      // Already ranked by goals then minutes upstream — keep the real regulars.
      return contributors
        .slice(0, 16)
        .map((p) => {
          const bits = [`${p.apps} match${p.apps > 1 ? "s" : ""}`];
          if (p.goals) bits.push(`${p.goals} but${p.goals > 1 ? "s" : ""}`);
          if (p.assists) bits.push(`${p.assists} passe${p.assists > 1 ? "s" : ""} D`);
          return `${p.name} (${p.position}, ${bits.join(", ")})`;
        })
        .join(", ");
    }
    // Pre-tournament fallback: registered squad, attackers first.
    const players = team.lineup?.players ?? [];
    if (!players.length) {
      return team.keyPlayers?.length ? `joueurs connus : ${team.keyPlayers.join(", ")}` : "effectif non disponible";
    }
    const sorted = [...players].sort(
      (p1, p2) => (ATTACK.test(p2.position) ? 1 : 0) - (ATTACK.test(p1.position) ? 1 : 0),
    );
    return sorted.slice(0, 16).map((p) => `${p.name} (${p.position})`).join(", ");
  };

  // Real absences for THIS fixture (API-Football /injuries). "Aucune connue"
  // is honest: the provider lists none, it doesn't mean everyone is fit.
  const absStr = (team: typeof h): string => {
    const abs = team.absences ?? [];
    if (!abs.length) return "aucune absence connue";
    const K = { injury: "blessé", suspension: "suspendu", doubt: "incertain", other: "absent" } as const;
    return abs.slice(0, 8).map((x) => `${x.name} (${K[x.kind]}${x.reason ? `, ${x.reason}` : ""})`).join(", ");
  };

  // Home/away splits of the league season — the home side's home numbers, the
  // visitor's away numbers, which is what matters for this fixture.
  const splitStr = (team: typeof h, side: "home" | "away"): string => {
    const st = team.seasonStats;
    if (!st || !st.played[side]) return "";
    const where = side === "home" ? "à domicile" : "à l'extérieur";
    return `${team.name} ${where} cette saison : ${st.played[side]} matchs, ${st.goalsForAvg[side].toFixed(2)} buts marqués/match, ${st.goalsAgainstAvg[side].toFixed(2)} encaissés/match, ${st.cleanSheets[side]} clean sheets, ${st.failedToScore[side]} matchs sans marquer${st.formation ? `, système habituel ${st.formation}` : ""}`;
  };
  const splits = [splitStr(h, "home"), splitStr(a, "away")].filter(Boolean).join("\n");

  // Independent second opinion (API-Football's own model) — agreement or
  // disagreement with our numbers is itself information for the narrative.
  const ap = match.apiPrediction;
  const secondOpinion = ap
    ? `SECOND AVIS (modèle indépendant du fournisseur de données) : ${h.name} ${ap.percent.home}% · Nul ${ap.percent.draw}% · ${a.name} ${ap.percent.away}%${ap.winner ? ` · favori ${ap.winner === "home" ? h.name : ap.winner === "away" ? a.name : "nul"}` : ""}${ap.underOver ? ` · total de buts ${ap.underOver}` : ""}. Si ce second avis diverge de nos chiffres, dis-le en une phrase dans le résumé (sans jamais parler de cotes).`
    : "";

  const comp = match.competition?.name ?? "Coupe du Monde 2026";
  const rankOf = (t: typeof h) =>
    t.leagueRank ? `${t.leagueRank}e au classement` : t.fifaRanking ? `#${t.fifaRanking} FIFA` : "classement inconnu";
  return `${comp} | ${match.round}${match.group && match.group !== "—" ? ` Gr.${match.group}` : ""} | ${match.date} ${match.time} | ${match.stadium}${match.city ? `, ${match.city}` : ""}

${h.flag} ${h.name} (${rankOf(h)}, domicile/1er) vs ${a.flag} ${a.name} (${rankOf(a)})

FORME RÉCENTE (V/N/D, score, lieu, adv) :
${h.flag} ${h.name}: ${formStr(h)}
${a.flag} ${a.name}: ${formStr(a)}

H2H : ${h2hStr}

ABSENCES POUR CE MATCH (réelles, à intégrer dans le scénario et les forces/faiblesses ; un absent ne peut PAS être buteur ni joueur clé) :
${h.flag} ${h.name}: ${absStr(h)}
${a.flag} ${a.name}: ${absStr(a)}
${splits ? `\nDOMICILE / EXTÉRIEUR :\n${splits}\n` : ""}
EFFECTIFS (choisis buteurs & joueurs clés UNIQUEMENT ici, noms exacts, privilégie ceux qui jouent et marquent vraiment, jamais un remplaçant inutilisé) :
${h.flag} ${h.name}: ${squadStr(h)}
${a.flag} ${a.name}: ${squadStr(a)}

CHIFFRES DE NOTRE MODÈLE (à utiliser tels quels) :
- Probabilités : ${h.name} ${pred.probabilities.home}% · Nul ${pred.probabilities.draw}% · ${a.name} ${pred.probabilities.away}%
- Buts attendus : ${h.name} ${pred.expectedGoals.home} · ${a.name} ${pred.expectedGoals.away}
- Plus de 2,5 buts : ${pred.markets.over25}% · Moins de 2,5 buts : ${pred.markets.under25}% · Les deux équipes marquent : ${pred.markets.bttsYes}%
- Comparaison (home/away) : ${cmp}
- Niveau de confiance global : ${pred.confidence}${secondOpinion ? `\n\n${secondOpinion}` : ""}`;
}

async function generate(match: Match, userId: string, locale: Locale): Promise<MatchAnalysisData> {
  const pred = predictMatch(match);

  const text = await callClaudeJson<ClaudeMatchText>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(match, pred) + langDirective(locale),
    maxTokens: 2200,
    kind: "match",
    userId,
  });

  // Merge Claude's narrative with our grounded numbers.
  return {
    summary: text.summary,
    scenario: text.scenario,
    confidence: pred.confidence,
    probabilities: pred.probabilities,
    secondaryScenarios: text.secondaryScenarios ?? [],
    keyStrengths: text.keyStrengths ?? [],
    factors: text.factors ?? [],
    comparison: pred.comparison,
    expectedGoals: pred.expectedGoals,
    markets: pred.markets,
    probableScorers: text.probableScorers ?? [],
    firstScorer: text.firstScorer || undefined,
    keyPlayers: text.keyPlayers ?? [],
  };
}

export async function analyzeMatch(match: Match, locale: Locale = defaultLocale): Promise<Result> {
  const en = locale === "en";
  // No pre-match analysis for a finished match (checked before any credit spend).
  if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
    return {
      ok: false,
      error: en
        ? "This match is over — the pre-match analysis is no longer available."
        : "Ce match est terminé — l'analyse pré-match n'est plus disponible.",
    };
  }

  // The 7-day rule: too far ahead, form and squads aren't settled → no analysis.
  if (!isMatchAnalyzable(match)) {
    return {
      ok: false,
      error: en
        ? "The analysis opens 7 days before kickoff."
        : "L'analyse s'ouvre 7 jours avant le coup d'envoi.",
    };
  }

  // Check access WITHOUT consuming the monthly credit (committed only on success).
  const access = await getAnalysisAccess();
  if ("error" in access) return { ok: false, error: access.error };

  // Re-key by finished WC matches (fresh form after each match) AND by locale, so
  // each language gets its own cached analysis, shared across all users.
  const day = new Date().toISOString().slice(0, 10);
  const finished = match.competition ? 0 : await getWcFinishedCount().catch(() => 0);
  const key = `analysis:match:${match.id}:${day}:wc${finished}:v4:${locale}`;

  try {
    const data = await getCachedOrFetch(key, 86400, () => generate(match, access.userId, locale));
    // Success → only now do we consume the credit (Mini monthly quota) + record usage.
    await commitAnalysisUsage(access);
    await saveAnalysis(access.userId, {
      kind: "match",
      target: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      homeFlag: match.homeTeam.flag,
      awayFlag: match.awayTeam.flag,
      data,
    });
    // Track record: log the IA's structured pick for this match (idempotent).
    await logMatchPrediction(match);
    return { ok: true, data };
  } catch (err) {
    // The Claude/data call failed → the credit is NOT consumed, the user can retry.
    console.error("[analyze-match] error:", err);
    return {
      ok: false,
      error: en
        ? "The analysis is temporarily unavailable. Try again in a moment."
        : "L'analyse est momentanément indisponible. Réessaie dans un instant.",
    };
  }
}
