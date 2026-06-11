/**
 * Competition data service (SERVER ONLY).
 *
 * Real club lists + final standings for each competition, sourced from
 * API-Football's `/standings` (season 2025 = the just-finished 2025/26 season)
 * and shared through the Supabase cache (lib/api-cache). No hardcoded clubs,
 * no invented 2026/27 composition: we show the REAL 2025/26 final table and
 * label it as such; the 2026/27 line-up (promotions/relegations, European
 * qualifiers) is confirmed over the summer.
 */
import "server-only";

import { fetchStandings, type ApiStandingRow } from "./api-football";
import { getCachedOrFetch } from "./api-cache";
import { getCompetition, type Competition } from "./competitions";

const hasApiKey = () => Boolean(process.env.API_FOOTBALL_KEY);

export interface CompetitionClub {
  apiId: number;
  name: string;
  slug: string;
  /** Stylised monogram (no licensed logos by default). */
  monogram: string;
  rank: number;
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsDiff: number;
  form: string | null;
  /** Group label for multi-group competitions (single group → competition name). */
  groupLabel: string;
}

/** Stable, SEO-friendly slug for a club name. */
export function clubSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function monogram(name: string): string {
  const words = name
    .replace(/\b(FC|CF|AC|AS|SC|SS|RC|CD|UD|SD|FK|BK|AFC|CFC)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

function mapRow(row: ApiStandingRow): CompetitionClub {
  return {
    apiId: row.team.id,
    name: row.team.name,
    slug: clubSlug(row.team.name),
    monogram: monogram(row.team.name),
    rank: row.rank,
    points: row.points,
    played: row.all.played,
    win: row.all.win,
    draw: row.all.draw,
    lose: row.all.lose,
    goalsDiff: row.goalsDiff,
    form: row.form,
    groupLabel: row.group,
  };
}

/**
 * Real clubs of a competition (final 2025/26 table). For multi-group
 * competitions (UCL/UEL league phase) all groups are flattened and sorted by
 * rank. Returns [] on any failure → the page shows an honest empty state.
 */
export async function getCompetitionClubs(
  slug: string,
): Promise<CompetitionClub[]> {
  const comp = getCompetition(slug);
  if (!comp || !hasApiKey()) return [];

  try {
    const groups = await getCachedOrFetch(
      `standings:${comp.leagueId}:${comp.dataSeason}`,
      86400,
      () => fetchStandings(comp.leagueId, comp.dataSeason),
    );
    const clubs = groups.flat().map(mapRow);
    // Sort by rank, then dedupe by club id (league-phase tables can repeat).
    const seen = new Set<number>();
    return clubs
      .sort((a, b) => a.rank - b.rank)
      .filter((c) => (seen.has(c.apiId) ? false : seen.add(c.apiId)));
  } catch (err) {
    console.warn("[competition-data] standings failed", slug, err);
    return [];
  }
}

export interface ClubDetail {
  competition: Competition;
  club: CompetitionClub;
}

/** Resolve a single club within a competition (for the club fiche page). */
export async function getClubDetail(
  compSlug: string,
  clubSlugParam: string,
): Promise<ClubDetail | null> {
  const comp = getCompetition(compSlug);
  if (!comp) return null;
  const clubs = await getCompetitionClubs(compSlug);
  const club = clubs.find((c) => c.slug === clubSlugParam);
  if (!club) return null;
  return { competition: comp, club };
}
