import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface TrackRecordStats {
  total: number; // prédictions réglées (won + lost)
  verified: number; // toutes prédictions enregistrées (incl. pending)
  won: number;
  lost: number;
  winRate: number; // % sur les réglées, 0 si aucune
  currentStreak: number; // série de ✅ en cours (résultats récents)
}

const EMPTY: TrackRecordStats = {
  total: 0,
  verified: 0,
  won: 0,
  lost: 0,
  winRate: 0,
  currentStreak: 0,
};

/**
 * Real aggregate stats from verified_predictions. Fail-safe: if the table is
 * missing or empty, returns zeros (the UI degrades to the verified count + the
 * match's own IA confidence). Never invents numbers.
 */
export async function getTrackRecordStats(): Promise<TrackRecordStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("verified_predictions")
      .select("status, settled_at")
      .order("settled_at", { ascending: false, nullsFirst: false });

    if (error || !data) return EMPTY;

    const verified = data.length;
    const settled = data.filter((r) => r.status === "won" || r.status === "lost");
    const won = settled.filter((r) => r.status === "won").length;
    const lost = settled.filter((r) => r.status === "lost").length;
    const total = won + lost;

    // Current streak of wins, walking the most-recent settled results.
    let currentStreak = 0;
    for (const r of settled) {
      if (r.status === "won") currentStreak++;
      else break;
    }

    return {
      total,
      verified,
      won,
      lost,
      winRate: total ? Math.round((won / total) * 100) : 0,
      currentStreak,
    };
  } catch {
    return EMPTY;
  }
}
