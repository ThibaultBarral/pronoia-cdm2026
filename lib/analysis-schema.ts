/**
 * Structured JSON contracts for the AI analyses (match & team).
 *
 * Claude returns JSON matching these shapes (no free-text parsing). The data is
 * cached and persisted to history, then rendered by dedicated components.
 *
 * Shared between server (actions) and client (components) → keep it type-only,
 * no server imports.
 */

export type Confidence = "Faible" | "Moyen" | "Élevé" | "Très élevé";

// ─── Match analysis ───────────────────────────────────────────────────────────

/** A probable scorer — picked from the REAL squad. Speculative (a prediction). */
export interface ProbableScorer {
  name: string;
  team: "home" | "away";
  /** Short reason: form, role, penalties, matchup… */
  note: string;
}

/** A key player to watch, picked from the REAL squad. */
export interface MatchKeyPlayer {
  name: string;
  team: "home" | "away";
  /** Position/role in plain words, e.g. "Attaquant", "Meneur de jeu". */
  role?: string;
  note: string;
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
  /**
   * Probable scorers, chosen from the real squads (a prediction, not a fact).
   * Optional → absent on older cached/stored analyses.
   */
  probableScorers?: ProbableScorer[];
  /** The single most likely first scorer (a real squad name). */
  firstScorer?: string;
  /** Key players to watch, from the real squads. */
  keyPlayers?: MatchKeyPlayer[];

  // ─── Gold v2 (2026-09-18) — every field optional so older stored analyses render ───

  /** What is at stake for each side (table, Europe, derby, calendar, fatigue). */
  stakes?: string;
  /** Real absences and what they change, per side. */
  absenceImpact?: { team: "home" | "away"; text: string }[];
  /** Probable line-ups in plain words (system + notable choices), per side. */
  probableLineups?: { team: "home" | "away"; text: string }[];
  /** The 2-3 individual or collective duels the match hinges on. */
  keyDuels?: { title: string; detail: string }[];
  /** Cross-check between our model, the market, the provider model and the press. */
  signals?: { label: string; verdict: "convergent" | "divergent" | "neutre"; detail: string }[];
  /** What would flip the read (2-4 concrete things). */
  swingFactors?: string[];
  /** Market consensus figures (data, not narrative) — for the Gold "marché" block. */
  market?: {
    operators: number;
    implied: { home: number; draw: number; away: number };
    agreement: "fort" | "moyen" | "faible";
    movement?: { days: number; home: number; draw: number; away: number };
  };
  /** Real absences (data) so the UI can list them without re-deriving. */
  absences?: { team: "home" | "away"; name: string; kind: "injury" | "suspension" | "doubt" | "other"; reason: string }[];
  /** What the press says — searched at J-2, with sources. Absent before that. */
  press?: PressDigest;
}

/** Press digest — built by a cheap search pass at J-2 (lib/press.ts). */
export interface PressDigest {
  /** 2-3 sentences: the story of the match as the press tells it. */
  summary: string;
  items: PressItem[];
  /** Probable line-ups as reported, when found. */
  lineups?: { home?: string; away?: string };
  /** ISO date of the search. */
  searchedAt: string;
}

export interface PressItem {
  title: string;
  source: string;
  url: string;
  /** Publication date when known (free text as found). */
  date?: string;
  /** One sentence: what this article changes for the match. */
  takeaway: string;
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
