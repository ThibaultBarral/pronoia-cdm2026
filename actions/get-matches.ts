"use server";

import { getMatches } from "@/lib/data-service";
import type { Match } from "@/lib/types";

/** Server action so the (client) dashboard never bundles server-only data code. */
export async function getMatchesAction(): Promise<Match[]> {
  return getMatches();
}

/** Lean match shape for the nation→match onboarding (no heavy Team objects). */
export interface OnboardMatch {
  id: string;
  date: string;
  time: string;
  round: string;
  home: { name: string; flag: string; rank: number };
  away: { name: string; flag: string; rank: number };
}

/**
 * Upcoming fixtures in a lean shape for the onboarding flow: the client derives
 * the nation picker from the distinct teams and filters by the supported nation.
 * Sorted soonest-first.
 */
export async function getOnboardingMatches(): Promise<OnboardMatch[]> {
  const matches = await getMatches().catch(() => [] as Match[]);
  return matches
    .filter((m) => (m.status ?? "NS") === "NS")
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    )
    .map((m) => ({
      id: m.id,
      date: m.date,
      time: m.time,
      round: m.round,
      home: { name: m.homeTeam.name, flag: m.homeTeam.flag, rank: m.homeTeam.fifaRanking },
      away: { name: m.awayTeam.name, flag: m.awayTeam.flag, rank: m.awayTeam.fifaRanking },
    }));
}

/**
 * The match to showcase to a brand-new user right after onboarding — the soonest
 * MARQUEE clash (strongest combined teams among the next dozen fixtures), so the
 * very first auto-generated analysis lands on an exciting, well-known match. Null
 * if no upcoming fixture (caller falls back to the dashboard).
 */
export async function getFeaturedMatchId(): Promise<string | null> {
  const matches = await getMatches().catch(() => [] as Match[]);
  const upcoming = matches
    .filter((m) => (m.status ?? "NS") === "NS")
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );
  if (!upcoming.length) return null;
  // Among the soonest fixtures, the strongest pairing (lowest summed FIFA rank).
  const pool = upcoming.slice(0, 12);
  pool.sort(
    (a, b) =>
      a.homeTeam.fifaRanking + a.awayTeam.fifaRanking -
      (b.homeTeam.fifaRanking + b.awayTeam.fifaRanking),
  );
  return pool[0].id;
}
