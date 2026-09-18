"use server";

import type { Match } from "@/lib/types";
import { predictMatch } from "@/lib/match-model";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription } from "@/lib/ai-guard";

/**
 * The free, model-only short read of a match — shown to non-members above the
 * locked full analysis. Three things and nothing more (2026-09-18): the
 * favourite, its probability and the most likely score. Built from our
 * deterministic model (predictMatch) so it costs ZERO Claude tokens. Everything
 * else (markets, confidence, what the model looked at, the narrative, absences,
 * players, chat) is paid.
 */
export interface MatchPreview {
  favorite: "home" | "away" | "draw";
  /** Probability of the favourite outcome (%). */
  probability: number;
  /** Most likely scoreline (rounded expected goals, favourite kept ahead). */
  likelyScore: { home: number; away: number };
}

/**
 * Why the short read is gated (2026-09-16): it is the one free taste of the
 * product, so it is worth an account. A visitor must sign up to see it, and a
 * free account gets it on ONE match only (the first one it opens); every other
 * match shows the paywall. Members are never gated. The "which match was the
 * free one" memory lives in app_events (name = "free_read"), no schema change.
 */
export type MatchPreviewResult =
  | { ok: true; preview: MatchPreview }
  | { ok: false; gate: "auth" | "paywall" };

const FREE_READ_EVENT = "free_read";

export async function getMatchPreview(match: Match): Promise<MatchPreviewResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, gate: "auth" };

  const sub = await getSubscription();
  if (!sub?.access) {
    const admin = createAdminClient();
    const { data: prior } = await admin
      .from("app_events")
      .select("props")
      .eq("user_id", user.id)
      .eq("name", FREE_READ_EVENT)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const freeMatchId = (prior?.props as { matchId?: string } | null)?.matchId;
    if (freeMatchId && freeMatchId !== match.id) return { ok: false, gate: "paywall" };
    if (!freeMatchId) {
      await admin.from("app_events").insert({ user_id: user.id, name: FREE_READ_EVENT, props: { matchId: match.id } });
    }
  }

  return { ok: true, preview: computePreview(match) };
}

function computePreview(match: Match): MatchPreview {
  const pred = predictMatch(match);
  const { home, draw, away } = pred.probabilities;
  const favorite: MatchPreview["favorite"] =
    home >= away && home >= draw ? "home" : away >= home && away >= draw ? "away" : "draw";

  // Likely score: rounded expected goals, nudged so it agrees with the favourite.
  let sh = Math.max(0, Math.round(pred.expectedGoals.home));
  let sa = Math.max(0, Math.round(pred.expectedGoals.away));
  if (favorite === "home" && sh <= sa) sh = sa + 1;
  if (favorite === "away" && sa <= sh) sa = sh + 1;
  if (favorite === "draw") sa = sh;

  return {
    favorite,
    probability: favorite === "home" ? home : favorite === "away" ? away : draw,
    likelyScore: { home: sh, away: sa },
  };
}
