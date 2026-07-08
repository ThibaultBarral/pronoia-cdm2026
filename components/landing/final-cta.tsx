"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LocaleLink } from "@/lib/i18n/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trackEvent } from "@/lib/analytics";

export default function FinalCta() {
  const en = useLocale() === "en";
  const copy = en
    ? {
        pill: "Shall we?",
        title: "Pick a match,",
        titleAccent: "get the read in 60 seconds.",
        subtitle: "Unlimited analyses, value bets and bankroll with Pro.",
        ctaPrimary: "Analyse a match",
        ctaSecondary: "See pricing",
        trust: "No commitment · Cancel in one click · GDPR-compliant",
      }
    : {
        pill: "On y va ?",
        title: "Choisis un match,",
        titleAccent: "la lecture tombe en 60 secondes.",
        subtitle: "Analyses illimitées, value bets et bankroll avec Pro.",
        ctaPrimary: "J'analyse un match",
        ctaSecondary: "Voir les tarifs",
        trust: "Sans engagement · Annulable en 1 clic · Conforme RGPD",
      };

  return (
    <section className="relative overflow-hidden border-t border-white/5 px-4 py-24">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10 gradient-hero opacity-90" />
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <span className="inline-flex items-center rounded-full glass px-4 py-1.5 text-sm font-bold text-[var(--accent)] mb-7">
          {copy.pill}
        </span>
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          <span className="text-[#f4f5f7]">{copy.title}</span>{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {copy.titleAccent}
          </span>
        </h2>
        <p className="text-[#9aa3b2] text-lg mt-6">{copy.subtitle}</p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.a
            href="/login?mode=signup"
            onClick={() => trackEvent("signup_click", { location: "final_cta" })}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(var(--accent-rgb),0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[var(--accent-soft)]"
          >
            {copy.ctaPrimary}
            <ArrowRight size={16} />
          </motion.a>
          <LocaleLink
            href="/tarifs"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass text-[#c2c8d0] text-sm font-bold hover:text-[#f4f5f7] transition-colors"
          >
            {copy.ctaSecondary}
          </LocaleLink>
        </div>

        <p className="text-[13px] text-[var(--text-muted)] mt-7">{copy.trust}</p>
      </motion.div>
    </section>
  );
}
