import { ImageResponse } from "next/og";
import { getMatchData } from "@/lib/data-service";
import { getMyAnalysis } from "@/lib/supabase/analyses-db";
import { getTrackRecordStats } from "@/lib/track-record";
import { createClient } from "@/lib/supabase/server";
import type { MatchAnalysisData } from "@/lib/analysis-schema";
import { predictMatch } from "@/lib/match-model";
import { BasicCard, ResultCard, CARD_SIZE } from "./card";

/**
 * 9:16 shareable image of a match. Two variants:
 *  - "lecture"  : the basic pre-match card (favourite, its probability, likely
 *                 score) straight from the model — any signed-in user, any
 *                 match, no analysis needed. Built for TikTok / Reels.
 *  - "resultat" : post-match proof (real score, IA call ✅/✗, verified hit rate),
 *                 which needs the user's stored analysis.
 *
 * The variant is auto-detected from the match status (finished → résultat) and
 * can be forced with `?v=lecture` / `?v=resultat`. The card layouts live in
 * ./card (pure, no server imports).
 */

const FINISHED = new Set(["FT", "AET", "PEN"]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  // Gate to signed-in users (the analysis is read from their own history).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Connexion requise.", { status: 401 });

  const match = await getMatchData(id);
  if (!match) return new Response("Match introuvable.", { status: 404 });

  const finished = FINISHED.has(match.status ?? "");
  const forced = new URL(req.url).searchParams.get("v");
  const wantResult = forced === "resultat" || (forced !== "lecture" && finished);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(`${match.date}T12:00:00`),
  );

  let element: React.ReactElement;
  if (wantResult) {
    const stored = await getMyAnalysis("match", id);
    if (!stored) return new Response("Analyse introuvable — génère-la d'abord.", { status: 404 });
    const data = stored.data as MatchAnalysisData;
    element = ResultCard({
      match,
      data,
      homeName: match.homeTeam.name,
      awayName: match.awayTeam.name,
      homeFlag: match.homeTeam.flag || stored.homeFlag || "🏳️",
      awayFlag: match.awayTeam.flag || stored.awayFlag || "🏳️",
      track: await getTrackRecordStats(),
    });
  } else {
    element = BasicCard({ match, pred: predictMatch(match), dateLabel });
  }

  return new ImageResponse(element, { ...CARD_SIZE, emoji: "twemoji" });
}
