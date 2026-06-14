"use server";

import type { Match } from "@/lib/types";
import { getAnalysisAccess, commitAnalysisUsage } from "@/lib/ai-guard";
import { callClaudeJson } from "@/lib/claude-json";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { logMatchPrediction } from "@/lib/predictions";
import { selectValueBetsByProfile, type ValueBet } from "@/lib/value-bet";
import { fmtCote, confidenceFromProba } from "@/lib/value";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { predictMatch, type MatchPrediction } from "@/lib/match-model";
import { PLAYSTYLES, type Playstyle } from "@/lib/bankroll";
import type { BetRecommendation, MatchAnalysisData } from "@/lib/analysis-schema";

type Result = { ok: true; data: MatchAnalysisData } | { ok: false; error: string };

/** The bettor profiles we generate a recommendation for, in display order. */
const PROFILE_IDS = PLAYSTYLES.map((p) => p.id);

/** The qualitative fields Claude writes (numbers come from our model). */
interface ClaudeMatchText {
  summary: string;
  scenario: string;
  secondaryScenarios: { title: string; detail: string }[];
  keyStrengths: { team: "home" | "away"; points: string[] }[];
  factors: { label: string; kind: "pos" | "neg" | "neutral" }[];
  /** One short rationale per bettor profile (keyed by profile id). */
  recommendations: Partial<Record<Playstyle, { rationale: string }>>;
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
  "recommendations": {
    "safe": {"rationale": "1-2 phrases qui expliquent le pari du profil Prudent en clair"},
    "balanced": {"rationale": "1-2 phrases pour le profil Équilibré"},
    "opportunist": {"rationale": "1-2 phrases pour le profil Chercheur de bons coups"},
    "aggressive": {"rationale": "1-2 phrases pour le profil Audacieux"}
  }
}

RÈGLES : 2 à 3 secondaryScenarios, 3 à 5 factors, "home"=équipe à domicile/1ère citée. Base-toi UNIQUEMENT sur les données et chiffres fournis.
RÈGLE VALUE (capitale) : chaque profil a SON pari, imposé par le VERDICT VALUE de notre moteur (fourni plus bas, un par profil). Pour CHAQUE profil, rédige le "rationale" en cohérence STRICTE avec SON verdict — ne propose JAMAIS un autre pari, ne contredis pas l'EV. Si l'EV d'un profil est ≤ 0 ("Pas de value"), explique honnêtement que ce pari n'a pas de valeur au prix actuel et conseille de NE PAS miser — n'écris JAMAIS "value", "bon pari" ou "ça sent la value" dans ce cas. Une probabilité de victoire élevée n'est PAS une value si la cote est trop basse. Seul ton "rationale" est conservé (le moteur réécrit bet/odds/confidence/stake).`;

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

/** One value verdict per profile — the bet TYPE adapts to each play style. */
function valueVerdictsPrompt(bets: Record<Playstyle, ValueBet | null>): string {
  const lines = PLAYSTYLES.map((ps) => {
    const vb = bets[ps.id];
    if (!vb) {
      return `• ${ps.label} ${ps.emoji} (${ps.id}) : cotes indisponibles — pas de pari ferme.`;
    }
    const evPct = `${vb.ev >= 0 ? "+" : ""}${(vb.ev * 100).toFixed(1)}%`;
    return `• ${ps.label} ${ps.emoji} (${ps.id}) : ${vb.selection} (${vb.market}) @ ${fmtCote(vb.cote)} · proba ${Math.round(vb.proba * 100)}% · EV ${evPct} → ${TIER_LABEL[vb.tier]}`;
  }).join("\n");
  return `\n\nVERDICT VALUE PAR PROFIL (calculé par notre moteur — NE LE CONTREDIS JAMAIS, un "rationale" par profil) :
${lines}`;
}

/** Build the final recommendation from the engine's value verdict + Claude's text. */
function buildRecommendation(
  vb: ValueBet | null,
  rationale: string,
  profile: Playstyle,
): BetRecommendation {
  if (!vb) {
    return {
      bet: "Aucun pari à valeur (cotes indisponibles)",
      confidence: "Faible",
      stake: "Ne pas jouer",
      rationale: rationale || "Cotes indisponibles : pas de recommandation de pari fiable sur ce match.",
      valueTier: "none",
      basis: "value",
    };
  }

  // Prudent = a "banker": the most likely outcome, proposed even without value,
  // framed honestly on PROBABILITY (not a fake +EV claim).
  if (profile === "safe") {
    return {
      bet: `${vb.selection} (${vb.market})`,
      odds: fmtCote(vb.cote),
      bookmaker: vb.bookmaker,
      confidence: confidenceFromProba(vb.proba),
      stake: "Mise prudente : 1 à 2% de ta bankroll",
      rationale,
      ev: Math.round(vb.ev * 1000) / 1000,
      coteMin: Math.round(vb.coteMin * 100) / 100,
      valueTier: vb.tier,
      probaModele: Math.round(vb.proba * 100),
      basis: "probability",
    };
  }

  const stake =
    vb.tier === "none"
      ? "Ne pas jouer ce pari (pas de value)"
      : vb.tier === "marginal"
        ? "Mise prudente : 1% max"
        : "1 à 3% de ta bankroll";
  return {
    // Always name the distinct pick (variety across profiles); the value badge +
    // stake stay honest about whether it's actually worth playing.
    bet: `${vb.selection} (${vb.market})`,
    odds: fmtCote(vb.cote),
    bookmaker: vb.bookmaker,
    confidence: vb.confidence,
    stake,
    rationale,
    ev: Math.round(vb.ev * 1000) / 1000,
    coteMin: Math.round(vb.coteMin * 100) / 100,
    valueTier: vb.tier,
    probaModele: Math.round(vb.proba * 100),
    basis: "value",
  };
}

async function generate(match: Match, userId: string): Promise<MatchAnalysisData> {
  const pred = predictMatch(match);
  // One grounded value verdict per profile (single odds fetch shared across all).
  const emptyBets = Object.fromEntries(PROFILE_IDS.map((p) => [p, null])) as Record<Playstyle, ValueBet | null>;
  const bets = await selectValueBetsByProfile(match, PROFILE_IDS).catch(() => emptyBets);

  const text = await callClaudeJson<ClaudeMatchText>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(match, pred) + valueVerdictsPrompt(bets),
    maxTokens: 1800,
    kind: "match",
    userId,
  });

  // A recommendation per profile (bet TYPE/boldness adapts to the play style).
  const recommendationsByProfile = Object.fromEntries(
    PROFILE_IDS.map((p) => [
      p,
      buildRecommendation(bets[p], text.recommendations?.[p]?.rationale ?? "", p),
    ]),
  ) as Record<Playstyle, BetRecommendation>;

  // Canonical default = the pure best-EV (Chercheur de bons coups) view.
  const canonical = recommendationsByProfile.opportunist;
  // Confidence reflects the BET's expected value (not just the win probability).
  const confidence = bets.opportunist ? bets.opportunist.confidence : pred.confidence;

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
    recommendation: canonical,
    recommendationsByProfile,
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

  // Re-key by finished WC matches (fresh form after each match). The analysis now
  // carries a recommendation for EVERY profile, so it's profile-independent and
  // shared across all users — the UI toggles between profiles client-side.
  const day = new Date().toISOString().slice(0, 10);
  const finished = await getWcFinishedCount().catch(() => 0);
  const key = `analysis:match:${match.id}:${day}:wc${finished}:profiles3`;

  try {
    const data = await getCachedOrFetch(key, 86400, () => generate(match, access.userId));
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
