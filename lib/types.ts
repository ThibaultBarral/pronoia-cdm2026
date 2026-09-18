export type MatchResult = "W" | "D" | "L";

export interface FormResult {
  opponent: string;
  result: MatchResult;
  score: string;
  competition: string;
  date?: string; // ISO date (YYYY-MM-DD) when known
  venue?: "H" | "A"; // home / away for the analysed team
}

/** Computed momentum signal derived from a team's real recent matches. */
export interface TeamMomentum {
  sample: number; // number of matches the momentum is based on
  last5Pts: number; // points over the 5 most recent (W=3, D=1)
  last10Pts: number; // points over up to 10 most recent
  goalsForAvg: number; // avg goals scored per match
  goalsAgainstAvg: number; // avg goals conceded per match
  cleanSheets: number; // clean sheets over the sample
  trend: "hot" | "cold" | "neutral"; // form direction
}

export interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  competition: string;
}

export interface TeamStats {
  possession: number;
  goalsScored: number;
  goalsConceded: number;
  xGFor: number;
  xGAgainst: number;
  qualificationPath: string;
  cleanSheets: number;
}

/** Home/away splits of a club's league season (from /teams/statistics). */
export interface TeamSeasonStats {
  played: { home: number; away: number };
  goalsForAvg: { home: number; away: number };
  goalsAgainstAvg: { home: number; away: number };
  cleanSheets: { home: number; away: number };
  failedToScore: { home: number; away: number };
  /** Most used formation this season, when known. */
  formation: string | null;
}

/** A player expected to miss the match (from /injuries). */
export interface Absence {
  name: string;
  /**
   * "injury" (physical), "suspension" (cards), "doubt" (questionable) or
   * "other" (coach's decision, inactive, not registered…).
   */
  kind: "injury" | "suspension" | "doubt" | "other";
  /** Raw reason from the provider ("Knee Injury", "Suspended"…). */
  reason: string;
}

export interface Player {
  name: string;
  position: string;
  number: number;
  flag: string;
  photo?: string;
  age?: number;
  club?: string;
  apiId?: number;
}

export interface Lineup {
  formation: string;
  players: Player[];
}

export interface Odds {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
}

export interface Team {
  id: string;
  apiTeamId?: number;
  name: string;
  /** Canonical English name — used for slugs, API lookups and H2H matching. */
  nameEn?: string;
  shortName: string;
  flag: string;
  logo?: string;
  group: string;
  /** FIFA ranking for national teams; 0 for clubs (see `rating`). */
  fifaRanking: number;
  /**
   * Club strength on the Elo scale, derived from the league table (clubs only).
   * When set, the match model uses it instead of the nation Elo lookup.
   */
  rating?: number;
  /** League table rank for clubs (1 = leader), when known. */
  leagueRank?: number;
  coach: string;
  recentForm: FormResult[];
  momentum?: TeamMomentum;
  stats: TeamStats;
  lineup: Lineup;
  keyPlayers: string[];
  /** Absence names (legacy string form, kept in sync with `absences`). */
  injuries: string[];
  suspensions: string[];
  /** Structured absences for this fixture (injured, suspended, doubtful). */
  absences?: Absence[];
  /** Club league season home/away splits (clubs only). */
  seasonStats?: TeamSeasonStats;
  strengths?: string[];
  weaknesses?: string[];
  /** "live" when recentForm/stats come from API-Football, "static" when from team-data.ts */
  dataSource?: "live" | "static";
  /**
   * Real WC 2026 player involvement (appearances, minutes, goals, rating) — who
   * ACTUALLY plays/scores in the tournament. The pool the AI must pick scorers /
   * key players from, instead of the raw registered squad (which lists uncapped
   * fringe names). Empty before the team has played.
   */
  recentContributors?: RecentContributor[];
  /** True when this slot is an undetermined knockout placeholder (e.g. "Vainqueur match 89"). */
  isPlaceholder?: boolean;
}

/** One player's real recent involvement for a national team (from API-Football /players). */
export interface RecentContributor {
  name: string;
  /** API-Football position label (Goalkeeper / Defender / Midfielder / Attacker). */
  position: string;
  /** Matches actually appeared in. */
  apps: number;
  /** Total minutes played. */
  minutes: number;
  goals: number;
  assists: number;
  /** Average match rating (null when unrated). */
  rating: number | null;
}

export interface Match {
  id: string;
  apiFixtureId?: number;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  stadium: string;
  city: string;
  country: string;
  group: string;
  round: string;
  /** Exact kickoff instant (ISO 8601) when known — the 7-day analysis rule keys off it. */
  kickoffIso?: string;
  /** Competition the fixture belongs to (clubs); absent for the 2026 World Cup. */
  competition?: { slug: string; name: string; shortName: string; flag: string; leagueId: number };
  h2h: H2HMatch[];
  odds: Odds[];
  status?: "NS" | "1H" | "HT" | "2H" | "FT" | "AET" | "PEN";
  score?: { home: number | null; away: number | null };
  /** API-Football's own prediction — an independent second opinion for the model. */
  apiPrediction?: ApiPredictionSummary;
  /** Market consensus across every operator (+ line movement). */
  market?: MarketConsensus;
}

/** Consensus of every operator quoting the fixture (see lib/market.ts). */
export interface MarketConsensus {
  /** Number of operators averaged. */
  operators: number;
  /** Margin-free implied probabilities, % with one decimal. */
  implied: { home: number; draw: number; away: number };
  /** Max − min across operators on the favourite, in points. */
  spread: number;
  agreement: "fort" | "moyen" | "faible";
  /** Consensus probability of more than 2.5 goals (%), when quoted. */
  over25?: number;
  /** Consensus probability that both teams score (%), when quoted. */
  btts?: number;
  /** Line movement since our first daily reading, when we have ≥ 2 days. */
  movement?: MarketMovement;
}

/** Change of the consensus since the first snapshot, in probability points. */
export interface MarketMovement {
  days: number;
  since: string; // YYYY-MM-DD of the first reading
  home: number;
  draw: number;
  away: number;
}

export interface ApiPredictionSummary {
  winner: "home" | "away" | "draw" | null;
  percent: { home: number; draw: number; away: number };
  /** Provider advice, e.g. "Double chance : draw or Marseille". */
  advice: string | null;
  /** e.g. "+2.5" / "-3.5" */
  underOver: string | null;
}
