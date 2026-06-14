"use client";

import { createCheckout } from "@/actions/create-checkout";
import { CDM_INTRO_CODE, cdmIntroActive, type PaidPlan } from "@/lib/plans";

/**
 * Client-side checkout starter. Whop has no way to auto-apply a promo code
 * (confirmed: no URL param, no embed prefill, no checkout-config field), so we
 * copy the relevant code to the clipboard right before redirecting — the user
 * then just pastes it into "Ajouter un code promotionnel" on the hosted checkout.
 *
 * - If an explicit code is passed (welcome / winback), we copy that.
 * - Otherwise, for the Monthly plan during the World Cup, we copy the first-month
 *   intro code so the customer gets 9,99 € instead of 14,99 €.
 */
export async function startCheckout(plan: PaidPlan, promoCode?: string) {
  const code =
    promoCode ??
    (plan === "monthly" && cdmIntroActive() ? CDM_INTRO_CODE : undefined);
  if (code && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard blocked — the code is still shown in the UI to copy manually */
    }
  }
  return createCheckout(plan, promoCode);
}
