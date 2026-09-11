"use server";

import type { Match, Team } from "@/lib/types";
import { predictMatch } from "@/lib/match-model";
import type { Confidence } from "@/lib/analysis-schema";

/**
 * The free, model-only short read of a match — shown to non-members above the
 * locked full analysis. Built entirely from our deterministic model
 * (predictMatch) and the real team data already on the Match, so it costs
 * ZERO Claude tokens. It gives the favourite, the probabilities, the likely
 * score and a few plain-language lines on what was looked at; the scenario,
 * strengths/weaknesses, players to watch and the AI chat stay paid.
 */
export interface MatchPreview {
  favorite: "home" | "away" | "draw";
  probabilities: { home: number; draw: number; away: number };
  expectedGoals: { home: number; away: number };
  /** Most likely scoreline (rounded expected goals, favourite kept ahead). */
  likelyScore: { home: number; away: number };
  /** Over 2.5 goals probability (%). */
  over25: number;
  confidence: Confidence;
  /** 2-4 plain-language lines on what the model looked at (real data only). */
  looked: string[];
}

function formLine(t: Team): string | null {
  const f = t.recentForm?.slice(0, 5) ?? [];
  if (!f.length) return null;
  const w = f.filter((r) => r.result === "W").length;
  const d = f.filter((r) => r.result === "D").length;
  const l = f.length - w - d;
  const gf = f.reduce((acc, r) => acc + (parseInt(r.score.split("-")[0], 10) || 0), 0);
  const ga = f.reduce((acc, r) => acc + (parseInt(r.score.split("-")[1], 10) || 0), 0);
  return `${t.name} : ${w} victoire${w > 1 ? "s" : ""}, ${d} nul${d > 1 ? "s" : ""}, ${l} défaite${l > 1 ? "s" : ""} sur les ${f.length} derniers matchs (${gf} buts marqués, ${ga} encaissés).`;
}

export async function getMatchPreview(match: Match): Promise<MatchPreview> {
  const pred = predictMatch(match);
  const { home, draw, away } = pred.probabilities;
  const favorite: MatchPreview["favorite"] =
    home >= away && home >= draw ? "home" : away >= home && away >= draw ? "away" : "draw";

  // Likely score: rounded expected goals, nudged so it agrees with the favourite.
  let sh = Math.max(0, Math.round(pred.expectedGoals.home));
  let sa = Math.max(0, Math.round(pred.expectedGoals.away));
  if (favorite === "home" && sh <= sa) sh = sa + 1;
  if (favorite === "away" && sa <= sh) sa = sh + 1;
  if (favorite === "draw") sa = sh;

  const looked: string[] = [];
  const fh = formLine(match.homeTeam);
  const fa = formLine(match.awayTeam);
  if (fh) looked.push(fh);
  if (fa) looked.push(fa);
  if (match.h2h?.length) {
    looked.push(`${match.h2h.length} confrontation${match.h2h.length > 1 ? "s" : ""} directe${match.h2h.length > 1 ? "s" : ""} récente${match.h2h.length > 1 ? "s" : ""} prise${match.h2h.length > 1 ? "s" : ""} en compte.`);
  }
  if (match.homeTeam.leagueRank && match.awayTeam.leagueRank) {
    looked.push(`Classement : ${match.homeTeam.name} ${match.homeTeam.leagueRank}e, ${match.awayTeam.name} ${match.awayTeam.leagueRank}e.`);
  }
  const squads = (match.homeTeam.lineup?.players?.length ?? 0) + (match.awayTeam.lineup?.players?.length ?? 0);
  if (squads > 0) looked.push(`Effectifs à jour des deux équipes (${squads} joueurs).`);
  if (!looked.length) looked.push("Forme, résultats et effectifs des deux équipes.");

  return {
    favorite,
    probabilities: pred.probabilities,
    expectedGoals: pred.expectedGoals,
    likelyScore: { home: sh, away: sa },
    over25: pred.markets.over25,
    confidence: pred.confidence,
    looked,
  };
}
