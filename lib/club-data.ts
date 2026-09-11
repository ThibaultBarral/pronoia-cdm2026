/**
 * Club data service (SERVER ONLY) — the 2026/27 club season.
 *
 * Everything here is fed by API-Football through the shared Supabase cache
 * (lib/api-cache), so users read cached data and we control the request
 * volume. Sources:
 *   - `/standings`  → the club list of each competition (name, logo, rank)
 *   - `/fixtures?team=&season=` → a club's past & upcoming matches
 *   - `/fixtures?id=` → one fixture, turned into a full `Match` for analysis
 *   - `/players/squads`, `/coachs` → squad & coach
 *
 * No hardcoded clubs, no invented numbers: when the API is unavailable the
 * functions return empty lists and the UI shows an honest empty state.
 */
import "server-only";

import {
  fetchFixtureById,
  fetchTeamSeasonFixtures,
  fetchSquad,
  fetchCoach,
  fetchH2H,
  FINISHED_STATUSES,
  type ApiFixtureResponse,
  type ApiTeam,
} from "./api-football";
import { getCachedOrFetch } from "./api-cache";
import { COMPETITIONS, type Competition } from "./competitions";
import { getCompetitionClubs, type CompetitionClub } from "./competition-data";
import { mapSquad, mapForm, computeMomentum, mapH2H, mapStatus } from "./data-service";
import type { Match, Team, Lineup } from "./types";

/** Season key API-Football uses for 2026/27. */
export const CLUB_SEASON = 2026;
/** Kickoff window inside which a match can be analysed (7 days). */
export const ANALYSIS_WINDOW_MS = 7 * 24 * 3600_000;

const LEAGUE_IDS = new Set(COMPETITIONS.map((c) => c.leagueId));
const hasApiKey = () => Boolean(process.env.API_FOOTBALL_KEY);

export function competitionForLeague(leagueId: number): Competition | undefined {
  return COMPETITIONS.find((c) => c.leagueId === leagueId);
}

// ─── Clubs (search + lookup) ─────────────────────────────────────────────────

export interface ClubSummary {
  apiId: number;
  name: string;
  slug: string;
  logo: string | null;
  monogram: string;
  rank: number;
  competition: Pick<Competition, "slug" | "name" | "shortName" | "flag" | "leagueId">;
}

function toSummary(c: CompetitionClub, comp: Competition): ClubSummary {
  return {
    apiId: c.apiId,
    name: c.name,
    slug: c.slug,
    logo: c.logo ?? null,
    monogram: c.monogram,
    rank: c.rank,
    competition: {
      slug: comp.slug,
      name: comp.name,
      shortName: comp.shortName,
      flag: comp.flag,
      leagueId: comp.leagueId,
    },
  };
}

/**
 * Every club of the 7 covered competitions, deduped (a club in Ligue 1 AND in
 * the Champions League appears once, under its domestic league).
 */
