import "server-only";

import { getMatches } from "./data-service";
import { listValueBets, type ValueBet } from "./value-bet";
import { getCachedOrFetch } from "./api-cache";
import type { Match } from "./types";

const hasApiKey = () => Boolean(process.env.API_FOOTBALL_KEY);

function parisToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
const ts = (m: Match) => new Date(`${m.date}T${m.time || "00:00"}`).getTime();

export interface DailyValueBet extends ValueBet {
  matchId: string;
  matchLabel: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
}

/** Every genuine value bet across today's upcoming fixtures (best EV first). */
async function buildDailyValues(): Promise<DailyValueBet[]> {
  if (!hasApiKey()) return [];
  const matches = await getMatches();
  const now = Date.now();
  const today = parisToday();

  let pool = matches.filter(
    (m) => (m.status ?? "NS") === "NS" && ts(m) > now && m.apiFixtureId && m.date === today
  );
  if (pool.length < 3) {
    // Fallback: not enough matches today → widen to the soonest upcoming ones.
    pool = matches
      .filter((m) => (m.status ?? "NS") === "NS" && ts(m) > now && m.apiFixtureId)
      .sort((a, b) => ts(a) - ts(b));
  }
  // Cap the pool so a slow day never burns the whole API quota.
  pool = pool.slice(0, 12);

  const out: DailyValueBet[] = [];
  for (const m of pool) {
    const bets = await listValueBets(m).catch(() => []);
    for (const b of bets) {
      out.push({
        ...b,
        matchId: m.id,
        matchLabel: `${m.homeTeam.shortName} - ${m.awayTeam.shortName}`,
        homeFlag: m.homeTeam.flag,
        awayFlag: m.awayTeam.flag,
        date: m.date,
        time: m.time,
      });
    }
  }
  return out.sort((a, b) => b.ev - a.ev);
}

/** Today's value bets across all fixtures, cached 30min (shared across users). */
export async function getDailyValues(): Promise<DailyValueBet[]> {
  return getCachedOrFetch(`values:daily:${parisToday()}`, 1800, buildDailyValues).catch(() => []);
}
