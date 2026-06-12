"use server";

import type { Match } from "@/lib/types";
import { predictMatch } from "@/lib/match-model";
import { getMatchOddsMarkets } from "@/lib/data-service";
import { getTrackRecordStats } from "@/lib/track-record";

/** Simulated stake per pick (€) — labelled "simulée" everywhere in the UI. */
const STAKE_PER_PICK = 20;

export interface TeaserPick {
  /** Market name shown to the visitor (the SELECTION stays hidden/blurred). */
  market: string;
  /** Simulated potential return for this pick (€), from the real bookmaker odd. */
  potential: number;
}

export type PaywallTeaser =
  | { available: false }
  | {
      available: true;
      /** Total simulated return if all picks land (€). */
      missedAmount: number;
      stakedTotal: number;
      nPicks: number;
      maxOdds: number;
      /** Match-level IA confidence label (real, from the model). */
      confidence: string;
      picks: TeaserPick[];
      track: { verified: number; total: number; winRate: number; currentStreak: number };
    };

/**
 * Builds the loss-aversion ticket for a non-member, from our model's picks and
 * the REAL bookmaker odds (1X2 / O/U 2.5 / BTTS). Never reveals the selections,
 * never invents an odd: a market is only included if a real price exists.
 * No Claude call — cheap and safe to run for every paywall view.
 */
export async function getPaywallTeaser(match: Match): Promise<PaywallTeaser> {
  try {
    const pred = predictMatch(match);
    const odds = match.apiFixtureId
      ? await getMatchOddsMarkets(match.apiFixtureId)
      : { win: null, ou25: null, btts: null };

    const picks: TeaserPick[] = [];
    let maxOdds = 0;
    const add = (market: string, odd: number | undefined) => {
      if (!odd || odd <= 1) return;
      picks.push({ market, potential: Math.round(STAKE_PER_PICK * odd) });
      if (odd > maxOdds) maxOdds = odd;
    };

    // 1X2 → the model's favourite side, at its real odd.
    if (odds.win) {
      const { home, draw, away } = pred.probabilities;
      const winOdd =
        home >= away && home >= draw
          ? odds.win.home
          : away >= home && away >= draw
            ? odds.win.away
            : odds.win.draw;
      add("Résultat du match", winOdd);
    }
    // Over/Under 2.5 → model's side, real odd (line shown, side hidden).
    if (odds.ou25) {
      add("Total de buts (2,5)", pred.markets.over25 >= 50 ? odds.ou25.over : odds.ou25.under);
    }
    // BTTS → model's side, real odd.
    if (odds.btts) {
      add("Les deux équipes marquent", pred.markets.bttsYes >= 50 ? odds.btts.yes : odds.btts.no);
    }

    if (picks.length === 0) return { available: false };

    const missedAmount = picks.reduce((s, p) => s + p.potential, 0);
    const track = await getTrackRecordStats();

    return {
      available: true,
      missedAmount,
      stakedTotal: STAKE_PER_PICK * picks.length,
      nPicks: picks.length,
      maxOdds: Math.round(maxOdds * 100) / 100,
      confidence: pred.confidence,
      picks,
      track: {
        verified: track.verified,
        total: track.total,
        winRate: track.winRate,
        currentStreak: track.currentStreak,
      },
    };
  } catch {
    return { available: false };
  }
}
