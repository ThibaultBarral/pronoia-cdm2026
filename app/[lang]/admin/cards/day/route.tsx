import { ImageResponse } from "next/og";
import { isAdmin } from "@/lib/admin";
import { getDaySchedule, getClubMatch, parisToday, type ClubFixture } from "@/lib/club-data";
import { predictMatch } from "@/lib/match-model";
import {
  NotebookCard,
  CARD_SIZE,
  buildNotebookSlides,
  pickFromPrediction,
  type NotebookRow,
} from "@/app/[lang]/match/[id]/share/card";

/**
 * The "cahier" slideshow: the day's picks handwritten on notebook pages, one
 * 1080 × 1920 image per slide for a TikTok / Reels carousel. Admin only.
 *
 *   /admin/cards/day?date=2026-09-20&page=1
 *
 * Slide 1 is the cover, then one page per competition (split past 9
 * matches), then the outro. The slide count comes back in the `x-pages`
 * header so the studio fetches the whole carousel. Each match goes through
 * the same model as the basic card (getClubMatch → predictMatch), a few at a
 * time to spare the API.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FINISHED = new Set(["FT", "AET", "PEN"]);
const CONCURRENCY = 4;

async function mapLimit<T, R>(rows: T[], limit: number, fn: (row: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(rows.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, rows.length) }, async () => {
      while (next < rows.length) {
        const i = next++;
        out[i] = await fn(rows[i]);
      }
    }),
  );
  return out;
}

export async function GET(req: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date") ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : parisToday();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);

  const schedule = await getDaySchedule(date);
  const groups = schedule.groups
    .map((g) => ({ ...g, fixtures: g.fixtures.filter((f) => !FINISHED.has(f.status ?? "")) }))
    .filter((g) => g.fixtures.length > 0);
  const fixtures = groups.flatMap((g) => g.fixtures);

  const matches = await mapLimit(fixtures, CONCURRENCY, (f: ClubFixture) => getClubMatch(f.id).catch(() => null));
  const byId = new Map(fixtures.map((f, i) => [f.id, matches[i]] as const));

  const slides = buildNotebookSlides(
    groups.map((g) => ({
      flag: g.competition.flag,
      name: g.competition.name,
      rows: g.fixtures.flatMap((f): NotebookRow[] => {
        const m = byId.get(f.id);
        if (!m) return [];
        return [
          {
            home: { name: m.homeTeam.name, logo: m.homeTeam.logo },
            away: { name: m.awayTeam.name, logo: m.awayTeam.logo },
            time: f.time,
            pick: pickFromPrediction(predictMatch(m)),
          },
        ];
      }),
    })),
  );
  const total = slides.length;
  const current = Math.min(page, total);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${date}T12:00:00`),
  );

  const [regular, bold] = await Promise.all([
    fetch(new URL("/fonts/Caveat-Regular.woff", req.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("/fonts/Caveat-Bold.woff", req.url)).then((r) => r.arrayBuffer()),
  ]);
  const fonts = [
    { name: "Caveat", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Caveat", data: bold, weight: 700 as const, style: "normal" as const },
  ];

  return new ImageResponse(NotebookCard({ slide: slides[current - 1], dateLabel, index: current, total }), {
    ...CARD_SIZE,
    emoji: "twemoji",
    fonts,
    headers: { "x-pages": String(total), "cache-control": "private, no-store" },
  });
}
