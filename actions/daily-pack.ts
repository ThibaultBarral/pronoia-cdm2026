"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "La pochette du jour" — daily reward for retention. The roll is 100% server
 * side (never trust the client); odds are published in the UI. Rewards feed the
 * free-analysis credit balance, or grant temporary Pro access (jackpot).
 */

export type PackReward = {
  key: "none" | "one" | "two" | "day" | "week";
  label: string;
  credits: number;
  accessDays: number;
};

// Weighted table — total 100. Keep in sync with the odds shown in the UI.
const REWARDS: (PackReward & { weight: number })[] = [
  { key: "none", weight: 55, credits: 0, accessDays: 0, label: "Rien cette fois — reviens demain !" },
  { key: "one",  weight: 32, credits: 1, accessDays: 0, label: "+1 analyse gratuite" },
  { key: "two",  weight: 10, credits: 2, accessDays: 0, label: "+2 analyses gratuites" },
  { key: "day",  weight: 2,  credits: 0, accessDays: 1, label: "24h Pro offert" },
  { key: "week", weight: 1,  credits: 0, accessDays: 7, label: "JACKPOT — 1 semaine Pro offerte" },
];

function rollReward(): PackReward {
  const total = REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of REWARDS) {
    roll -= r.weight;
    if (roll < 0) return { key: r.key, label: r.label, credits: r.credits, accessDays: r.accessDays };
  }
  const last = REWARDS[REWARDS.length - 1];
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

  const reward = rollReward();

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
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { packOpenedToday: false, shareClaimedToday: false, bonusCredits: 0 };

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
      .select("bonus_credits")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const kinds = new Set((rewards ?? []).map((r) => r.kind as string));
  return {
    packOpenedToday: kinds.has("pack"),
    shareClaimedToday: kinds.has("share"),
    bonusCredits: (sub?.bonus_credits as number | null) ?? 0,
  };
}
