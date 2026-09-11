"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, AlertCircle, Settings } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout-client";
import { restoreSubscription } from "@/actions/restore-subscription";
import { planName, visibleOffers, ACCESS_FEATURES, type Plan, type PaidPlan } from "@/lib/plans";

/**
 * Sober, no-trial paywall: one plan, three durations (Semaine / Mois / Saison),
 * the same content in each. The monthly offer carries the visual weight; no
 * anchor price, no countdown, no capped entry tier.
 */
export default function PaywallContent({
  currentPlan,
  hasAccess = false,
  manageUrl = null,
}: {
  currentPlan?: Plan | null;
  hasAccess?: boolean;
  manageUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [restoring, startRestore] = useTransition();
  const offers = visibleOffers();

  useEffect(() => {
    if (!hasAccess) trackEvent("paywall_view", { source: "pricing_page" });
  }, [hasAccess]);

  function checkout(plan: PaidPlan) {
    setError(null);
    setInfo(null);
    setPending(plan);
    startTransition(async () => {
      const res = await startCheckout(plan);
      if (res.ok) window.location.href = res.url;
      else {
        setError(res.error);
        setPending(null);
      }
    });
  }

  function restore() {
    setError(null);
    setInfo(null);
    startRestore(async () => {
      const res = await restoreSubscription();
      if (res.ok) {
        setInfo("Accès restauré ✓");
        router.refresh();
      } else setError(res.error);
    });
  }

  const isCurrent = (plan: PaidPlan) => currentPlan === plan;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">
          Débloque <span className="text-[var(--accent-soft)]">Copafever</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2.5">
          Toutes les analyses, le chat IA et l&apos;historique. Choisis ton rythme.
        </p>
      </div>

      {/* Active subscriber — manage / cancel */}
      {hasAccess && (
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl glass-neon px-5 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text)] font-semibold">
              Abonnement actif{currentPlan ? ` · ${planName(currentPlan)}` : ""}
            </span>
          </div>
          <a
            href={manageUrl ?? "#"}
            target={manageUrl ? "_blank" : undefined}
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              manageUrl
                ? "bg-[var(--accent)]/12 text-[var(--accent-soft)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20"
                : "glass text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            <Settings size={15} /> Gérer / Résilier
          </a>
        </div>
      )}

      {/* Benefit checklist — identical for every duration */}
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
        Inclus, quelle que soit la durée
      </p>
      <ul className="space-y-2.5 mb-6">
        {ACCESS_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-[#c3cbe3]">
            <Check size={16} strokeWidth={3} className="shrink-0 text-[var(--accent-soft)]" />
            {f}
          </li>
        ))}
      </ul>

      {/* Durations */}
      {offers.map((o) => {
        const highlight = o.highlight;
        return (
          <button
            key={o.plan}
            onClick={() => checkout(o.plan)}
            disabled={pending === o.plan || isCurrent(o.plan)}
            className={`relative w-full text-left rounded-2xl p-4 mb-3 disabled:opacity-70 ${
              highlight ? "glass-neon glow-neon" : "glass"
            }`}
            style={highlight ? { borderColor: "rgba(var(--accent-rgb),0.6)", borderWidth: 2 } : undefined}
          >
            {o.badge && (
              <span
                className="absolute -top-3 left-4 inline-flex items-center text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={
                  o.badgeKind === "life"
                    ? { background: "var(--star)", color: "#0B1330" }
                    : { background: "var(--accent)", color: "#ffffff" }
                }
              >
                {o.badge}
              </span>
            )}
            <div className={`flex items-start justify-between gap-3 ${o.badge ? "mt-1" : ""}`}>
              <div>
                <div className="text-base font-black text-[var(--text)]">{o.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{o.sublabel}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-[var(--text)]">
                  {pending === o.plan ? "…" : o.priceLabel}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{o.unit}</div>
              </div>
            </div>
            {isCurrent(o.plan) && (
              <div className="mt-2 text-xs font-bold text-[var(--accent-soft)]">✓ Offre actuelle</div>
            )}
          </button>
        );
      })}

      <p className="text-center text-[11px] text-[var(--text-muted)] mt-2.5">
        Sans engagement · résiliable à tout moment · paiement sécurisé via Whop
      </p>

      {(error || info) && (
        <div
          className={`flex items-center justify-center gap-2 text-sm mt-5 rounded-xl px-3 py-2.5 ${
            error
              ? "text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/25"
              : "text-[var(--accent-soft)] bg-[var(--accent)]/10 border border-[var(--accent)]/25"
          }`}
        >
          {error && <AlertCircle size={15} />} {error ?? info}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center space-y-3">
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
          Copafever est un outil d&apos;analyse de matchs, fourni à titre informatif. Ce n&apos;est ni un
          service de paris, ni un conseil financier.
        </p>
        <button
          onClick={restore}
          disabled={restoring}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RotateCcw size={12} /> {restoring ? "Restauration…" : "Déjà payé ? Restaurer"}
        </button>
      </div>
    </div>
  );
}
