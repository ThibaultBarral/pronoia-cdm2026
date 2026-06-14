"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSubscription } from "@/lib/use-subscription";
import { useCountdown, formatRemaining, PRICE_HIKE_DEADLINE } from "@/components/launch-countdown";

const DISMISS_KEY = "launch-pricing-banner-dismissed-v2";

/**
 * Dismissible (localStorage) urgency banner on the dashboard promoting the
 * "Pass Coupe du Monde" (9,99 € le 1er mois). Shown only to users WITHOUT access
 * (free) — anyone already paying or VIP has nothing to buy. Auto-hides after the
 * 19 July deadline.
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

  // Only show to users WITHOUT access (free) — we promote the World Cup pass.
  // Anyone already paying (or VIP) has sub.access === true → nothing to upsell.
  if (dismissed || r.total <= 0 || !sub || sub.access) return null;

  const left = formatRemaining(r);

  return (
    <div
      className="relative rounded-2xl px-4 py-3 pr-10 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1"
      style={{
        background: "rgba(var(--accent-rgb),0.10)",
        border: "1px solid rgba(var(--accent-rgb),0.30)",
      }}
    >
      <span className="text-sm text-[#cfeee4]">
        <span aria-hidden>🏆</span>{" "}
        <span className="font-black text-white">Pass Coupe du Monde — 9,99 € le 1er mois</span>,
        puis 14,99 €/mois. La Coupe du Monde se termine dans{" "}
        <span className="tabular-nums font-bold">{left}</span>.
      </span>

      <Link
        href="/dashboard/pricing"
        className="shrink-0 inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-black text-[#06231a] sm:ml-auto"
        style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
      >
        En profiter — 9,99 € →
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
