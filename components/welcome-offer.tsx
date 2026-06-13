"use client";

import { useEffect, useState, useTransition } from "react";
import { Gift, Clock } from "lucide-react";
import { getWelcomeOffer } from "@/actions/welcome-offer";
import { createCheckout } from "@/actions/create-checkout";
import { logAppEvent } from "@/actions/log-event";
import { WELCOME_DISCOUNT_PCT, WELCOME_TARGET_PLAN } from "@/lib/welcome-offer";
import { trackEvent } from "@/lib/analytics";

/** "23 h 47 m 12 s" left until the deadline (or null once elapsed). */
function useCountdown(expiresAt: string | null): string | null {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const end = Date.parse(expiresAt);
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) {
        setLeft(null);
        return false;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setLeft(`${h} h ${String(m).padStart(2, "0")} m ${String(s).padStart(2, "0")} s`);
      return true;
    };
    if (tick() === false) return;
    const id = setInterval(() => tick() === false && clearInterval(id), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

/**
 * First-session welcome discount — a compact, gold-accented card with a live
 * countdown and a one-click discounted checkout. Self-fetches eligibility and
 * renders nothing for subscribers / outside the window / once expired.
 */
export default function WelcomeOffer({ source }: { source: "analysis" | "paywall" }) {
  const [offer, setOffer] = useState<{ code: string; expiresAt: string | null } | null>(null);
  const [pending, startCheckout] = useTransition();
  const countdown = useCountdown(offer?.expiresAt ?? null);

  useEffect(() => {
    let active = true;
    getWelcomeOffer().then((o) => {
      if (!active || !o.eligible) return;
      setOffer({ code: o.code, expiresAt: o.expiresAt });
      trackEvent("welcome_offer_view", { source });
      logAppEvent("welcome_offer_view", { source });
    });
    return () => {
      active = false;
    };
  }, [source]);

  function unlock() {
    if (!offer) return;
    trackEvent("welcome_offer_click", { source, code: offer.code });
    logAppEvent("welcome_offer_click", { source });
    startCheckout(async () => {
      const res = await createCheckout(WELCOME_TARGET_PLAN, offer.code);
      if (res.ok) window.location.href = res.url;
    });
  }

  // Not eligible, or the window elapsed while open → render nothing.
  if (!offer || !countdown) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ffd700]/30 bg-gradient-to-b from-[#ffd700]/[0.07] to-transparent p-4">
      <div className="flex items-center gap-2 text-[#ffd700] mb-1.5">
        <Gift size={15} />
        <span className="text-xs font-black uppercase tracking-wide">Offre de bienvenue</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-[#ff9d5c]">
          <Clock size={11} /> {countdown}
        </span>
      </div>

      <p className="text-sm text-[#e6e9ee] leading-snug">
        <span className="font-black text-[#ffd700]">−{WELCOME_DISCOUNT_PCT}%</span> sur le Mensuel —
        analyses <span className="font-semibold text-[#cdd3db]">illimitées</span>. Réservé à ta
        première session.
      </p>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[var(--text-muted)]">
          Code{" "}
          <span className="font-mono font-bold text-[#ffd700] tracking-wide">{offer.code}</span>
        </span>
      </div>

      <button
        onClick={unlock}
        disabled={pending}
        className="mt-3 w-full rounded-xl py-3 text-sm font-black text-[#1a1300] transition-transform hover:scale-[1.02] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #f5b800, #ffd700)" }}
      >
        {pending ? "Redirection…" : `Profiter de −${WELCOME_DISCOUNT_PCT}% maintenant →`}
      </button>
    </div>
  );
}
