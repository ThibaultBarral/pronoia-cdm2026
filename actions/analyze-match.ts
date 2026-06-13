"use server";

import type { Match } from "@/lib/types";
import { getAnalysisAccess, commitAnalysisUsage } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { getBettorProfile, bettorProfilePromptContext } from "@/lib/bettor-profile";
import { logMatchPrediction } from "@/lib/predictions";
import { selectValueBet, type ValueBet } from "@/lib/value-bet";
import { fmtCote } from "@/lib/value";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { predictMatch, type MatchPrediction } from "@/lib/match-model";
import type { Playstyle } from "@/lib/bankroll";
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
    "bet": "reprends le pari du VERDICT VALUE fourni",
    "odds": "la cote du verdict",
    "confidence": "Faible|Moyen|Élevé|Très élevé",
    "stake": "selon le verdict",
    "rationale": "1-2 phrases qui expliquent le verdict de value en clair"
  }
}

RÈGLES : 2 à 3 secondaryScenarios, 3 à 5 factors, "home"=équipe à domicile/1ère citée. Base-toi UNIQUEMENT sur les données et chiffres fournis.
RÈGLE VALUE (capitale) : la RECOMMANDATION est imposée par le VERDICT VALUE de notre moteur. Ne propose JAMAIS un autre pari, ne contredis pas l'EV. Si l'EV est ≤ 0 ("Pas de value"), explique honnêtement qu'aucun pari n'a de valeur au prix actuel et conseille de NE PAS miser — n'écris JAMAIS "value", "bon pari" ou "ça sent la value" dans ce cas. Une probabilité de victoire élevée n'est PAS une value si la cote est trop basse. Seul ton "rationale" est conservé (le moteur réécrit bet/odds/confidence/stake).`;

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

const TIER_LABEL = { value: "VALUE", marginal: "value marginale", none: "PAS DE VALUE" } as const;

function valueVerdictPrompt(vb: ValueBet | null): string {
  if (!vb) return "\n\nVERDICT VALUE : cotes indisponibles — reste prudent, ne conseille pas de pari ferme.";
  const evPct = `${vb.ev >= 0 ? "+" : ""}${(vb.ev * 100).toFixed(1)}%`;
  return `\n\nVERDICT VALUE (calculé par notre moteur — NE LE CONTREDIS JAMAIS) :
- Meilleur pari à valeur : ${vb.selection} (${vb.market}) @ ${fmtCote(vb.cote)}
- Proba modèle : ${Math.round(vb.proba * 100)}% · Cote mini pour value : ${fmtCote(vb.coteMin)} · EV : ${evPct} → ${TIER_LABEL[vb.tier]}
→ Rédige le "rationale" en cohérence STRICTE avec ce verdict (2 phrases max).`;
}

/** Build the final recommendation from the engine's value verdict + Claude's text. */
function buildRecommendation(vb: ValueBet | null, rationale: string): MatchAnalysisData["recommendation"] {
  if (!vb) {
    return {
      bet: "Aucun pari à valeur (cotes indisponibles)",
      confidence: "Faible",
      stake: "Ne pas jouer",
      rationale: rationale || "Cotes indisponibles : pas de recommandation de pari fiable sur ce match.",
      valueTier: "none",
    };
  }
  const stake =
    vb.tier === "none"
      ? "Ne pas jouer ce pari (pas de value)"
      : vb.tier === "marginal"
        ? "Mise prudente : 1% max"
        : "1 à 3% de ta bankroll";
  return {
    bet: vb.tier === "none" ? "Aucun pari à valeur sur ce match" : `${vb.selection} (${vb.market})`,
    odds: fmtCote(vb.cote),
    bookmaker: vb.bookmaker,
    confidence: vb.confidence,
    stake,
    rationale,
    ev: Math.round(vb.ev * 1000) / 1000,
    coteMin: Math.round(vb.coteMin * 100) / 100,
    valueTier: vb.tier,
    probaModele: Math.round(vb.proba * 100),
  };
}

async function generate(match: Match, profile: Playstyle | null): Promise<MatchAnalysisData> {
  const pred = predictMatch(match);
  const valueBet = await selectValueBet(match).catch(() => null);
  const text = await callClaudeJson<ClaudeMatchText>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(match, pred) + valueVerdictPrompt(valueBet) + bettorProfilePromptContext(profile),
    maxTokens: 1500,
  });

  // Confidence reflects the BET's expected value (not just the win probability).
  const confidence = valueBet ? valueBet.confidence : pred.confidence;

  // Merge Claude's narrative with our grounded numbers + the engine's value verdict.
  return {
    summary: text.summary,
    scenario: text.scenario,
    confidence,
    probabilities: pred.probabilities,
    secondaryScenarios: text.secondaryScenarios ?? [],
    keyStrengths: text.keyStrengths ?? [],
    factors: text.factors ?? [],
    comparison: pred.comparison,
    expectedGoals: pred.expectedGoals,
    markets: pred.markets,
    recommendation: buildRecommendation(valueBet, text.recommendation?.rationale ?? ""),
  };
}

export async function analyzeMatch(match: Match): Promise<Result> {
  // No pre-match analysis for a finished match (checked before any credit spend).
  if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
    return { ok: false, error: "Ce match est terminé — l'analyse pré-match n'est plus disponible." };
  }

  // Check access WITHOUT consuming the free analysis (committed only on success).
  const access = await getAnalysisAccess();
  if ("error" in access) return { ok: false, error: access.error };

  // Re-key by finished WC matches (fresh form after each match) AND by the
  // caller's bettor profile → the recommendation adapts to their play style.
  // Each (match, day, results, profile) is still shared across same-profile users.
  const day = new Date().toISOString().slice(0, 10);
  const finished = await getWcFinishedCount().catch(() => 0);
  const profile = await getBettorProfile().catch(() => null);
  const key = `analysis:match:${match.id}:${day}:wc${finished}:${profile ?? "none"}:ev2`;

  try {
    const data = await getCachedOrFetch(key, 86400, () => generate(match, profile));
    // Success → only now do we consume the free credit + record usage.
    await commitAnalysisUsage(access.isFree);
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
    // The Claude/data call failed → the free analysis is NOT consumed, the user
    // can retry. Show a clean message (never the raw provider error).
    console.error("[analyze-match] error:", err);
    return { ok: false, error: "L'analyse est momentanément indisponible. Réessaie dans un instant." };
  }
}