export async function getAllClubs(): Promise<ClubSummary[]> {
  const domesticFirst = [...COMPETITIONS].sort((a, b) =>
    a.kind === b.kind ? 0 : a.kind === "domestic" ? -1 : 1,
  );
  const lists = await Promise.all(
    domesticFirst.map(async (comp) => ({
      comp,
      clubs: await getCompetitionClubs(comp.slug).catch(() => [] as CompetitionClub[]),
    })),
  );
  const seen = new Set<number>();
  const out: ClubSummary[] = [];
  for (const { comp, clubs } of lists) {
    for (const c of clubs) {
      if (seen.has(c.apiId)) continue;
      seen.add(c.apiId);
      out.push(toSummary(c, comp));
    }
  }
  return out;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Name search across all covered clubs (accent-insensitive, prefix-first). */
export async function searchClubs(query: string, limit = 8): Promise<ClubSummary[]> {
  const q = norm(query);
  if (q.length < 2) return [];
  const clubs = await getAllClubs();
  const scored = clubs
    .map((c) => {
      const n = norm(c.name);
      const score = n.startsWith(q) ? 2 : n.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : n.includes(q) ? 0.5 : 0;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.rank - b.c.rank);
  return scored.slice(0, limit).map((x) => x.c);
}

export async function getClubById(apiId: number): Promise<ClubSummary | null> {
  const clubs = await getAllClubs();
  return clubs.find((c) => c.apiId === apiId) ?? null;
}

// ─── Fixtures of a club ──────────────────────────────────────────────────────

/** Lean fixture row for lists (club page, onboarding, dashboard). */
export interface ClubFixture {
  id: number;
  date: string; // YYYY-MM-DD (Paris)
  time: string; // HH:MM (Paris)
  kickoffIso: string;
  competition: { slug: string; name: string; shortName: string; flag: string } | null;
  round: string;
  home: { id: number; name: string; logo: string };
  away: { id: number; name: string; logo: string };
  status: Match["status"];
  score: { home: number | null; away: number | null };
  /** True when the kickoff is within the 7-day analysis window. */
  analyzable: boolean;
  /** Whole days until kickoff (0 = today), for the "dans X jours" label. */
  daysUntil: number;
}

function parisDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return { date, time };
}

/** Is a fixture inside the analysis window (not finished, kicks off within 7 days)? */
export function isWithinAnalysisWindow(kickoffIso: string, now = Date.now()): boolean {
  const t = Date.parse(kickoffIso);
  if (Number.isNaN(t)) return false;
  return t > now - 3 * 3600_000 && t <= now + ANALYSIS_WINDOW_MS;
}

export function toClubFixture(f: ApiFixtureResponse, now = Date.now()): ClubFixture {
  const comp = competitionForLeague(f.league.id);
  const { date, time } = parisDateTime(f.fixture.date);
  const t = Date.parse(f.fixture.date);
  const finished = FINISHED_STATUSES.has(f.fixture.status.short);
  return {
    id: f.fixture.id,
    date,
    time,
    kickoffIso: f.fixture.date,
    competition: comp
      ? { slug: comp.slug, name: comp.name, shortName: comp.shortName, flag: comp.flag }
      : { slug: "", name: f.league.name, shortName: f.league.name, flag: "⚽" },
    round: f.league.round,
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
    status: mapStatus(f.fixture.status.short),
    score: { home: f.goals.home, away: f.goals.away },
    analyzable: !finished && isWithinAnalysisWindow(f.fixture.date, now),
    daysUntil: Math.max(0, Math.floor((t - now) / 86_400_000)),
  };
}

/**
 * A club's season fixtures in the covered competitions, split into past
 * (newest first) and upcoming (soonest first). Cached 1h.
 */
export async function getClubFixtures(
  teamId: number,
): Promise<{ past: ClubFixture[]; upcoming: ClubFixture[] }> {
  if (!hasApiKey()) return { past: [], upcoming: [] };
  const fixtures = await getCachedOrFetch(
    `club-fixtures:${teamId}:${CLUB_SEASON}`,
    3600,
    () => fetchTeamSeasonFixtures(teamId, CLUB_SEASON),
  ).catch(() => [] as ApiFixtureResponse[]);

  const now = Date.now();
  const rows = fixtures
    .filter((f) => LEAGUE_IDS.has(f.league.id))
    .map((f) => toClubFixture(f, now));
  const past = rows
    .filter((r) => FINISHED_STATUSES.has(r.status ?? ""))
    .sort((a, b) => Date.parse(b.kickoffIso) - Date.parse(a.kickoffIso));
  const upcoming = rows
    .filter((r) => !FINISHED_STATUSES.has(r.status ?? ""))
    .sort((a, b) => Date.parse(a.kickoffIso) - Date.parse(b.kickoffIso));
  return { past, upcoming };
}

/** Registered squad of a club — cached 24h. */
export async function getClubSquad(teamId: number): Promise<Lineup> {
  if (!hasApiKey()) return { formation: "4-3-3", players: [] };
  const squad = await getCachedOrFetch(`squad:${teamId}`, 86400, () => fetchSquad(teamId)).catch(
    () => null,
  );
  return mapSquad(squad);
}

// ─── One fixture → full Match (for the analysis page) ────────────────────────

/** Club strength on the Elo scale from its league rank (leader ≈ 1850). */
function ratingFromRank(rank: number | undefined, isEuropean: boolean): number {
  if (!rank) return 1700;
  const base = isEuropean ? 1900 : 1850;
  return Math.max(1450, base - (rank - 1) * 15);
}

function monogram(name: string): string {
  return name
    .replace(/\b(FC|CF|AC|AS|SC|SS|RC|CD|UD|SD|FK|BK|AFC|CFC)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

async function buildClubTeam(apiTeam: ApiTeam, comp: Competition | undefined): Promise<Team> {
  const teamId = apiTeam.id;
  const club = await getClubById(teamId).catch(() => null);

  const [squadRes, coachRes, fixturesRes] = await Promise.allSettled([
    getCachedOrFetch(`squad:${teamId}`, 86400, () => fetchSquad(teamId)),
    getCachedOrFetch(`coach:${teamId}`, 604800, () => fetchCoach(teamId)),
    getCachedOrFetch(`club-fixtures:${teamId}:${CLUB_SEASON}`, 3600, () =>
      fetchTeamSeasonFixtures(teamId, CLUB_SEASON),
    ),
  ]);

  const squad = squadRes.status === "fulfilled" ? squadRes.value : null;
  const coach = coachRes.status === "fulfilled" ? coachRes.value : null;
  const fixtures = fixturesRes.status === "fulfilled" ? fixturesRes.value : [];

  // Real recent form: finished matches of the season, newest first (all comps).
  const finished = fixtures
    .filter((f) => FINISHED_STATUSES.has(f.fixture.status.short))
    .sort((a, b) => Date.parse(b.fixture.date) - Date.parse(a.fixture.date))
    .slice(0, 10);
  const recentForm = mapForm(finished, teamId);
  const momentum = computeMomentum(recentForm);

  return {
    id: String(teamId),
    apiTeamId: teamId,
    name: apiTeam.name,
    nameEn: apiTeam.name,
    shortName: monogram(apiTeam.name),
    flag: "",
    logo: apiTeam.logo,
    group: "—",
    fifaRanking: 0,
    rating: ratingFromRank(club?.rank, comp?.kind === "european"),
    leagueRank: club?.rank,
    coach: coach ? `${coach.firstname} ${coach.lastname}` : "",
    recentForm,
    momentum,
    stats: {
      possession: 50,
      goalsScored: momentum ? Math.round(momentum.goalsForAvg * momentum.sample) : 0,
      goalsConceded: momentum ? Math.round(momentum.goalsAgainstAvg * momentum.sample) : 0,
      xGFor: 0,
      xGAgainst: 0,
      qualificationPath: comp?.name ?? "",
      cleanSheets: momentum?.cleanSheets ?? 0,
    },
    lineup: mapSquad(squad),
    keyPlayers: [],
    injuries: [],
    suspensions: [],
    dataSource: recentForm.length ? "live" : "static",
  };
}

/** Full Match for a club fixture id — null when unknown / API unavailable. */
export async function getClubMatch(fixtureId: number): Promise<Match | null> {
  if (!hasApiKey()) return null;
  const f = await getCachedOrFetch(`fixture:${fixtureId}`, 900, () => fetchFixtureById(fixtureId)).catch(
    () => null,
  );
  if (!f) return null;

  const comp = competitionForLeague(f.league.id);
  const [homeTeam, awayTeam, h2hRes] = await Promise.all([
    buildClubTeam(f.teams.home, comp),
    buildClubTeam(f.teams.away, comp),
    getCachedOrFetch(`h2h:${f.teams.home.id}-${f.teams.away.id}`, 43200, () =>
      fetchH2H(f.teams.home.id, f.teams.away.id, 5),
    ).catch(() => [] as ApiFixtureResponse[]),
  ]);

  const { date, time } = parisDateTime(f.fixture.date);
  return {
    id: String(f.fixture.id),
    apiFixtureId: f.fixture.id,
    homeTeam,
    awayTeam,
    date,
    time,
    kickoffIso: f.fixture.date,
    stadium: f.fixture.venue.name ?? "",
    city: f.fixture.venue.city ?? "",
    country: f.league.country,
    group: "—",
    round: f.league.round,
    competition: comp
      ? { slug: comp.slug, name: comp.name, shortName: comp.shortName, flag: comp.flag, leagueId: comp.leagueId }
      : { slug: "", name: f.league.name, shortName: f.league.name, flag: "⚽", leagueId: f.league.id },
    h2h: mapH2H(h2hRes),
    odds: [],
    status: mapStatus(f.fixture.status.short),
    score: { home: f.goals.home, away: f.goals.away },
  };
}

/** Kickoff instant of a Match — for the 7-day rule. */
export function matchKickoffMs(match: Match): number {
  const t = match.kickoffIso
    ? Date.parse(match.kickoffIso)
    : Date.parse(`${match.date}T${match.time || "00:00"}:00+02:00`);
  return Number.isNaN(t) ? 0 : t;
}

/** Whole days until kickoff (0 when today or already started). */
export function daysUntilKickoff(match: Match, now = Date.now()): number {
  return Math.max(0, Math.ceil((matchKickoffMs(match) - now) / 86_400_000));
}

/** Can this match be analysed right now (not finished, kickoff within 7 days)? */
export function isMatchAnalyzable(match: Match, now = Date.now()): boolean {
  if (FINISHED_STATUSES.has(match.status ?? "")) return false;
  const t = matchKickoffMs(match);
  return t > now - 3 * 3600_000 && t <= now + ANALYSIS_WINDOW_MS;
}
