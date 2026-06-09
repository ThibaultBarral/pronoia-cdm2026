/**
 * Deterministic quantitative match model (SERVER ONLY).
 *
 * Produces the *numbers* shown in a match analysis (1X2 probabilities, expected
 * goals, over/under & BTTS, stat-comparison bars) from real data — FIFA ranking,
 * live momentum and bookmaker odds — so Claude never has to invent figures. The
 * LLM only writes the qualitative narrative around these grounded numbers.
 */
import "server-only";

import type { Match, Team } from "./types";
import type { Confidence } from "./analysis-schema";

const BASE_TOTAL_GOALS = 2.6;
const MAX_SUPREMACY = 3;
const RATING_PER_GOAL = 200;

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function poissonPmf(lambda: number, k: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function ratingFromRank(rank: number): number {
  const r = rank > 0 ? Math.min(rank, 120) : 80;
  return 2000 - 7.5 * r;
}

/** Rating from FIFA rank, nudged by live momentum (last-5 points). */
function ratingOf(team: Team): number {
  let bonus = 0;
  if (team.momentum) {
    // last5Pts ∈ [0,15] → bonus ∈ [-30,+30]
    bonus = ((team.momentum.last5Pts - 7.5) / 7.5) * 30;
  }
  return ratingFromRank(team.fifaRanking) + bonus;
}

function expectedGoals(rA: number, rB: number): { la: number; lb: number } {
  let s = (rA - rB) / RATING_PER_GOAL;
  s = Math.max(-MAX_SUPREMACY, Math.min(MAX_SUPREMACY, s));
  return {
    la: Math.max(0.15, BASE_TOTAL_GOALS / 2 + s / 2),
    lb: Math.max(0.15, BASE_TOTAL_GOALS / 2 - s / 2),
  };
}

export interface MatchPrediction {
  probabilities: { home: number; draw: number; away: number };
  expectedGoals: { home: number; away: number };
  markets: { over25: number; under25: number; bttsYes: number; bttsNo: number };
  comparison: { label: string; home: number; away: number }[];
  confidence: Confidence;
}

/** Implied 1X2 probabilities from the best available odds (margin removed). */
function impliedFromOdds(match: Match): { home: number; draw: number; away: number } | null {
  const o = match.odds[0];
  if (!o || !o.home || !o.draw || !o.away) return null;
  const ih = 1 / o.home;
  const id = 1 / o.draw;
  const ia = 1 / o.away;
  const sum = ih + id + ia;
  if (sum <= 0) return null;
  return { home: ih / sum, draw: id / sum, away: ia / sum };
}

function confidenceFromGap(probs: { home: number; draw: number; away: number }): Confidence {
  const max = Math.max(probs.home, probs.draw, probs.away);
  if (max >= 0.6) return "Très élevé";
  if (max >= 0.48) return "Élevé";
  if (max >= 0.38) return "Moyen";
  return "Faible";
}

function bar(home: number, away: number): { home: number; away: number } {
  const total = home + away;
  if (total <= 0) return { home: 50, away: 50 };
  const h = Math.round((home / total) * 100);
  return { home: h, away: 100 - h };
}

/** Compute the full quantitative prediction for a match. */
export function predictMatch(match: Match): MatchPrediction {
  const h = match.homeTeam;
  const a = match.awayTeam;
  const rH = ratingOf(h);
  const rA = ratingOf(a);
  const { la, lb } = expectedGoals(rH, rA);

  // Poisson grid for 1X2 + markets.
  const MAX = 8;
  let pWin = 0;
  let pDraw = 0;
  let pLoss = 0;
  let over25 = 0;
  let bttsYes = 0;
  for (let i = 0; i <= MAX; i++) {
    const pi = poissonPmf(la, i);
    for (let j = 0; j <= MAX; j++) {
      const p = pi * poissonPmf(lb, j);
      if (i > j) pWin += p;
      else if (i === j) pDraw += p;
      else pLoss += p;
      if (i + j > 2.5) over25 += p;
      if (i >= 1 && j >= 1) bttsYes += p;
    }
  }

  // Blend the model with the market (odds) when available (60% market / 40% model).
  const modelProbs = { home: pWin, draw: pDraw, away: pLoss };
  const implied = impliedFromOdds(match);
  const probabilities = implied
    ? {
        home: 0.6 * implied.home + 0.4 * modelProbs.home,
        draw: 0.6 * implied.draw + 0.4 * modelProbs.draw,
        away: 0.6 * implied.away + 0.4 * modelProbs.away,
      }
    : modelProbs;

  const pct = (x: number) => Math.round(x * 100);

  // Comparison bars from live momentum (fall back to rating).
  const hm = h.momentum;
  const am = a.momentum;
  const attaque = bar(hm?.goalsForAvg ?? rH / 1000, am?.goalsForAvg ?? rA / 1000);
  const defense = bar(
    1 / (1 + (hm?.goalsAgainstAvg ?? 1)),
    1 / (1 + (am?.goalsAgainstAvg ?? 1))
  );
  const forme = bar(hm?.last5Pts ?? 7, am?.last5Pts ?? 7);
  const global = bar(rH, rA);

  return {
    probabilities: {
      home: pct(probabilities.home),
      draw: pct(probabilities.draw),
      away: pct(probabilities.away),
    },
    expectedGoals: {
      home: Math.round(la * 100) / 100,
      away: Math.round(lb * 100) / 100,
    },
    markets: {
      over25: pct(over25),
      under25: pct(1 - over25),
      bttsYes: pct(bttsYes),
      bttsNo: pct(1 - bttsYes),
    },
    comparison: [
      { label: "Attaque", ...attaque },
      { label: "Défense", ...defense },
      { label: "Forme", ...forme },
      { label: "Global", ...global },
    ],
    confidence: confidenceFromGap(probabilities),
  };
}
