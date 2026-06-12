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

export interface TrackRow {
  id: string;
  matchLabel: string;
  homeFlag: string | null;
  awayFlag: string | null;
  market: string;
  selection: string;
  odds: number;
  confidence: string | null;
  status: string;
  resultNote: string | null;
  phase: string | null;
  date: string | null;
}

/** Full chronological list (settled first, recent first) — misses included. */
export async function getTrackRecordList(limit = 300): Promise<TrackRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("verified_predictions")
      .select("id, match_label, home_flag, away_flag, market, selection, odds, confidence, status, result_note, phase, match_date, settled_at, created_at")
      .order("settled_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((r): TrackRow => ({
      id: r.id as string,
      matchLabel: (r.match_label as string | null) ?? "",
      homeFlag: (r.home_flag as string | null) ?? null,
      awayFlag: (r.away_flag as string | null) ?? null,
      market: (r.market as string | null) ?? "",
      selection: (r.selection as string | null) ?? "",
      odds: Number(r.odds) || 0,
      confidence: (r.confidence as string | null) ?? null,
      status: (r.status as string) ?? "pending",
      resultNote: (r.result_note as string | null) ?? null,
      phase: (r.phase as string | null) ?? null,
      date: (r.match_date as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
