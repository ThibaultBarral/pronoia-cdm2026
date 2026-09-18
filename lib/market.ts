/**
 * Market consensus — pure functions over an API-Football /odds response.
 *
 * Instead of one operator's prices, we read EVERY operator quoting the
 * fixture, strip each one's margin, and average the implied probabilities.
 * The dispersion between operators is kept as an agreement signal: when 15
 * operators sit within a point of each other the market is sure of itself;
 * when they spread out, it isn't. Vocabulary is deliberately "market" and
 * "operators" (never bookmaker / bet) — this powers an analysis, not a wager.
 */
import type { ApiOddsResponse } from "./api-football";
import type { MarketConsensus, MarketMovement } from "./types";

const MATCH_WINNER = 1;
const OVER_UNDER = 5;
const BTTS = 8;

/** Margin-free implied probabilities from a set of decimal prices. */
function implied(prices: number[]): number[] | null {
  if (prices.some((p) => !(p > 1))) return null;
  const inv = prices.map((p) => 1 / p);
  const sum = inv.reduce((a, b) => a + b, 0);
  return inv.map((x) => x / sum);
}

function price(values: { value: string; odd: string }[], label: string): number {
  return parseFloat(values.find((v) => v.value === label)?.odd ?? "0");
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeConsensus(resp: ApiOddsResponse | null): MarketConsensus | null {
  if (!resp?.bookmakers?.length) return null;

  const rows: { home: number; draw: number; away: number }[] = [];
  const over25: number[] = [];
  const btts: number[] = [];

  for (const bk of resp.bookmakers) {
    const mw = bk.bets.find((b) => b.id === MATCH_WINNER || b.name === "Match Winner");
    if (mw) {
      const p = implied([price(mw.values, "Home"), price(mw.values, "Draw"), price(mw.values, "Away")]);
      if (p) rows.push({ home: p[0], draw: p[1], away: p[2] });
    }
    const ou = bk.bets.find((b) => b.id === OVER_UNDER || b.name === "Goals Over/Under");
    if (ou) {
      const p = implied([price(ou.values, "Over 2.5"), price(ou.values, "Under 2.5")]);
      if (p) over25.push(p[0]);
    }
    const bt = bk.bets.find((b) => b.id === BTTS || b.name === "Both Teams Score");
    if (bt) {
      const p = implied([price(bt.values, "Yes"), price(bt.values, "No")]);
      if (p) btts.push(p[0]);
    }
  }
  if (!rows.length) return null;

  const home = mean(rows.map((r) => r.home));
  const draw = mean(rows.map((r) => r.draw));
  const away = mean(rows.map((r) => r.away));
  // Spread: how far apart the operators are on the favourite, in points.
  const favKey = home >= away && home >= draw ? "home" : away >= draw ? "away" : "draw";
  const favs = rows.map((r) => r[favKey] * 100);
  const spread = rows.length > 1 ? Math.max(...favs) - Math.min(...favs) : 0;
  const agreement: MarketConsensus["agreement"] = rows.length < 3 ? "faible" : spread <= 4 ? "fort" : spread <= 8 ? "moyen" : "faible";

  const pct = (x: number) => Math.round(x * 1000) / 10;
  return {
    operators: rows.length,
    implied: { home: pct(home), draw: pct(draw), away: pct(away) },
    spread: Math.round(spread * 10) / 10,
    agreement,
    over25: over25.length ? pct(mean(over25)) : undefined,
    btts: btts.length ? pct(mean(btts)) : undefined,
  };
}

/** One dated reading of the consensus, as stored for line-movement tracking. */
export interface MarketSnapshot {
  takenOn: string; // YYYY-MM-DD (UTC)
  operators: number;
  home: number;
  draw: number;
  away: number;
}

/**
 * Line movement between the first and the latest snapshot, in probability
 * points. Positive = the market moved TOWARDS that outcome. Null until we
 * have two distinct days.
 */
export function computeMovement(snaps: MarketSnapshot[]): MarketMovement | null {
  const sorted = [...snaps].sort((a, b) => a.takenOn.localeCompare(b.takenOn));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last || first.takenOn === last.takenOn) return null;
  const days = Math.round((Date.parse(last.takenOn) - Date.parse(first.takenOn)) / 86_400_000);
  const d = (x: number) => Math.round(x * 10) / 10;
  return {
    days,
    since: first.takenOn,
    home: d(last.home - first.home),
    draw: d(last.draw - first.draw),
    away: d(last.away - first.away),
  };
}
