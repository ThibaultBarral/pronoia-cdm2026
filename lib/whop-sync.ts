/**
 * Maps a Whop membership into our `subscriptions` row. Shared by the webhook
 * handler and the "Restaurer" action so both produce identical state.
 *
 * Writes via the service-role client (bypasses RLS) — server-only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PASS_CDM_END, SEASON_END, planForPlanId, type SubStatus } from "@/lib/plans";

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

  // Pass CDM / Pass Saison are fixed windows; lifetime never expires.
  const currentPeriodEnd =
    plan === "pass_cdm"
      ? PASS_CDM_END
      : plan === "season"
        ? SEASON_END
        : plan === "lifetime"
          ? null
          : m.renewal_period_end;
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

const WHOP_COMPANY_ID = "biz_2exftzpAHl23k9";

/** Adapt a raw Whop API membership object into our WhopMembership shape. */
function normalizeMembership(raw: Record<string, unknown>): WhopMembership | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  const planField = raw.plan;
  const planId =
    typeof planField === "string"
      ? planField
      : typeof (planField as { id?: string } | null)?.id === "string"
        ? (planField as { id: string }).id
        : typeof raw.plan_id === "string"
          ? (raw.plan_id as string)
          : null;
  if (!planId) return null;
  const meta = raw.metadata;
  return {
    id,
    status: typeof raw.status === "string" ? raw.status : "expired",
    plan: { id: planId },
    metadata:
      meta && typeof meta === "object"
        ? (meta as Record<string, unknown>)
        : typeof meta === "string"
          ? safeJson(meta)
          : null,
    manage_url: typeof raw.manage_url === "string" ? raw.manage_url : null,
    cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    renewal_period_end:
      typeof raw.renewal_period_end === "string" ? raw.renewal_period_end : null,
  };
}

function safeJson(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Re-sync ALL Whop memberships into our subscriptions table. Catches statuses
 * that a missed webhook left stale (e.g. a cancellation) so /admin reflects the
 * truth. Admin-triggered; paginates the Whop API. Returns simple counts.
 */
export async function syncAllWhopMemberships(): Promise<{
  ok: boolean;
  synced: number;
  canceled: number;
  error?: string;
}> {
  const key = process.env.WHOP_API_KEY;
  if (!key) return { ok: false, synced: 0, canceled: 0, error: "WHOP_API_KEY manquant." };

  let synced = 0;
  let canceled = 0;
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 25; page++) {
      const url = new URL("https://api.whop.com/api/v1/memberships");
      url.searchParams.set("company_id", WHOP_COMPANY_ID);
      url.searchParams.set("limit", "100");
      if (cursor) url.searchParams.set("starting_after", cursor);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return { ok: false, synced, canceled, error: `Whop API ${res.status}` };
      const json = await res.json();
      const data: Array<Record<string, unknown>> = json.data ?? [];

      for (const raw of data) {
        const m = normalizeMembership(raw);
        if (!m) continue;
        const r = await syncMembershipToDb(m);
        if (r.ok) {
          synced++;
          if (toStatus(m.status) === "canceled" || toStatus(m.status) === "expired") canceled++;
        }
      }

      cursor = (json.pagination?.next_cursor as string | null) ?? null;
      if (!cursor || data.length === 0) break;
    }
    return { ok: true, synced, canceled };
  } catch (err) {
    return { ok: false, synced, canceled, error: (err as Error).message };
  }
}
