"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAccess, type Plan, type SubStatus } from "@/lib/plans";

/** A real paid subscription (ignores bonus access) → analyses are worthless to them. */
function isPaidSubscriber(sub: {
  plan?: unknown;
  status?: unknown;
  current_period_end?: unknown;
  trial_end?: unknown;
  vip?: unknown;
} | null): boolean {
  if (!sub) return false;
  if (Boolean(sub.vip)) return true;
  return hasAccess({
    plan: (sub.plan as Plan) ?? "free",
    status: (sub.status as SubStatus | null) ?? null,
    currentPeriodEnd: (sub.current_period_end as string | null) ?? null,
    trialEnd: (sub.trial_end as string | null) ?? null,
    bonusAccessUntil: null, // ignore bonus access → only a real plan counts
  });
}

/**
 * "La pochette du jour" — daily reward for retention. The roll is 100% server
 * side (never trust the client); odds are published in the UI. Rewards feed the
 * free-analysis credit balance, or grant temporary Pro access (jackpot).
 */

export type PackReward = {
  key: string;
  label: string;
  /** Bonus free-analysis credits (free users). */
  credits: number;
  /** Days of temporary Pro access granted (free users: from now; paid: after period). */
  accessDays: number;
};

// Weighted tables — total 100 each. Keep in sync with the odds shown in the UI.
// Free users win analyses/temp Pro; paid users win subscription days (analyses
// are worthless to them), with slightly better odds as a loyalty gesture.
type WeightedReward = PackReward & { weight: number };

const REWARDS_FREE: WeightedReward[] = [
  { key: "none", weight: 55, credits: 0, accessDays: 0, label: "Rien cette fois — reviens demain !" },
  { key: "one",  weight: 32, credits: 1, accessDays: 0, label: "+1 analyse gratuite" },
  { key: "two",  weight: 10, credits: 2, accessDays: 0, label: "+2 analyses gratuites" },
  { key: "day",  weight: 2,  credits: 0, accessDays: 1, label: "24h Pro offert" },
  { key: "week", weight: 1,  credits: 0, accessDays: 7, label: "JACKPOT — 1 semaine Pro offerte" },
];

const REWARDS_PAID: WeightedReward[] = [
  { key: "none",   weight: 45, credits: 0, accessDays: 0,  label: "Rien cette fois — reviens demain !" },
  { key: "pdays3", weight: 35, credits: 0, accessDays: 3,  label: "+3 jours d'abonnement offerts" },
  { key: "pdays7", weight: 15, credits: 0, accessDays: 7,  label: "+7 jours d'abonnement offerts" },
  { key: "pmonth", weight: 5,  credits: 0, accessDays: 30, label: "JACKPOT — 1 mois d'abonnement offert" },
];

function rollReward(pool: WeightedReward[]): PackReward {
  const total = pool.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of pool) {
    roll -= r.weight;
    if (roll < 0) return { key: r.key, label: r.label, credits: r.credits, accessDays: r.accessDays };
  }
  const last = pool[pool.length - 1];
  return { key: last.key, label: last.label, credits: last.credits, accessDays: last.accessDays };
}

export type OpenPackResult =
  | { ok: true; alreadyOpened: true }
  | { ok: true; alreadyOpened: false; reward: PackReward }
  | { ok: false; error: string };

/** Open today's pack (once per calendar day). Returns the rolled reward. */
export async function openDailyPack(): Promise<OpenPackResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  // Pick the reward pool by profile: paid subscribers win subscription days,
  // free users win analyses (worthless to a paying member).
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_end, vip")
    .eq("user_id", user.id)
    .maybeSingle();
  const reward = rollReward(isPaidSubscriber(sub) ? REWARDS_PAID : REWARDS_FREE);

  const { data: claimed, error } = await supabase.rpc("claim_daily_pack", {
    p_reward: reward.key,
    p_credits: reward.credits,
    p_access_days: reward.accessDays,
  });

  if (error) {
    console.error("[daily-pack] claim_daily_pack error:", error.message);
    return { ok: false, error: "Impossible d'ouvrir la pochette pour le moment." };
  }

  // `false` → already opened today (the roll is discarded, no double reward).
  if (!claimed) return { ok: true, alreadyOpened: true };

  return { ok: true, alreadyOpened: false, reward };
}

/** Grant +1 free analysis for sharing the prediction card (capped once/day). */
export async function grantShareReward(): Promise<{ ok: boolean; granted: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, granted: false };

  const { data: granted, error } = await supabase.rpc("grant_share_credit");
  if (error) {
    console.error("[daily-pack] grant_share_credit error:", error.message);
    return { ok: false, granted: false };
  }
  return { ok: true, granted: Boolean(granted) };
}

/** Whether the user opened the pack today + their current bonus credit balance. */
export async function getDailyStatus(): Promise<{
  packOpenedToday: boolean;
  shareClaimedToday: boolean;
  bonusCredits: number;
  isPaid: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { packOpenedToday: false, shareClaimedToday: false, bonusCredits: 0, isPaid: false };

  // daily_rewards is server-only (RLS deny) → read with the service-role client.
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rewards }, { data: sub }] = await Promise.all([
    admin
      .from("daily_rewards")
      .select("kind")
      .eq("user_id", user.id)
      .eq("reward_date", today),
    admin
      .from("subscriptions")
      .select("bonus_credits, plan, status, current_period_end, trial_end, vip")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const kinds = new Set((rewards ?? []).map((r) => r.kind as string));
  return {
    packOpenedToday: kinds.has("pack"),
    shareClaimedToday: kinds.has("share"),
    bonusCredits: (sub?.bonus_credits as number | null) ?? 0,
    isPaid: isPaidSubscriber(sub),
  };
}
