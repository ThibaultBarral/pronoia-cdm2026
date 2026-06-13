/**
 * World Football Elo ratings for the simulation engine.
 *
 * Source: eloratings.net (snapshot 2026-06-01) for the teams that matter most
 * (the realistic title contenders). For teams without a quoted Elo we derive a
 * value from the live FIFA ranking, calibrated to the Elo scale's top-20 floor
 * (rank 20 ≈ 1866, ~−6.4 pts per rank below that, floor 1400).
 *
 * Why Elo (not the raw FIFA rank used by the old model): Elo separates the
 * elites realistically (Spain 2165 vs Argentina 2113 vs France 2081) and bakes
 * in recent results & margin of victory — so the model reflects 2024-2025 form,
 * not a stale ranking. Keys are the ENGLISH team names used across the app.
 */
import "server-only";

import { getTeamMeta } from "./team-ids";

/** Real Elo ratings (eloratings.net, 2026-06-01). Update periodically. */
export const REAL_ELO: Record<string, number> = {
  Spain: 2165,
  Argentina: 2113,
  France: 2081,
  England: 2020,
  Brazil: 1988,
  Portugal: 1984,
  Colombia: 1977,
  Netherlands: 1961,
  Ecuador: 1935,
  Croatia: 1930,
  Germany: 1925,
  Norway: 1917,
  Turkey: 1906,
  Japan: 1906,
  Switzerland: 1894,
  Uruguay: 1892,
  Denmark: 1870,
  Mexico: 1868,
  Belgium: 1866,
  Senegal: 1866,
  // Notable WC qualifiers just below the published top 20 (eloratings.net):
  Morocco: 1943,
  USA: 1892,
  Austria: 1790,
  Australia: 1720,
  Egypt: 1700,
  "South Korea": 1730,
  Iran: 1690,
  Paraguay: 1680,
  "Ivory Coast": 1700,
  Algeria: 1690,
  Panama: 1620,
  Scotland: 1720,
  Sweden: 1760,
  // Lower-ranked WC entrants whose FIFA-rank-derived Elo overrated them (the
  // derivation floor is too generous for weak sides) → real eloratings.net values.
  Qatar: 1500,
  "New Zealand": 1490,
};

/** Elo for a team — real value if known, else estimated from its FIFA rank. */
export function getElo(nameEn: string): number {
  const real = REAL_ELO[nameEn];
  if (real != null) return real;
  const rank = getTeamMeta(nameEn).fifaRanking || 70;
  return Math.max(1400, Math.round(1866 - 6.4 * (rank - 20)));
}
