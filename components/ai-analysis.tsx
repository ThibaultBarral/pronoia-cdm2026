"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot, Sparkles, RefreshCw, AlertCircle, Gauge,
  Coins, Target, TrendingUp, Wallet, Sliders, Goal, Users, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import { analyzeMatch } from "@/actions/analyze-match";
import { getMatchPreview, type MatchPreview } from "@/actions/match-preview";
import { trackEvent } from "@/lib/analytics";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";
import { useSubscription } from "@/lib/use-subscription";
import { computeStats, loadBankroll, PLAYSTYLES, type Playstyle } from "@/lib/bankroll";
import { loadUserBankroll } from "@/lib/supabase/bankroll-db";
import { createClient } from "@/lib/supabase/client";
import { recommendStake, parseOdds } from "@/lib/staking";
import AskAiModal from "@/components/ask-ai-modal";
import ShareAnalysisButton from "@/components/share-analysis-button";
import AnalysisLoader from "@/components/analysis-loader";
import LossAversionPaywall from "@/components/loss-aversion-paywall";
import LockedFullAnalysis from "@/components/locked-full-analysis";
import { valueBadge, fmtCote } from "@/lib/value";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useLocalizedHref } from "@/lib/i18n/navigation";
import {
  DISCLAIMER, type Confidence, type MatchAnalysisData,
} from "@/lib/analysis-schema";

const PLAYSTYLE_LABEL = Object.fromEntries(
  PLAYSTYLES.map((p) => [p.id, p.label])
) as Record<Playstyle, string>;

const CONFIDENCE_FILL: Record<Confidence, number> = {
  "Faible": 35,
  "Moyen": 55,
  "Élevé": 78,
  "Très élevé": 92,
};

