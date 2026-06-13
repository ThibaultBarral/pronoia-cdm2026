/**
 * Expected-Value (value betting) — single source of truth.
 *
 * A bet is only "good" when our estimated probability beats the bookmaker's
 * price: proba × cote > 1. Confidence is derived from the EV, never from the
 * win probability alone (a likely winner at a short price is NOT a good bet).
 *
 * Client-safe: pure functions, type-only imports.
 */
import type { Confidence } from "./analysis-schema";

export type ValueTier = "value" | "marginal" | "none";

export interface ValueResult {
  /** Model probability used, 0–1. */
  proba: number;
  /** Bookmaker odds. */
  cote: number;
  /** Minimum odds for the bet to have value = 1 / proba. */
  coteMin: number;
  /** Expected value per unit staked = proba × cote − 1. */
  ev: number;
  /** value: ev > 0.05 · marginal: 0 < ev ≤ 0.05 · none: ev ≤ 0. */
  tier: ValueTier;
  /** Convenience: tier === "value". */
  value: boolean;
  /** EV-derived confidence (Faible when no value). */
  confidence: Confidence;
}

/** EV → confidence. No value ⇒ never above "Faible". */
export function confidenceFromEv(ev: number): Confidence {
  if (ev > 0.25) return "Très élevé";
  if (ev > 0.15) return "Élevé";
  if (ev > 0) return "Moyen";
  return "Faible";
}

export function calculateValue(proba: number, cote: number): ValueResult {
  const p = Math.max(0, Math.min(1, Number.isFinite(proba) ? proba : 0));
  const c = Number.isFinite(cote) && cote > 0 ? cote : 0;
  const coteMin = p > 0 ? 1 / p : Infinity;
  const ev = p * c - 1;
  const tier: ValueTier = ev > 0.05 ? "value" : ev > 0 ? "marginal" : "none";
  return { proba: p, cote: c, coteMin, ev, tier, value: ev > 0.05, confidence: confidenceFromEv(ev) };
}

// ── Display helpers (French formatting) ───────────────────────────────────────

/** "1,93" — French decimal, fixed decimals. */
export function fmtCote(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function valueBadge(tier: ValueTier): { label: string; tone: "ok" | "warn" | "no" } {
  switch (tier) {
    case "value": return { label: "✅ Value détectée", tone: "ok" };
    case "marginal": return { label: "⚠️ Value marginale", tone: "warn" };
    case "none": return { label: "❌ Pas de value sur ce pari", tone: "no" };
  }
}
