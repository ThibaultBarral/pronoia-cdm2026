/**
 * API-Football v3 client (api-sports.io)
 * Docs: https://www.api-football.com/documentation-v3
 *
 * Free tier: 100 req/day — all fetches use Next.js ISR cache to minimize calls.
 * Cache strategy:
 *   - Fixtures list: 1h
 *   - Single fixture: 30min
 *   - Squads: 12h (stable before tournament, daily during)
 *   - H2H: 6h
 *   - Form (last 5): 2h
 *   - Team stats: 2h
 *   - Odds: 30min
 */

const BASE = "https://v3.football.api-sports.io";
export const WC_LEAGUE = 1;
export const WC_SEASON = 2026;

// ─── Raw API types ────────────────────────────────────────────────────────────

export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface ApiVenue {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface ApiFixtureInfo {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  venue: ApiVenue;
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

export interface ApiLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
  standings?: boolean;
}

export interface ApiGoals {
  home: number | null;
  away: number | null;
}

export interface ApiFixtureResponse {
  fixture: ApiFixtureInfo;
  league: ApiLeague;
  teams: { home: ApiTeam; away: ApiTeam };
  goals: ApiGoals;
  score: {
    halftime: ApiGoals;
    fulltime: ApiGoals;
    extratime: ApiGoals;
    penalty: ApiGoals;
  };
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

export interface ApiSquadResponse {
  team: ApiTeam;
  players: ApiSquadPlayer[];
}

export interface ApiPlayerStatistics {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team: ApiTeam;
    league: ApiLeague;
    games: { appearances: number; lineups: number; minutes: number; position: string; rating: string | null; captain: boolean };
    goals: { total: number | null; conceded: number | null; assists: number | null };
    cards: { yellow: number; red: number };
  }>;
}

export interface ApiOddsBookmaker {
  id: number;
  name: string;
  bets: Array<{
    id: number;
    name: string;
    values: Array<{ value: string; odd: string }>;
  }>;
}

export interface ApiOddsResponse {
  fixture: { id: number };
  bookmakers: ApiOddsBookmaker[];
}

export interface ApiTeamStatistics {
  league: ApiLeague;
  team: ApiTeam;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  lineups: Array<{ formation: string; played: number }>;
  cards: {
    yellow: Record<string, { total: number | null; percentage: string | null }>;
    red: Record<string, { total: number | null; percentage: string | null }>;
  };
}

export interface ApiCoach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  nationality: string;
  photo: string;
  team: ApiTeam;
  career: Array<{
    team: ApiTeam;
    start: string;
    end: string | null;
  }>;
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  revalidate: number
): Promise<T[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY not set");

  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
      "Accept": "application/json",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`API-Football HTTP ${res.status} for ${path}`);
  }

  const json = await res.json();

  if (json.errors && typeof json.errors === "object" && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }

  return json.response as T[];
}

// ─── Public fetchers ─────────────────────────────────────────────────────────

/** All CDM 2026 fixtures — cached 1h */
export async function fetchFixtures(): Promise<ApiFixtureResponse[]> {
  return apiFetch<ApiFixtureResponse>(
    `/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`,
    3600
  );
}

/** Single fixture by ID — cached 30min */
export async function fetchFixtureById(
  fixtureId: number
): Promise<ApiFixtureResponse | null> {
  const results = await apiFetch<ApiFixtureResponse>(
    `/fixtures?id=${fixtureId}`,
    1800
  );
  return results[0] ?? null;
}

/** Team squad (current registered squad) — cached 12h */
export async function fetchSquad(teamId: number): Promise<ApiSquadResponse | null> {
  const results = await apiFetch<ApiSquadResponse>(
    `/players/squads?team=${teamId}`,
    43200
  );
  return results[0] ?? null;
}

/**
 * Seasons we derive recent form from, newest first. 2026 surfaces the freshly
 * played World Cup 2026 results (so form/analyses react to the tournament as it
 * unfolds); 2024 carries the qualifiers / Nations League up to late 2025.
 */
export const RECENT_SEASONS = [2026, 2024, 2023] as const;

/** All fixtures for a team in a given season (all competitions) — cached 12h */
export async function fetchTeamSeasonFixtures(
  teamId: number,
  season: number
): Promise<ApiFixtureResponse[]> {
  return apiFetch<ApiFixtureResponse>(
    `/fixtures?team=${teamId}&season=${season}`,
    43200
  );
}

