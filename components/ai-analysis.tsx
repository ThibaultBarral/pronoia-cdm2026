"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import { analyzeMatch } from "@/actions/analyze-match";
import { getMatchPreview, type MatchPreview } from "@/actions/match-preview";
import { trackEvent } from "@/lib/analytics";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";
import { useSubscription } from "@/lib/use-subscription";
import AnalysisLoader from "@/components/analysis-loader";
import LossAversionPaywall from "@/components/loss-aversion-paywall";
import LockedFullAnalysis from "@/components/locked-full-analysis";
import AnalysisResult, { ProbRow } from "@/components/analysis-result";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useLocalizedHref } from "@/lib/i18n/navigation";
import { type MatchAnalysisData } from "@/lib/analysis-schema";

/**
 * Free, model-only preview shown to non-members (zero Claude cost). Reveals the
 * real numbers — our honest edge — then the full AI narrative is blurred below.
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
      ? `${homeFlag} ${homeName}`
      : preview.favorite === "away"
        ? `${awayFlag} ${awayName}`
        : "Match nul";
  return (
    <div className="space-y-4">
      <div className="rounded-xl glass p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[var(--accent)]">
            <Target size={13} /> Le verdict du modèle
          </span>
          <span className="text-[10px] text-[var(--text-muted)] border border-white/10 px-2 py-0.5 rounded-full">
            Aperçu gratuit
          </span>
        </div>
        <p className="text-sm text-[#d0d0d0] leading-relaxed mb-3">
          {preview.favorite === "draw" ? (
            <>Match très serré&nbsp;: notre modèle penche pour le <span className="font-bold text-[var(--accent)]">nul</span>.</>
          ) : (
            <>Notre modèle voit <span className="font-bold text-[var(--accent)]">{favLabel}</span> favori de ce match.</>
          )}{" "}
          Confiance&nbsp;: <span className="font-bold text-[#cdd3db]">{preview.confidence}</span>.
        </p>
        <div className="space-y-2.5">
          <ProbRow label={`${homeFlag} Victoire ${homeName}`} pct={preview.probabilities.home} accent={preview.favorite === "home"} />
          <ProbRow label={`${homeFlag} ${awayFlag} Match nul`} pct={preview.probabilities.draw} accent={preview.favorite === "draw"} />
          <ProbRow label={`${awayFlag} Victoire ${awayName}`} pct={preview.probabilities.away} accent={preview.favorite === "away"} />
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="rounded-xl glass p-3 text-center">
            <div className="text-lg font-black text-[var(--text)] tabular-nums">{preview.expectedGoals.home}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {homeFlag} {homeName}</div>
          </div>
          <div className="rounded-xl glass p-3 text-center">
            <div className="text-lg font-black text-[var(--text)] tabular-nums">{preview.expectedGoals.away}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {awayFlag} {awayName}</div>
          </div>
          <div className="rounded-xl glass p-3 text-center">
            <div className="text-lg font-black text-[var(--text)] tabular-nums">{preview.over25}%</div>
            <div className="text-[10px] text-[var(--text-muted)]">+2.5 buts</div>
          </div>
        </div>
      </div>
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
  // signed-out visitor returns null too). Full analysis is paid-only.
  const hasPaidAccess = sub?.access === true;
  // Feature-tiered gating: Essential has access but not the Premium toolkit
  // (scorers/key players). Every other paid plan + VIP do.
  const hasToolkit = sub?.access === true && sub.plan !== "essential";
  const canPlayers = hasToolkit;
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [data, setData] = useState<MatchAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Non-members get the free, model-only preview (zero Claude cost), shown above
  // the blurred AI analysis. Skip the fetch entirely for paying members.
  useEffect(() => {
    if (hasPaidAccess) return;
    let active = true;
    getMatchPreview(match)
      .then((p) => active && setPreview(p))
      .catch(() => {});
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
            <span className="font-semibold text-[#f0f0f0] text-sm truncate">Analyse Copafever IA</span>
            {data && (
              <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5 rounded-full">
                Analyse complète
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#666] mt-0.5">
            Probabilités · Buts attendus · Scénarios
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Non-member: free model-only preview + the full analysis locked below. */}
        {!hasPaidAccess && !data && (
          <div className="space-y-5">
            {preview ? (
              <ModelPreview preview={preview} homeName={h.name} awayName={a.name} homeFlag={h.flag} awayFlag={a.flag} />
            ) : (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin-custom" />
              </div>
            )}
            <LockedFullAnalysis match={match} />
          </div>
        )}

        {/* Member whose access lapsed mid-session → paywall. */}
        {hasPaidAccess && locked && <LossAversionPaywall match={match} />}

        {/* Member empty state — ready to generate the full analysis. */}
        {hasPaidAccess && !data && !isPending && !error && !locked && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center animate-pulse-neon">
              <Sparkles size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[#f0f0f0] font-semibold mb-1">Prêt à analyser</p>
              <p className="text-xs text-[#666] max-w-xs leading-relaxed">
                Probabilités · Confiance IA · Buts attendus · Scénarios & joueurs clés
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[#0a0a0a] font-bold px-6 py-2.5 glow-neon transition-all hover:scale-105"
            >
              <Sparkles size={15} className="mr-2" /> Générer l&apos;analyse IA
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
          </div>
        )}
      </div>
    </section>
  );
}
