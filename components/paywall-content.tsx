"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import {
  Check, Flame, Zap, CalendarDays, Infinity as InfinityIcon,
  RotateCcw, AlertCircle, Settings, Lock, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createCheckout } from "@/actions/create-checkout";
import { restoreSubscription } from "@/actions/restore-subscription";
import { VISIBLE_OFFERS, planName, type Plan, type PaidPlan } from "@/lib/plans";
import LaunchCountdown from "@/components/launch-countdown";

const ICONS: Record<PaidPlan, LucideIcon> = {
  pass_cdm: Flame,
  weekly: Zap,
  monthly: CalendarDays,
  lifetime: InfinityIcon,
};

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

  useEffect(() => {
    if (!hasAccess) trackEvent("paywall_view", { source: "pricing_page" });
  }, [hasAccess]);

  function checkout(plan: PaidPlan) {
    setError(null);
    setInfo(null);
    setPending(plan);
    startTransition(async () => {
      const res = await createCheckout(plan);
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text)]">
          Choisis ton plan
        </h1>
        <p className="text-base text-[var(--text-muted)] mt-3">
          Accède aux analyses IA de la CDM 2026 et de toutes les compétitions à venir.
        </p>
        {currentPlan !== "lifetime" && (
          <div className="mt-5 flex justify-center">
            <LaunchCountdown />
          </div>
        )}
      </div>

      {/* Active subscriber — manage / cancel */}
      {hasAccess && (
        <div className="max-w-xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl glass-neon px-5 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text)] font-semibold">
              {currentPlan === "pass_cdm"
                ? "Pass CDM actif · accès complet jusqu'au 19 juillet"
                : `Abonnement actif${currentPlan ? ` · ${planName(currentPlan)}` : ""}`}
            </span>
          </div>
          {currentPlan === "pass_cdm" ? (
            <button
              onClick={() => checkout("lifetime")}
              disabled={pending === "lifetime"}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-[#ffd700]/12 text-[#ffd700] border border-[#ffd700]/30 hover:bg-[#ffd700]/20 transition-colors disabled:opacity-60"
            >
              {pending === "lifetime" ? "Redirection…" : "Passer à vie — 59 €"}
            </button>
          ) : (
            <a
              href={manageUrl ?? "#"}
              target={manageUrl ? "_blank" : undefined}
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                manageUrl
                  ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20"
                  : "glass text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              <Settings size={15} /> Gérer / Résilier
            </a>
          )}
        </div>
      )}

      {/* Offers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch max-w-5xl mx-auto">
        {VISIBLE_OFFERS.map((o, i) => {
          const Icon = ICONS[o.plan];
          const highlight = o.highlight;
          const gold = o.plan === "lifetime";
          const isCurrent = currentPlan === o.plan;
          const loading = pending === o.plan;
          const accentColor = gold ? "#ffd700" : "var(--accent)";

          return (
            <motion.div
              key={o.plan}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className={`relative flex flex-col rounded-3xl p-6 ${
                highlight ? "glass-neon glow-neon" : "glass"
              }`}
              style={
                highlight
                  ? { borderColor: "rgba(var(--accent-rgb),0.55)" }
                  : gold
                    ? { borderColor: "rgba(255,215,0,0.30)" }
                    : undefined
              }
            >
              {o.badge && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap"
                  style={
                    gold
                      ? { background: "#ffd700", color: "#1a1300" }
                      : { background: "var(--accent)", color: "#06231a" }
                  }
                >
                  {gold && <InfinityIcon size={12} />}
                  {o.badge}
                </span>
              )}

              {/* Name */}
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: gold ? "rgba(255,215,0,0.12)" : "rgba(var(--accent-rgb),0.12)" }}
                >
                  <Icon size={18} style={{ color: accentColor }} />
                </span>
                <h3 className="text-xl font-black text-[var(--text)]">{o.name}</h3>
              </div>

              {/* Price */}
              {(o.discountLabel || o.anchorPrice) && (
                <div className="flex items-center gap-2 mb-1.5">
                  {o.discountLabel && (
                    <span className="inline-flex items-center text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#ef4444]/15 text-[#ff6b6b] border border-[#ef4444]/30">
                      {o.discountLabel}
                    </span>
                  )}
                  {o.anchorPrice && (
                    <span className="text-lg font-bold text-[var(--text-muted)] line-through decoration-[#ef4444]/60 decoration-2">
                      {o.anchorPrice}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <span className="text-[40px] leading-none font-black" style={{ color: gold ? "#ffd700" : "var(--text)" }}>
                  {o.priceLabel}
                </span>
                <span className="text-sm text-[var(--text-muted)] mb-1.5">{o.unit}</span>
              </div>
              {o.urgencyLabel && (
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#ff9d5c] mt-2">
                  <Flame size={13} className="shrink-0" />
                  {o.urgencyLabel}
                </p>
              )}
              <p className="text-sm text-[var(--text-muted)] mt-2 mb-5">{o.sublabel}</p>

              {/* Features */}
              <ul className="space-y-3 mb-7 flex-1">
                {o.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#d0d0d0]">
                    <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                    <span>{f}</span>
                  </li>
                ))}
                {o.lockedFeatures?.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]"
                  >
                    <Lock size={15} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                    <span className="line-through decoration-[var(--text-muted)]/50">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full text-center rounded-xl py-3 text-sm font-bold glass text-[var(--text-muted)]">
                  ✓ Offre actuelle
                </div>
              ) : (
                <button
                  onClick={() => checkout(o.plan)}
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-60"
                  style={{
                    background: gold
                      ? "linear-gradient(135deg, #f5b800, #ffd700)"
                      : highlight
                        ? "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))"
                        : "linear-gradient(135deg, #0fb5a0, var(--accent))",
                  }}
                >
                  {loading ? "Redirection…" : o.ctaLabel}
                </button>
              )}

              {o.note && (
                <p className="text-[11px] text-[var(--text-muted)] text-center mt-3">{o.note}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Price-hike strip */}
      <div className="max-w-3xl mx-auto mt-6 rounded-2xl glass px-5 py-3.5 flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 text-center">
        <span className="text-xs text-[var(--text-muted)]">
          <span className="font-bold text-[#cdd3db]">Le 19 juillet, l&apos;Accès à vie passe à 99 €.</span>{" "}
          Les abonnements continuent sur toutes les compétitions 2026/27.
        </span>
        <Link
          href="/dashboard/competitions"
          className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0"
        >
          Voir les compétitions →
        </Link>
      </div>

      {(error || info) && (
        <div
          className={`flex items-center justify-center gap-2 text-sm mt-6 rounded-xl px-3 py-2.5 max-w-md mx-auto ${
            error
              ? "text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/25"
              : "text-[var(--accent-soft)] bg-[var(--accent)]/10 border border-[var(--accent)]/25"
          }`}
        >
          {error && <AlertCircle size={15} />} {error ?? info}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center space-y-3">
        <p className="text-xs text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          Hebdo et Mensuel : abonnements annulables à tout moment, sans engagement.
          Accès à vie : un seul paiement, pour toujours.
          <br />
          Les analyses sont fournies à titre informatif. Les paris sportifs comportent des risques ·
          Réservé aux 18 ans et plus · Jouez responsable.
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