/**
 * Real recent matches for a team across all competitions.
 * Walks RECENT_SEASONS until it has at least `min` finished games, then returns
 * the `last` most recent (newest first). Free-plan friendly (no `last` param).
 */
export async function fetchRecentMatches(
  teamId: number,
  last = 10,
  min = 8
): Promise<ApiFixtureResponse[]> {
  const collected: ApiFixtureResponse[] = [];

  for (const season of RECENT_SEASONS) {
    const fixtures = await fetchTeamSeasonFixtures(teamId, season).catch(
      () => [] as ApiFixtureResponse[]
    );
    const finished = fixtures.filter((f) => f.fixture.status.short === "FT");
    collected.push(...finished);
    if (collected.length >= min) break;
  }

  return collected
    .sort(
      (a, b) =>
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    )
    .slice(0, last);
}

/** Head-to-head between two teams — cached 6h */
export async function fetchH2H(
  team1Id: number,
  team2Id: number,
  last = 5
): Promise<ApiFixtureResponse[]> {
  return apiFetch<ApiFixtureResponse>(
    `/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=${last}`,
    21600
  );
}

/** Odds for a fixture — cached 30min */
export async function fetchOdds(fixtureId: number): Promise<ApiOddsResponse | null> {
  const results = await apiFetch<ApiOddsResponse>(
    `/odds?fixture=${fixtureId}&bet=1`,
    1800
  );
  return results[0] ?? null;
}

/** Team statistics for WC 2026 — cached 2h */
export async function fetchTeamStats(
  teamId: number
): Promise<ApiTeamStatistics | null> {
  const results = await apiFetch<ApiTeamStatistics>(
    `/teams/statistics?league=${WC_LEAGUE}&season=${WC_SEASON}&team=${teamId}`,
    7200
  );
  return results[0] ?? null;
}

/** Coach for a team — cached 24h */
export async function fetchCoach(teamId: number): Promise<ApiCoach | null> {
  const results = await apiFetch<ApiCoach>(
    `/coachs?team=${teamId}`,
    86400
  );
  return results[0] ?? null;
}

/** All teams in WC 2026 (includes team ID mapping) — cached 24h */
export async function fetchTeams(): Promise<Array<{ team: ApiTeam; venue: ApiVenue }>> {
  return apiFetch<{ team: ApiTeam; venue: ApiVenue }>(
    `/teams?league=${WC_LEAGUE}&season=${WC_SEASON}`,
    86400
  );
}

// ─── Standings (domestic leagues + UCL/UEL league phase) ─────────────────────

export interface ApiStandingRow {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface ApiStandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    /** One inner array per group (single array for round-robin leagues). */
    standings: ApiStandingRow[][];
  };
}

/**
 * Final standings for a league + season — cached 24h.
 * Returns the flattened groups (`standings`), or [] if unavailable.
 */
export async function fetchStandings(
  leagueId: number,
  season: number,
): Promise<ApiStandingRow[][]> {
  const results = await apiFetch<ApiStandingsResponse>(
    `/standings?league=${leagueId}&season=${season}`,
    86400,
  );
  return results[0]?.league?.standings ?? [];
}

// ─── Odds extraction helpers ─────────────────────────────────────────────────

const BOOKMAKER_PRIORITY = [
  { id: 8, name: "Unibet" },
  { id: 6, name: "Bwin" },
  { id: 1, name: "Bet365" },
  { id: 16, name: "William Hill" },
  { id: 3, name: "1xBet" },
  { id: 11, name: "Marathon Bet" },
];

export interface SimpleOdds {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
}

export function extractOdds(oddsResponse: ApiOddsResponse | null): SimpleOdds[] {
  if (!oddsResponse) return [];

  const results: SimpleOdds[] = [];

  for (const priority of BOOKMAKER_PRIORITY) {
    const bk = oddsResponse.bookmakers.find((b) => b.id === priority.id);
    if (!bk) continue;

    const matchWinner = bk.bets.find((b) => b.id === 1 || b.name === "Match Winner");
    if (!matchWinner) continue;

    const home = parseFloat(matchWinner.values.find((v) => v.value === "Home")?.odd ?? "0");
    const draw = parseFloat(matchWinner.values.find((v) => v.value === "Draw")?.odd ?? "0");
    const away = parseFloat(matchWinner.values.find((v) => v.value === "Away")?.odd ?? "0");

    if (home > 0 && draw > 0 && away > 0) {
      results.push({ bookmaker: priority.name, home, draw, away });
    }

    if (results.length >= 3) break;
  }

  return results;
}
