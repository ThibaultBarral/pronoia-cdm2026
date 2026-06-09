import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AnalysisKind,
  MatchAnalysisData,
  TeamAnalysisData,
  StoredAnalysis,
} from "@/lib/analysis-schema";

/** Persist (upsert) an analysis into a user's history. Service-role write. */
export async function saveAnalysis(
  userId: string,
  entry: {
    kind: AnalysisKind;
    target: string;
    title: string;
    homeFlag?: string;
    awayFlag?: string;
    data: MatchAnalysisData | TeamAnalysisData;
  }
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("analyses").upsert(
    {
      user_id: userId,
      kind: entry.kind,
      target: entry.target,
      title: entry.title,
      home_flag: entry.homeFlag ?? null,
      away_flag: entry.awayFlag ?? null,
      payload: entry.data,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind,target" }
  );
  if (error) console.error("[analyses-db] save error:", error.message);
}

/** A history list item (no payload — lighter for the list view). */
export interface HistoryItem {
  kind: AnalysisKind;
  target: string;
  title: string;
  homeFlag: string | null;
  awayFlag: string | null;
  createdAt: string;
}

/** The signed-in user's analysis history, most recent first. */
export async function listMyAnalyses(): Promise<HistoryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select("kind, target, title, home_flag, away_flag, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[analyses-db] list error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    kind: r.kind as AnalysisKind,
    target: r.target as string,
    title: r.title as string,
    homeFlag: (r.home_flag as string | null) ?? null,
    awayFlag: (r.away_flag as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

/** Read one stored analysis payload for the signed-in user (re-open from history). */
export async function getMyAnalysis(
  kind: AnalysisKind,
  target: string
): Promise<StoredAnalysis | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("analyses")
    .select("kind, target, title, home_flag, away_flag, payload, created_at")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("target", target)
    .maybeSingle();

  if (!data) return null;
  return {
    kind: data.kind as AnalysisKind,
    target: data.target as string,
    title: data.title as string,
    homeFlag: (data.home_flag as string | null) ?? undefined,
    awayFlag: (data.away_flag as string | null) ?? undefined,
    data: data.payload as MatchAnalysisData | TeamAnalysisData,
    generatedAt: data.created_at as string,
  };
}
