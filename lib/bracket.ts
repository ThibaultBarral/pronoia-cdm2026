/**
 * Knockout bracket (SERVER ONLY).
 *
 * Before/at the start of the tournament FIFA's real R32 pairings depend on the
 * group results (and the 8 best third-placed teams), which don't exist yet. So
 * we build a *projected* bracket: take the 32 teams most likely to qualify (per
 * our simulation), seed them 1→32, and lay them out in a standard single-elim
 * tree (1v32, 16v17, …). It is clearly labelled "projeté" in the UI.
 *
 * Once real knockout fixtures exist (OpenFootball / API-Football), this can be
 * swapped for the official structure without changing the component contract.
 */
import "server-only";

import { getSimulation, type TeamSimResult } from "./simulation";
import { getMatches, teamSlug } from "./data-service";
import type { Match, Team } from "./types";

export interface BracketSlot {
  nameEn: string;
  fr: string;
  flag: string;
  slug: string;
  /** Seed (1 = strongest projected qualifier). Absent for real fixtures. */
  seed?: number;
  /** Real goals once the match is played (null otherwise). */
  goals?: number | null;
  /** True when this side won and advanced. */
  winner?: boolean;
  /** True for an undecided knockout slot ("Vainqueur match 89"). */
  placeholder?: boolean;
}

export interface BracketMatch {
  /** Stable id, e.g. "R32-1" (projection) or the match slug (real). */
  id: string;
  /** Match slug → /match/[id] when both teams are decided (real fixtures only). */
  matchId?: string;
  /** Kick-off date (YYYY-MM-DD) for real fixtures. */
  date?: string;
  /** Live/finished status for real fixtures. */
  status?: string;
  /** True once the match is finished. */
  finished?: boolean;
  home: BracketSlot | null;
  away: BracketSlot | null;
}

export interface BracketRound {
  /** "16es de finale" … "Finale". */
  name: string;
  matches: BracketMatch[];
}

export interface Bracket {
  /** True = projected from the simulation; false = real knockout fixtures. */
  projected: boolean;
  rounds: BracketRound[];
}

// ─── Real bracket from official knockout fixtures ─────────────────────────────

const FINISHED_KO = new Set(["FT", "AET", "PEN"]);

/** Knockout rounds in bracket order → clean display label. */
const KO_DISPLAY: Record<string, string> = {
  "16es de finale": "16es de finale",
  "8es de finale": "8es de finale",
  "Quart de finale": "Quarts de finale",
  "Demi-finale": "Demi-finales",
  "Match pour la 3e place": "3e place",
  Finale: "Finale",
};
const KO_ORDER = Object.keys(KO_DISPLAY);

function slotFromTeam(team: Team, goals: number | null, winner: boolean): BracketSlot {
  return {
    nameEn: team.nameEn ?? team.name,
    fr: team.name,
    flag: team.flag,
    slug: team.isPlaceholder ? "" : teamSlug(team.nameEn ?? team.name),
    goals,
    winner,
    placeholder: team.isPlaceholder,
  };
}

/**
 * The REAL knockout bracket built from the official fixtures (OpenFootball /
 * API-Football, via getMatches): real nations where decided, live/final scores,
 * winner highlighting, and a link to each match's analysis. Undecided slots show
 * "à déterminer". Falls back to the projected bracket before any knockout
 * fixture exists (pre-tournament).
 */
export async function getRealBracket(): Promise<Bracket> {
  const matches = await getMatches();
  const ko = matches.filter((m) => m.round !== "Phase de groupes");
  if (!ko.length) return getBracket(); // pre-tournament: nothing real yet

  const rounds: BracketRound[] = [];
  for (const key of KO_ORDER) {
    const roundMatches = ko
      .filter((m) => m.round === key)
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
      );
    if (!roundMatches.length) continue;

    rounds.push({
      name: KO_DISPLAY[key] ?? key,
      matches: roundMatches.map((m: Match): BracketMatch => {
        const finished = FINISHED_KO.has(m.status ?? "");
        const hg = m.score?.home ?? null;
        const ag = m.score?.away ?? null;
        const homeWin = finished && hg != null && ag != null && hg > ag;
        const awayWin = finished && hg != null && ag != null && ag > hg;
        const bothReal = !m.homeTeam.isPlaceholder && !m.awayTeam.isPlaceholder;
        return {
          id: m.id,
          matchId: bothReal ? m.id : undefined,
          date: m.date,
          status: m.status,
          finished,
          home: slotFromTeam(m.homeTeam, finished ? hg : null, homeWin),
          away: slotFromTeam(m.awayTeam, finished ? ag : null, awayWin),
        };
      }),
    });
  }

  return { projected: false, rounds };
}

const ROUND_NAMES = [
  "16es de finale",
  "8es de finale",
  "Quarts de finale",
  "Demi-finales",
  "Finale",
] as const;

/** Standard seeding order for a 32-slot single-elimination bracket. */
function seedOrder32(): number[] {
  // 1,32,16,17,8,25,9,24,4,29,13,20,5,28,12,21,2,31,15,18,7,26,10,23,3,30,14,19,6,27,11,22
  let seeds = [1, 2];
  for (let size = 2; size < 32; size *= 2) {
    const next: number[] = [];
    const sum = size * 2 + 1;
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds; // length 32
}

function toSlot(t: TeamSimResult, seed: number): BracketSlot {
  return { nameEn: t.nameEn, fr: t.fr, flag: t.flag, slug: t.slug, seed };
}

/** Build the projected knockout bracket from the simulation. */
export async function getBracket(): Promise<Bracket> {
  const sim = await getSimulation();
  // 32 most likely qualifiers, ordered by reach into the round of 32.
  const qualifiers = [...sim]
    .sort((a, b) => b.reachR32 - a.reachR32)
    .slice(0, 32);

  // Seed map: seed N → team (index N-1 in the qualifiers list).
  const order = seedOrder32();
  const bySeed = new Map<number, TeamSimResult>();
  qualifiers.forEach((t, i) => bySeed.set(i + 1, t));

  // R32: 16 matches following the seeding order (pairs of consecutive entries).
  const r32: BracketMatch[] = [];
  for (let i = 0; i < 16; i++) {
    const homeSeed = order[i * 2];
    const awaySeed = order[i * 2 + 1];
    const home = bySeed.get(homeSeed);
    const away = bySeed.get(awaySeed);
    r32.push({
      id: `R32-${i + 1}`,
      home: home ? toSlot(home, homeSeed) : null,
      away: away ? toSlot(away, awaySeed) : null,
    });
  }

  // Later rounds: empty slots (decided once results exist).
  const rounds: BracketRound[] = [{ name: ROUND_NAMES[0], matches: r32 }];
  let count = 8;
  for (let r = 1; r < ROUND_NAMES.length; r++) {
    const matches: BracketMatch[] = Array.from({ length: count }, (_, i) => ({
      id: `${ROUND_NAMES[r]}-${i + 1}`,
      home: null,
      away: null,
    }));
    rounds.push({ name: ROUND_NAMES[r], matches });
    count = Math.max(1, count / 2);
  }

  return { projected: true, rounds };
}
