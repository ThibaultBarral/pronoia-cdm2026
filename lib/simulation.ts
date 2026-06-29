/**
 * World Cup 2026 simulation engine (SERVER ONLY) — V2.
 *
 * A seeded Monte-Carlo over the REAL bracket. Per team it estimates:
 *   - group finishing position (1st / 2nd / 3rd),
 *   - probability of reaching each knockout round (1/16 → title),
 *   - projected goals over the tournament + a probable top scorer.
 *
 * V2 changes vs the FIFA-rank-only V1:
 *   - Ratings come from real World Football Elo (lib/elo), which separates the
 *     elites and reflects 2024-2025 form (Spain #1 in Elo, not #8 in FIFA).
 *   - Knockout is the ACTUAL OpenFootball bracket (lib/wc-bracket), simulated
 *     N times — capturing easy/hard draws — instead of an averaged field.
 *   - Published title% blends our model with bookmaker outright odds
 *     (lib/outright-odds). The blend is DYNAMIC: 65% market / 35% model at
 *     kick-off (so numbers track the media/market consensus), decaying toward
 *     30% market / 70% model by the final — the pre-tournament odds get staler
 *     every matchday while our model, now conditioned on real scores, earns
 *     trust. Both halves are exposed (modelTitle/marketTitle).
 *
 * Seeded RNG → deterministic, so the whole thing is computed once per day and
 * cached. Everything is surfaced in the UI as "selon notre simulation".
 */
import "server-only";

import { getGroups, type GroupTeam } from "./groups";
import { getCachedOrFetch } from "./api-cache";
import { getTeamProfile } from "./team-data";
import { getElo } from "./elo";
import { getKnockoutBracket } from "./wc-bracket";
import { marketTitleProbs } from "./outright-odds";
import { getTeamMeta } from "./team-ids";
import { getPlayedWcResults, getWcFinishedCount } from "./data-service";

// ─── Tunables ────────────────────────────────────────────────────────────────

const BASE_TOTAL_GOALS = 2.6;
const MAX_SUPREMACY = 3;
/** Elo points per goal of supremacy. Higher = flatter (calibrated so the clear
 *  favourite lands ~18-20% model title, like 538/Opta). */
const RATING_PER_GOAL = 350;
/** Monte-Carlo iterations. Seeded → stable across cache reads. */
const ITERATIONS = 20000;
const SEED = 20260608;
/** Output blend (DYNAMIC): published title = marketWeight·market + rest·model.
 *  marketWeight decays linearly with tournament progress (matches played /
 *  TOTAL_MATCHES) from START at kick-off to END by the final. */
const MARKET_WEIGHT_START = 0.65;
const MARKET_WEIGHT_END = 0.3;
/** WC 2026 format: 48 teams, 104 matches total (72 group + 32 knockout). */
const TOTAL_MATCHES = 104;

export type Stage =
  | "Vainqueur"
  | "Finale"
  | "Demi-finale"
  | "Quart de finale"
  | "8e de finale"
  | "16e de finale"
  | "Phase de groupes";

export interface TeamSimResult {
  nameEn: string;
  fr: string;
  flag: string;
  slug: string;
  group: string;
  fifaRanking: number;
  /** Internal Elo rating (exposed for debugging / sorting). */
  rating: number;
  // Group stage (%)
  winGroup: number;
  runnerUp: number;
  third: number;
  // Knockout reach (%) — cumulative, monotonically decreasing
  reachR32: number; // 1/16
  reachR16: number; // 1/8
  reachQF: number; // 1/4
  reachSF: number; // 1/2
  reachFinal: number;
  /** Published title chance (dynamic market/model blend — see MARKET_WEIGHT_*). */
  title: number;
  /** Our pure-model title chance (Monte-Carlo only). */
  modelTitle: number;
  /** De-margined bookmaker outright title chance. */
  marketTitle: number;
  /** Expected number of matches played in the tournament. */
  expMatches: number;
  /** Projected goals scored over the whole tournament. */
  projGoals: number;
  /** Most likely stage reached (deepest round with ≥ 50% reach). */
  probableStage: Stage;
  /** Estimated top scorer (from the static squad profile) + expected goals. */
  probableScorer?: { name: string; expectedGoals: number };
}

// ─── Poisson match model ─────────────────────────────────────────────────────

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function poissonPmf(lambda: number, k: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}
function expectedGoals(rA: number, rB: number): [number, number] {
  let s = (rA - rB) / RATING_PER_GOAL;
  s = Math.max(-MAX_SUPREMACY, Math.min(MAX_SUPREMACY, s));
  return [
    Math.max(0.15, BASE_TOTAL_GOALS / 2 + s / 2),
    Math.max(0.15, BASE_TOTAL_GOALS / 2 - s / 2),
  ];
}

