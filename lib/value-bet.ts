import "server-only";

import type { Match } from "./types";
import type { Playstyle } from "./bankroll";
import { predictMatch } from "./match-model";
import { getMatchOddsMarkets } from "./data-service";
import { calculateValue, type ValueResult } from "./value";

export interface ValueBet extends ValueResult {
  market: string;
  selection: string;
  bookmaker?: string;
}

type Scored = {
  c: { market: string; selection: string; proba: number; cote: number };
  v: ValueResult;
};

/** All candidate bets for a match (1X2 / O-U 2.5 / BTTS), scored for value. */
async function scoreCandidates(match: Match): Promise<{ scored: Scored[]; bookmaker?: string }> {
  const pred = predictMatch(match);
  const odds = match.apiFixtureId
    ? await getMatchOddsMarkets(match.apiFixtureId)
    : { win: null, ou25: null, btts: null };

  const win =
    odds.win ??
    (match.odds[0]
      ? { home: match.odds[0].home, draw: match.odds[0].draw, away: match.odds[0].away, bookmaker: match.odds[0].bookmaker }
      : null);
  const bookmaker = odds.win?.bookmaker ?? match.odds[0]?.bookmaker;

  const cands: { market: string; selection: string; proba: number; cote: number }[] = [];
  if (win) {
    cands.push({ market: "Résultat du match", selection: `${match.homeTeam.name} gagne`, proba: pred.probabilities.home / 100, cote: win.home });
    cands.push({ market: "Résultat du match", selection: "Match nul", proba: pred.probabilities.draw / 100, cote: win.draw });
    cands.push({ market: "Résultat du match", selection: `${match.awayTeam.name} gagne`, proba: pred.probabilities.away / 100, cote: win.away });
  }
  if (odds.ou25) {
    cands.push({ market: "Total de buts", selection: "Plus de 2,5 buts", proba: pred.markets.over25 / 100, cote: odds.ou25.over });
    cands.push({ market: "Total de buts", selection: "Moins de 2,5 buts", proba: pred.markets.under25 / 100, cote: odds.ou25.under });
  }
  if (odds.btts) {
    cands.push({ market: "Les deux équipes marquent", selection: "Oui", proba: pred.markets.bttsYes / 100, cote: odds.btts.yes });
    cands.push({ market: "Les deux équipes marquent", selection: "Non", proba: pred.markets.bttsNo / 100, cote: odds.btts.no });
  }

  const scored = cands
    .filter((c) => c.cote > 1 && c.proba > 0)
    .map((c) => ({ c, v: calculateValue(c.proba, c.cote) }));
  return { scored, bookmaker };
}

const toBet = (s: Scored, bookmaker?: string): ValueBet => ({
  ...s.v,
  market: s.c.market,
  selection: s.c.selection,
  bookmaker,
});

/**
 * A value pick must be PLAUSIBLE — even the boldest profile never headlines a
 * longshot. Below this model probability a "+EV" pick is just a lottery ticket
 * and erodes trust, so it's excluded from the value profiles' picks.
 */
const MIN_RECO_PROBA = 0.3;

/** A "banker" (Prudent) must still pay something — no sub-1.40 dead-money picks. */
const MIN_SAFE_ODDS = 1.4;

const keyOf = (s: Scored) => `${s.c.market}|${s.c.selection}`;

/**
 * Pick the candidate that best fits a profile's RISK APPETITE — never the stake,
 * always the bet TYPE/boldness. `used` holds selections already taken by more
 * conservative profiles, so bolder ones diversify away from them when possible
 * (this is what makes the 4 profiles show genuinely different bets).
 *
 *  - safe        → l'issue la plus probable ET jouable (un "banker"), value ou
 *                  non : le Prudent propose TOUJOURS un pari.
 *  - balanced    → la meilleure value parmi les paris solides (proba ≥ 40%).
 *  - opportunist → la meilleure value parmi les paris plausibles.
 *  - aggressive  → la plus grosse cote parmi les paris plausibles à value.
 */
function pickForProfile(
  scored: Scored[],
  profile: Playstyle,
  used: Set<string> = new Set(),
): Scored {
  const plausible = scored.filter((s) => s.c.proba >= MIN_RECO_PROBA);
  // Prefer candidates not already taken by a more conservative profile.
  const prefFresh = (pool: Scored[]) => {
    const fresh = pool.filter((s) => !used.has(keyOf(s)));
    return fresh.length ? fresh : pool;
  };
  const byEv = (pool: Scored[]) => [...pool].sort((a, b) => b.v.ev - a.v.ev);
  const byOdds = (pool: Scored[]) => [...pool].sort((a, b) => b.c.cote - a.c.cote);
  const byProba = (pool: Scored[]) =>
    [...pool].sort((a, b) => b.c.proba - a.c.proba || b.v.ev - a.v.ev);

  switch (profile) {
    case "safe": {
      // Most probable PLAYABLE outcome (a banker), value or not. Picked first, so
      // it sets the anchor the bolder profiles diversify away from.
      const playable = scored.filter((s) => s.c.cote >= MIN_SAFE_ODDS);
      return byProba(playable.length ? playable : scored)[0];
    }
    case "balanced": {
      const solid = plausible.filter((s) => s.c.proba >= 0.4);
      return byEv(prefFresh(solid.length ? solid : plausible.length ? plausible : scored))[0];
    }
    case "aggressive": {
      const withValue = plausible.filter((s) => s.v.ev >= 0);
      return byOdds(prefFresh(withValue.length ? withValue : plausible.length ? plausible : scored))[0];
    }
    case "opportunist":
    default:
      return byEv(prefFresh(plausible.length ? plausible : scored))[0];
  }
}

/**
 * The best-EV bet for a match across 1X2 / O-U 2.5 / BTTS, using our model
 * probabilities (the displayed blend) and REAL bookmaker odds. Returns the
 * highest-EV side — which may have no value (tier "none"). Null if no odds.
 */
export async function selectValueBet(match: Match): Promise<ValueBet | null> {
  const { scored, bookmaker } = await scoreCandidates(match);
  if (!scored.length) return null;
  return toBet(pickForProfile(scored, "opportunist"), bookmaker);
}

/**
 * Fixed conservative→bold order: each profile is picked in turn and remembers
 * what the previous ones took, so bolder profiles diversify away → 4 different
 * bets when the match offers enough material.
 */
const SELECTION_ORDER: readonly Playstyle[] = ["safe", "balanced", "opportunist", "aggressive"];

/**
 * One value bet PER bettor profile (computed from a single odds fetch). The bet
 * TYPE/boldness adapts to each profile's risk appetite, and picks diversify
 * across profiles (see SELECTION_ORDER). Null entries when no odds.
 */
export async function selectValueBetsByProfile(
  match: Match,
  profiles: readonly Playstyle[],
): Promise<Record<Playstyle, ValueBet | null>> {
  const { scored, bookmaker } = await scoreCandidates(match);
  const out = {} as Record<Playstyle, ValueBet | null>;
  if (!scored.length) {
    for (const p of profiles) out[p] = null;
    return out;
  }
  const used = new Set<string>();
  // Pick conservative→bold so diversity is deterministic; only assign requested
  // profiles, but follow the canonical order for stable, varied results.
  const ordered = [
    ...SELECTION_ORDER.filter((p) => profiles.includes(p)),
    ...profiles.filter((p) => !SELECTION_ORDER.includes(p)),
  ];
  for (const p of ordered) {
    const pick = pickForProfile(scored, p, used);
    out[p] = toBet(pick, bookmaker);
    used.add(keyOf(pick));
  }
  return out;
}
