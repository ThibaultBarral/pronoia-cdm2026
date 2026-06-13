/**
 * Structured JSON contracts for the AI analyses (match & team).
 *
 * Claude returns JSON matching these shapes (no free-text parsing). The data is
 * cached and persisted to history, then rendered by dedicated components.
 *
 * Shared between server (actions) and client (components) → keep it type-only,
 * no server imports.
 */

import type { Playstyle } from "./bankroll";

export type Confidence = "Faible" | "Moyen" | "Élevé" | "Très élevé";

// ─── Match analysis ───────────────────────────────────────────────────────────

/** The actionable bet recommendation (CopaFever's paris angle). */
export interface BetRecommendation {
  bet: string;
  odds?: string;
  bookmaker?: string;
  confidence: Confidence;
  /** e.g. "1 à 3% de ta bankroll". */
  stake: string;
  rationale: string;
  /** Expected-value verdict (set by the engine, not the LLM). */
  ev?: number;
  /** Minimum odds for value = 1 / model probability. */
  coteMin?: number;
  /** value · marginal · none. */
  valueTier?: "value" | "marginal" | "none";
  /** Model probability of the recommended bet (%). */
  probaModele?: number;
}

export interface MatchAnalysisData {
  /** Plain-language quick summary (2-3 sentences). */
  summary: string;
  /** Written most-likely scenario. */
  scenario: string;
  /** Overall confidence in the read. */
  confidence: Confidence;
  /** Exact 1X2 probabilities (%, sum ≈ 100). */
  probabilities: { home: number; draw: number; away: number };
  /** Secondary angles (Over 2.5, BTTS, …). */
  secondaryScenarios: { title: string; detail: string }[];
  /** Key strengths per side. */
  keyStrengths: { team: "home" | "away"; points: string[] }[];
  /** Short factor pills. */
  factors: { label: string; kind: "pos" | "neg" | "neutral" }[];
  /** Stat comparison bars (0-100 each, home+away ≈ 100). */
  comparison: { label: string; home: number; away: number }[];
  /** Expected goals per side. */
  expectedGoals: { home: number; away: number };
  /** Over/under & both-teams-to-score (%). */
  markets: { over25: number; under25: number; bttsYes: number; bttsNo: number };
  /** The default bet recommendation (canonical best-EV value pick). */
  recommendation: BetRecommendation;
  /**
   * One recommendation per bettor profile — lets the UI toggle between play
   * styles (prudent → audacieux) without re-running the analysis. Absent on
   * older cached/stored analyses (fall back to `recommendation`).
   */
  recommendationsByProfile?: Partial<Record<Playstyle, BetRecommendation>>;
}

// ─── Team analysis ────────────────────────────────────────────────────────────

export interface TeamAnalysisData {
  /** "Notre IA lit les chiffres" — reads the simulation numbers in plain words. */
  numbersRead: string;
  /** "Notre analyse" — qualitative scouting text. */
  analysisText: string;
  strengths: { label: string; detail?: string }[];
  weaknesses: { label: string; detail?: string }[];
  keyPlayers: { name: string; note: string }[];
  /** Bet ideas tied to the team's projected run. */
  betIdeas: { label: string; rationale: string; confidence: Confidence }[];
}

// ─── Persisted/cached envelope ────────────────────────────────────────────────

export type AnalysisKind = "match" | "team";

export interface StoredAnalysis<T = MatchAnalysisData | TeamAnalysisData> {
  kind: AnalysisKind;
  /** Stable target id: match slug or team slug. */
  target: string;
  /** Human title, e.g. "France vs Sénégal" / "France". */
  title: string;
  /** Flags for the list UI. */
  homeFlag?: string;
  awayFlag?: string;
  data: T;
  generatedAt: string;
}

const DISCLAIMER = "Cette analyse est fournie à titre informatif uniquement.";
export { DISCLAIMER };

/** Clamp a number to [min,max] with a fallback for NaN/undefined. */
export function clampPct(n: unknown, fallback = 0): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}