/** W/D probabilities for side A (loss = 1 − w − d). */
function winDraw(rA: number, rB: number): { w: number; d: number } {
  const [la, lb] = expectedGoals(rA, rB);
  const MAX = 8;
  let w = 0;
  let d = 0;
  for (let a = 0; a <= MAX; a++) {
    const pa = poissonPmf(la, a);
    for (let b = 0; b <= MAX; b++) {
      const p = pa * poissonPmf(lb, b);
      if (a > b) w += p;
      else if (a === b) d += p;
    }
  }
  return { w, d };
}

/** Elo expected score — used to break knockout draws (incl. shootouts). */
function eloAdvantage(rA: number, rB: number): number {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

// ─── Seeded RNG (mulberry-style LCG) ──────────────────────────────────────────

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─── Probable stage & scorer ──────────────────────────────────────────────────

function probableStage(r: {
  title: number;
  reachFinal: number;
  reachSF: number;
  reachQF: number;
  reachR16: number;
  reachR32: number;
}): Stage {
  if (r.title >= 50) return "Vainqueur";
  if (r.reachFinal >= 50) return "Finale";
  if (r.reachSF >= 50) return "Demi-finale";
  if (r.reachQF >= 50) return "Quart de finale";
  if (r.reachR16 >= 50) return "8e de finale";
  if (r.reachR32 >= 50) return "16e de finale";
  return "Phase de groupes";
}

function probableScorer(
  nameEn: string,
  projGoals: number
): TeamSimResult["probableScorer"] {
  const profile = getTeamProfile(nameEn);
  const name = profile?.keyPlayers?.[0];
  if (!name) return undefined;
  const eg = Math.round(projGoals * 0.28 * 10) / 10;
  return { name: name.split("—")[0].split("(")[0].trim(), expectedGoals: eg };
}

// ─── Bracket slot resolution ──────────────────────────────────────────────────

interface SimContext {
  /** group letter → finishing order [1st, 2nd, 3rd, 4th] (team names). */
  standings: Record<string, string[]>;
  /** group letters whose third-placed team qualified (best 8). */
  qualThirds: Set<string>;
  /** thirds already slotted into the bracket (avoid double-use). */
  usedThirds: Set<string>;
  /** match number → winning team. */
  winners: Map<number, string>;
  eloOf: (name: string) => number;
}

/** Resolve an OpenFootball slot ("1A" | "2B" | "3A/B/C/D/F" | "W74") to a team. */
function resolveSlot(slot: string, ctx: SimContext): string {
  if (/^W\d+$/.test(slot)) return ctx.winners.get(Number(slot.slice(1)))!;
  if (/^[12][A-L]$/.test(slot)) {
    return ctx.standings[slot[1]][Number(slot[0]) - 1];
  }
  // Once a knockout match's participants are decided, OpenFootball replaces the
  // positional code with the REAL team name (e.g. "South Africa"). Anything that
  // isn't a positional third-place slot ("3A/B/…") is a literal team → use it.
  if (!/^3[A-L]/.test(slot)) return slot;
  // Third-place slot: pick the strongest qualified, unused third among candidates.
  const candidates = slot
    .replace(/^3/, "")
    .split("/")
    .map((x) => x.trim())
    .filter(Boolean)
    .sort(
      (a, b) =>
        ctx.eloOf(ctx.standings[b][2]) - ctx.eloOf(ctx.standings[a][2])
    );
  for (const L of candidates) {
    const third = ctx.standings[L]?.[2];
    if (third && ctx.qualThirds.has(L) && !ctx.usedThirds.has(third)) {
      ctx.usedThirds.add(third);
      return third;
    }
  }
  // Fallback: any unused qualified third.
  for (const L of ctx.qualThirds) {
    const third = ctx.standings[L][2];
    if (!ctx.usedThirds.has(third)) {
      ctx.usedThirds.add(third);
      return third;
    }
  }
  return ctx.standings[candidates[0]][2];
}

// ─── Full tournament simulation ───────────────────────────────────────────────

interface Counters {
  winGroup: number;
  runnerUp: number;
  third: number;
  r32: number;
  r16: number;
  qf: number;
  sf: number;
  final: number;
  title: number;
}

async function compute(): Promise<TeamSimResult[]> {
  const [groups, bracket, played] = await Promise.all([
    getGroups(),
    getKnockoutBracket(),
    getPlayedWcResults().catch(() => []),
  ]);

  const teams: GroupTeam[] = groups.flatMap((g) => g.teams);
  const elo = new Map(teams.map((t) => [t.nameEn, getElo(t.nameEn)]));
  const eloOf = (n: string) => elo.get(n) ?? getElo(n);

  // Real finished results, keyed by sorted API-id pair → fixes those group
  // matches to reality so standings & all probabilities track the live tournament.
  const apiIdOf = (name: string) => getTeamMeta(name).apiId;
  const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const realByPair = new Map<string, { homeApiId: number; gh: number; ga: number }>();
  for (const r of played) {
    realByPair.set(pairKey(r.homeApiId, r.awayApiId), {
      homeApiId: r.homeApiId,
      gh: r.goalsHome,
      ga: r.goalsAway,
    });
  }

  // Memoise pairwise W/D so the inner MC loop stays cheap.
  const wdCache = new Map<string, { w: number; d: number }>();
  const wd = (a: string, b: string) => {
    const key = `${a} ${b}`;
    let v = wdCache.get(key);
    if (!v) {
      v = winDraw(eloOf(a), eloOf(b));
      wdCache.set(key, v);
    }
    return v;
  };

  const counters = new Map<string, Counters>(
    teams.map((t) => [
      t.nameEn,
      {
        winGroup: 0,
        runnerUp: 0,
        third: 0,
        r32: 0,
        r16: 0,
        qf: 0,
        sf: 0,
        final: 0,
        title: 0,
      },
    ])
  );

  // Pre-extract group letters + their teams.
  const groupTeams: Record<string, string[]> = {};
  for (const g of groups) groupTeams[g.letter] = g.teams.map((t) => t.nameEn);

  const rand = makeRng(SEED);

  for (let it = 0; it < ITERATIONS; it++) {
    const standings: Record<string, string[]> = {};
    const thirds: { L: string; team: string; elo: number }[] = [];

    // 1) Group stage — random round-robin, rank by points then goal diff.
    for (const [L, ts] of Object.entries(groupTeams)) {
      const pts: Record<string, number> = {};
      const gd: Record<string, number> = {};
      for (const t of ts) {
        pts[t] = 0;
        gd[t] = 0;
      }
      for (let i = 0; i < ts.length; i++) {
        for (let j = i + 1; j < ts.length; j++) {
          const A = ts[i];
          const B = ts[j];

          // Already played? Fix it to the real result (deterministic every iter).
          const idA = apiIdOf(A);
          const idB = apiIdOf(B);
          const real = idA && idB ? realByPair.get(pairKey(idA, idB)) : undefined;
          if (real) {
            const aGoals = real.homeApiId === idA ? real.gh : real.ga;
            const bGoals = real.homeApiId === idA ? real.ga : real.gh;
            if (aGoals > bGoals) pts[A] += 3;
            else if (aGoals === bGoals) {
              pts[A]++;
              pts[B]++;
            } else pts[B] += 3;
            gd[A] += aGoals - bGoals;
            gd[B] += bGoals - aGoals;
            continue;
          }

          const { w, d } = wd(A, B);
          const r = rand();
          if (r < w) {
            pts[A] += 3;
            gd[A]++;
            gd[B]--;
          } else if (r < w + d) {
            pts[A]++;
            pts[B]++;
          } else {
            pts[B] += 3;
            gd[B]++;
            gd[A]--;
          }
        }
      }
      const order = [...ts].sort(
        (a, b) => pts[b] - pts[a] || gd[b] - gd[a] || eloOf(b) - eloOf(a)
      );
      standings[L] = order;
      const c1 = counters.get(order[0])!;
      const c2 = counters.get(order[1])!;
      const c3 = counters.get(order[2])!;
      c1.winGroup++;
      c2.runnerUp++;
      c3.third++;
      thirds.push({ L, team: order[2], elo: eloOf(order[2]) });
    }

    // 2) Eight best thirds qualify.
    thirds.sort((a, b) => b.elo - a.elo);
    const qualThirds = new Set(thirds.slice(0, 8).map((t) => t.L));

    // R32 reach = top 2 of every group + the 8 qualified thirds.
    for (const ts of Object.values(standings)) {
      counters.get(ts[0])!.r32++;
      counters.get(ts[1])!.r32++;
    }
    for (const t of thirds.slice(0, 8)) counters.get(t.team)!.r32++;

    // 3) Knockout on the real bracket.
    const ctx: SimContext = {
      standings,
      qualThirds,
      usedThirds: new Set(),
      winners: new Map(),
      eloOf,
    };
    for (const m of bracket) {
      const A = resolveSlot(m.slot1, ctx);
      const B = resolveSlot(m.slot2, ctx);
      const winner = rand() < koWin(A, B, wd, eloOf) ? A : B;
      ctx.winners.set(m.num, winner);
      const cw = counters.get(winner)!;
      if (m.round === "Round of 32") cw.r16++;
      else if (m.round === "Round of 16") cw.qf++;
      else if (m.round === "Quarter-final") cw.sf++;
      else if (m.round === "Semi-final") cw.final++;
      else if (m.round === "Final") cw.title++;
    }
  }

  // 4) Market odds (de-margined) over the real field.
  const market = marketTitleProbs(
    teams.map((t) => t.nameEn),
    eloOf
  );

  // Dynamic blend: the more matches are in the books, the less we lean on the
  // pre-tournament bookmaker odds and the more on our results-conditioned model.
  const progress = Math.min(1, played.length / TOTAL_MATCHES);
  const marketWeight =
    MARKET_WEIGHT_START - (MARKET_WEIGHT_START - MARKET_WEIGHT_END) * progress;

  // 5) Assemble results.
  const N = ITERATIONS;
  const pct = (x: number) => Math.round((x / N) * 1000) / 10;
  const medianElo = [...elo.values()].sort((a, b) => a - b)[
    Math.floor(elo.size / 2)
  ];

  const results: TeamSimResult[] = teams.map((t) => {
    const c = counters.get(t.nameEn)!;
    const reachR32 = c.r32 / N;
    const reachR16 = c.r16 / N;
    const reachQF = c.qf / N;
    const reachSF = c.sf / N;
    const reachFinal = c.final / N;
    const modelTitle = c.title / N;
    const marketTitle = market.get(t.nameEn) ?? 0;
    const titleBlend =
      marketWeight * marketTitle + (1 - marketWeight) * modelTitle;

    const expMatches =
      3 + reachR32 + reachR16 + reachQF + reachSF + reachFinal;
    const [xgPerMatch] = expectedGoals(eloOf(t.nameEn), medianElo);
    const projGoals = Math.round(xgPerMatch * expMatches * 10) / 10;

    const reach = {
      title: titleBlend * 100,
      reachFinal: reachFinal * 100,
      reachSF: reachSF * 100,
      reachQF: reachQF * 100,
      reachR16: reachR16 * 100,
      reachR32: reachR32 * 100,
    };

    return {
      nameEn: t.nameEn,
      fr: t.fr,
      flag: t.flag,
      slug: t.slug,
      group: t.group,
      fifaRanking: t.fifaRanking,
      rating: Math.round(eloOf(t.nameEn)),
      winGroup: pct(c.winGroup),
      runnerUp: pct(c.runnerUp),
      third: pct(c.third),
      reachR32: pct(c.r32),
      reachR16: pct(c.r16),
      reachQF: pct(c.qf),
      reachSF: pct(c.sf),
      reachFinal: pct(c.final),
      title: Math.round(titleBlend * 1000) / 10,
      modelTitle: Math.round(modelTitle * 1000) / 10,
      marketTitle: Math.round(marketTitle * 1000) / 10,
      expMatches: Math.round(expMatches * 10) / 10,
      projGoals,
      probableStage: probableStage(reach),
      probableScorer: probableScorer(t.nameEn, projGoals),
    };
  });

  return results.sort((a, b) => b.title - a.title);
}

/** Probability that A beats B in a knockout (draws split by Elo advantage). */
function koWin(
  A: string,
  B: string,
  wd: (a: string, b: string) => { w: number; d: number },
  eloOf: (n: string) => number
): number {
  const { w, d } = wd(A, B);
  return w + d * eloAdvantage(eloOf(A), eloOf(B));
}

// ─── Public API (cached daily) ────────────────────────────────────────────────

/** Full simulation for all 48 teams, sorted by title probability. */
export async function getSimulation(): Promise<TeamSimResult[]> {
  // Re-key by finished matches → the simulation re-runs (conditioned on the
  // latest real results) after every match, instead of once a day.
  const finished = await getWcFinishedCount().catch(() => 0);
  return getCachedOrFetch(`simulation:wc2026:v4:wc${finished}`, 86400, compute);
}

/** Simulation result for one team by slug. */
export async function getTeamSimulation(
  slug: string
): Promise<TeamSimResult | null> {
  const sim = await getSimulation();
  return sim.find((t) => t.slug === slug) ?? null;
}

/** Top N favorites (by title probability). */
export async function getTopFavorites(n = 3): Promise<TeamSimResult[]> {
  const sim = await getSimulation();
  return sim.slice(0, n);
}
