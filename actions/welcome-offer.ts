"use server";

import { createClient } from "@/lib/supabase/server";
import { hasAccess, type Plan, type SubStatus } from "@/lib/plans";
import { WELCOME_CODE, welcomeExpiryMs } from "@/lib/welcome-offer";

export interface WelcomeOffer {
  eligible: boolean;
  code: string;
  /** ISO end of the welcome window (signup + N h), or null when not eligible. */
  expiresAt: string | null;
}

const NOT_ELIGIBLE: WelcomeOffer = { eligible: false, code: WELCOME_CODE, expiresAt: null };

/**
 * Whether the first-session welcome offer should show for the current user:
 * a non-subscriber still inside the post-signup window. Fail-safe — any error
 * returns "not eligible" and never throws to the UI.
 */
export async function getWelcomeOffer(): Promise<WelcomeOffer> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.created_at) return NOT_ELIGIBLE;

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
    // Exclude every subscriber (active/trial plans, VIP, Pass CDM legacy).
    const isSubscriber = Boolean(data?.vip) || hasAccess(state) || state.plan !== "free";
    if (isSubscriber) return NOT_ELIGIBLE;

    const expiryMs = welcomeExpiryMs(user.created_at);
    if (Date.now() >= expiryMs) return NOT_ELIGIBLE;

    return { eligible: true, code: WELCOME_CODE, expiresAt: new Date(expiryMs).toISOString() };
  } catch (err) {
    console.warn("[welcome-offer] getWelcomeOffer error:", err);
    return NOT_ELIGIBLE;
  }
}
