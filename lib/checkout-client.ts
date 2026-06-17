"use client";

import { createCheckout } from "@/actions/create-checkout";
import { type PaidPlan } from "@/lib/plans";

/**
 * Client-side checkout starter → redirects to the Whop hosted checkout.
 * An optional explicit promo code is forwarded (e.g. the win-back coupon); the
 * win-back UI surfaces and copies that code itself.
 */
export async function startCheckout(plan: PaidPlan, promoCode?: string) {
  return createCheckout(plan, promoCode);
}
