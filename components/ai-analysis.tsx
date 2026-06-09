"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot, Sparkles, RefreshCw, AlertCircle, Lock, Gauge,
  Coins, Target, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import { analyzeMatch } from "@/actions/analyze-match";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";
import AskAiModal from "@/components/ask-ai-modal";
import ShareAnalysisButton from "@/components/share-analysis-button";
import {
  DISCLAIMER, type Confidence, type MatchAnalysisData,
} from "@/lib/analysis-schema";

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

export default function AIAnalysis({ match, isAdmin = false }: { match: Match; isAdmin?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<MatchAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const h = match.homeTeam;
  const a = match.awayTeam;

  function handleGenerate() {
    setData(null);
    setError(null);
    setLocked(false);
    startTransition(async () => {
      try {
        const result = await analyzeMatch(match);
        if (!result.ok) {
          if (result.error === AUTH_REQUIRED) {
            router.push(`/login?next=/match/${match.id}`);
            return;
          }
          if (result.error === PAYWALL_REQUIRED) {
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
        {/* Locked */}
        {locked && (
          <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/15 bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent py-9 px-5">
            <div className="absolute inset-0 px-6 pt-6 space-y-2.5 opacity-[0.12] blur-[3px] pointer-events-none select-none" aria-hidden>
              {["w-3/4", "w-full", "w-5/6", "w-2/3", "w-full", "w-1/2"].map((w, i) => (
                <div key={i} className={`h-2.5 rounded-full bg-[#9aa] ${w}`} />
              ))}
            </div>
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <Lock size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[#f0f0f0] font-bold text-base mb-1">Analyse IA Premium</p>
                <p className="text-xs text-[#888] max-w-xs leading-relaxed mx-auto">
                  Probabilités, value bets détectés et recommandation de pari sur ce match.
                </p>
              </div>
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[#06231a] font-bold px-6 py-2.5 text-sm glow-neon transition-all hover:scale-105"
              >
                <Sparkles size={15} /> Passer Premium
              </Link>
            </div>
          </div>
        )}

        {/* Empty */}
        {!data && !isPending && !error && !locked && (
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
        {isPending && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin-custom" />
            <p className="text-xs text-[#555]">Analyse des données en cours…</p>
          </div>
        )}

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

            {/* Recommendation */}
            <div className="rounded-2xl glass-neon glow-neon p-4">
              <div className="flex items-center gap-1.5 text-[var(--accent)] mb-2">
                <Coins size={15} />
                <span className="text-xs font-black uppercase tracking-wide">Notre recommandation</span>
              </div>
              <div className="text-base font-black text-[#f0f0f0]">
                {data.recommendation.bet}
                {data.recommendation.odds && (
                  <span className="text-[var(--accent)]">
                    {" "}— cote {data.recommendation.odds}
                    {data.recommendation.bookmaker ? ` (${data.recommendation.bookmaker})` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#aaa] mt-1.5 leading-relaxed">{data.recommendation.rationale}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] font-bold">
                  Confiance : {data.recommendation.confidence}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--text-muted)] font-bold">
                  Mise : {data.recommendation.stake}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] text-center">{DISCLAIMER}</p>

            {/* Ask AI + regenerate */}
            <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAdmin && (
                <ShareAnalysisButton
                  matchId={match.id}
                  title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
                />
              )}
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
