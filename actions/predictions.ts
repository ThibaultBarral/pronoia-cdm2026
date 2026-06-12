"use server";

import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCelebrationData as _getCelebrationData,
  settlePendingPredictions,
  type WinItem,
} from "@/lib/predictions";

/** Public: settles finished predictions then returns today's + recent wins. */
export async function getCelebrationData(): Promise<{
  todayWins: WinItem[];
  recentWins: WinItem[];
}> {
  return _getCelebrationData();
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function settleNow(): Promise<{ ok: boolean; settled?: number }> {
  if (!(await isAdmin())) return { ok: false };
  const settled = await settlePendingPredictions();
  return { ok: true, settled };
}

export async function setPredictionStatus(
  id: string,
  status: "won" | "lost" | "void" | "pending"
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  const admin = createAdminClient();
  const { error } = await admin
    .from("verified_predictions")
    .update({
      status,
      settled_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", id);
  return { ok: !error };
}
