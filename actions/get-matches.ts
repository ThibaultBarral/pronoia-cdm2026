"use server";

import { getMatches } from "@/lib/data-service";
import type { Match } from "@/lib/types";

/** Server action so the (client) dashboard never bundles server-only data code. */
export async function getMatchesAction(): Promise<Match[]> {
  return getMatches();
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
