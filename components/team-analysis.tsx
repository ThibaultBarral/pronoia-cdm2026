"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot, Sparkles, RefreshCw, AlertCircle, Lock,
  TrendingUp, TrendingDown, Star, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Team } from "@/lib/types";
import { analyzeTeam } from "@/actions/analyze-team";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";
import { DISCLAIMER, type Confidence, type TeamAnalysisData } from "@/lib/analysis-schema";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useLocalizedHref } from "@/lib/i18n/navigation";

function ConfidenceBadge({ level }: { level: Confidence }) {
  const map: Record<Confidence, { bg: string; fg: string }> = {
    "Faible": { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
    "Moyen": { bg: "rgba(245,184,0,0.15)", fg: "#f5b800" },
    "Élevé": { bg: "rgba(22,193,114,0.15)", fg: "var(--accent)" },
    "Très élevé": { bg: "rgba(22,193,114,0.22)", fg: "var(--accent-soft)" },
  };
  const s = map[level] ?? map["Moyen"];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {level}
    </span>
  );
}

export default function TeamAnalysis({ team, slug }: { team: Team; slug: string }) {
  const router = useRouter();
  const locale = useLocale();
  const localizedHref = useLocalizedHref();
  const [data, setData] = useState<TeamAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setData(null);
    setError(null);
    setLocked(false);
    startTransition(async () => {
      try {
        const result = await analyzeTeam(team, slug, locale);
        if (!result.ok) {
          if (result.error === AUTH_REQUIRED) {
            router.push(localizedHref(`/login?next=/team/${slug}`));
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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Bot size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="font-semibold text-[#f0f0f0] text-sm">Analyse d&apos;équipe IA</div>
          <div className="text-[10px] text-[#555]">Forces, joueurs à suivre & idées de paris</div>
        </div>
        {data && (
          <span className="ml-auto text-[10px] text-[var(--accent)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5 rounded-full">
            Analyse complète
          </span>
        )}
      </div>

      <div className="p-5">
        {locked && (
          <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/15 bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent py-9 px-5">
            <div className="absolute inset-0 px-6 pt-6 space-y-2.5 opacity-[0.12] blur-[3px] pointer-events-none select-none" aria-hidden>
              {["w-3/4", "w-full", "w-5/6", "w-2/3", "w-full"].map((w, i) => (
                <div key={i} className={`h-2.5 rounded-full bg-[#9aa] ${w}`} />
              ))}
            </div>
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <Lock size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[#f0f0f0] font-bold text-base mb-1">Analyse d&apos;équipe Premium</p>
                <p className="text-xs text-[#888] max-w-xs leading-relaxed mx-auto">
                  Forces & faiblesses, joueurs à suivre et idées de paris sur {team.name}.
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

        {!data && !isPending && !error && !locked && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center animate-pulse-neon">
              <Sparkles size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[#f0f0f0] font-semibold mb-1">Analyser {team.name}</p>
              <p className="text-xs text-[#666] max-w-xs leading-relaxed">
                Forces & faiblesses · Joueurs à suivre · Idées de paris
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[#0a0a0a] font-bold px-6 py-2.5 glow-neon transition-all hover:scale-105"
            >
              <Sparkles size={15} className="mr-2" /> Générer l&apos;analyse
            </Button>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin-custom" />
            <p className="text-xs text-[#555]">Analyse de l&apos;équipe en cours…</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 mb-4">
            <AlertCircle size={15} className="text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-xs text-[#888]">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Numbers read */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--accent)] mb-2">
                Notre IA lit les chiffres
              </h3>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.numbersRead}</p>
            </div>

            {/* Strengths / weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl glass p-4">
                <div className="flex items-center gap-1.5 text-[var(--accent)] mb-2.5">
                  <TrendingUp size={14} />
                  <span className="text-xs font-black uppercase tracking-wide">Forces</span>
                </div>
                <ul className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-[#d0d0d0]">
                      <span className="font-semibold text-[#f0f0f0]">{s.label}</span>
                      {s.detail && <span className="text-[#999]"> — {s.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl glass p-4">
                <div className="flex items-center gap-1.5 text-[#ef4444] mb-2.5">
                  <TrendingDown size={14} />
                  <span className="text-xs font-black uppercase tracking-wide">Faiblesses</span>
                </div>
                <ul className="space-y-2">
                  {data.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-[#d0d0d0]">
                      <span className="font-semibold text-[#f0f0f0]">{w.label}</span>
                      {w.detail && <span className="text-[#999]"> — {w.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key players */}
            {data.keyPlayers.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[var(--text)] mb-2.5">
                  <Star size={14} className="text-[#ffd700]" />
                  <span className="text-xs font-black uppercase tracking-wide">Joueurs à suivre</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.keyPlayers.map((p, i) => (
                    <div key={i} className="rounded-xl glass p-3">
                      <div className="text-sm font-bold text-[#f0f0f0]">{p.name}</div>
                      <div className="text-xs text-[#999] mt-0.5">{p.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis text */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Notre analyse
              </h3>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.analysisText}</p>
            </div>

            {/* Bet ideas */}
            {data.betIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[var(--accent)] mb-2.5">
                  <Coins size={14} />
                  <span className="text-xs font-black uppercase tracking-wide">Idées de paris</span>
                </div>
                <div className="space-y-2">
                  {data.betIdeas.map((b, i) => (
                    <div key={i} className="rounded-xl glass-neon p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-bold text-[#f0f0f0]">{b.label}</span>
                        <ConfidenceBadge level={b.confidence} />
                      </div>
                      <p className="text-xs text-[#aaa] mt-1.5 leading-relaxed">{b.rationale}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2.5">
                  Mise conseillée : petite (1 à 3% de ta cagnotte). {DISCLAIMER}
                </p>
              </div>
            )}
          </div>
        )}

        {(data || error) && (
          <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex justify-center">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isPending}
              className="border-[#1f1f1f] text-[#666] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] text-xs"
            >
              <RefreshCw size={12} className="mr-1.5" /> Regénérer
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
