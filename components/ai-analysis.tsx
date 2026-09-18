"use client";

import { useCallback, useState, useEffect, useRef, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import { analyzeMatch } from "@/actions/analyze-match";
import { getMatchPreview, type MatchPreview, type MatchPreviewResult } from "@/actions/match-preview";
import { trackEvent } from "@/lib/analytics";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";
import { useSubscription } from "@/lib/use-subscription";
import AnalysisLoader from "@/components/analysis-loader";
import AnalysisLocked from "@/components/analysis-locked";
import AnalysisScan from "@/components/analysis-scan";
import AnalysisTeaser, { type TeaserMode } from "@/components/analysis-teaser";
import AnalysisResult from "@/components/analysis-result";
import ShareAnalysisButton from "@/components/share-analysis-button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useLocalizedHref } from "@/lib/i18n/navigation";
import { type MatchAnalysisData } from "@/lib/analysis-schema";

/**
 * Free, model-only short read shown to non-members (zero Claude cost): the
 * favourite, its probability and the likely score. Deliberately minimal —
 * everything else is the paid analysis right below.
 */
function ModelPreview({
  preview,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
}: {
  preview: MatchPreview;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
}) {
  const favLabel =
    preview.favorite === "home"
      ? `${homeFlag} ${homeName}`.trim()
      : preview.favorite === "away"
        ? `${awayFlag} ${awayName}`.trim()
        : null;
  return (
    <div className="rounded-xl glass p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[var(--accent-soft)]">
          <Target size={13} /> La lecture courte
        </span>
        <span className="text-[10px] text-[var(--text-muted)] border border-white/10 px-2 py-0.5 rounded-full">
          Gratuit
        </span>
      </div>
      <p className="text-base text-[#c3cbe3] leading-relaxed">
        {favLabel ? (
          <>
            <span className="font-black text-[var(--text)]">{favLabel}</span> favori à{" "}
            <span className="font-black text-[var(--accent-soft)] tabular-nums">{preview.probability}&nbsp;%</span>.
          </>
        ) : (
          <>
            Match très serré&nbsp;: <span className="font-black text-[var(--text)]">nul</span> à{" "}
            <span className="font-black text-[var(--accent-soft)] tabular-nums">{preview.probability}&nbsp;%</span>.
          </>
        )}
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-1.5">
        Score probable&nbsp;:{" "}
        <span className="font-black text-[var(--text)] tabular-nums">
          {preview.likelyScore.home} - {preview.likelyScore.away}
        </span>
      </p>
    </div>
  );
}

export default function AIAnalysis({
  match,
  autoStart = false,
}: {
  match: Match;
  /** Fire the analysis automatically on mount (e.g. right after onboarding). */
  autoStart?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const localizedHref = useLocalizedHref();
  const sub = useSubscription();
  // Treat anyone without a confirmed active entitlement as a non-member (a
  // signed-out visitor returns null too). There is no free tier — the full
  // analysis requires an active plan; the short read above is free.
  const hasPaidAccess = sub?.access === true;
  // Legacy capped Mini members don't get the scorers/key-players section.
  const canPlayers = sub?.access === true && sub.plan !== "mini";
  const [previewResult, setPreviewResult] = useState<MatchPreviewResult | null>(null);
  const preview = previewResult?.ok ? previewResult.preview : null;
  const teaserMode: TeaserMode = previewResult && !previewResult.ok ? (previewResult.gate === "auth" ? "auth" : "free") : "paywall";
  const [data, setData] = useState<MatchAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  // The "analysis in progress" scan plays once per match per tab for
  // non-members; after that the page opens straight on the short read.
  const scanKey = `cf-scan-${match.id}`;
  // sessionStorage as an external store: the server snapshot is "not seen"
  // (hydration-safe), the client reads the real flag. Private mode → replay.
  const scannedStored = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      try {
        return Boolean(sessionStorage.getItem(scanKey));
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [scannedNow, setScannedNow] = useState(false);
  const scanned = scannedStored || scannedNow;
  const finishScan = useCallback(() => {
    setScannedNow(true);
    try {
      sessionStorage.setItem(scanKey, "1");
    } catch {
      /* ignore */
    }
  }, [scanKey]);

  // Non-members get the free, model-only preview (zero Claude cost), shown above
  // the blurred AI analysis. Skip the fetch entirely for paying members.
  useEffect(() => {
    if (hasPaidAccess) return;
    let active = true;
    getMatchPreview(match)
      .then((r) => active && setPreviewResult(r))
      .catch(() => active && setPreviewResult({ ok: false, gate: "auth" }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPaidAccess, match.id]);

  // Auto-launch once when arriving from onboarding (?welcome=1) → instant value.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const h = match.homeTeam;
  const a = match.awayTeam;

  function handleGenerate() {
    setData(null);
    setError(null);
    setLocked(false);
    trackEvent("analysis_start", { match_id: match.id });
    startTransition(async () => {
      try {
        const result = await analyzeMatch(match, locale);
        if (!result.ok) {
          if (result.error === AUTH_REQUIRED) {
            router.push(localizedHref(`/login?next=/match/${match.id}`));
            return;
          }
          if (result.error === PAYWALL_REQUIRED) {
            // paywall_view is fired (enriched with missed_amount) by the paywall.
            setLocked(true);
            return;
          }
          setError(result.error ?? "Erreur inconnue");
          return;
        }
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
      }
    });
  }

  return (
    <section className="rounded-2xl glass overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[var(--accent)]/6 to-transparent">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
          <Bot size={19} className="text-[var(--accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text)] text-sm truncate">Analyse du match</span>
            {data && (
              <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-black uppercase tracking-wide text-[#ffd700] border border-[#ffd700]/30 bg-[#ffd700]/[0.08] px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> Prédiction Gold
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Non-member: the scan plays first, then the free short read, then
            the full analysis blurred with one CTA on top. */}
        {!hasPaidAccess && !data && (
          <div className="space-y-5">
            {!scanned ? (
              <AnalysisScan match={match} onDone={finishScan} />
            ) : previewResult ? (
              <>
                {preview && (
                  <ModelPreview preview={preview} homeName={h.name} awayName={a.name} homeFlag={h.flag} awayFlag={a.flag} />
                )}
                <AnalysisTeaser matchId={match.id} preview={preview} mode={teaserMode} home={h} away={a} />
              </>
            ) : (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin-custom" />
              </div>
            )}
          </div>
        )}

        {/* Member whose access/quota lapsed mid-session → same lock card. */}
        {hasPaidAccess && locked && <AnalysisLocked matchId={match.id} />}

        {/* Member empty state — ready to generate the full analysis. */}
        {hasPaidAccess && !data && !isPending && !error && !locked && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center animate-pulse-neon">
              <Sparkles size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[var(--text)] font-semibold mb-1">Prêt à analyser</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                Scénario du match · Forces & faiblesses · Joueurs à suivre · Tes questions à l&apos;IA
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-bold px-6 py-2.5 glow-neon transition-all hover:scale-105"
            >
              <Sparkles size={15} className="mr-2" /> Lancer l&apos;analyse complète
            </Button>
          </div>
        )}

        {/* Loading */}
        {isPending && <AnalysisLoader />}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 mb-4">
            <AlertCircle size={15} className="text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-xs text-[#888]">{error}</p>
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="space-y-6">
            <AnalysisResult data={data} home={h} away={a} canPlayers={canPlayers} />
            <div className="pt-5 border-t border-[#1a1a1a] flex justify-center">
              <ShareAnalysisButton
                matchId={match.id}
                title={`${h.name} vs ${a.name}`}
                variant="lecture"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
