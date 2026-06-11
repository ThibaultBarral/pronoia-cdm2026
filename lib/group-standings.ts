/**
 * Real group standings (SERVER ONLY) — actual points/record built from the
 * FINISHED World Cup matches (no projection). Powers the live classement table.
 */
import "server-only";

import { getGroups } from "./groups";
import { getPlayedWcResults } from "./data-service";
import { getTeamMeta } from "./team-ids";

export interface StandingRow {
  nameEn: string;
  fr: string;
  flag: string;
  slug: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface GroupStanding {
  letter: string;
  rows: StandingRow[];
  /** At least one match has been played in this group. */
  anyPlayed: boolean;
}

/** Live standings for all 12 groups, ordered by points → GD → GF. */
export async function getGroupStandings(): Promise<GroupStanding[]> {
  const [groups, played] = await Promise.all([
    getGroups(),
    getPlayedWcResults().catch(() => []),
  ]);

  return groups.map((g): GroupStanding => {
    const byId = new Map<number, StandingRow>();
    const rows: StandingRow[] = g.teams.map((t) => {
      const row: StandingRow = {
        nameEn: t.nameEn,
        fr: t.fr,
        flag: t.flag,
        slug: t.slug,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      };
      const id = getTeamMeta(t.nameEn).apiId;
      if (id) byId.set(id, row);
      return row;
    });

    let anyPlayed = false;
    for (const r of played) {
      const home = byId.get(r.homeApiId);
      const away = byId.get(r.awayApiId);
      if (!home || !away) continue; // not an intra-group match → skip
      anyPlayed = true;
      home.played++;
      away.played++;
      home.gf += r.goalsHome;
      home.ga += r.goalsAway;
      away.gf += r.goalsAway;
      away.ga += r.goalsHome;
      if (r.goalsHome > r.goalsAway) {
        home.win++;
        home.points += 3;
        away.loss++;
      } else if (r.goalsHome < r.goalsAway) {
        away.win++;
        away.points += 3;
        home.loss++;
      } else {
        home.draw++;
        away.draw++;
        home.points++;
        away.points++;
      }
    }

    for (const row of rows) row.gd = row.gf - row.ga;
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.fr.localeCompare(b.fr, "fr")
    );

    return { letter: g.letter, rows, anyPlayed };
  });
}
