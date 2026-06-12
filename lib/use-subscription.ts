"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasAccess, planName, type Plan, type SubStatus } from "@/lib/plans";

export interface ClientSub {
  plan: Plan;
  access: boolean;
  label: string | null;
  /** Discovery analyses already consumed (free tier). */
  freeAnalysesUsed: number;
}

/**
 * Client-side read of the current user's subscription, for nav/badges.
 * Returns null while loading or signed out.
 */
export function useSubscription(): ClientSub | null {
  const [sub, setSub] = useState<ClientSub | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, trial_end, vip, free_analyses_used")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          const plan = (data?.plan as Plan) ?? "free";
          const vip = Boolean(data?.vip);
          const access =
            vip ||
            hasAccess({
              plan,
              status: (data?.status as SubStatus | null) ?? null,
              currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
              trialEnd: (data?.trial_end as string | null) ?? null,
            });
          setSub({
            plan,
            access,
            label: vip ? "Accès VIP" : access ? planName(plan) : null,
            freeAnalysesUsed: (data?.free_analyses_used as number | null) ?? 0,
          });
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return sub;
}
