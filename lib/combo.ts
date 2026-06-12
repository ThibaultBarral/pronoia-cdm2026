import "server-only";

import { getMatches } from "./data-service";
import { getMatchOddsMarkets } from "./data-service";
import { computeTopPick, upsertPrediction } from "./predictions";
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
const confLabel = (p: number) => (p >= 70 ? "Élevé" : p >= 58 ? "Moyen" : "Faible");

export interface ComboPick {
  matchId: string;
  matchLabel: string;
  homeFlag: string;
  awayFlag: string;
  market: string;
  selection: string;
  odd: number;
  confLabel: string;
  date: string;
  time: string;
}

export interface DailyCombo {
  picks: ComboPick[];
  totalOdds: number;
  confidence: string;
  firstKickoff: string;
  count: number;
}

async function buildCombo(): Promise<DailyCombo | null> {
  if (!hasApiKey()) return null;
  const matches = await getMatches();
  const now = Date.now();
  const upcoming = matches
    .filter((m) => (m.status ?? "NS") === "NS" && ts(m) > now)
    .sort((a, b) => ts(a) - ts(b));
  if (upcoming.length < 2) return null;

  const today = parisToday();
  let pool = upcoming.filter((m) => m.date === today);
  if (pool.length < 2) pool = upcoming; // fallback: soonest upcoming
  pool = pool.slice(0, 8);

  const cands: { m: Match; market: string; selection: string; odd: number; conf: number; confLabel: string }[] = [];
  for (const m of pool) {
    const pick = await computeTopPick(m);
    if (!pick) continue;
    cands.push({ m, market: pick.market, selection: pick.selection, odd: pick.odd, conf: pick.conf, confLabel: pick.confLabel });
    await upsertPrediction(m, pick); // tracked → feeds the track record / celebration
  }
  cands.sort((a, b) => b.conf - a.conf);
  const top = cands.slice(0, 3);
  if (top.length < 2) return null;

  const picks: ComboPick[] = top.map((c) => ({
    matchId: c.m.id,
    matchLabel: `${c.m.homeTeam.shortName} - ${c.m.awayTeam.shortName}`,
    homeFlag: c.m.homeTeam.flag,
    awayFlag: c.m.awayTeam.flag,
    market: c.market,
    selection: c.selection,
    odd: c.odd,
    confLabel: c.confLabel,
    date: c.m.date,
    time: c.m.time,
  }));
  const totalOdds = Math.round(picks.reduce((p, x) => p * x.odd, 1) * 100) / 100;
  const minConf = Math.min(...top.map((c) => c.conf));
  const firstKickoff = top
    .map((c) => `${c.m.date}T${c.m.time || "00:00"}:00`)
    .sort()[0];

  return { picks, totalOdds, confidence: confLabel(minConf), firstKickoff, count: picks.length };
}

/** The IA combo of the day (2–3 highest-confidence picks), cached 3h. */
export async function getDailyCombo(): Promise<DailyCombo | null> {
  return getCachedOrFetch(`combo:daily:${parisToday()}`, 10800, buildCombo).catch(() => null);
}

// ─── Odds ticker ──────────────────────────────────────────────────────────────

export interface TickerItem {
  matchId: string;
  label: string;
  homeFlag: string;
  awayFlag: string;
  home: number;
  draw: number;
  away: number;
  time: string;
}

async function buildTicker(): Promise<TickerItem[]> {
  if (!hasApiKey()) return [];
  const matches = await getMatches();
  const now = Date.now();
  const upcoming = matches
    .filter((m) => (m.status ?? "NS") === "NS" && ts(m) > now && m.apiFixtureId)
    .sort((a, b) => ts(a) - ts(b))
    .slice(0, 10);

  const items: TickerItem[] = [];
  for (const m of upcoming) {
    const odds = await getMatchOddsMarkets(m.apiFixtureId!);
    if (!odds.win) continue;
    items.push({
      matchId: m.id,
      label: `${m.homeTeam.shortName}-${m.awayTeam.shortName}`,
      homeFlag: m.homeTeam.flag,
      awayFlag: m.awayTeam.flag,
      home: odds.win.home,
      draw: odds.win.draw,
      away: odds.win.away,
      time: m.time,
    });
  }
  return items;
}

/** Today's upcoming matches with 1N2 odds for the ticker, cached 30min. */
export async function getTodayTicker(): Promise<TickerItem[]> {
  return getCachedOrFetch(`ticker:${parisToday()}`, 1800, buildTicker).catch(() => []);
}
