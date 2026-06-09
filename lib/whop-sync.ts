/**
 * Maps a Whop membership into our `subscriptions` row. Shared by the webhook
 * handler and the "Restaurer" action so both produce identical state.
 *
 * Writes via the service-role client (bypasses RLS) — server-only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PASS_CDM_END, planForPlanId, type SubStatus } from "@/lib/plans";

/** Structural subset of a Whop membership (webhook event data or API fetch). */
export interface WhopMembership {
  id: string;
  status: string;
  plan: { id: string };
  metadata: Record<string, unknown> | null;
  manage_url: string | null;
  cancel_at_period_end: boolean;
  renewal_period_end: string | null;
}

/** Whop's MembershipStatus → our normalized status. */
function toStatus(s: string): SubStatus {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
    case "completed":
      return "active";
    case "canceling":
    case "canceled":
      // Still inside the paid window until current_period_end (hasAccess checks it).
      return "canceled";
    default:
      // past_due, expired, unresolved, drafted, …
      return "expired";
  }
}

/** Extract our Supabase user id from the metadata attached at checkout. */
function readUserId(metadata: Record<string, unknown> | null): string | null {
  const v = metadata?.userId;
  return typeof v === "string" ? v : null;
}

export async function syncMembershipToDb(
  m: WhopMembership
): Promise<{ ok: boolean; userId?: string; reason?: string }> {
  const userId = readUserId(m.metadata);
  if (!userId) {
    console.warn("[whop-sync] membership without userId metadata:", m.id);
    return { ok: false, reason: "missing-user" };
  }

  const plan = planForPlanId(m.plan.id);
  if (!plan) {
    // Unknown plan id → env mismatch. Don't corrupt the row; surface it.
    console.error("[whop-sync] unknown plan id (check WHOP_PLAN_* env):", m.plan.id);
    return { ok: false, userId, reason: "unknown-plan" };
  }

  const status = toStatus(m.status);

  // Pass CDM is a fixed tournament window; lifetime never expires.
  const currentPeriodEnd =
    plan === "pass_cdm" ? PASS_CDM_END : plan === "lifetime" ? null : m.renewal_period_end;
  const trialEnd = status === "trialing" ? m.renewal_period_end : null;

  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status,
      current_period_end: currentPeriodEnd,
      trial_end: trialEnd,
      whop_status: m.status,
      whop_membership_id: m.id,
      whop_plan_id: m.plan.id,
      manage_url: m.manage_url,
      cancel_at_period_end: m.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[whop-sync] upsert error:", error.message);
    return { ok: false, userId, reason: error.message };
  }
  return { ok: true, userId };
}
