"use server";

import { createClient } from "@/lib/supabase/server";
import { hasAccess, type Plan, type SubStatus } from "@/lib/plans";
import {
  WINBACK_CODE,
  isWinbackEligible,
  winbackExpiryMs,
} from "@/lib/winback";

export interface WinbackOffer {
  eligible: boolean;
  code: string;
  /** ISO end of the 72h window once the pop-up has been stamped (else null). */
  expiresAt: string | null;
}

const NOT_ELIGIBLE: WinbackOffer = { eligible: false, code: WINBACK_CODE, expiresAt: null };

/**
 * Records a visit (max 1×/day) for the current non-subscriber and returns
 * whether the win-back pop-up should show. Fail-safe: any error (e.g. the
 * migration not applied yet) → not eligible, never throws to the UI.
 */
export async function getWinbackOffer(): Promise<WinbackOffer> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NOT_ELIGIBLE;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, trial_end, vip, free_analyses_used, winback_popup_seen_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const state = {
      plan: (data?.plan as Plan) ?? "free",
      status: (data?.status as SubStatus | null) ?? null,
      currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
      trialEnd: (data?.trial_end as string | null) ?? null,
    };

    // Exclude every subscriber: active/trial plans, VIP, and Pass CDM legacy.
    const isSubscriber =
      Boolean(data?.vip) || hasAccess(state) || state.plan !== "free";
    if (isSubscriber) return NOT_ELIGIBLE;

    // Non-subscriber → count the visit (atomic, 1×/Paris-day) and evaluate.
    const { data: visitDays } = await supabase.rpc("record_visit");

    const seenAt = (data?.winback_popup_seen_at as string | null) ?? null;
    const eligible = isWinbackEligible({
      isSubscriber: false,
      visitDays: (visitDays as number | null) ?? 0,
      freeAnalysesUsed: (data?.free_analyses_used as number | null) ?? 0,
      seenAt,
    });

    return {
      eligible,
      code: WINBACK_CODE,
      expiresAt: seenAt ? new Date(winbackExpiryMs(seenAt)).toISOString() : null,
    };
  } catch (err) {
    console.warn("[winback] getWinbackOffer error:", err);
    return NOT_ELIGIBLE;
  }
}

/**
 * Stamp the pop-up as shown (idempotent) so it never reappears, and return the
 * end of the 72h marketing window to drive the countdown.
 */
export async function markWinbackSeen(): Promise<{ expiresAt: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { expiresAt: null };

    const { data: seenAt } = await supabase.rpc("mark_winback_seen");
    return {
      expiresAt: seenAt
        ? new Date(winbackExpiryMs(seenAt as string)).toISOString()
        : null,
    };
  } catch (err) {
    console.warn("[winback] markWinbackSeen error:", err);
    return { expiresAt: null };
  }
}
