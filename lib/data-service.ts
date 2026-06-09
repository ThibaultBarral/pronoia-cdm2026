/**
 * Data service (SERVER ONLY) — combines:
 *   1. OpenFootball (GitHub)  → real WC 2026 group-stage fixtures (free, no key)
 *   2. API-Football           → squads, coachs, recent form, H2H, odds, live score
 *   All API-Football calls go through the Supabase cache (lib/api-cache) so users
 *   read shared cached data and we control the request volume / quota.
 *   No mock fallback once logged in: real data or honest empty states.
 */
import "server-only";

import type {
  ApiFixtureResponse,
  ApiSquadResponse,
  ApiCoach,
} from "./api-football";
import {
  fetchSquad,
  fetchCoach,
  fetchRecentMatches,
  fetchH2H,
  fetchFixtures,
  fetchOdds,
  extractOdds,
  WC_LEAGUE,
  WC_SEASON,
} from "./api-football";
import { getCachedOrFetch } from "./api-cache";
import { getTeamMeta, TEAM_META } from "./team-ids";
import { getTeamProfile } from "./team-data";
import type {
  Match,
  Team,
  FormResult,
  H2HMatch,
  Player,
  Lineup,
  TeamMomentum,
} from "./types";
import { MATCHES as MOCK_MATCHES, getMatchById as getMockById } from "./mock-data";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const hasApiKey = () => Boolean(process.env.API_FOOTBALL_KEY);

// ─── OpenFootball types ───────────────────────────────────────────────────────

interface OFMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: { ft: [number, number] };
}

interface OFData {
  name: string;
  matches: OFMatch[];
}

// ─── OpenFootball fetch (24h ISR cache) ───────────────────────────────────────

async function fetchOpenFootball(): Promise<OFMatch[]> {
  try {
    const res = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`OpenFootball HTTP ${res.status}`);
    const data: OFData = await res.json();
    return data.matches.filter((m) => m.group?.startsWith("Group"));
  } catch (err) {
    console.warn("[data-service] OpenFootball fetch failed:", err);
    return [];
  }
}

// ─── Stadium / venue helpers ──────────────────────────────────────────────────

const STADIUM_MAP: Record<string, string> = {
  "Mexico City": "Estadio Azteca",
  "Guadalajara (Zapopan)": "Estadio Akron",
  "Monterrey (Guadalupe)": "Estadio BBVA",
  Toronto: "BMO Field",
  Vancouver: "BC Place",
  "New York/New Jersey (East Rutherford)": "MetLife Stadium",
  "Boston (Foxborough)": "Gillette Stadium",
  "Los Angeles (Inglewood)": "SoFi Stadium",
  "San Francisco Bay Area (Santa Clara)": "Levi's Stadium",
  Seattle: "Lumen Field",
  "Dallas (Arlington)": "AT&T Stadium",
  Atlanta: "Mercedes-Benz Stadium",
  Houston: "NRG Stadium",
  "Miami Gardens": "Hard Rock Stadium",
  "Kansas City": "Arrowhead Stadium",
  Philadelphia: "Lincoln Financial Field",
};

function venueToStadium(ground: string): string {
  return STADIUM_MAP[ground] ?? ground.split(" (")[0];
}

function venueToCity(ground: string): string {
  return ground.split(" (")[0].split("/")[0];
}

function venueToCountry(ground: string): "USA" | "Canada" | "Mexique" {
  if (ground.includes("Mexico") || ground.includes("Guadalajara") || ground.includes("Monterrey"))
    return "Mexique";
  if (ground.includes("Toronto") || ground.includes("Vancouver")) return "Canada";
  return "USA";
}

// ─── Time conversion to Paris time ───────────────────────────────────────────

/**
 * Convert an OpenFootball local date + "HH:MM UTC±X" into the Europe/Paris
 * date AND time. Crucially this rolls the DATE over when the conversion crosses
 * midnight (e.g. a 20:00 UTC-6 match becomes 04:00 the NEXT day in Paris), so
 * matches sort and group correctly. DST-safe via Intl.
 */
