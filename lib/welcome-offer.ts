/**
 * Welcome offer config — single source of truth (client-safe: pure constants,
 * no server imports). A first-session, time-limited discount that fires right
 * after a brand-new user has tasted the product (their first analysis), to
 * convert hot intent. Complements the win-back (which targets RETURNING users).
 *
 * The countdown is anchored on the account creation date, so the urgency is real
 * and per-user (no extra DB column needed).
 *
 * ⚠️ The discount only actually applies if a matching coupon exists on Whop.
 * Create a coupon with code WELCOME_CODE (−20% on the Monthly plan) on Whop —
 * same as KICKOFF20. The countdown + UI work regardless; without the coupon the
 * user just pays full price.
 */
import type { PaidPlan } from "@/lib/plans";

/** Generic, shared welcome code — must match a coupon created on Whop. */
export const WELCOME_CODE = "COPA20";
/** Discount advertised (display only — the real value lives on the Whop coupon). */
export const WELCOME_DISCOUNT_PCT = 20;
/** The discount only applies to this plan. */
export const WELCOME_TARGET_PLAN: PaidPlan = "monthly";
/** Urgency window (hours) from signup — front-side, decoupled from Whop. */
export const WELCOME_WINDOW_HOURS = 48;

/** Epoch ms when the welcome window closes (from the account creation date). */
export function welcomeExpiryMs(createdAtIso: string): number {
  return Date.parse(createdAtIso) + WELCOME_WINDOW_HOURS * 3_600_000;
}
