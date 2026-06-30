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
  fetchPlayerInvolvement,
  fetchRecentMatches,
  fetchH2H,
  fetchFixtures,
  fetchOdds,
  fetchOddsAll,
  extractOdds,
  extractOverUnder,
  extractBtts,
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
  RecentContributor,
} from "./types";
import { MATCHES as MOCK_MATCHES, getMatchById as getMockById } from "./mock-data";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const hasApiKey = () => Boolean(process.env.API_FOOTBALL_KEY);

// ─── OpenFootball types ───────────────────────────────────────────────────────

interface OFMatch {
  round: string;
  /** FIFA match number (1-104). Knockout placeholders reference it, e.g. "W76". */
  num?: number;
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

// ─── Knockout rounds (48-team WC: Round of 32 → Final) ────────────────────────

/** OpenFootball `round` label → French display label. Order = bracket progression. */
const KNOCKOUT_ROUNDS: Record<string, string> = {
  "Round of 32": "16es de finale",
  "Round of 16": "8es de finale",
  "Quarter-final": "Quart de finale",
  "Quarter-finals": "Quart de finale",
  "Semi-final": "Demi-finale",
  "Semi-finals": "Demi-finale",
  "Match for third place": "Match pour la 3e place",
  "Third place": "Match pour la 3e place",
  Final: "Finale",
};

function isKnockout(round: string | undefined): boolean {
  return Boolean(round && round in KNOCKOUT_ROUNDS);
}


/** French round label for any fixture (group or knockout). */
function roundLabelFr(m: OFMatch): string {
  if (m.group?.startsWith("Group")) return "Phase de groupes";
  return (m.round && KNOCKOUT_ROUNDS[m.round]) ?? m.round ?? "Phase finale";
}

/**
 * Knockout fixtures whose participants aren't decided yet carry placeholder
 * codes instead of real nations (e.g. "W89", "1A", "3C/E/F"). A name is a
 * placeholder when it isn't a known WC team. We render these as a neutral
 * "à déterminer" slot rather than treating the code as a country.
 */
function isPlaceholderName(name: string): boolean {
  return !(name in TEAM_META);
}

/** Human-readable French label for a knockout placeholder code. */
function placeholderLabel(code: string): string {
  const c = code.trim();
  let m: RegExpMatchArray | null;
  if ((m = c.match(/^W(\d+)$/i))) return `Vainqueur match ${m[1]}`;
  if ((m = c.match(/^L(\d+)$/i))) return `Perdant match ${m[1]}`;
  if ((m = c.match(/^([123])([A-L])$/i))) {
    const pos = m[1] === "1" ? "1er" : m[1] === "2" ? "2e" : "3e";
    return `${pos} groupe ${m[2].toUpperCase()}`;
  }
  if ((m = c.match(/^3([A-L/]+)$/i))) return `3e (gr. ${m[1].toUpperCase()})`;
  return c;
}

/** Neutral "à déterminer" team for an undecided knockout slot. */
function placeholderTeam(name: string, group: string): Team {
  return {
    id: name,
    name: placeholderLabel(name),
    nameEn: name,
    shortName: name.toUpperCase().slice(0, 6),
    flag: "🏳️",
    group,
    fifaRanking: 999,
    coach: "",
    recentForm: [],
    stats: {
      possession: 50, goalsScored: 0, goalsConceded: 0,
      xGFor: 0, xGAgainst: 0, qualificationPath: "", cleanSheets: 0,
    },
    lineup: { formation: "4-3-3", players: [] },
    keyPlayers: [],
    injuries: [],
    suspensions: [],
    isPlaceholder: true,
  };
}

// ─── OpenFootball fetch (24h ISR cache) ───────────────────────────────────────

async function fetchOpenFootball(): Promise<OFMatch[]> {
  try {
    const res = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`OpenFootball HTTP ${res.status}`);
    const data: OFData = await res.json();
    // Group stage AND knockout rounds (Round of 32 → Final). Knockout matches
    // have no `group` field; they're identified by their `round` label.
    return data.matches.filter(
      (m) => m.group?.startsWith("Group") || isKnockout(m.round)
    );
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

// ─── Live WC fixtures (status + score), short-cached so scores update ─────────

const WC_FINISHED = new Set(["FT", "AET", "PEN"]);

/**
 * All WC 2026 fixtures from API-Football, shared-cached for only 60s so live
 * scores and finished results surface quickly (one API call serves everyone).
 */
async function getWcFixtures(): Promise<ApiFixtureResponse[]> {
  if (!hasApiKey()) return [];
  return getCachedOrFetch(`fixtures:wc${WC_SEASON}:live`, 60, () => fetchFixtures()).catch(
    () => [] as ApiFixtureResponse[]
  );
}

export interface MatchOddsMarkets {
  win: { home: number; draw: number; away: number; bookmaker: string } | null;
  ou25: { over: number; under: number } | null;
  btts: { yes: number; no: number } | null;
}

/**
 * Real bookmaker odds for the three ticket markets (1X2, Over/Under 2.5, BTTS),
 * shared-cached 30min. Used by the loss-aversion paywall. Missing markets stay
 * null — we never invent a price.
 */
export async function getMatchOddsMarkets(apiFixtureId: number): Promise<MatchOddsMarkets> {
  if (!hasApiKey() || !apiFixtureId) return { win: null, ou25: null, btts: null };
  const resp = await getCachedOrFetch(`odds-all:${apiFixtureId}`, 1800, () =>
    fetchOddsAll(apiFixtureId)
  ).catch(() => null);
  const simple = extractOdds(resp);
  const win = simple[0]
    ? { home: simple[0].home, draw: simple[0].draw, away: simple[0].away, bookmaker: simple[0].bookmaker }
    : null;
  return { win, ou25: extractOverUnder(resp), btts: extractBtts(resp) };
}

/**
 * Final score of a finished WC match by team API ids, oriented so `homeGoals`
 * belongs to `homeApiId`. Null if the match isn't finished / not found. Used to
 * auto-settle predictions.
 */
export async function getFinishedScore(
  homeApiId: number,
  awayApiId: number
): Promise<{ homeGoals: number; awayGoals: number } | null> {
  if (!homeApiId || !awayApiId) return null;
  const wc = await getWcFixtures();
  const f = findWcFixture(wc, homeApiId, awayApiId);
  if (!f || !WC_FINISHED.has(f.fixture.status.short)) return null;
  if (f.goals.home == null || f.goals.away == null) return null;
  return f.teams.home.id === homeApiId
    ? { homeGoals: f.goals.home, awayGoals: f.goals.away }
    : { homeGoals: f.goals.away, awayGoals: f.goals.home };
}

/** How many WC matches have finished — drives cache keys so analyses recompute. */
export async function getWcFinishedCount(): Promise<number> {
  const fx = await getWcFixtures();
  return fx.reduce((n, f) => n + (WC_FINISHED.has(f.fixture.status.short) ? 1 : 0), 0);
}

export interface PlayedResult {
  homeApiId: number;
  awayApiId: number;
  goalsHome: number;
  goalsAway: number;
}

/**
 * All FINISHED WC 2026 matches with their real score (by API team id). Used to
 * condition the simulation on actual results (live group standings + % recompute).
 */
export async function getPlayedWcResults(): Promise<PlayedResult[]> {
  const fx = await getWcFixtures();
  return fx
    .filter(
      (f) =>
        WC_FINISHED.has(f.fixture.status.short) &&
        f.goals.home != null &&
        f.goals.away != null
    )
    .map((f) => ({
      homeApiId: f.teams.home.id,
      awayApiId: f.teams.away.id,
      goalsHome: f.goals.home as number,
      goalsAway: f.goals.away as number,
    }));
}

function findWcFixture(
  fx: ApiFixtureResponse[],
  idA: number,
  idB: number
): ApiFixtureResponse | null {
  return (
    fx.find((f) => {
      const h = f.teams.home.id;
      const a = f.teams.away.id;
      return (h === idA && a === idB) || (h === idB && a === idA);
    }) ?? null
  );
}

interface LiveResult {
  status: Match["status"];
  score: { home: number | null; away: number | null };
  apiFixtureId: number;
}

/** Map an API fixture to live status + score ORIENTED to our `homeApiId`. */
function orientResult(f: ApiFixtureResponse, homeApiId: number): LiveResult {
  const apiHomeIsOurHome = f.teams.home.id === homeApiId;
  const gh = f.goals.home;
  const ga = f.goals.away;
  return {
    status: mapStatus(f.fixture.status.short),
    score: apiHomeIsOurHome ? { home: gh, away: ga } : { home: ga, away: gh },
    apiFixtureId: f.fixture.id,
  };
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

  const [squadRes, coachRes, formRes, involvementRes] = await Promise.allSettled([
    getCachedOrFetch(`squad:${teamId}`, 86400, () => fetchSquad(teamId)),
    getCachedOrFetch(`coach:${teamId}`, 604800, () => fetchCoach(teamId)),
    // Real recent matches across all competitions — cached 1h so the form
    // reflects newly played World Cup matches within the hour.
    getCachedOrFetch(`recent:${teamId}`, 3600, () => fetchRecentMatches(teamId, 10)).catch(
      () => [] as ApiFixtureResponse[]
    ),
    // Real WC 2026 player involvement (who actually plays/scores) — cached 1h so
    // the AI's probable scorers / key players follow the tournament, not a stale
    // registered roster. Empty before the team has played a WC match.
    getCachedOrFetch(`involvement:${teamId}`, 3600, () => fetchPlayerInvolvement(teamId)).catch(
      () => [] as RecentContributor[]
    ),
  ]);

  const squad = squadRes.status === "fulfilled" ? squadRes.value : null;
  const coach = coachRes.status === "fulfilled" ? coachRes.value : null;
  const fixtures =
    formRes.status === "fulfilled" ? (formRes.value as ApiFixtureResponse[]) : [];
  // Keep only players who actually featured, ranked by goals then minutes — the
  // real "who plays" pool. Fringe / uncapped names (0 minutes) drop out.
  const recentContributors =
    involvementRes.status === "fulfilled"
      ? (involvementRes.value as RecentContributor[])
          .filter((p) => p.minutes > 0 || p.apps > 0)
          .sort((p1, p2) => p2.goals - p1.goals || p2.minutes - p1.minutes)
      : [];

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
    recentContributors,
    dataSource: realForm.length ? "live" : "static",
  };
}

/**
 * Knockout propagation context: which real nation won / lost each finished match
 * number. OpenFootball codes undecided knockout slots as "W76" (= winner of
 * match 76) and "L101" (= loser of match 101); resolving those codes lets a R32
 * winner flow into its R16 slot even when OpenFootball left that slot blank.
 */
interface KoContext {
  winnerByNum: Map<number, string>; // FIFA match num → winning team (English name)
  loserByNum: Map<number, string>; // FIFA match num → losing team (English name)
}

/** A "W76" / "L101" code → the referenced match number and side. */
function parseSlotCode(code: string): { num: number; side: "W" | "L" } | null {
  const m = code.match(/^([WL])(\d+)$/i);
  return m ? { num: parseInt(m[2], 10), side: m[1].toUpperCase() as "W" | "L" } : null;
}

/** Resolve a knockout slot label to a real English team name, or null if undecided. */
function resolveSlotName(code: string, ko: KoContext): string | null {
  if (!isPlaceholderName(code)) return code; // already a real nation
  const parsed = parseSlotCode(code);
  if (!parsed) return null; // group-position code (1A, 3C…) — not propagated here
  return (parsed.side === "W" ? ko.winnerByNum : ko.loserByNum).get(parsed.num) ?? null;
}

/**
 * Walk the knockout matches in match-number order and record each finished
 * match's winner + loser, so later-round "W{n}" / "L{n}" codes resolve to real
 * nations. The qualifier comes from API-Football's winner flag (correct even on
 * penalty shootouts); we fall back to OpenFootball's decisive full-time score.
 */
function buildKoContext(ko: OFMatch[], wc: ApiFixtureResponse[]): KoContext {
  const ctx: KoContext = { winnerByNum: new Map(), loserByNum: new Map() };
  const byNum = [...ko]
    .filter((m) => typeof m.num === "number")
    .sort((a, b) => (a.num ?? 0) - (b.num ?? 0));

  for (const m of byNum) {
    const home = resolveSlotName(m.team1, ctx);
    const away = resolveSlotName(m.team2, ctx);
    if (!home || !away) continue; // teams not both decided yet

    const hId = getTeamMeta(home).apiId;
    const aId = getTeamMeta(away).apiId;
    let winner: string | null = null;

    const apiFx = hId && aId ? findWcFixture(wc, hId, aId) : null;
    if (apiFx && WC_FINISHED.has(apiFx.fixture.status.short)) {
      if (apiFx.teams.home.winner === true) winner = apiFx.teams.home.id === hId ? home : away;
      else if (apiFx.teams.away.winner === true) winner = apiFx.teams.away.id === hId ? home : away;
    }
    // Fallback: OpenFootball decisive 90-min score (no shootout info there).
    if (!winner && m.score) {
      const [g1, g2] = m.score.ft;
      if (g1 > g2) winner = home;
      else if (g2 > g1) winner = away;
    }

    if (winner && typeof m.num === "number") {
      ctx.winnerByNum.set(m.num, winner);
      ctx.loserByNum.set(m.num, winner === home ? away : home);
    }
  }
  return ctx;
}

/**
 * Resolve a knockout fixture's two slots using the propagation context. Returns
 * the (possibly still-placeholder) slot labels plus the live result when BOTH
 * sides are decided real nations. `home`/`away` keep the OpenFootball order.
 */
function resolveKoMatch(
  f: OFMatch,
  ko: KoContext,
  wc: ApiFixtureResponse[]
): { home: string; away: string; bothReal: boolean; live: LiveResult | null } {
  const home = resolveSlotName(f.team1, ko) ?? f.team1;
  const away = resolveSlotName(f.team2, ko) ?? f.team2;
  const bothReal = !isPlaceholderName(home) && !isPlaceholderName(away);

  let live: LiveResult | null = null;
  if (bothReal) {
    const hId = getTeamMeta(home).apiId;
    const aId = getTeamMeta(away).apiId;
    const apiFx = hId && aId ? findWcFixture(wc, hId, aId) : null;
    if (apiFx) live = orientResult(apiFx, hId);
  }
  return { home, away, bothReal, live };
}

// ─── getMatches — all 72 WC 2026 group-stage matches ─────────────────────────

export async function getMatches(): Promise<Match[]> {
  const [fixtures, wc] = await Promise.all([fetchOpenFootball(), getWcFixtures()]);

  if (!fixtures.length) {
    console.warn("[data-service] OpenFootball empty — using mock");
    return MOCK_MATCHES;
  }

  // Propagate finished-match winners into later-round slots ("W76" → Brazil).
  const ko = buildKoContext(
    fixtures.filter((m) => !m.group?.startsWith("Group")),
    wc
  );

  return fixtures.map((f): Match => {
    const isGroupStage = Boolean(f.group?.startsWith("Group"));
    const group = isGroupStage ? (f.group ?? "").replace("Group ", "") : "—";
    const meta1 = getTeamMeta(f.team1);
    const meta2 = getTeamMeta(f.team2);

    // Real-time status + score from API-Football (oriented to team1 = home).
    const apiFx =
      meta1.apiId && meta2.apiId ? findWcFixture(wc, meta1.apiId, meta2.apiId) : null;
    const live = apiFx ? orientResult(apiFx, meta1.apiId) : null;

    const makeShell = (name: string, meta: ReturnType<typeof getTeamMeta>): Team => {
      // Undetermined knockout slot (e.g. "W89", "1A") → neutral placeholder.
      if (isPlaceholderName(name)) return placeholderTeam(name, group);
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
    const hasFtScore = Boolean(f.score);

    // Knockout slot OpenFootball hasn't resolved yet ("W76 vs W78" or "Canada vs
    // W75"): fill in the real qualifiers it references + the live score. Sides
    // still undecided stay as a "Vainqueur match N" placeholder.
    if (!isGroupStage && (isPlaceholderName(f.team1) || isPlaceholderName(f.team2))) {
      const r = resolveKoMatch(f, ko, wc);
      if (r.home !== f.team1 || r.away !== f.team2 || r.live) {
        return {
          id: matchSlug(r.home, r.away),
          homeTeam: makeShell(r.home, getTeamMeta(r.home)),
          awayTeam: makeShell(r.away, getTeamMeta(r.away)),
          date: kickoff.date,
          time: kickoff.time,
          stadium: venueToStadium(f.ground),
          city: venueToCity(f.ground),
          country: venueToCountry(f.ground),
          group,
          round: roundLabelFr(f),
          h2h: [],
          odds: [],
          apiFixtureId: r.live?.apiFixtureId,
          status: r.live?.status ?? (hasFtScore ? "FT" : "NS"),
          score:
            r.live?.score ??
            (f.score ? { home: f.score.ft[0], away: f.score.ft[1] } : { home: null, away: null }),
        };
      }
    }

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
      round: roundLabelFr(f),
      h2h: [],
      odds: [],
      apiFixtureId: live?.apiFixtureId,
      // Prefer live API status; fall back to FT when OpenFootball already has a
      // final score (so finished matches never display as "à venir").
      status: live?.status ?? (hasFtScore ? "FT" : "NS"),
      score:
        live && live.score.home != null
          ? live.score
          : f.score
            ? { home: f.score.ft[0], away: f.score.ft[1] }
            : { home: null, away: null },
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
  let fixture = fixtures.find((f) => matchSlug(f.team1, f.team2) === id) ?? null;

  // The two nations for this match. Usually the OpenFootball names, but for a
  // resolved knockout slug (id like "canada-vs-morocco" while OpenFootball still
  // reads "Canada vs W75") we recover them from the live API-Football bracket.
  let team1 = fixture?.team1;
  let team2 = fixture?.team2;
  let preLive: LiveResult | null = null;

  if (!fixture && hasApiKey()) {
    const wc = await getWcFixtures();
    const ko = buildKoContext(
      fixtures.filter((m) => !m.group?.startsWith("Group")),
      wc
    );
    for (const of of fixtures) {
      if (of.group?.startsWith("Group")) continue;
      const r = resolveKoMatch(of, ko, wc);
      if (r.bothReal && matchSlug(r.home, r.away) === id) {
        fixture = of;
        team1 = r.home;
        team2 = r.away;
        preLive = r.live;
        break;
      }
    }
  }

  if (!fixture || !team1 || !team2) {
    // Fall back to mock
    return mockMatch ?? null;
  }

  const isGroupStage = Boolean(fixture.group?.startsWith("Group"));
  const group = isGroupStage ? (fixture.group ?? "").replace("Group ", "") : "—";
  const meta1 = getTeamMeta(team1);
  const meta2 = getTeamMeta(team2);

  // Build teams — API-Football calls (squad + coach) run in parallel. Undecided
  // knockout slots ("W89", "1A"…) resolve to a neutral placeholder, not the API.
  const [homeTeam, awayTeam] = await Promise.all([
    isPlaceholderName(team1)
      ? Promise.resolve(placeholderTeam(team1, group))
      : buildTeam(team1, group, true, meta2.apiId),
    isPlaceholderName(team2)
      ? Promise.resolve(placeholderTeam(team2, group))
      : buildTeam(team2, group, false, meta1.apiId),
  ]);

  // H2H, odds and live score — REAL only (no mock fallback). Empty = the UI shows
  // an honest "indisponible" state. All API-Football calls are Supabase-cached.
  let h2h: HH2Match[] = [];
  let odds: Match["odds"] = [];
  // Resolved knockout slots already carry the live result from the bracket lookup.
  let apiFixtureId: number | undefined = preLive?.apiFixtureId;
  let liveStatus: Match["status"] | undefined = preLive?.status;
  let liveScore: Match["score"] | undefined = preLive?.score;

  if (hasApiKey() && meta1.apiId && meta2.apiId) {
    // Resolve this match's API-Football fixture → unlocks odds + live score.
    // Short-cached (60s) + oriented to OUR home team so the score isn't flipped.
    if (!apiFixtureId) {
      const wc = await getWcFixtures();
      const apiFixture = findWcFixture(wc, meta1.apiId, meta2.apiId);
      if (apiFixture) {
        const live = orientResult(apiFixture, meta1.apiId);
        apiFixtureId = live.apiFixtureId;
        liveStatus = live.status;
        liveScore = live.score;
      }
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
    round: roundLabelFr(fixture),
    h2h,
    odds,
    apiFixtureId,
    status: liveStatus ?? (fixture.score ? "FT" : "NS"),
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

