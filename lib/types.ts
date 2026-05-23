export type MatchResult = "W" | "D" | "L";

export interface FormResult {
  opponent: string;
  result: MatchResult;
  score: string;
  competition: string;
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
  shortName: string;
  flag: string;
  logo?: string;
  group: string;
  fifaRanking: number;
  coach: string;
  recentForm: FormResult[];
  stats: TeamStats;
  lineup: Lineup;
  keyPlayers: string[];
  injuries: string[];
  suspensions: string[];
  strengths?: string[];
  weaknesses?: string[];
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
