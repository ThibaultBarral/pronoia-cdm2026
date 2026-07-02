"use client";

import { motion } from "framer-motion";
import { Share2, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trackEvent } from "@/lib/analytics";

/**
 * "Share the predictions with your friends." Framed around the real shareable
 * 9:16 prediction cards (share/route.tsx) — no fabricated referral-reward claim.
 */
export default function ShareReferral() {
  const en = useLocale() === "en";
  const copy = en
    ? {
        title: "Settle the debate in the group chat",
        subtitle:
          "Every read turns into a clean shareable card. Drop it in the chat before kickoff, call your score — and let the replies roll in.",
        cta: "Try it on a match — free",
      }
    : {
        title: "Clôturez le débat dans la boucle",
        subtitle:
          "Chaque lecture devient une carte à partager. Balance-la dans le groupe avant le coup d'envoi, annonce ton score — et laisse les répliques arriver. 🍿",
        cta: "Teste sur un match — offert",
      };

  return (
    <section className="border-t border-white/5 px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] glass-strong px-6 py-14 sm:px-10 text-center"
        >
          <div className="absolute inset-0 -z-10 opacity-60 gradient-hero" />
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(var(--accent-rgb),0.14)] border border-[rgba(var(--accent-rgb),0.3)] mb-7">
            <Share2 size={26} className="text-[var(--accent)]" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#f4f5f7] leading-[1.1] max-w-xl mx-auto">
            {copy.title}
          </h2>
          <p className="text-[#9aa3b2] text-base sm:text-lg mt-5 max-w-lg mx-auto leading-relaxed">{copy.subtitle}</p>
          <motion.a
            href="/login?mode=signup"
            onClick={() => trackEvent("signup_click", { location: "share_referral" })}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(var(--accent-rgb),0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[var(--accent-soft)]"
          >
            {copy.cta}
            <ArrowRight size={16} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
