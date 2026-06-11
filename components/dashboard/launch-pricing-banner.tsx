"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSubscription } from "@/lib/use-subscription";
import { useCountdown, formatRemaining, PRICE_HIKE_DEADLINE } from "@/components/launch-countdown";

const DISMISS_KEY = "launch-pricing-banner-dismissed-v1";

/**
 * Dismissible (localStorage) urgency banner on the dashboard.
 * - Hidden for lifetime users (nothing to upsell).
 * - Pass CDM holders see a "passe à vie avant la hausse" variant.
 * - Everyone else sees the price-hike warning.
 * Auto-hides after the 19 July deadline.
 */
export default function LaunchPricingBanner() {
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState(true);
  const r = useCountdown(PRICE_HIKE_DEADLINE);

  useEffect(() => {
    // Deferred (setTimeout) to keep the setState out of the synchronous effect
    // body — starts hidden, so a previously-dismissed banner never flashes.
    const id = setTimeout(
      () => setDismissed(localStorage.getItem(DISMISS_KEY) === "1"),
      0,
    );
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  // Wait for sub to resolve; never show to lifetime; hide past the deadline.
  if (dismissed || r.total <= 0 || !sub || sub.plan === "lifetime") return null;

  const isPass = sub.plan === "pass_cdm";
  // Active Hebdo/Mensuel subscribers get the "lifetime = ~6 months" angle.
  const isSubscriber =
    sub.access && (sub.plan === "weekly" || sub.plan === "monthly");
  const left = formatRemaining(r);

  return (
    <div
      className="relative rounded-2xl px-4 py-3 pr-10 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
      }}
    >
      <span className="text-sm text-[#ffb4b4]">
        <span aria-hidden>⏳</span>{" "}
        {isPass ? (
          <>
            Ton Pass CDM reste actif jusqu&apos;au 19 juillet. Passe à vie pour{" "}
            <span className="font-black text-white">59 €</span> avant la hausse —
            plus que <span className="tabular-nums font-bold">{left}</span>.
          </>
        ) : isSubscriber ? (
          <>
            L&apos;Accès à vie à <span className="font-black text-white">59 €</span> ={" "}
            ~6 mois de Mensuel, pour toujours. Avant la hausse à 99 € —{" "}
            <span className="tabular-nums font-bold">{left}</span>.
          </>
        ) : (
          <>
            L&apos;Accès à vie passe de{" "}
            <span className="font-black text-white">59 € à 99 €</span> le 19 juillet.
            Plus que <span className="tabular-nums font-bold">{left}</span>.
          </>
        )}
      </span>

      <Link
        href="/dashboard/pricing"
        className="shrink-0 inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-black text-[#06231a] sm:ml-auto"
        style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
      >
        {isPass || isSubscriber ? "Passer à vie 59 €" : "Verrouiller 59 €"} →
      </Link>

      <button
        onClick={dismiss}
        aria-label="Fermer"
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center text-[#ff9d9d]/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
