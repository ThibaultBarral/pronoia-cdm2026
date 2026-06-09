/**
 * Real WC 2026 knockout bracket structure (SERVER ONLY).
 *
 * OpenFootball encodes the entire knockout tree with positional slots:
 *   "1A" = winner of group A, "2B" = runner-up of B,
 *   "3A/B/C/D/F" = a third-placed team from one of those groups,
 *   "W74" = winner of match 74.
 * We fetch & cache that structure so the simulation can Monte-Carlo the ACTUAL
 * bracket (who plays whom each round) instead of an averaged "field strength".
 */
import "server-only";

import { getCachedOrFetch } from "./api-cache";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

export type KnockoutRound =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Final";

const KO_ROUNDS: KnockoutRound[] = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

export interface KnockoutMatch {
  /** OpenFootball match number (defines bracket wiring via "W<num>"). */
  num: number;
  round: KnockoutRound;
  /** Slot for side 1 — "1A" | "2B" | "3A/B/C/D/F" | "W74". */
  slot1: string;
  /** Slot for side 2. */
  slot2: string;
}

interface OFRawMatch {
  round: string;
  num?: number;
  team1: string;
  team2: string;
  group?: string;
}

/** Fetch & cache the knockout bracket (R32 → Final), ordered by match number. */
export async function getKnockoutBracket(): Promise<KnockoutMatch[]> {
  return getCachedOrFetch("bracket:wc2026", 86400, async () => {
    const res = await fetch(OPENFOOTBALL_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`OpenFootball ${res.status}`);
    const data = (await res.json()) as { matches: OFRawMatch[] };

    return data.matches
      .filter((m): m is OFRawMatch & { num: number } =>
        typeof m.num === "number" && (KO_ROUNDS as string[]).includes(m.round)
      )
      .map((m) => ({
        num: m.num,
        round: m.round as KnockoutRound,
        slot1: m.team1,
        slot2: m.team2,
      }))
      .sort((a, b) => a.num - b.num);
  });
}
