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
 * A recommended bet must be PLAUSIBLE — even the boldest profile never headlines
 * a longshot. Below this model probability a "+EV" pick is just a lottery ticket
 * (e.g. a 15%-likely underdog at long odds) and erodes trust, so it's excluded
 * from every profile's headline recommendation.
 */
const MIN_RECO_PROBA = 0.3;

/**
 * Pick the candidate that best fits a bettor profile's RISK APPETITE — never the
 * stake, always the bet TYPE/boldness. Two guards keep recommendations sane:
 *  - PLAUSIBILITY: only bets with proba ≥ 30% can be the headline pick.
 *  - EV: we never push a clearly negative-EV bet (fallback to the best-EV one,
 *    which honestly reports its tier, "none" included).
 *  - safe        → l'issue la plus probable (faible variance).
 *  - balanced    → la meilleure value parmi les paris solides (proba ≥ 40%).
 *  - opportunist → la meilleure value parmi les paris plausibles.
 *  - aggressive  → le plus gros gain potentiel parmi les paris plausibles à value.
 */
function pickForProfile(scored: Scored[], profile: Playstyle): Scored {
  const byEv = [...scored].sort((a, b) => b.v.ev - a.v.ev);
  const bestEv = byEv[0];
  // Plausible candidates only (fall back to all if a match is wide open).
  const plausible = scored.filter((s) => s.c.proba >= MIN_RECO_PROBA);
  const pool = plausible.length ? plausible : scored;
  const poolByEv = [...pool].sort((a, b) => b.v.ev - a.v.ev);

  switch (profile) {
    case "safe": {
      // Highest probability wins (lowest variance) — already plausible by nature.
      return [...scored].sort(
        (a, b) => b.c.proba - a.c.proba || b.v.ev - a.v.ev,
      )[0];
    }
    case "balanced": {
      const solid = poolByEv.filter((s) => s.c.proba >= 0.4);
      return solid[0] ?? poolByEv[0] ?? bestEv;
    }
    case "aggressive": {
      // Boldest = biggest odds, but only among plausible bets that still hold value.
      const withValue = pool.filter((s) => s.v.ev >= 0);
      if (withValue.length) {
        return [...withValue].sort((a, b) => b.c.cote - a.c.cote)[0];
      }
      return poolByEv[0] ?? bestEv;
    }
    case "opportunist":
    default:
      return poolByEv[0] ?? bestEv;
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
 * One value bet PER bettor profile (computed from a single odds fetch). The bet
 * TYPE/boldness adapts to each profile's risk appetite; the engine still grounds
 * every pick in real odds + model probabilities. Null entries when no odds.
 */
export async function selectValueBetsByProfile(
  match: Match,
  profiles: readonly Playstyle[],
): Promise<Record<Playstyle, ValueBet | null>> {
  const { scored, bookmaker } = await scoreCandidates(match);
  const out = {} as Record<Playstyle, ValueBet | null>;
  for (const p of profiles) {
    out[p] = scored.length ? toBet(pickForProfile(scored, p), bookmaker) : null;
  }
  return out;
}
