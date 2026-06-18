"use server";

import type { Match } from "@/lib/types";
import { predictMatch } from "@/lib/match-model";
import type { Confidence } from "@/lib/analysis-schema";

/**
 * The free, model-only preview of a match — shown to non-members ABOVE the
 * blurred AI analysis. Built entirely from our deterministic model (predictMatch),
 * so it costs ZERO Claude tokens and is safe to render for every visitor. It
 * reveals the real numbers (our honest edge) without giving away the AI's
 * narrative, scenario or betting recommendation (those stay paid).
 */
export interface MatchPreview {
  /** Which side the model favours (or a draw lean). */
  favorite: "home" | "away" | "draw";
  probabilities: { home: number; draw: number; away: number };
  expectedGoals: { home: number; away: number };
  /** Over 2.5 goals probability (%) — a teaser market. */
  over25: number;
  confidence: Confidence;
}

export async function getMatchPreview(match: Match): Promise<MatchPreview> {
  const pred = predictMatch(match);
  const { home, draw, away } = pred.probabilities;
  const favorite: MatchPreview["favorite"] =
    home >= away && home >= draw ? "home" : away >= home && away >= draw ? "away" : "draw";

  return {
    favorite,
    probabilities: pred.probabilities,
    expectedGoals: pred.expectedGoals,
    over25: pred.markets.over25,
    confidence: pred.confidence,
  };
}
