"use server";

import { createClient } from "@/lib/supabase/server";
import { hasAccess, type Plan, type SubStatus } from "@/lib/plans";
import { NO_SUB_MIN_VISIT_DAYS } from "@/lib/no-sub-survey";

/**
 * Should we ask this user why they haven't subscribed yet? True only for a
 * signed-in NON-subscriber who's visited on ≥ NO_SUB_MIN_VISIT_DAYS distinct
 * days and hasn't answered/skipped yet. Fail-safe: any error → don't show.
 * `visit_days` is already tracked by the win-back flow (record_visit).
 */
export async function getNoSubSurvey(): Promise<{ eligible: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { eligible: false };

    // Already answered or skipped → never again.
    if (user.user_metadata?.no_sub_reason) return { eligible: false };
    // Let the acquisition survey go first (avoid stacked modals).
    if (!user.user_metadata?.acquisition_channel) return { eligible: false };

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, trial_end, vip, visit_days, free_analyses_used, winback_popup_seen_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const state = {
      plan: (data?.plan as Plan) ?? "free",
      status: (data?.status as SubStatus | null) ?? null,
      currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
      trialEnd: (data?.trial_end as string | null) ?? null,
    };

    // Exclude every subscriber (paid/trial, VIP, Pass CDM legacy).
    if (Boolean(data?.vip) || hasAccess(state) || state.plan !== "free") {
      return { eligible: false };
    }

    // Let the win-back pop-up go first if it's still pending for this user.
    const winbackPending =
      !data?.winback_popup_seen_at && ((data?.free_analyses_used as number | null) ?? 0) >= 1;
    if (winbackPending) return { eligible: false };

    const visitDays = (data?.visit_days as number | null) ?? 0;
    return { eligible: visitDays >= NO_SUB_MIN_VISIT_DAYS };
  } catch {
    return { eligible: false };
  }
}
