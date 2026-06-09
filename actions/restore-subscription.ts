"use server";

import { getWhop } from "@/lib/whop";
import { createClient } from "@/lib/supabase/server";
import { syncMembershipToDb, type WhopMembership } from "@/lib/whop-sync";

type RestoreResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Re-sync the user's subscription from Whop using their stored membership id.
 * Useful when the webhook was missed, or to recover access on a new device.
 */
export async function restoreSubscription(): Promise<RestoreResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi pour restaurer ton accès." };

  const { data } = await supabase
    .from("subscriptions")
    .select("whop_membership_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipId = data?.whop_membership_id as string | null;
  if (!membershipId) {
    return { ok: false, error: "Aucun abonnement à restaurer sur ce compte." };
  }

  try {
    const membership = await getWhop().memberships.retrieve(membershipId);
    const res = await syncMembershipToDb(membership as unknown as WhopMembership);
    if (!res.ok) return { ok: false, error: "Impossible de restaurer l'abonnement pour le moment." };
    return { ok: true };
  } catch (err) {
    console.error("[restore-subscription] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de la restauration." };
  }
}
