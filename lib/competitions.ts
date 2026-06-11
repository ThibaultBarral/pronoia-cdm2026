/**
 * Competitions config — single source of truth for the /dashboard/competitions hub.
 *
 * The product covers the World Cup 2026 now (separate hero, page CDM) and the
 * 2026/27 European season after it. Each entry maps to a real API-Football
 * league id so club lists / standings come from live data (no hardcoded clubs).
 *
 * `status: 'live'` activates a competition (its matches become analysable). Until
 * then `'upcoming'` shows it as a vitrine with real 2025/26 data + availability date.
 * Activating a competition in August = flip its `status` here, nothing in the JSX.
 */

export type CompetitionStatus = "live" | "upcoming";
export type CompetitionKind = "domestic" | "european";

export interface Competition {
  slug: string;
  name: string;
  shortName: string;
  country: string;
  /** Emoji flag/escutcheon — no licensed league/club logos by default. */
  flag: string;
  /** API-Football league id (drives real standings/clubs). */
  leagueId: number;
  /** Season we currently have real, final data for (2025 = 2025/26). */
  dataSeason: number;
  /** Human label of the season the product will cover. */
  seasonLabel: string;
  /** Human label of the season the displayed table belongs to. */
  dataSeasonLabel: string;
  /** Real number of matches over the covered season. */
  matchCount: number;
  status: CompetitionStatus;
  /** When analyses go live, e.g. "mi-août 2026". */
  availableFrom: string;
  kind: CompetitionKind;
}

/** The covered season + data season, kept in one place. */
export const COVERED_SEASON_LABEL = "2026/27";
export const DATA_SEASON = 2025;
export const DATA_SEASON_LABEL = "2025/26";

export const COMPETITIONS: Competition[] = [
  {
    slug: "ligue-1",
    name: "Ligue 1",
    shortName: "L1",
    country: "France",
    flag: "🇫🇷",
    leagueId: 61,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 306,
    status: "upcoming",
    availableFrom: "mi-août 2026",
    kind: "domestic",
  },
  {
    slug: "premier-league",
    name: "Premier League",
    shortName: "PL",
    country: "Angleterre",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    leagueId: 39,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 380,
    status: "upcoming",
    availableFrom: "mi-août 2026",
    kind: "domestic",
  },
  {
    slug: "la-liga",
    name: "La Liga",
    shortName: "Liga",
    country: "Espagne",
    flag: "🇪🇸",
    leagueId: 140,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 380,
    status: "upcoming",
    availableFrom: "mi-août 2026",
    kind: "domestic",
  },
  {
    slug: "serie-a",
    name: "Serie A",
    shortName: "Serie A",
    country: "Italie",
    flag: "🇮🇹",
    leagueId: 135,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 380,
    status: "upcoming",
    availableFrom: "mi-août 2026",
    kind: "domestic",
  },
  {
    slug: "bundesliga",
    name: "Bundesliga",
    shortName: "Bundes",
    country: "Allemagne",
    flag: "🇩🇪",
    leagueId: 78,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 306,
    status: "upcoming",
    availableFrom: "mi-août 2026",
    kind: "domestic",
  },
  {
    slug: "champions-league",
    name: "UEFA Champions League",
    shortName: "LDC",
    country: "Europe",
    flag: "🇪🇺",
    leagueId: 2,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 189,
    status: "upcoming",
    availableFrom: "mi-septembre 2026",
    kind: "european",
  },
  {
    slug: "europa-league",
    name: "UEFA Europa League",
    shortName: "LDE",
    country: "Europe",
    flag: "🇪🇺",
    leagueId: 3,
    dataSeason: DATA_SEASON,
    seasonLabel: COVERED_SEASON_LABEL,
    dataSeasonLabel: DATA_SEASON_LABEL,
    matchCount: 189,
    status: "upcoming",
    availableFrom: "mi-septembre 2026",
    kind: "european",
  },
];

/** Total analysable matches across the 2026/27 season — drives the key figure. */
export const TOTAL_SEASON_MATCHES = COMPETITIONS.reduce(
  (sum, c) => sum + c.matchCount,
  0,
);

/** World Cup match count (for the "vs 104 pour la CDM" comparison). */
export const WC_MATCH_COUNT = 104;

export function getCompetition(slug: string): Competition | undefined {
  return COMPETITIONS.find((c) => c.slug === slug);
}
