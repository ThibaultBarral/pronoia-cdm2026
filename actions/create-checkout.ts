"use server";

import { getWhop } from "@/lib/whop";
import { createClient } from "@/lib/supabase/server";
import { planIdForPlan, type PaidPlan } from "@/lib/plans";

type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Create a Whop checkout session for an offer and return the hosted checkout URL.
 * The user's Supabase id is attached as metadata — Whop copies it onto the
 * resulting membership, so the webhook can map the purchase back to the account.
 */
export async function createCheckout(
  plan: PaidPlan,
  promoCode?: string,
): Promise<CheckoutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter pour vous abonner." };

  const planId = planIdForPlan(plan);
  if (!planId) {
    return { ok: false, error: "Cette offre n'est pas encore configurée. Réessaie plus tard." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const code = promoCode?.trim() || undefined;

  try {
    const config = await getWhop().checkoutConfigurations.create({
      plan_id: planId,
      metadata: { userId: user.id },
      redirect_url: appUrl ? `${appUrl}/dashboard?checkout=success` : null,
      // Show the promo field on the hosted checkout when a code is passed.
      ...(code ? { allow_promo_codes: true } : {}),
    });

    // Best-effort prefill: append the code to the hosted checkout URL. The code
    // is also shown in the UI as a guaranteed copy-paste fallback.
    let url = config.purchase_url;
    if (code) {
      try {
        const u = new URL(url);
        u.searchParams.set("promo", code);
        url = u.toString();
      } catch {
        /* keep the original url if not parseable */
      }
    }
    return { ok: true, url };
  } catch (err) {
    console.error("[create-checkout] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de la création du paiement." };
  }
}
