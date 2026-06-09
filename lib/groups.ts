/**
 * Group-stage structure (SERVER ONLY).
 *
 * Source of truth = the real fixtures (OpenFootball, via data-service). We derive
 * the 12 groups A→L and their 4 teams from the actual schedule rather than
 * hardcoding a draw, so the groups always match what users see on the match list.
 *
 * Cached through Supabase (api_cache) so the 48-team structure is computed once
 * per day, never per request.
 */
import "server-only";

import { getMatches } from "./data-service";
import { getCachedOrFetch } from "./api-cache";
import { getTeamMeta } from "./team-ids";

/** A single national team inside a group (lightweight, display-safe). */
export interface GroupTeam {
  /** Canonical English key (matches TEAM_META / team-data / API lookups). */
  nameEn: string;
  /** French display name. */
  fr: string;
  flag: string;
  /** FIFA ranking (static, from team-ids). */
  fifaRanking: number;
  /** Stable slug for /team/<slug> links. */
  slug: string;
  group: string;
}

export interface Group {
  /** "A" … "L" */
  letter: string;
  teams: GroupTeam[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[àáâã]/g, "a")
    .replace(/[é]/g, "e")
    .replace(/[&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The 12 groups with their teams, ordered A→L and (within a group) by FIFA rank.
 * Derived from the real group-stage fixtures.
 */
export async function getGroups(): Promise<Group[]> {
  return getCachedOrFetch("groups:wc2026", 86400, async () => {
    const matches = await getMatches();

    // group letter → set of English team names (dedup via Map keyed by name)
    const byGroup = new Map<string, Map<string, GroupTeam>>();

    for (const m of matches) {
      const letter = m.group;
      if (!letter || letter === "—") continue;
      if (!byGroup.has(letter)) byGroup.set(letter, new Map());
      const bucket = byGroup.get(letter)!;

      for (const t of [m.homeTeam, m.awayTeam]) {
        const nameEn = t.nameEn ?? t.name;
        if (bucket.has(nameEn)) continue;
        const meta = getTeamMeta(nameEn);
        bucket.set(nameEn, {
          nameEn,
          fr: meta.fr,
          flag: meta.flag,
          fifaRanking: meta.fifaRanking || 999,
          slug: slugify(nameEn),
          group: letter,
        });
      }
    }

    return [...byGroup.entries()]
      .map(([letter, teams]) => ({
        letter,
        teams: [...teams.values()].sort(
          (a, b) => a.fifaRanking - b.fifaRanking
        ),
      }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  });
}

/** Flat list of every team in the tournament (with its group). */
export async function getAllTeams(): Promise<GroupTeam[]> {
  const groups = await getGroups();
  return groups.flatMap((g) => g.teams);
}
