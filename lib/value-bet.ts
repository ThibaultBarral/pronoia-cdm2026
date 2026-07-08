import "server-only";

import type { Match } from "./types";
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
 * A value pick must be PLAUSIBLE — a "+EV" pick on a longshot is just a lottery
 * ticket and erodes trust, so it's excluded below this model probability.
 */
const MIN_RECO_PROBA = 0.3;

/**
 * The best-EV bet for a match across 1X2 / O-U 2.5 / BTTS, using our model
 * probabilities (the displayed blend) and REAL bookmaker odds. Returns the
 * highest-EV side — which may have no value (tier "none"). Null if no odds.
 */
export async function selectValueBet(match: Match): Promise<ValueBet | null> {
  const { scored, bookmaker } = await scoreCandidates(match);
  if (!scored.length) return null;
  const plausible = scored.filter((s) => s.c.proba >= MIN_RECO_PROBA);
  const pool = plausible.length ? plausible : scored;
  const best = [...pool].sort((a, b) => b.v.ev - a.v.ev)[0];
  return toBet(best, bookmaker);
}

/**
 * Every genuine value bet (EV > 5%, plausible probability) for a match, best
 * first — used by the "Value bets du jour" page. Empty array if no odds or no
 * value found (never a lottery-ticket longshot).
 */
export async function listValueBets(match: Match): Promise<ValueBet[]> {
  const { scored, bookmaker } = await scoreCandidates(match);
  return scored
    .filter((s) => s.c.proba >= MIN_RECO_PROBA && s.v.tier === "value")
    .sort((a, b) => b.v.ev - a.v.ev)
    .map((s) => toBet(s, bookmaker));
}
