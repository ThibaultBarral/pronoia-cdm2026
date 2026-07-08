"use server";

import { createClient } from "@/lib/supabase/server";
import {
  AUTH_REQUIRED,
  hasAccess,
  MONTHLY_ANALYSIS_LIMIT,
  PAYWALL_REQUIRED,
  type PaidPlan,
  type Plan,
  type SubStatus,
  type SubscriptionView,
} from "@/lib/plans";

/** Result of getAnalysisAccess for an allowed request: which meter to consume. */
type AnalysisGrant = {
  userId: string;
  meter: "monthly" | "none";
  /** For meter="monthly": the plan's monthly quota, passed back to commit. */
  limit?: number;
};

/** Effective monthly count — a stored period from a past month counts as reset. */
function monthlyUsedNow(usedRaw: number, periodStart: string | null): number {
  if (!periodStart) return 0;
  const curMonth = new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
  return periodStart.slice(0, 7) < curMonth ? 0 : usedRaw;
}

/** Columns we read for both the gate and the UI view model. */
const SUB_COLUMNS =
  "plan, status, current_period_end, trial_end, cancel_at_period_end, manage_url, vip, bonus_access_until";

/**
 * Read the current user's subscription (view model). Returns null when not
 * authenticated. A user with no row is treated as a fresh `free` account
 * (no access — there is no free tier).
 */
export async function getSubscription(): Promise<SubscriptionView | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select(SUB_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();

  const state = {
    plan: (data?.plan as Plan) ?? "free",
    status: (data?.status as SubStatus | null) ?? null,
    currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
    trialEnd: (data?.trial_end as string | null) ?? null,
    bonusAccessUntil: (data?.bonus_access_until as string | null) ?? null,
  };

  const vip = Boolean(data?.vip);

  return {
    ...state,
    access: vip || hasAccess(state),
    vip,
    cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
    manageUrl: (data?.manage_url as string | null) ?? null,
    freeAnalysesUsed: 0,
    bonusCredits: 0,
  };
}

/**
 * The gate applied at the source of every analysis (server-side).
 * - Has access (paid plan) → allowed, subject to the plan's monthly quota
 *   (Mini) when applicable.
 * - Else → PAYWALL_REQUIRED (the client opens the paywall). There is no free
 *   tier: a signed-in user with no active plan goes straight to the paywall.
 */
export async function requireAnalysisAccess(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_end, vip, bonus_access_until")
    .eq("user_id", user.id)
    .maybeSingle();

  const state = {
    plan: (data?.plan as Plan) ?? "free",
    status: (data?.status as SubStatus | null) ?? null,
    currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
    trialEnd: (data?.trial_end as string | null) ?? null,
    bonusAccessUntil: (data?.bonus_access_until as string | null) ?? null,
  };

  const vip = Boolean(data?.vip);
  if (!vip && !hasAccess(state)) return { error: PAYWALL_REQUIRED };

  const limit = vip ? undefined : MONTHLY_ANALYSIS_LIMIT[state.plan as PaidPlan];
  if (limit != null) {
    const { data: granted, error } = await supabase.rpc("use_monthly_analysis", {
      p_limit: limit,
    });
    if (error) {
      // Fail closed to the paywall on a DB error.
      console.error("[ai-guard] use_monthly_analysis error:", error.message);
      return { error: PAYWALL_REQUIRED };
    }
    if (!granted) return { error: PAYWALL_REQUIRED }; // monthly quota spent
  }
  await supabase.rpc("record_analysis");
  return { userId: user.id };
}

/**
 * Like requireAnalysisAccess but does NOT consume the monthly quota — only
 * checks eligibility. The credit is committed separately, AFTER a successful
 * generation (commitAnalysisUsage), so a failed Claude call never burns a
 * member's monthly analysis.
 */
export async function getAnalysisAccess(): Promise<AnalysisGrant | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, current_period_end, trial_end, vip, monthly_analyses_used, monthly_period_start, bonus_access_until"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const state = {
    plan: (data?.plan as Plan) ?? "free",
    status: (data?.status as SubStatus | null) ?? null,
    currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
    trialEnd: (data?.trial_end as string | null) ?? null,
    bonusAccessUntil: (data?.bonus_access_until as string | null) ?? null,
  };

  // VIP → unlimited, no meter to consume.
  if (Boolean(data?.vip)) return { userId: user.id, meter: "none" };

  if (!hasAccess(state)) return { error: PAYWALL_REQUIRED };

  const limit = MONTHLY_ANALYSIS_LIMIT[state.plan as PaidPlan];
  if (limit != null) {
    const used = monthlyUsedNow(
      (data?.monthly_analyses_used as number | null) ?? 0,
      (data?.monthly_period_start as string | null) ?? null
    );
    if (used >= limit) return { error: PAYWALL_REQUIRED }; // monthly quota spent
    return { userId: user.id, meter: "monthly", limit };
  }
  return { userId: user.id, meter: "none" }; // unlimited paid plan
}

/**
 * Commit usage AFTER a successful analysis: consume the monthly credit (Mini
 * plan only) and bump the analytics counter. Best-effort.
 */
export async function commitAnalysisUsage(
  grant: { meter: "monthly" | "none"; limit?: number }
): Promise<void> {
  try {
    const supabase = await createClient();
    if (grant.meter === "monthly" && grant.limit != null) {
      await supabase.rpc("use_monthly_analysis", { p_limit: grant.limit });
    }
    await supabase.rpc("record_analysis");
  } catch (err) {
    console.error("[ai-guard] commitAnalysisUsage error:", err);
  }
}
