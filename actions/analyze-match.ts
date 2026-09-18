"use server";

import type { Match } from "@/lib/types";
import { getAnalysisAccess, commitAnalysisUsage } from "@/lib/ai-guard";
import { getCachedOrFetch } from "@/lib/api-cache";
import { getWcFinishedCount } from "@/lib/data-service";
import { isMatchAnalyzable } from "@/lib/club-data";
import { logMatchPrediction } from "@/lib/predictions";
import { saveAnalysis } from "@/lib/supabase/analyses-db";
import { generateMatchAnalysis } from "@/lib/match-analysis";
import type { MatchAnalysisData } from "@/lib/analysis-schema";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type Result = { ok: true; data: MatchAnalysisData } | { ok: false; error: string };

export async function analyzeMatch(match: Match, locale: Locale = defaultLocale): Promise<Result> {
  const en = locale === "en";
  // No pre-match analysis for a finished match (checked before any credit spend).
  if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
    return {
      ok: false,
      error: en
        ? "This match is over — the pre-match analysis is no longer available."
        : "Ce match est terminé — l'analyse pré-match n'est plus disponible.",
    };
  }

  // The 7-day rule: too far ahead, form and squads aren't settled → no analysis.
  if (!isMatchAnalyzable(match)) {
    return {
      ok: false,
      error: en
        ? "The analysis opens 7 days before kickoff."
        : "L'analyse s'ouvre 7 jours avant le coup d'envoi.",
    };
  }

  // Check access WITHOUT consuming the monthly credit (committed only on success).
  const access = await getAnalysisAccess();
  if ("error" in access) return { ok: false, error: access.error };

  // Re-key by finished WC matches (fresh form after each match) AND by locale, so
  // each language gets its own cached analysis, shared across all users.
  const day = new Date().toISOString().slice(0, 10);
  const finished = match.competition ? 0 : await getWcFinishedCount().catch(() => 0);
  const key = `analysis:match:${match.id}:${day}:wc${finished}:v6:${locale}`;

  try {
    const data = await getCachedOrFetch(key, 86400, () => generateMatchAnalysis(match, access.userId, locale));
    // Success → only now do we consume the credit (Mini monthly quota) + record usage.
    await commitAnalysisUsage(access);
    await saveAnalysis(access.userId, {
      kind: "match",
      target: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      homeFlag: match.homeTeam.flag,
      awayFlag: match.awayTeam.flag,
      data,
    });
    // Track record: log the IA's structured pick for this match (idempotent).
    await logMatchPrediction(match);
    return { ok: true, data };
  } catch (err) {
    // The Claude/data call failed → the credit is NOT consumed, the user can retry.
    console.error("[analyze-match] error:", err);
    return {
      ok: false,
      error: en
        ? "The analysis is temporarily unavailable. Try again in a moment."
        : "L'analyse est momentanément indisponible. Réessaie dans un instant.",
    };
  }
}
