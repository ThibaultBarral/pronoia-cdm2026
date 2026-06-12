import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { predictMatch } from "@/lib/match-model";
import { getMatchOddsMarkets, getFinishedScore } from "@/lib/data-service";
import type { Match } from "@/lib/types";

type PickSide = "home" | "away" | "over" | "under" | "btts_yes" | "btts_no";

function confLabel(pct: number): string {
  return pct >= 70 ? "Élevé" : pct >= 58 ? "Moyen" : "Faible";
}

/** Paris-local date (YYYY-MM-DD) of an ISO timestamp. */
function parisDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Log the IA's main structured pick for a match as a `pending` verified
 * prediction (one per match, real odds). Idempotent. Fire-and-forget safe.
 */
export async function logMatchPrediction(match: Match): Promise<void> {
  try {
    if (!match.apiFixtureId) return;
    const pred = predictMatch(match);
    const odds = await getMatchOddsMarkets(match.apiFixtureId);

    const cands: {
      market: string;
      selection: string;
      side: PickSide;
      odd: number;
      conf: number;
    }[] = [];

    if (odds.win) {
      const { home, away } = pred.probabilities;
      if (home >= away)
        cands.push({ market: "Résultat", selection: match.homeTeam.name, side: "home", odd: odds.win.home, conf: home });
      else
        cands.push({ market: "Résultat", selection: match.awayTeam.name, side: "away", odd: odds.win.away, conf: away });
    }
    if (odds.ou25) {
      const over = pred.markets.over25;
      if (over >= 50)
        cands.push({ market: "Total buts", selection: "Plus de 2,5 buts", side: "over", odd: odds.ou25.over, conf: over });
      else
        cands.push({ market: "Total buts", selection: "Moins de 2,5 buts", side: "under", odd: odds.ou25.under, conf: 100 - over });
    }
    if (odds.btts) {
      const yes = pred.markets.bttsYes;
      if (yes >= 50)
        cands.push({ market: "BTTS", selection: "Les deux marquent : Oui", side: "btts_yes", odd: odds.btts.yes, conf: yes });
      else
        cands.push({ market: "BTTS", selection: "Les deux marquent : Non", side: "btts_no", odd: odds.btts.no, conf: 100 - yes });
    }

    if (!cands.length) return;
    cands.sort((a, b) => b.conf - a.conf);
    const top = cands[0];

    const admin = createAdminClient();
    await admin.from("verified_predictions").upsert(
      {
        match_id: match.id,
        match_label: `${match.homeTeam.shortName} - ${match.awayTeam.shortName}`,
        home_flag: match.homeTeam.flag,
        away_flag: match.awayTeam.flag,
        market: top.market,
        selection: top.selection,
        pick_side: top.side,
        odds: top.odd,
        confidence: confLabel(top.conf),
        status: "pending",
        phase: match.round,
        match_date: match.date,
        home_api_id: match.homeTeam.apiTeamId ?? null,
        away_api_id: match.awayTeam.apiTeamId ?? null,
      },
      { onConflict: "match_id", ignoreDuplicates: true }
    );
  } catch {
    /* never block the analysis on logging */
  }
}

function evaluate(side: PickSide, hg: number, ag: number): "won" | "lost" {
  const total = hg + ag;
  switch (side) {
    case "home": return hg > ag ? "won" : "lost";
    case "away": return ag > hg ? "won" : "lost";
    case "over": return total >= 3 ? "won" : "lost";
    case "under": return total <= 2 ? "won" : "lost";
    case "btts_yes": return hg > 0 && ag > 0 ? "won" : "lost";
    case "btts_no": return hg === 0 || ag === 0 ? "won" : "lost";
  }
}

/** Settle every pending prediction whose match has finished (idempotent). */
export async function settlePendingPredictions(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data: pending } = await admin
      .from("verified_predictions")
      .select("id, pick_side, home_api_id, away_api_id")
      .eq("status", "pending");
    if (!pending?.length) return 0;

    let settled = 0;
    for (const p of pending) {
      const side = p.pick_side as PickSide | null;
      const hId = p.home_api_id as number | null;
      const aId = p.away_api_id as number | null;
      if (!side || !hId || !aId) continue;
      const score = await getFinishedScore(hId, aId);
      if (!score) continue;
      const status = evaluate(side, score.homeGoals, score.awayGoals);
      await admin
        .from("verified_predictions")
        .update({
          status,
          settled_at: new Date().toISOString(),
          result_note: `${score.homeGoals}-${score.awayGoals}`,
        })
        .eq("id", p.id);
      settled++;
    }
    return settled;
  } catch {
    return 0;
  }
}

export interface WinItem {
  id: string;
  matchLabel: string;
  homeFlag: string | null;
  awayFlag: string | null;
  market: string;
  selection: string;
  odds: number;
}

/** Settles pending, then returns today's wins (for the modal) + recent wins (toasts). */
export async function getCelebrationData(): Promise<{
  todayWins: WinItem[];
  recentWins: WinItem[];
}> {
  await settlePendingPredictions();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("verified_predictions")
      .select("id, match_label, home_flag, away_flag, market, selection, odds, settled_at")
      .eq("status", "won")
      .order("settled_at", { ascending: false })
      .limit(12);

    const rows = data ?? [];
    const map = (r: (typeof rows)[number]): WinItem => ({
      id: r.id as string,
      matchLabel: (r.match_label as string) ?? "",
      homeFlag: (r.home_flag as string | null) ?? null,
      awayFlag: (r.away_flag as string | null) ?? null,
      market: (r.market as string) ?? "",
      selection: (r.selection as string) ?? "",
      odds: Number(r.odds) || 0,
    });

    const today = parisDate(new Date().toISOString());
    const todayWins = rows
      .filter((r) => parisDate(r.settled_at as string | null) === today)
      .map(map);
    const recentWins = rows.map(map);
    return { todayWins, recentWins };
  } catch {
    return { todayWins: [], recentWins: [] };
  }
}
