import { ImageResponse } from "next/og";
import { getMatchData } from "@/lib/data-service";
import { getMyAnalysis } from "@/lib/supabase/analyses-db";
import { getTrackRecordStats } from "@/lib/track-record";
import { createClient } from "@/lib/supabase/server";
import type { MatchAnalysisData } from "@/lib/analysis-schema";
import { PronoCard, ResultCard, CARD_SIZE } from "./card";

/**
 * 9:16 shareable image of a match analysis. Two variants:
 *  - "prono"    : pre-match read (predicted score, 1X2 probabilities, value bet).
 *  - "resultat" : post-match proof (real score, IA call ✅/✗, real track record).
 *
 * The variant is auto-detected from the match status (finished → résultat) and
 * can be forced with `?v=prono` / `?v=resultat`. Available to any signed-in user
 * who has generated this match's analysis (it reads their own stored analysis).
 * The card layout lives in ./card (pure, no server imports).
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

  const [stored, match] = await Promise.all([
    getMyAnalysis("match", id),
    getMatchData(id),
  ]);
  if (!stored) {
    return new Response("Analyse introuvable — génère-la d'abord.", { status: 404 });
  }

  const data = stored.data as MatchAnalysisData;
  const [titleHome, titleAway] = stored.title.split(" vs ");
  const homeName = match?.homeTeam.name ?? titleHome ?? "Domicile";
  const awayName = match?.awayTeam.name ?? titleAway ?? "Extérieur";
  const homeFlag = match?.homeTeam.flag ?? stored.homeFlag ?? "🏳️";
  const awayFlag = match?.awayTeam.flag ?? stored.awayFlag ?? "🏳️";

  const finished = Boolean(match && FINISHED.has(match.status ?? ""));
  const forced = new URL(req.url).searchParams.get("v");
  const wantResult =
    forced === "resultat" || (forced !== "prono" && finished);

  const element =
    wantResult && match
      ? ResultCard({
          match,
          data,
          homeName,
          awayName,
          homeFlag,
          awayFlag,
          track: await getTrackRecordStats(),
        })
      : PronoCard({ data, homeName, awayName, homeFlag, awayFlag });

  return new ImageResponse(element, { ...CARD_SIZE, emoji: "twemoji" });
}
