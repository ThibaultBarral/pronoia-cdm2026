/**
 * Recommended-stake engine — turns the AI recommendation's confidence + the
 * user's live bankroll and bettor profile into a concrete € amount to bet.
 *
 * Design choice: a *capped fractional* stake (profile base % × confidence
 * multiplier, hard-capped at 5% of bankroll), NOT raw Kelly. Kelly needs a
 * trustworthy edge per bet, which arbitrary markets (BTTS, scorer…) don't give
 * us reliably; an over-confident Kelly could recommend dangerously large bets.
 * Capped fractional staking is the responsible, always-valid baseline that
 * personalises by profile and never blows up a bankroll.
 *
 * Type-only imports → safe on client and server.
 */
import type { Confidence } from "./analysis-schema";
import { PLAYSTYLES, type Playstyle } from "./bankroll";

/** How the AI's confidence in the bet scales the base stake. */
const CONFIDENCE_MULT: Record<Confidence, number> = {
  "Faible": 0.5,
  "Moyen": 0.8,
  "Élevé": 1.0,
  "Très élevé": 1.25,
};

const MIN_PCT = 0.5;
/** Hard safety ceiling — never advise more than this on a single bet. */
const MAX_PCT = 5;

export interface StakeAdvice {
  /** Recommended stake in the bankroll's currency, rounded to a clean amount. */
  amount: number;
  /** Share of the current bankroll (%), rounded to .1. */
  pct: number;
  /** Bankroll the advice was computed against. */
  bankroll: number;
  /** Net profit if the bet wins (only when the odds are known). */
  potentialGain?: number;
  /** Total payout if it wins (stake + gain). */
  potentialReturn?: number;
  /** True when the 5% safety cap clipped the raw fraction. */
  cappedBySafety: boolean;
}

/** Parse an odds label ("2,10", "@2.1", "cote 2.10") into a decimal > 1. */
export function parseOdds(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) && v > 1 ? v : null;
}

/** Round a money amount to a clean stake (1 € steps under 50, else 5 € steps). */
function roundStake(x: number): number {
  if (x <= 0) return 0;
  if (x < 50) return Math.max(1, Math.round(x));
  return Math.round(x / 5) * 5;
}

export function recommendStake(
  bankroll: number,
  playstyle: Playstyle | undefined,
  confidence: Confidence,
  odds?: number | null
): StakeAdvice | null {
  if (!Number.isFinite(bankroll) || bankroll <= 0) return null;

  const base =
    PLAYSTYLES.find((p) => p.id === (playstyle ?? "balanced"))?.stakePercent ?? 2.5;
  const raw = base * (CONFIDENCE_MULT[confidence] ?? 0.8);
  const pct = Math.min(Math.max(raw, MIN_PCT), MAX_PCT);
  const amount = roundStake((bankroll * pct) / 100);

  const advice: StakeAdvice = {
    amount,
    pct: Math.round(pct * 10) / 10,
    bankroll: Math.round(bankroll * 100) / 100,
    cappedBySafety: raw > MAX_PCT,
  };
  if (odds && odds > 1) {
    advice.potentialGain = Math.round(amount * (odds - 1) * 100) / 100;
    advice.potentialReturn = Math.round(amount * odds * 100) / 100;
  }
  return advice;
}