function ProbRow({ label, pct, accent }: { label: string; pct: number; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#c0c0c0]">{label}</span>
        <span className={`font-black tabular-nums ${accent ? "text-[var(--accent)]" : "text-[#c0c0c0]"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: accent ? "var(--accent)" : "#6b7280" }}
        />
      </div>
    </div>
  );
}

function CompareRow({ label, home, away }: { label: string; home: number; away: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-[var(--accent)] font-bold tabular-nums">{home}%</span>
        <span className="text-[var(--text-muted)] uppercase tracking-wide font-bold">{label}</span>
        <span className="text-[#ef4444] font-bold tabular-nums">{away}%</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06]">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${home}%` }} />
        <div className="h-full bg-[#ef4444]" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

/**
 * Free, model-only preview shown to non-members (zero Claude cost). Reveals the
 * real numbers — our honest edge — then the full AI narrative is blurred below.
 */
function ModelPreview({
  preview,
  homeName,
  awayName,
}: {
  preview: MatchPreview;
  homeName: string;
  awayName: string;
}) {
  const favLabel =
    preview.favorite === "home"
      ? homeName
      : preview.favorite === "away"
        ? awayName
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
          <ProbRow label={`Victoire ${homeName}`} pct={preview.probabilities.home} accent={preview.favorite === "home"} />
          <ProbRow label="Match nul" pct={preview.probabilities.draw} accent={preview.favorite === "draw"} />
          <ProbRow label={`Victoire ${awayName}`} pct={preview.probabilities.away} accent={preview.favorite === "away"} />
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="rounded-xl glass p-3 text-center">
            <div className="text-lg font-black text-[var(--text)] tabular-nums">{preview.expectedGoals.home}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {homeName}</div>
          </div>
          <div className="rounded-xl glass p-3 text-center">
            <div className="text-lg font-black text-[var(--text)] tabular-nums">{preview.expectedGoals.away}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {awayName}</div>
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
  // Live bankroll + bettor profile → personalised € stake on the recommendation.
  const [bankroll, setBankroll] = useState<{ amount: number; playstyle?: Playstyle } | null>(null);
  const [bankrollReady, setBankrollReady] = useState(false);
  // Which profile's recommendation is being previewed (null → follow the user's
  // saved profile). Lets users compare play styles without changing their default.
  const [activeProfile, setActiveProfile] = useState<Playstyle | null>(null);

  // Auto-launch once when arriving from onboarding (?welcome=1) → instant value.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: { user } }, br] = await Promise.all([
          supabase.auth.getUser(),
          loadUserBankroll(),
        ]);
        if (!active) return;
        const profile =
          (user?.user_metadata?.bettor_profile as Playstyle | undefined) ??
          br?.playstyle;
        const source = br ?? loadBankroll();
        if (source) {
          setBankroll({ amount: computeStats(source).currentAmount, playstyle: profile });
        } else if (profile) {
          setBankroll({ amount: 0, playstyle: profile });
        }
      } catch {
        /* no bankroll → the block shows a setup CTA */
      } finally {
        if (active) setBankrollReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const h = match.homeTeam;
  const a = match.awayTeam;

  // The profile being previewed defaults to the user's saved profile, then to
  // the canonical value pick. Per-profile recs are absent on older analyses.
  const profileRecs = data?.recommendationsByProfile;
  const effectiveProfile: Playstyle = activeProfile ?? bankroll?.playstyle ?? "opportunist";
  const rec = profileRecs?.[effectiveProfile] ?? data?.recommendation;
  // "Banker" = the Prudent pick: the most likely outcome, proposed even without
  // value → shown as a probability-based pick, never as "no value / don't bet".
  const isBanker = rec?.basis === "probability";
  const stakeAdvice =
    rec && bankroll && bankroll.amount > 0
      ? recommendStake(bankroll.amount, effectiveProfile, rec.confidence, parseOdds(rec.odds))
      : null;

  function handleGenerate() {
    setData(null);
    setError(null);
    setLocked(false);
    setActiveProfile(null);
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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Bot size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="font-semibold text-[#f0f0f0] text-sm">Analyse Copafever IA</div>
          <div className="text-[10px] text-[#555]">Probabilités, comparaison & recommandation pari</div>
        </div>
        {data && (
          <span className="ml-auto text-[10px] text-[var(--accent)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5 rounded-full">
            Analyse complète
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Non-member: free model-only preview + the full analysis locked below. */}
        {!hasPaidAccess && !data && (
          <div className="space-y-5">
            {preview ? (
              <ModelPreview preview={preview} homeName={h.name} awayName={a.name} />
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
                Probabilités · Comparaison · Buts attendus · Value bet & recommandation
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
            {/* Summary */}
            <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.summary}</p>

            {/* Confidence gauge */}
            <div className="rounded-xl glass p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                  <Gauge size={13} /> Confiance de l&apos;IA
                </span>
                <span className="text-xs font-black text-[var(--accent)]">{data.confidence}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent-soft)]"
                  style={{ width: `${CONFIDENCE_FILL[data.confidence] ?? 55}%` }}
                />
              </div>
            </div>

            {/* Probabilities */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Probabilités exactes
              </h3>
              <div className="space-y-2.5">
                <ProbRow label={`Victoire ${h.name}`} pct={data.probabilities.home} accent />
                <ProbRow label="Match nul" pct={data.probabilities.draw} />
                <ProbRow label={`Victoire ${a.name}`} pct={data.probabilities.away} />
              </div>
            </div>

            {/* Scenario */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Scénario probable
              </h3>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.scenario}</p>
            </div>

            {/* Secondary scenarios */}
            {data.secondaryScenarios.length > 0 && (
              <div className="space-y-2">
                {data.secondaryScenarios.map((s, i) => (
                  <div key={i} className="rounded-xl glass p-3.5">
                    <div className="text-sm font-bold text-[#f0f0f0]">{s.title}</div>
                    <p className="text-xs text-[#999] mt-1 leading-relaxed">{s.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Key strengths */}
            {data.keyStrengths.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.keyStrengths.map((ks, i) => (
                  <div key={i} className="rounded-xl glass p-3.5">
                    <div className="text-xs font-black text-[var(--accent)] mb-1.5">
                      {ks.team === "home" ? h.name : a.name}
                    </div>
                    <ul className="space-y-1">
                      {ks.points.map((p, j) => (
                        <li key={j} className="text-xs text-[#c0c0c0] flex gap-1.5">
                          <span className="text-[var(--accent)]">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Factors */}
            {data.factors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.factors.map((f, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                    style={
                      f.kind === "pos"
                        ? { color: "var(--accent)", borderColor: "rgba(22,193,114,0.3)", background: "rgba(22,193,114,0.08)" }
                        : f.kind === "neg"
                          ? { color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }
                          : { color: "#9aa3af", borderColor: "rgba(154,163,175,0.25)", background: "rgba(154,163,175,0.06)" }
                    }
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            )}

            {/* Buteurs probables & 1er buteur — depuis l'effectif réel */}
            {data.probableScorers && data.probableScorers.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  <Goal size={13} className="text-[var(--accent)]" /> Buteurs probables
                </h3>
                {data.firstScorer && (
                  <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-3.5 py-2.5">
                    <Star size={14} className="text-[var(--accent)] shrink-0" />
                    <span className="text-xs text-[#c0c0c0]">
                      1<sup>er</sup> buteur le plus probable&nbsp;:{" "}
                      <span className="font-black text-[#f0f0f0]">{data.firstScorer}</span>
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {data.probableScorers.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl glass p-3.5">
                      <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--accent)]/12 shrink-0">
                        <Goal size={12} className="text-[var(--accent)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#f0f0f0]">
                          {s.name}{" "}
                          <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                            · {s.team === "home" ? h.shortName : a.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-[#999] mt-0.5 leading-relaxed">{s.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Joueurs clés à suivre — depuis l'effectif réel */}
            {data.keyPlayers && data.keyPlayers.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  <Users size={13} className="text-[var(--accent)]" /> Joueurs clés à suivre
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.keyPlayers.map((p, i) => (
                    <div key={i} className="rounded-xl glass p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#f0f0f0]">{p.name}</span>
                        <span className="ml-auto text-[10px] font-semibold text-[var(--text-muted)]">
                          {p.team === "home" ? h.shortName : a.shortName}
                        </span>
                      </div>
                      {p.role && (
                        <div className="text-[10px] font-semibold text-[var(--accent)] mt-0.5">{p.role}</div>
                      )}
                      <p className="text-xs text-[#999] mt-1 leading-relaxed">{p.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prédiction Gold — bloc premium (xG, marchés, comparaison des forces) */}
            <div className="rounded-2xl p-4 space-y-5 border border-[#ffd700]/25 bg-gradient-to-b from-[#ffd700]/[0.06] to-transparent">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#ffd700]/15 shrink-0">
                <Sparkles size={13} className="text-[#ffd700]" />
              </span>
              <span className="text-xs font-black uppercase tracking-wide text-[#ffd700]">Prédiction Gold</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">xG · marchés · forces</span>
            </div>

            {/* Comparison */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[var(--accent)]">{h.name}</span>
                <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                  <TrendingUp size={12} className="inline mr-1" />Comparaison
                </span>
                <span className="text-xs font-black text-[#ef4444]">{a.name}</span>
              </div>
              <div className="space-y-2.5">
                {data.comparison.map((c) => (
                  <CompareRow key={c.label} label={c.label} home={c.home} away={c.away} />
                ))}
              </div>
            </div>

            {/* Expected goals & markets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl glass p-3 text-center">
                <Target size={13} className="text-[var(--text-muted)] mx-auto mb-1" />
                <div className="text-lg font-black text-[var(--text)] tabular-nums">{data.expectedGoals.home}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {h.shortName}</div>
              </div>
              <div className="rounded-xl glass p-3 text-center">
                <Target size={13} className="text-[var(--text-muted)] mx-auto mb-1" />
                <div className="text-lg font-black text-[var(--text)] tabular-nums">{data.expectedGoals.away}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">Buts {a.shortName}</div>
              </div>
              <div className="rounded-xl glass p-3 text-center">
                <div className="text-lg font-black text-[var(--text)] tabular-nums">{data.markets.over25}%</div>
                <div className="text-[10px] text-[var(--text-muted)]">+2.5 buts</div>
              </div>
              <div className="rounded-xl glass p-3 text-center">
                <div className="text-lg font-black text-[var(--text)] tabular-nums">{data.markets.bttsYes}%</div>
                <div className="text-[10px] text-[var(--text-muted)]">Les 2 marquent</div>
              </div>
            </div>
            </div>

            {/* Recommendation — with a per-profile toggle (preview only, never
                changes the user's saved profile). */}
            {rec && (
            <div>
              {profileRecs && (
                <div className="mb-2.5">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">
                    <Sliders size={12} className="text-[var(--accent)]" /> Voir selon ton style de pari
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYSTYLES.map((ps) => {
                      const isActive = ps.id === effectiveProfile;
                      return (
                        <button
                          key={ps.id}
                          onClick={() => setActiveProfile(ps.id)}
                          aria-pressed={isActive}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            isActive
                              ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40"
                              : "glass text-[var(--text-muted)] border border-transparent hover:text-[#cdd3db] hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{ps.emoji}</span> {ps.label}
                        </button>
                      );
                    })}
                  </div>
                  {bankroll?.playstyle && effectiveProfile !== bankroll.playstyle && (
                    <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                      Aperçu — ton profil reste «&nbsp;{PLAYSTYLE_LABEL[bankroll.playstyle]}&nbsp;».
                    </p>
                  )}
                </div>
              )}

              <div
                className={`rounded-2xl p-4 ${
                  isBanker
                    ? "glass border border-[var(--accent)]/25"
                    : rec.valueTier === "none"
                      ? "glass border border-[#ef4444]/20"
                      : rec.valueTier === "marginal"
                        ? "glass border border-[#ffd700]/25"
                        : "glass-neon glow-neon"
                }`}
              >
              <div className="flex items-center gap-1.5 text-[var(--accent)] mb-2">
                <Coins size={15} />
                <span className="text-xs font-black uppercase tracking-wide">Notre recommandation</span>
              </div>

              {isBanker ? (
                <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-full mb-2 bg-[var(--accent)]/12 text-[var(--accent)]">
                  🛡️ Le pari le plus probable
                </span>
              ) : (() => {
                const tier = rec.valueTier;
                if (!tier) return null;
                const b = valueBadge(tier);
                const cls =
                  b.tone === "ok"
                    ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                    : b.tone === "warn"
                      ? "bg-[#ffd700]/12 text-[#ffd700]"
                      : "bg-[#ef4444]/12 text-[#ef4444]";
                return (
                  <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full mb-2 ${cls}`}>
                    {b.label}
                  </span>
                );
              })()}

              <div className="text-base font-black text-[#f0f0f0]">
                {rec.bet}
                {rec.odds && (
                  <span className="text-[var(--accent)]">
                    {" "}— cote {rec.odds}
                    {rec.bookmaker ? ` (${rec.bookmaker})` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#aaa] mt-1.5 leading-relaxed">{rec.rationale}</p>

              {/* Banker → on montre la probabilité ; value → cote mini vs actuelle */}
              {isBanker ? (
                rec.probaModele != null && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    Probabilité estimée :{" "}
                    <span className="font-bold text-[#cdd3db]">{rec.probaModele}%</span>
                    {rec.odds ? <> · Cote : <span className="font-bold text-[#cdd3db]">{rec.odds}</span></> : null}
                  </p>
                )
              ) : (
                rec.coteMin != null && rec.odds && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    Cote min. pour value :{" "}
                    <span className="font-bold text-[#cdd3db]">{fmtCote(rec.coteMin)}</span>{" "}
                    · Cote actuelle : <span className="font-bold text-[#cdd3db]">{rec.odds}</span>
                  </p>
                )
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] font-bold">
                  Confiance : {rec.confidence}
                </span>
                {(!stakeAdvice || (rec.valueTier === "none" && !isBanker)) && (
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--text-muted)] font-bold">
                    Mise indicative : {rec.stake}
                  </span>
                )}
              </div>

              {/* Personalised € stake — for value bets AND the Prudent banker
                  (never for a no-value bet in a value profile). */}
              {stakeAdvice && (rec.valueTier !== "none" || isBanker) ? (
                <div className="mt-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--accent)] mb-1.5">
                    <Wallet size={12} /> Mise conseillée pour toi
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-[#f0f0f0] tabular-nums">
                      {stakeAdvice.amount} €
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {stakeAdvice.pct.toLocaleString("fr-FR")}% de ta bankroll ({stakeAdvice.bankroll.toLocaleString("fr-FR")} €)
                    </span>
                  </div>
                  {stakeAdvice.potentialGain != null && (
                    <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                      Si ça passe : <span className="text-[var(--accent)] font-bold">+{stakeAdvice.potentialGain.toLocaleString("fr-FR")} €</span>
                      {" "}· retour {stakeAdvice.potentialReturn?.toLocaleString("fr-FR")} €
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-[#5a6472] leading-relaxed">
                    Calculé sur ta bankroll actuelle, le profil «&nbsp;{PLAYSTYLE_LABEL[effectiveProfile]}&nbsp;» et la confiance du pari · plafonné à 5% pour ta sécurité.
                  </p>
                </div>
              ) : bankrollReady && (!bankroll || bankroll.amount <= 0) ? (
                <Link
                  href="/dashboard/bankroll"
                  className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.04] p-3 text-xs text-[var(--text-muted)] hover:bg-[var(--accent)]/[0.08] transition-colors"
                >
                  <Wallet size={14} className="text-[var(--accent)] shrink-0" />
                  <span>
                    <span className="text-[var(--accent)] font-bold">Configure ta bankroll</span> pour voir le montant exact à miser sur ce pari.
                  </span>
                </Link>
              ) : null}
              </div>
            </div>
            )}

            <p className="text-[10px] text-[var(--text-muted)] text-center">{DISCLAIMER}</p>

            {/* Ask AI + regenerate */}
            <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-center gap-3">
              <ShareAnalysisButton
                matchId={match.id}
                title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
              />
              <AskAiModal match={match} />
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isPending}
                className="border-[#1f1f1f] text-[#666] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] text-xs"
              >
                <RefreshCw size={12} className="mr-1.5" /> Regénérer
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
