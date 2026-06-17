"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Lock, Sparkles, ShieldCheck, TrendingUp, Flame } from "lucide-react";
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

export default function LossAversionPaywall({ match }: { match: Match }) {
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ffd700]/25 bg-gradient-to-b from-[#ffd700]/[0.05] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ffd700]/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6">
        {/* Hero — montant simulé */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#ff9d5c] font-bold mb-1">
            Ce que tu rates sur ce match
          </p>
          <div
            className="text-5xl sm:text-6xl font-black tabular-nums leading-none"
            style={{ color: "#ffd700", textShadow: "0 0 28px rgba(255,215,0,0.35)" }}
          >
            {eur(t.missedAmount)}€
          </div>
          <p className="text-xs text-[#9aa3b2] mt-2">
            Mise simulée {eur(t.stakedTotal)}€ → {eur(t.missedAmount)}€ ·{" "}
            <span className="text-[#cdd3db]">si les {t.nPicks} pronos de l&apos;IA passent</span>
          </p>
          <p className="text-[10px] text-[#5a6472] mt-1">Potentiel calculé sur cotes réelles · simulation</p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25">
              <Flame size={11} /> Confiance IA : {t.confidence}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ffd700]/12 text-[#ffd700] border border-[#ffd700]/25">
              @{t.maxOdds.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Picks verrouillés */}
        <div className="mt-5 space-y-2">
          {t.picks.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3.5 py-3"
            >
              <Lock size={13} className="text-[#5a6472] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#cdd3db]">{p.market}</div>
                <div className="mt-1 h-2.5 w-24 rounded-full bg-[#9aa]/15 blur-[3px]" aria-hidden />
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-[var(--accent)] tabular-nums">{eur(p.potential)}€</div>
                <div className="text-[9px] text-[#5a6472]">potentiel</div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[#5a6472] text-center">
            Sélections masquées — débloque pour les voir
          </p>
        </div>

        {/* CTA principal */}
        <button
          onClick={() => unlock("monthly")}
          disabled={pending}
          className="mt-5 w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] glow-neon transition-transform hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
        >
          {pending ? "Redirection…" : "⚡ Débloquer mon ticket →"}
        </button>
        <p className="text-[11px] text-[#9aa3b2] text-center mt-2">
          14,99 €/mois · Analyses <span className="text-[#cdd3db] font-semibold">ILLIMITÉES</span> ·
          Résiliable à tout moment · Accès immédiat
        </p>

        {/* Intentions secondaires */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px]">
          <button onClick={() => unlock("weekly")} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors">
            Juste tester · Hebdo 4,99 €
          </button>
          <span className="text-[#2a3550]">·</span>
          <button onClick={() => unlock("lifetime")} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors">
            Une fois pour toutes · À vie 59 €
          </button>
        </div>

        {/* Track record — only when it's actually convincing (real win rate). */}
        {showTrack && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl glass px-2 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--accent)]">
                  <ShieldCheck size={13} />
                  <span className="text-base font-black tabular-nums">{track.verified}</span>
                </div>
                <div className="text-[9px] text-[#5a6472] mt-0.5">prédictions vérifiées</div>
              </div>
              <div className="rounded-xl glass px-2 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[#ffd700]">
                  <TrendingUp size={13} />
                  <span className="text-base font-black tabular-nums">{track.winRate}%</span>
                </div>
                <div className="text-[9px] text-[#5a6472] mt-0.5">de pronos validés</div>
              </div>
              <div className="rounded-xl glass px-2 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--accent-soft)]">
                  <Flame size={13} />
                  <span className="text-base font-black tabular-nums">
                    {track.currentStreak > 0 ? `${track.currentStreak} ✅` : "—"}
                  </span>
                </div>
                <div className="text-[9px] text-[#5a6472] mt-0.5">série en cours</div>
              </div>
            </div>

            <div className="text-center mt-2">
              <Link href="/track-record" className="text-[11px] font-bold text-[var(--accent)] hover:underline">
                Voir tout le track record →
              </Link>
            </div>
          </>
        )}

        {/* Mentions légales */}
        <p className="text-[10px] text-[#5a6472] text-center mt-3 leading-relaxed">
          Analyses à titre informatif · simulation sur cotes réelles · 18+ · Jouer comporte des
          risques · joueurs-info-service.fr · 09 74 75 13 13
        </p>
      </div>
    </div>
  );
}
