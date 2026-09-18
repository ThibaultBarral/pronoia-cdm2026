import type { NextRequest } from "next/server";
import { COMPETITIONS } from "@/lib/competitions";
import { getCompetitionUpcoming } from "@/lib/club-data";
import { getCachedOrFetch } from "@/lib/api-cache";
import { fetchOddsAll } from "@/lib/api-football";
import { computeConsensus } from "@/lib/market";
import { recordSnapshot } from "@/lib/market-snapshots";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Daily market snapshot for every club fixture inside the 7-day analysis
 * window, so "line movement" exists for a match even if nobody opened it
 * during the week. One /odds call per fixture (shared 30-min cache with the
 * match page). Invoked by Vercel Cron, protected by CRON_SECRET.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const lists = await Promise.all(
    COMPETITIONS.map((c) => getCompetitionUpcoming(c.slug, 20).catch(() => [])),
  );
  const fixtures = lists.flat().filter((f) => f.analyzable);

  let recorded = 0;
  let skipped = 0;
  for (const f of fixtures) {
    try {
      const resp = await getCachedOrFetch(`odds-all:${f.id}`, 1800, () => fetchOddsAll(f.id));
      const c = computeConsensus(resp);
      if (!c) {
        skipped++;
        continue;
      }
      await recordSnapshot(f.id, c);
      recorded++;
    } catch {
      skipped++;
    }
  }

  return Response.json({ ok: true, fixtures: fixtures.length, recorded, skipped });
}
