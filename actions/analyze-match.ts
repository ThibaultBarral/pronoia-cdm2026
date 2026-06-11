"use server";

import type { Match } from "@/lib/types";
import { requireAnalysisAccess } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { predictMatch, type MatchPrediction } from "@/lib/match-model";
import type { MatchAnalysisData } from "@/lib/analysis-schema";

type Result = { ok: true; data: MatchAnalysisData } | { ok: false; error: string };

/** The qualitative fields Claude writes (numbers come from our model). */
interface ClaudeMatchText {
  summary: string;
  scenario: string;
  secondaryScenarios: { title: string; detail: string }[];
  keyStrengths: { team: "home" | "away"; points: string[] }[];
  factors: { label: string; kind: "pos" | "neg" | "neutral" }[];
  recommendation: {
    bet: string;
    odds?: string;
    bookmaker?: string;
    confidence: "Faible" | "Moyen" | "Élevé" | "Très élevé";
    stake: string;
    rationale: string;
  };
}

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui explique les paris de la Coupe du Monde 2026 à des DÉBUTANTS. Ton chaleureux, simple, un peu fun, tutoiement, zéro jargon non expliqué. Tu traduis chaque chiffre en clair et rappelles de miser petit, pour le plaisir.

On te fournit déjà les CHIFFRES calculés par notre modèle (probabilités, buts attendus, over/under, comparaison). Ne les recalcule pas et ne les contredis pas : appuie-toi dessus. Ton rôle est d'écrire le TEXTE et la RECOMMANDATION de pari.

Tu réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) au format EXACT :
{
  "summary": "2-3 phrases : qui part favori et l'ambiance du match, en clair",
  "scenario": "3-4 phrases : le déroulé le plus probable du match",
  "secondaryScenarios": [{"title": "ex. Over 2.5 buts", "detail": "explication simple basée sur les chiffres fournis"}],
  "keyStrengths": [{"team": "home", "points": ["force 1", "force 2"]}, {"team": "away", "points": ["force 1"]}],
  "factors": [{"label": "ex. Supériorité offensive", "kind": "pos|neg|neutral"}],
  "recommendation": {
    "bet": "le pari conseillé en mots simples",
    "odds": "cote si disponible dans les cotes fournies, sinon omettre",
    "bookmaker": "bookmaker si cote fournie, sinon omettre",
    "confidence": "Faible|Moyen|Élevé|Très élevé",
    "stake": "1 à 3% de ta cagnotte",
    "rationale": "1-2 phrases : pourquoi ce pari a de la valeur, en clair"
  }
}

RÈGLES : 2 à 3 secondaryScenarios, 3 à 5 factors, "home"=équipe à domicile/1ère citée. Base-toi UNIQUEMENT sur les données et chiffres fournis. Si les cotes manquent, baisse la confiance et n'invente pas de cote.`;

function buildPrompt(match: Match, pred: MatchPrediction): string {
  const { homeTeam: h, awayTeam: a } = match;

  const formStr = (team: typeof h): string => {
    if (!team.recentForm.length) return "Données non disponibles";
    return team.recentForm
      .slice(0, 8)
      .map((f) => `${f.result}${f.score}(${f.venue ?? ""}${f.opponent.slice(0, 3).toUpperCase()})`)
      .join(" · ");
  };

  const oddsStr = match.odds.length
    ? match.odds.map((o) => `${o.bookmaker}: 1=${o.home} N=${o.draw} 2=${o.away}`).join(" | ")
    : "Cotes non disponibles";

  const h2hStr = match.h2h.length
    ? match.h2h.map((m) => `${m.date.slice(0, 4)} ${m.homeTeam.slice(0, 3)}-${m.awayTeam.slice(0, 3)} ${m.score}`).join(" | ")
    : "Pas de H2H";

  const cmp = pred.comparison.map((c) => `${c.label} ${c.home}/${c.away}`).join(" · ");

  return `CDM 2026 | ${match.round}${match.group ? ` Gr.${match.group}` : ""} | ${match.date} ${match.time} | ${match.stadium}, ${match.city}

${h.flag} ${h.name} (#${h.fifaRanking} FIFA, domicile/1er) vs ${a.flag} ${a.name} (#${a.fifaRanking} FIFA)

FORME RÉCENTE (V/N/D, score, lieu, adv) :
${h.flag} ${h.name}: ${formStr(h)}
${a.flag} ${a.name}: ${formStr(a)}

H2H : ${h2hStr}
COTES : ${oddsStr}

CHIFFRES DE NOTRE MODÈLE (à utiliser tels quels) :
- Probabilités : ${h.name} ${pred.probabilities.home}% · Nul ${pred.probabilities.draw}% · ${a.name} ${pred.probabilities.away}%
- Buts attendus : ${h.name} ${pred.expectedGoals.home} · ${a.name} ${pred.expectedGoals.away}
- Over 2.5 : ${pred.markets.over25}% · Under 2.5 : ${pred.markets.under25}% · Les deux marquent : ${pred.markets.bttsYes}%
- Comparaison (home/away) : ${cmp}
- Niveau de confiance global : ${pred.confidence}`;
}

async function generate(match: Match): Promise<MatchAnalysisData> {
  const pred = predictMatch(match);
  const text = await callClaudeJson<ClaudeMatchText>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(match, pred),
    maxTokens: 1500,
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
    recommendation: text.recommendation,
  };
}

export async function analyzeMatch(match: Match): Promise<Result> {
  // No pre-match analysis for a finished match (checked before any credit spend).
  if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
    return { ok: false, error: "Ce match est terminé — l'analyse pré-match n'est plus disponible." };
  }

  const guard = await requireAnalysisAccess();
  if ("error" in guard) return { ok: false, error: guard.error };

  // Re-key by the number of finished WC matches → the analysis recomputes (with
  // fresh form) whenever a match finishes, not just once a day.
  const day = new Date().toISOString().slice(0, 10);
  const finished = await getWcFinishedCount().catch(() => 0);
  const key = `analysis:match:${match.id}:${day}:wc${finished}`;

  try {
    const data = await getCachedOrFetch(key, 86400, () => generate(match));
    await saveAnalysis(guard.userId, {
      kind: "match",
      target: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      homeFlag: match.homeTeam.flag,
      awayFlag: match.awayTeam.flag,
      data,
    });
    return { ok: true, data };
  } catch (err) {
    console.error("[analyze-match] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de l'analyse." };
  }
}
