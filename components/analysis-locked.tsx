"use client";

import { useTransition } from "react";
import { Lock, Sparkles } from "lucide-react";
import { startCheckout as beginCheckout } from "@/lib/checkout-client";
import { trackEvent } from "@/lib/analytics";

/**
 * Sober, single lock card shown when the analysis quota / access is missing.
 * No loss-aversion hooks, no per-section teasers — one clear CTA to Pro.
 */
export default function AnalysisLocked({ matchId }: { matchId: string }) {
  const [pending, startCheckout] = useTransition();

  function unlock() {
    trackEvent("unlock_ticket_click", { plan: "month", match_id: matchId });
    startCheckout(async () => {
      const res = await beginCheckout("month");
      if (res.ok) window.location.href = res.url;
      else window.location.href = `/login?mode=signup&next=/match/${matchId}`;
    });
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/15 bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent py-9 px-5">
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Lock size={24} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-[#f0f0f0] font-bold text-base mb-1">Analyse IA Copafever</p>
          <p className="text-xs text-[#888] max-w-xs leading-relaxed mx-auto">
            Probabilités, buts attendus et scénario complet — débloque l&apos;analyse pour continuer.
          </p>
        </div>
        <button
          onClick={unlock}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-bold px-6 py-2.5 text-sm glow-neon transition-all hover:scale-105 disabled:opacity-60"
        >
          <Sparkles size={15} /> {pending ? "Redirection…" : "Débloquer l'analyse"}
        </button>
      </div>
    </div>
  );
}
