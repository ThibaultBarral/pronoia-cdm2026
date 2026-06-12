"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Sparkles } from "lucide-react";
import type { LockedTeaser } from "@/lib/upsell";
import { createCheckout } from "@/actions/create-checkout";
import { trackEvent } from "@/lib/analytics";
import type { PaidPlan } from "@/lib/plans";

/** Contextual upsell modal opened from a locked nav teaser. */
export default function UpsellModal({
  teaser,
  onClose,
}: {
  teaser: LockedTeaser | null;
  onClose: () => void;
}) {
  const [pending, startCheckout] = useTransition();

  function go(plan: PaidPlan) {
    trackEvent("unlock_ticket_click", {
      plan: plan === "monthly" ? "mensuel" : plan === "weekly" ? "hebdo" : "avie",
      source: "locked_nav",
      item: teaser?.id,
    });
    startCheckout(async () => {
      const res = await createCheckout(plan);
      if (res.ok) window.location.href = res.url;
      else window.location.href = "/dashboard/pricing";
    });
  }

  return (
    <AnimatePresence>
      {teaser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl glass-strong p-6"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.06]"
            >
              <X size={16} />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/12 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
              <Lock size={20} className="text-[var(--accent)]" />
            </div>

            <h2 className="text-lg font-black text-[var(--text)]">{teaser.title}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">{teaser.body}</p>

            <button
              onClick={() => go("monthly")}
              disabled={pending}
              className="mt-5 w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] glow-neon transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
            >
              {pending ? "Redirection…" : "⚡ Devenir membre — 14,99 €/mois"}
            </button>
            <p className="text-[11px] text-[var(--text-muted)] text-center mt-2">
              Analyses illimitées · résiliable à tout moment · accès immédiat
            </p>

            <div className="flex items-center justify-center gap-4 mt-3 text-[11px]">
              <button onClick={() => go("weekly")} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors">
                Juste tester · Hebdo 4,99 €
              </button>
              <span className="text-[#2a3550]">·</span>
              <Link href="/dashboard/pricing" onClick={onClose} className="text-[#7a8290] hover:text-[#cdd3db] transition-colors inline-flex items-center gap-1">
                <Sparkles size={11} /> Tous les plans
              </Link>
            </div>

            <p className="text-[10px] text-[#5a6472] text-center mt-4">
              18+ · Jouer comporte des risques · joueurs-info-service.fr · 09 74 75 13 13
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
