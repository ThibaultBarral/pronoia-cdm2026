import type { NextRequest } from "next/server";
import { getMatches, getMatchData } from "@/lib/data-service";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Pre-warms the Supabase cache for imminent matches so users always hit warm
 * data (odds + live score stay fresh) without triggering API calls themselves.
 * Invoked by Vercel Cron. Protected by CRON_SECRET (Vercel sends it as a Bearer).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const matches = await getMatches();
  const now = Date.now();

  // Warm only matches kicking off soon (or just-started) — keeps odds/live fresh
  // while bounding the number of API calls per run.
  const soon = matches
    .filter((m) => {
      const t = new Date(`${m.date}T${m.time || "00:00"}`).getTime();
      return t > now - 3 * 3600_000 && t < now + 48 * 3600_000;
    })
    .slice(0, 16);

  let warmed = 0;
  for (const m of soon) {
    try {
      await getMatchData(m.id);
      warmed++;
    } catch {
      /* keep warming the rest */
    }
  }

  return Response.json({ ok: true, total: matches.length, warmed });
}
