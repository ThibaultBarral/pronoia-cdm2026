"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, Search, Target, Wallet, ArrowRight } from "lucide-react";
import PhoneMockup from "@/components/landing/phone-mockup";
import { type FeaturedMatch } from "@/components/landing/featured-match-card";
import { trackEvent } from "@/lib/analytics";
import { useTranslations, useLocale } from "@/lib/i18n/locale-provider";

export interface HeroStats {
  matches: number;
  verified: number;
  winRate: number;
}

/** Real-numbers proof strip — honest counts fed from the server. */
function StatStrip({ stats }: { stats: HeroStats }) {
  const en = useLocale() === "en";
  const items = [
    stats.matches > 0 && { value: `${stats.matches}`, label: en ? "matches covered" : "matchs couverts" },
    stats.verified > 0 && { value: `${stats.verified}`, label: en ? "verified picks" : "pronos vérifiés" },
    stats.winRate > 0 && { value: `${stats.winRate}%`, label: en ? "hit rate" : "de réussite" },
  ].filter(Boolean) as { value: string; label: string }[];
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center lg:items-start">
          <span className="text-2xl md:text-3xl font-black text-[var(--accent)] tabular-nums">{it.value}</span>
          <span className="text-[11px] text-[#5a6472] uppercase tracking-wide">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const } }),
};

// Staggered headline reveal.
const lineUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
const headlineStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.12 } },
};

// Animated value loop — communicates: AI analyses → you bet right → you cash in.
const STEPS = [
  { icon: Search, key: "hero.loopAnalyze" },
  { icon: Target, key: "hero.loopBet" },
  { icon: Wallet, key: "hero.loopCash" },
];

function ValueLoop() {
  const t = useTranslations();
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1300);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 flex-wrap">
      {STEPS.map((s, i) => {
        const on = i === active;
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={{ scale: on ? 1.06 : 1, opacity: on ? 1 : 0.5 }}
              transition={{ duration: 0.4 }}
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 border ${on ? "glass-neon glow-neon" : "glass"}`}
              style={on ? { borderColor: "rgba(var(--accent-rgb),0.5)" } : undefined}
            >
              <Icon size={15} className={on ? "text-[var(--accent)]" : "text-[#6a7488]"} />
              <span className={`text-xs sm:text-sm font-bold ${on ? "text-[var(--accent)]" : "text-[#6a7488]"}`}>
                {t(s.key)}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && <ArrowRight size={14} className="text-[#2a3550] shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

export default function Hero({ stats, featuredMatch }: { stats?: HeroStats; featuredMatch?: FeaturedMatch }) {
  const t = useTranslations();

  return (
    <section className="gradient-hero relative overflow-hidden pt-16 pb-20 px-4">
      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-[var(--accent)]/8 blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-20 right-[8%] w-64 h-64 rounded-full bg-[var(--accent-soft)]/6 blur-3xl"
          animate={{ y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[var(--accent)]/40 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={0}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-neon mb-6"
            >
              <Sparkles size={12} className="text-[var(--accent)]" />
              <span className="text-[11px] text-[var(--accent)] font-bold tracking-wide uppercase">
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              variants={headlineStagger} initial="hidden" animate="show"
              className="text-[2.5rem] sm:text-6xl lg:text-[3.4rem] xl:text-6xl font-black leading-[1.05] tracking-tight mb-5"
            >
              <motion.span variants={lineUp} className="block text-[#f0f0f0]">{t("hero.line1")}</motion.span>
              <motion.span variants={lineUp} className="block text-[#f0f0f0]">{t("hero.line2")}</motion.span>
              <motion.span
                variants={lineUp}
                className="block text-glow-neon"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("hero.line3")}
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="text-[#9aa3b2] text-base md:text-lg max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed"
            >
              {t("hero.subheadPre")}{" "}
              <span className="text-[var(--accent)] font-semibold">{t("hero.subheadEmphasis")}</span>{" "}
              {t("hero.subheadPost")}
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={2.4}
              className="mb-8"
            >
              <ValueLoop />
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={3}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-10"
            >
              <motion.a
                href="/login?mode=signup"
                onClick={() => trackEvent("signup_click", { location: "hero" })}
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(var(--accent-rgb),0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[var(--accent)] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[var(--accent-soft)]"
              >
                <Zap size={15} />
                {t("hero.ctaPrimary")}
              </motion.a>
              <motion.a
                href="#matches"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl glass text-[#7a8599] text-sm hover:text-[#f0f0f0] transition-colors"
              >
                {t("hero.ctaSecondary")}
              </motion.a>
            </motion.div>

            {stats && (
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3.4}>
                <StatStrip stats={stats} />
              </motion.div>
            )}
          </div>

          {/* Right — phone mockup of the real app */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={2.6}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup
              homeFlag={featuredMatch?.home.flag}
              homeName={featuredMatch?.home.name}
              awayFlag={featuredMatch?.away.flag}
              awayName={featuredMatch?.away.name}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
