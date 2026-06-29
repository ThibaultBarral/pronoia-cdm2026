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
  fifaRanking: number;
  coach: string;
  recentForm: FormResult[];
  momentum?: TeamMomentum;
  stats: TeamStats;
  lineup: Lineup;
  keyPlayers: string[];
  injuries: string[];
  suspensions: string[];
  strengths?: string[];
  weaknesses?: string[];
  /** "live" when recentForm/stats come from API-Football, "static" when from team-data.ts */
  dataSource?: "live" | "static";
  /** True when this slot is an undetermined knockout placeholder (e.g. "Vainqueur match 89"). */
  isPlaceholder?: boolean;
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
  country: "USA" | "Canada" | "Mexique";
  group: string;
  round: string;
  h2h: H2HMatch[];
  odds: Odds[];
  status?: "NS" | "1H" | "HT" | "2H" | "FT" | "AET" | "PEN";
  score?: { home: number | null; away: number | null };
}
