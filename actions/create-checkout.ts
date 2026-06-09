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
export async function createCheckout(plan: PaidPlan): Promise<CheckoutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter pour vous abonner." };

  const planId = planIdForPlan(plan);
  if (!planId) {
    return { ok: false, error: "Cette offre n'est pas encore configurée. Réessaie plus tard." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  try {
    const config = await getWhop().checkoutConfigurations.create({
      plan_id: planId,
      metadata: { userId: user.id },
      redirect_url: appUrl ? `${appUrl}/dashboard?checkout=success` : null,
    });
    return { ok: true, url: config.purchase_url };
  } catch (err) {
    console.error("[create-checkout] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de la création du paiement." };
  }
}
