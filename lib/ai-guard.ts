"use server";

import { createClient } from "@/lib/supabase/server";
import {
  AUTH_REQUIRED,
  FREE_ANALYSES_LIMIT,
  hasAccess,
  PAYWALL_REQUIRED,
  type Plan,
  type SubStatus,
  type SubscriptionView,
} from "@/lib/plans";

/** Columns we read for both the gate and the UI view model. */
const SUB_COLUMNS =
  "plan, status, current_period_end, trial_end, cancel_at_period_end, manage_url, free_analyses_used, vip";

/**
 * Read the current user's subscription (view model). Returns null when not
 * authenticated. A user with no row is treated as a fresh `free` account.
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
  };

  const vip = Boolean(data?.vip);

  return {
    ...state,
    access: vip || hasAccess(state),
    vip,
    cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
    manageUrl: (data?.manage_url as string | null) ?? null,
    freeAnalysesUsed: (data?.free_analyses_used as number | null) ?? 0,
  };
}

/**
 * The gate applied at the source of every analysis (server-side).
 * - Has access (paid/trial) → allowed.
 * - Otherwise, `free` users get FREE_ANALYSES_LIMIT discovery analyses total,
 *   consumed atomically.
 * - Else → PAYWALL_REQUIRED (the client opens the paywall).
 */
export async function requireAnalysisAccess(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_end, vip")
    .eq("user_id", user.id)
    .maybeSingle();

  const state = {
    plan: (data?.plan as Plan) ?? "free",
    status: (data?.status as SubStatus | null) ?? null,
    currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
    trialEnd: (data?.trial_end as string | null) ?? null,
  };

  // VIP (admin-granted free access) or a paid/trial entitlement → allowed.
  if (Boolean(data?.vip) || hasAccess(state)) {
    await supabase.rpc("record_analysis");
    return { userId: user.id };
  }

  // Free tier: one discovery analysis, consumed atomically (race-safe RPC).
  const { data: granted, error } = await supabase.rpc("use_free_analysis", {
    p_limit: FREE_ANALYSES_LIMIT,
  });

  if (error) {
    // Don't hand out free analyses on a DB error — fail closed to the paywall.
    console.error("[ai-guard] use_free_analysis error:", error.message);
    return { error: PAYWALL_REQUIRED };
  }

  if (granted) {
    await supabase.rpc("record_analysis");
    return { userId: user.id };
  }
  return { error: PAYWALL_REQUIRED };
}

/**
 * Like requireAnalysisAccess but does NOT consume the free analysis — only
 * checks eligibility. The credit is committed separately, AFTER a successful
 * generation (commitAnalysisUsage), so a failed Claude call never burns a
 * visitor's discovery analysis.
 */
export async function getAnalysisAccess(): Promise<
  { userId: string; isFree: boolean } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_end, vip, free_analyses_used")
    .eq("user_id", user.id)
    .maybeSingle();

  const state = {
    plan: (data?.plan as Plan) ?? "free",
    status: (data?.status as SubStatus | null) ?? null,
    currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
    trialEnd: (data?.trial_end as string | null) ?? null,
  };

  if (Boolean(data?.vip) || hasAccess(state)) {
    return { userId: user.id, isFree: false };
  }

  const used = (data?.free_analyses_used as number | null) ?? 0;
  if (used < FREE_ANALYSES_LIMIT) return { userId: user.id, isFree: true };

  return { error: PAYWALL_REQUIRED };
}

/**
 * Commit usage AFTER a successful analysis: consume the free credit (free users
 * only, race-safe RPC) and bump the analytics counter. Best-effort.
 */
export async function commitAnalysisUsage(isFree: boolean): Promise<void> {
  try {
    const supabase = await createClient();
    if (isFree) {
      await supabase.rpc("use_free_analysis", { p_limit: FREE_ANALYSES_LIMIT });
    }
    await supabase.rpc("record_analysis");
  } catch (err) {
    console.error("[ai-guard] commitAnalysisUsage error:", err);
  }
}