function toParisDateTime(dateStr: string, timeStr: string): { date: string; time: string } {
  const m = timeStr.match(/(\d+):(\d+)\s+UTC([+-]\d+)/);
  if (!m) return { date: dateStr, time: "21:00" };
  const [, hStr, minStr, tzStr] = m;
  const [Y, Mo, D] = dateStr.split("-").map((n) => parseInt(n, 10));
  // Real UTC instant = local wall-clock minus its UTC offset.
  const utcMs =
    Date.UTC(Y, Mo - 1, D, parseInt(hStr, 10), parseInt(minStr, 10)) -
    parseInt(tzStr, 10) * 3_600_000;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00"; // some runtimes emit 24 for midnight
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hour}:${get("minute")}` };
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[àáâã]/g, "a")
    .replace(/[é]/g, "e")
    .replace(/[&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function matchSlug(team1: string, team2: string): string {
  return `${slugify(team1)}-vs-${slugify(team2)}`;
}

// ─── API-Football squad / coach helpers ───────────────────────────────────────

const API_POSITION_MAP: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "CB",
  Midfielder: "CM",
  Attacker: "ST",
};

function mapSquad(squadData: ApiSquadResponse | null): Lineup {
  if (!squadData?.players?.length) {
    return { formation: "4-3-3", players: [] };
  }

  const ORDER = ["GK", "CB", "CM", "ST"];
  const players: Player[] = squadData.players
    .map((p) => ({
      apiId: p.id,
      name: p.name,
      position: API_POSITION_MAP[p.position] ?? p.position,
      number: p.number ?? 0,
      flag: "🏳️",
      photo: p.photo,
      age: p.age,
    }))
    .sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position));

  return { formation: "4-3-3", players };
}

// ─── Form mapping (API-Football last-5) ──────────────────────────────────────

function mapForm(fixtures: ApiFixtureResponse[], teamId: number): FormResult[] {
  return fixtures.map((f): FormResult => {
    const isHome = f.teams.home.id === teamId;
    const tg = isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    const og = isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
    const opponent = isHome ? f.teams.away.name : f.teams.home.name;
    const result: "W" | "D" | "L" = tg > og ? "W" : tg < og ? "L" : "D";
    return {
      opponent,
      result,
      score: `${tg}-${og}`,
      competition: f.league.name,
      date: f.fixture.date.split("T")[0],
      venue: isHome ? "H" : "A",
    };
  });
}

/** Derive a momentum signal from already-mapped recent form (newest first). */
function computeMomentum(form: FormResult[]): TeamMomentum | undefined {
  if (!form.length) return undefined;

  const pts = (r: FormResult["result"]) => (r === "W" ? 3 : r === "D" ? 1 : 0);
  const last5 = form.slice(0, 5);
  const last10 = form.slice(0, 10);

  const last5Pts = last5.reduce((acc, f) => acc + pts(f.result), 0);
  const last10Pts = last10.reduce((acc, f) => acc + pts(f.result), 0);

  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;
  for (const f of last10) {
    const [tg, og] = f.score.split("-").map((n) => parseInt(n, 10) || 0);
    goalsFor += tg;
    goalsAgainst += og;
    if (og === 0) cleanSheets += 1;
  }

  const ppg = last5.length ? last5Pts / last5.length : 0;
  const trend: TeamMomentum["trend"] =
    ppg >= 2.2 ? "hot" : ppg <= 1.0 ? "cold" : "neutral";

  return {
    sample: last10.length,
    last5Pts,
    last10Pts,
    goalsForAvg: Number((goalsFor / last10.length).toFixed(2)),
    goalsAgainstAvg: Number((goalsAgainst / last10.length).toFixed(2)),
    cleanSheets,
    trend,
  };
}

function mapH2H(fixtures: ApiFixtureResponse[]): H2HMatch[] {
  return fixtures.slice(0, 5).map((f): H2HMatch => {
    const gh = f.goals.home ?? 0;
    const ga = f.goals.away ?? 0;
    let score = `${gh}-${ga}`;
    if (f.score?.penalty?.home != null) {
      score += ` (${f.score.penalty.home}-${f.score.penalty.away} tab)`;
    }
    return {
      date: f.fixture.date.split("T")[0],
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      score,
      competition: f.league.name,
    };
  });
}

// ─── Team builder from OpenFootball + API-Football ────────────────────────────

async function buildTeam(
  name: string,
  group: string,
  isHome: boolean,
  peerApiId: number
): Promise<Team> {
  const meta = getTeamMeta(name);
  const teamId = meta.apiId;

  const profile = getTeamProfile(name);

  const emptyTeam: Team = {
    id: String(teamId || name),
    apiTeamId: teamId || undefined,
    name: meta.fr,
    nameEn: name,
    shortName: meta.shortName,
    flag: meta.flag,
    group,
    fifaRanking: meta.fifaRanking,
    coach: profile?.coach ?? "",
    recentForm: profile?.recentForm ?? [],
    stats: profile?.stats ?? {
      possession: 50,
      goalsScored: 0,
      goalsConceded: 0,
      xGFor: 0,
      xGAgainst: 0,
      qualificationPath: "CDM 2026",
      cleanSheets: 0,
    },
    lineup: { formation: profile?.formation ?? "4-3-3", players: [] },
    keyPlayers: profile?.keyPlayers ?? [],
    injuries: [],
    suspensions: [],
    strengths: profile?.strengths,
    weaknesses: profile?.weaknesses,
  };

  if (!hasApiKey() || !teamId) return emptyTeam;

  const [squadRes, coachRes, formRes] = await Promise.allSettled([
    getCachedOrFetch(`squad:${teamId}`, 86400, () => fetchSquad(teamId)),
    getCachedOrFetch(`coach:${teamId}`, 604800, () => fetchCoach(teamId)),
    // Real recent matches across all competitions (cached 12h)
    getCachedOrFetch(`recent:${teamId}`, 43200, () => fetchRecentMatches(teamId, 10)).catch(
      () => [] as ApiFixtureResponse[]
    ),
  ]);

  const squad = squadRes.status === "fulfilled" ? squadRes.value : null;
  const coach = coachRes.status === "fulfilled" ? coachRes.value : null;
  const fixtures =
    formRes.status === "fulfilled" ? (formRes.value as ApiFixtureResponse[]) : [];

  const realForm = fixtures.length ? mapForm(fixtures, teamId) : [];
  const momentum = computeMomentum(realForm);

  // Override quantitative stats with values derived from real matches when available;
  // keep qualitative scouting (strengths/weaknesses/keyPlayers) from the static profile.
  const liveStats =
    momentum && profile?.stats
      ? {
          ...profile.stats,
          goalsScored: Math.round(momentum.goalsForAvg * momentum.sample),
          goalsConceded: Math.round(momentum.goalsAgainstAvg * momentum.sample),
          cleanSheets: momentum.cleanSheets,
        }
      : emptyTeam.stats;

  return {
    ...emptyTeam,
    coach: coach ? `${coach.firstname} ${coach.lastname}` : emptyTeam.coach,
    recentForm: realForm.length ? realForm : emptyTeam.recentForm,
    momentum,
    stats: realForm.length ? liveStats : emptyTeam.stats,
    lineup: mapSquad(squad),
    dataSource: realForm.length ? "live" : "static",
  };
}

// ─── getMatches — all 72 WC 2026 group-stage matches ─────────────────────────

export async function getMatches(): Promise<Match[]> {
  const fixtures = await fetchOpenFootball();

  if (!fixtures.length) {
    console.warn("[data-service] OpenFootball empty — using mock");
    return MOCK_MATCHES;
  }

  return fixtures.map((f): Match => {
    const group = (f.group ?? "").replace("Group ", "");
    const meta1 = getTeamMeta(f.team1);
    const meta2 = getTeamMeta(f.team2);

    const makeShell = (name: string, meta: ReturnType<typeof getTeamMeta>): Team => {
      const p = getTeamProfile(name);
      return {
        id: String(meta.apiId || name),
        apiTeamId: meta.apiId || undefined,
        name: meta.fr,
        nameEn: name,
        shortName: meta.shortName,
        flag: meta.flag,
        group,
        fifaRanking: meta.fifaRanking,
        coach: p?.coach ?? "",
        recentForm: p?.recentForm ?? [],
        stats: p?.stats ?? {
          possession: 50,
          goalsScored: 0,
          goalsConceded: 0,
          xGFor: 0,
          xGAgainst: 0,
          qualificationPath: "",
          cleanSheets: 0,
        },
        lineup: { formation: p?.formation ?? "4-3-3", players: [] },
        keyPlayers: p?.keyPlayers ?? [],
        injuries: [],
        suspensions: [],
        strengths: p?.strengths,
        weaknesses: p?.weaknesses,
      };
    };

    const kickoff = toParisDateTime(f.date, f.time);

    return {
      id: matchSlug(f.team1, f.team2),
      homeTeam: makeShell(f.team1, meta1),
      awayTeam: makeShell(f.team2, meta2),
      date: kickoff.date,
      time: kickoff.time,
      stadium: venueToStadium(f.ground),
      city: venueToCity(f.ground),
      country: venueToCountry(f.ground),
      group,
      round: "Phase de groupes",
      h2h: [],
      odds: [],
      status: "NS",
      score: f.score ? { home: f.score.ft[0], away: f.score.ft[1] } : { home: null, away: null },
    };
  });
}

/** Full data for a single national team (for the /team/[slug] page). */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  const name = Object.keys(TEAM_META).find((n) => slugify(n) === slug);
  if (!name) return null;
  return buildTeam(name, "", true, 0);
}

/** Stable slug for a team name (used to build /team/<slug> links). */
export function teamSlug(name: string): string {
  return slugify(name);
}

// ─── getMatchData — full data for one match ───────────────────────────────────

export async function getMatchData(id: string): Promise<Match | null> {
  // Try mock first for old slug-based IDs
  const mockMatch = getMockById(id);

  // Fetch OpenFootball to find the real match
  const fixtures = await fetchOpenFootball();
  const fixture = fixtures.find((f) => matchSlug(f.team1, f.team2) === id);

  if (!fixture) {
    // Fall back to mock
    return mockMatch ?? null;
  }

  const group = (fixture.group ?? "").replace("Group ", "");
  const meta1 = getTeamMeta(fixture.team1);
  const meta2 = getTeamMeta(fixture.team2);

  // Build teams — API-Football calls (squad + coach) run in parallel
  const [homeTeam, awayTeam] = await Promise.all([
    buildTeam(fixture.team1, group, true, meta2.apiId),
    buildTeam(fixture.team2, group, false, meta1.apiId),
  ]);

  // H2H, odds and live score — REAL only (no mock fallback). Empty = the UI shows
  // an honest "indisponible" state. All API-Football calls are Supabase-cached.
  let h2h: HH2Match[] = [];
  let odds: Match["odds"] = [];
  let apiFixtureId: number | undefined;
  let liveStatus: Match["status"] | undefined;
  let liveScore: Match["score"] | undefined;

  if (hasApiKey() && meta1.apiId && meta2.apiId) {
    // Resolve this match's API-Football fixture → unlocks odds + live score.
    const apiFixture = await resolveApiFixture(meta1.apiId, meta2.apiId);
    if (apiFixture) {
      apiFixtureId = apiFixture.fixture.id;
      liveStatus = mapStatus(apiFixture.fixture.status.short);
      liveScore = { home: apiFixture.goals.home, away: apiFixture.goals.away };
    }

    const [h2hRes, oddsRes] = await Promise.allSettled([
      getCachedOrFetch(`h2h:${meta1.apiId}-${meta2.apiId}`, 43200, () =>
        fetchH2H(meta1.apiId!, meta2.apiId!, 5)
      ),
      apiFixtureId
        ? getCachedOrFetch(`odds:${apiFixtureId}`, 2700, () => fetchOdds(apiFixtureId!))
        : Promise.resolve(null),
    ]);

    if (h2hRes.status === "fulfilled" && h2hRes.value.length > 0) {
      h2h = mapH2H(h2hRes.value);
    }
    if (oddsRes.status === "fulfilled" && oddsRes.value) {
      const extracted = extractOdds(oddsRes.value);
      if (extracted.length) odds = extracted;
    }
  }

  const kickoff = toParisDateTime(fixture.date, fixture.time);

  return {
    id,
    homeTeam,
    awayTeam,
    date: kickoff.date,
    time: kickoff.time,
    stadium: venueToStadium(fixture.ground),
    city: venueToCity(fixture.ground),
    country: venueToCountry(fixture.ground),
    group,
    round: "Phase de groupes",
    h2h,
    odds,
    apiFixtureId,
    status: liveStatus ?? "NS",
    score:
      liveScore ??
      (fixture.score
        ? { home: fixture.score.ft[0], away: fixture.score.ft[1] }
        : { home: null, away: null }),
  };
}

type HH2Match = import("./types").H2HMatch;

// ─── API-Football fixture resolution (for odds + live score) ──────────────────

function mapStatus(short: string): Match["status"] {
  switch (short) {
    case "1H": return "1H";
    case "HT": return "HT";
    case "2H":
    case "ET": return "2H";
    case "FT": return "FT";
    case "AET": return "AET";
    case "PEN": return "PEN";
    default: return "NS";
  }
}

/** Find the WC 2026 API-Football fixture for a team pair (cached fixtures list). */
async function resolveApiFixture(
  idA: number,
  idB: number
): Promise<ApiFixtureResponse | null> {
  const fixtures = await getCachedOrFetch(
    `fixtures:wc${WC_SEASON}`,
    43200,
    () => fetchFixtures()
  ).catch(() => [] as ApiFixtureResponse[]);

  return (
    fixtures.find((f) => {
      const h = f.teams.home.id;
      const a = f.teams.away.id;
      return (h === idA && a === idB) || (h === idB && a === idA);
    }) ?? null
  );
}
