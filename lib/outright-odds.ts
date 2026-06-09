/**
 * Bookmaker outright odds to WIN the 2026 World Cup.
 *
 * Source: BetMGM (snapshot 2026-06-03), American odds. API-Football does NOT
 * expose tournament futures, so this table is maintained by hand — update it as
 * the market moves. It represents the aggregated market/media consensus, which
 * we blend with our Elo model so published numbers stay close to what experts say.
 */
import "server-only";

/** American outright odds (e.g. +450 ⇒ decimal 5.5 ⇒ implied 18.2% pre-margin). */
export const OUTRIGHT_ODDS_AM: Record<string, number> = {
  France: 450,
  Spain: 450,
  England: 650,
  Brazil: 800,
  Argentina: 800,
  Portugal: 900,
  Germany: 1400,
  Netherlands: 2000,
  Norway: 2500,
  Colombia: 3500,
  Morocco: 4000,
  USA: 4000,
  Ecuador: 6600,
};

/** Share of total title probability assumed to sit with quoted (favourite) teams. */
const QUOTED_MASS = 0.92;

const americanToDecimal = (a: number): number =>
  a > 0 ? a / 100 + 1 : 100 / -a + 1;

/**
 * De-margined market title probabilities for every team in `teams`.
 *
 * Quoted teams share `QUOTED_MASS` of the probability (their de-vigged odds,
 * renormalised); the remaining tail is spread over unquoted teams by Elo, so the
 * whole map sums to ~1. `eloOf` lets the caller supply the rating source.
 */
export function marketTitleProbs(
  teams: string[],
  eloOf: (name: string) => number
): Map<string, number> {
  const quoted = teams.filter((t) => OUTRIGHT_ODDS_AM[t] != null);
  const unquoted = teams.filter((t) => OUTRIGHT_ODDS_AM[t] == null);

  let rawSum = 0;
  const raw = new Map<string, number>();
  for (const t of quoted) {
    const p = 1 / americanToDecimal(OUTRIGHT_ODDS_AM[t]);
    raw.set(t, p);
    rawSum += p;
  }

  const out = new Map<string, number>();
  for (const t of quoted) {
    out.set(t, rawSum > 0 ? (raw.get(t)! / rawSum) * QUOTED_MASS : 0);
  }

  // Distribute the remaining mass over unquoted teams by Elo strength.
  const tailWeights = unquoted.map((t) => Math.pow(10, eloOf(t) / 400));
  const tailSum = tailWeights.reduce((a, b) => a + b, 0) || 1;
  unquoted.forEach((t, i) => {
    out.set(t, (1 - QUOTED_MASS) * (tailWeights[i] / tailSum));
  });

  return out;
}
