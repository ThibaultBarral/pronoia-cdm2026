/**
 * Data service — combines three sources:
 *   1. OpenFootball (GitHub)  → 72 real WC 2026 group-stage fixtures (free, no key)
 *   2. API-Football (free)    → /players/squads + /coachs (work without season restriction)
 *   3. Mock data              → form, H2H, odds (fallback until paid plan)
 */

import type {
  ApiFixtureResponse,
  ApiSquadResponse,
  ApiCoach,
} from "./api-football";
import {
  fetchSquad,
  fetchCoach,
  fetchTeamForm,
  fetchH2H,
  fetchOdds,
  extractOdds,
  WC_LEAGUE,
  WC_SEASON,
} from "./api-football";
import { getTeamMeta } from "./team-ids";
import { getTeamProfile } from "./team-data";
import type { Match, Team, FormResult, H2HMatch, Player, Lineup } from "./types";
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

// ─── Time conversion to Paris time (UTC+2 in summer) ─────────────────────────

function toParisTime(timeStr: string): string {
  const m = timeStr.match(/(\d+):(\d+)\s+UTC([+-]\d+)/);
  if (!m) return "21:00";
  const [, hStr, minStr, tzStr] = m;
  const utcH = parseInt(hStr) - parseInt(tzStr);
  const parisH = ((utcH + 2) % 24 + 24) % 24;
  return `${String(parisH).padStart(2, "0")}:${minStr}`;
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
  return fixtures.slice(0, 5).map((f): FormResult => {
    const isHome = f.teams.home.id === teamId;
    const tg = isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    const og = isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
    const opponent = isHome ? f.teams.away.name : f.teams.home.name;
    const result: "W" | "D" | "L" = tg > og ? "W" : tg < og ? "L" : "D";
    return { opponent, result, score: `${tg}-${og}`, competition: f.league.name };
  });
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
    name,
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
    fetchSquad(teamId),
    fetchCoach(teamId),
    // form: try with season 2025 qualifications or skip if blocked
    fetchTeamForm(teamId, 5).catch(() => [] as ApiFixtureResponse[]),
  ]);

  const squad = squadRes.status === "fulfilled" ? squadRes.value : null;
  const coach = coachRes.status === "fulfilled" ? coachRes.value : null;
  const form = formRes.status === "fulfilled" ? (formRes.value as ApiFixtureResponse[]) : [];

  return {
    ...emptyTeam,
    coach: coach ? `${coach.firstname} ${coach.lastname}` : "",
    recentForm: form.length ? mapForm(form, teamId) : [],
    lineup: mapSquad(squad),
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
        name,
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

    return {
      id: matchSlug(f.team1, f.team2),
      homeTeam: makeShell(f.team1, meta1),
      awayTeam: makeShell(f.team2, meta2),
      date: f.date,
      time: toParisTime(f.time),
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

  // H2H and odds — requires paid plan for `last` param; use mock H2H if available
  let h2h: HH2Match[] = [];
  let odds = mockMatch?.odds ?? [];

  if (hasApiKey() && meta1.apiId && meta2.apiId) {
    const [h2hRes, oddsRes] = await Promise.allSettled([
      fetchH2H(meta1.apiId, meta2.apiId, 5),
      fetchOdds(0), // no fixture ID available from OpenFootball
    ]);

    if (h2hRes.status === "fulfilled" && h2hRes.value.length > 0) {
      h2h = mapH2H(h2hRes.value);
    }
    if (oddsRes.status === "fulfilled" && oddsRes.value) {
      const extracted = extractOdds(oddsRes.value);
      if (extracted.length) odds = extracted;
    }
  }

  // Fall back to mock H2H if API blocked
  if (!h2h.length && mockMatch?.h2h?.length) {
    h2h = mockMatch.h2h;
  }

  // Fall back to mock stats (form, xG, etc.) if team has none from API
  if (!homeTeam.recentForm.length && mockMatch) {
    homeTeam.recentForm = mockMatch.homeTeam.recentForm;
    homeTeam.stats = mockMatch.homeTeam.stats;
    homeTeam.keyPlayers = mockMatch.homeTeam.keyPlayers;
  }
  if (!awayTeam.recentForm.length && mockMatch) {
    awayTeam.recentForm = mockMatch.awayTeam.recentForm;
    awayTeam.stats = mockMatch.awayTeam.stats;
    awayTeam.keyPlayers = mockMatch.awayTeam.keyPlayers;
  }

  return {
    id,
    homeTeam,
    awayTeam,
    date: fixture.date,
    time: toParisTime(fixture.time),
    stadium: venueToStadium(fixture.ground),
    city: venueToCity(fixture.ground),
    country: venueToCountry(fixture.ground),
    group,
    round: "Phase de groupes",
    h2h,
    odds,
    status: "NS",
    score: fixture.score
      ? { home: fixture.score.ft[0], away: fixture.score.ft[1] }
      : { home: null, away: null },
  };
}

// Fix typo in import above
type HH2Match = import("./types").H2HMatch;
