/**
 * Win-back offer config — single source of truth (client-safe: pure constants
 * and functions, no server imports). Tweak the thresholds here without touching
 * the trigger logic or the component.
 *
 * Targets RETURNING non-subscribers with an exclusive discount on the MONTHLY
 * plan only (never lifetime — we don't dilute the 89→129 € urgency).
 */
import { FREE_ANALYSES_LIMIT, type PaidPlan } from "@/lib/plans";

/** Generic, shared code — same for every eligible visitor. Created on Whop. */
export const WINBACK_CODE = "KICKOFF20";
/** Discount applied on Whop (display only — the real value lives on the coupon). */
export const WINBACK_DISCOUNT_PCT = 20;
/** Repeating duration of the discount, in months (Whop coupon setting). */
export const WINBACK_DURATION_MONTHS = 3;
/** The discount only applies to this plan. */
export const WINBACK_TARGET_PLAN: PaidPlan = "monthly";
/** Marketing urgency window (hours) — purely front-side, decoupled from Whop. */
export const WINBACK_WINDOW_HOURS = 72;

// ── Eligibility thresholds ───────────────────────────────────────────────────
/** Min distinct days visited before the offer triggers. */
export const WINBACK_MIN_VISIT_DAYS = 2;
/** Require the free discovery analysis to have been consumed. */
export const WINBACK_REQUIRE_FREE_ANALYSIS = true;

/** Minimal engagement snapshot needed to decide eligibility. */
export interface WinbackState {
  isSubscriber: boolean;
  visitDays: number;
  freeAnalysesUsed: number;
  /** ISO timestamp of when the pop-up was first shown, or null if never. */
  seenAt: string | null;
}

/** A returning, engaged, non-subscriber who hasn't seen the pop-up yet. */
export function isWinbackEligible(s: WinbackState): boolean {
  if (s.isSubscriber) return false;
  if (s.seenAt) return false;
  if (s.visitDays < WINBACK_MIN_VISIT_DAYS) return false;
  if (WINBACK_REQUIRE_FREE_ANALYSIS && s.freeAnalysesUsed < FREE_ANALYSES_LIMIT)
    return false;
  return true;
}

/** Epoch ms when the 72h marketing window closes (from the seen timestamp). */
export function winbackExpiryMs(seenAtIso: string): number {
  return Date.parse(seenAtIso) + WINBACK_WINDOW_HOURS * 3_600_000;
}
