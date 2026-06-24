"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  ShieldCheck,
  Flame,
  Target,
  Users,
  Goal,
  Lightbulb,
} from "lucide-react";
import type { Match } from "@/lib/types";
import { getPaywallTeaser, type PaywallTeaser } from "@/actions/paywall-teaser";
import { startCheckout as beginCheckout } from "@/lib/checkout-client";
import { trackEvent } from "@/lib/analytics";
import { FEATURE } from "@/lib/feature-flags";
import type { PaidPlan } from "@/lib/plans";

function eur(n: number): string {
  return n.toLocaleString("fr-FR");
}

/** Simple fallback (the original locked card) when the rich teaser isn't available. */
function SimpleLocked() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/15 bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent py-9 px-5">
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
  );
}

export default function LossAversionPaywall({
  match,
  compact = false,
}: {
  match: Match;
  /** Hide the "what's inside" pillars + intro (used below the rich locked page,
   *  which already teases every section). Keeps header, value line, CTA, proof. */
  compact?: boolean;
}) {
  const [teaser, setTeaser] = useState<PaywallTeaser | null>(null);
  const [pending, startCheckout] = useTransition();

  useEffect(() => {
    let active = true;
    if (!FEATURE.lossAversion) {
      trackEvent("paywall_view", { source: "match_analysis", match_id: match.id });
      return;
    }
    getPaywallTeaser(match).then((t) => {
      if (!active) return;
      setTeaser(t);
      trackEvent("paywall_view", {
        source: "match_analysis",
        match_id: match.id,
        ...(t.available ? { missed_amount: t.missedAmount } : {}),
      });
    });
    return () => {
      active = false;
    };
  }, [match]);

  function unlock(plan: PaidPlan) {
    trackEvent("unlock_ticket_click", {
      plan: plan === "monthly" ? "mensuel" : plan === "weekly" ? "hebdo" : "avie",
      match_id: match.id,
    });
    startCheckout(async () => {
      const res = await beginCheckout(plan);
      if (res.ok) window.location.href = res.url;
      else window.location.href = `/login?mode=signup&next=/match/${match.id}`;
    });
  }

  // Flag off, or teaser unavailable → keep the original simple locked card.
  if (!FEATURE.lossAversion) return <SimpleLocked />;
  if (teaser && !teaser.available) return <SimpleLocked />;
  if (!teaser) {
    return <div className="h-48 rounded-xl glass animate-pulse" aria-hidden />;
  }

  const t = teaser; // available
  const track = t.track;
  // Only surface the track record once it's actually compelling — showing
  // "0% validés" before any match is resolved kills trust (counter-productive).
  const showTrack = track.total > 0 && track.winRate > 0;

  // The full analysis behind the lock — the same four pillars for every match,
  // so we can name them honestly without running the (expensive) LLM analysis.
  const pillars = [
    { icon: Target, label: "Le scénario le plus probable du match" },
    { icon: Users, label: "Les forces et faiblesses qui font la différence" },
    { icon: Goal, label: "Les joueurs à suivre et buteurs probables" },
    { icon: Lightbulb, label: "La recommandation de l'IA + niveau de confiance" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-b from-[var(--accent)]/[0.05] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6">
        {/* En-tête — analyse, pas ticket (masqué en mode compact : la page
            verrouillée au-dessus présente déjà tout). */}
        {!compact && (
          <div className="flex items-start gap-2.5">
            <Sparkles size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#f0f0f0] font-bold text-base leading-tight">
                L&apos;analyse complète de ce match
              </p>
              <p className="text-xs text-[#9aa3b2] mt-1">
                Notre IA a déjà décortiqué {match.homeTeam.name}–{match.awayTeam.name}. Voici ce
                qu&apos;il te manque pour parier en connaissance de cause.
              </p>
            </div>
          </div>
        )}

        {/* Confiance IA */}
        <div className={compact ? "" : "mt-3"}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25">
            <Flame size={11} /> Confiance de l&apos;IA : {t.confidence}
          </span>
        </div>

        {/* Ce qui est derrière le verrou */}
        {!compact && (
          <div className="mt-4 space-y-1.5">
            {pillars.map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3.5 py-3"
              >
                <Icon size={15} className="text-[var(--accent)]/70 shrink-0" />
                <div className="min-w-0 flex-1 text-xs font-medium text-[#cdd3db]">{label}</div>
                <Lock size={13} className="text-[#5a6472] shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Hook valeur — discret, une ligne */}
        <p className="text-[11px] text-[#7a8290] text-center mt-3 leading-relaxed">
          En simulation, les {t.nPicks} pronos retenus rapportent{" "}
          <span className="text-[var(--accent)] font-semibold">{eur(t.missedAmount)}€</span> pour{" "}
          {eur(t.stakedTotal)}€ misés (cotes réelles).
        </p>

        {/* CTA principal */}
        <button
          onClick={() => unlock("monthly")}
          disabled={pending}
          className="mt-4 w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] glow-neon transition-transform hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
        >
          {pending ? "Redirection…" : "Débloquer l'analyse complète →"}
        </button>
        <p className="text-[11px] text-[#9aa3b2] text-center mt-2.5">
          14,99 €/mois · sans engagement
          <span className="text-[#5a6472]"> · ou hebdo </span>
          <button onClick={() => unlock("weekly")} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors">
            4,99 €
          </button>
          <span className="text-[#5a6472]"> · à vie </span>
          <button onClick={() => unlock("lifetime")} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors">
            89 €
          </button>
        </p>

        {/* Preuve — une seule ligne, pas une grille */}
        {showTrack && (
          <Link
            href="/track-record"
            className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[#9aa3b2] hover:text-[#cdd3db] transition-colors"
          >
            <ShieldCheck size={12} className="text-[var(--accent)]" />
            <span className="text-[var(--accent)] font-bold">{track.winRate}%</span> de pronos validés
            sur {track.verified} vérifiées
            <span className="text-[var(--accent)]">→</span>
          </Link>
        )}

        {/* Mentions légales */}
        <p className="text-[10px] text-[#5a6472] text-center mt-3">
          À titre informatif · 18+ · Jouer comporte des risques · joueurs-info-service.fr
        </p>
      </div>
    </div>
  );
}
