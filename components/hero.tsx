"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowDown, Sparkles, Search, Target, Wallet, ArrowRight } from "lucide-react";
import AnalysisDemo from "@/components/analysis-demo";
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
    <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-black text-[var(--accent)] tabular-nums">{it.value}</span>
          <span className="text-[11px] text-[#5a6472] uppercase tracking-wide">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

const KICKOFF = new Date("2026-06-11T19:00:00-04:00");

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number;
}

function getTimeLeft(): TimeLeft {
  const diff = KICKOFF.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl glass-neon flex items-center justify-center glow-neon">
        <span className="text-2xl md:text-3xl font-black text-[var(--accent)] tabular-nums text-glow-neon">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-[#4a5568] uppercase tracking-widest font-medium">{label}</span>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const } }),
};

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

// Staggered headline reveal (shoplit-style momentum).
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
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
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

export default function Hero({ stats }: { stats?: HeroStats }) {
  const t = useTranslations();
  // Start null so SSR and the first client render produce the SAME markup
  // (deterministic zero placeholder). The real countdown is computed only
  // after mount, avoiding a hydration mismatch on the live-changing value.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const display = timeLeft ?? ZERO;
  const isLive = timeLeft !== null && Object.values(timeLeft).every((v) => v === 0);

  return (
    <section className="gradient-hero relative overflow-hidden pt-16 pb-24 px-4">
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
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-[#ffd700]/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[var(--accent)]/40 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">

        {/* Badge */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-neon mb-7"
        >
          <Sparkles size={12} className="text-[var(--accent)]" />
          <span className="text-[11px] text-[var(--accent)] font-bold tracking-wide uppercase">
            {t("hero.badge")}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={headlineStagger} initial="hidden" animate="show"
          className="text-[2.75rem] sm:text-6xl md:text-7xl font-black leading-[1.04] tracking-tight mb-6"
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

        {/* Subhead — AI that makes you money */}
        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="text-[#9aa3b2] text-base md:text-xl max-w-xl mx-auto mb-7 leading-relaxed"
        >
          {t("hero.subheadPre")}{" "}
          <span className="text-[var(--accent)] font-semibold">{t("hero.subheadEmphasis")}</span>{" "}
          {t("hero.subheadPost")}
        </motion.p>

        {/* Animated value loop — Analyse → Bon pari → Encaisse */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={2.4}
          className="mb-8"
        >
          <ValueLoop />
        </motion.div>

        {/* Animated analysis demo — match → reco IA "value" → cagnotte qui grimpe */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={2.8}
          className="mb-10"
        >
          <AnalysisDemo />
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
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

        {/* Real-numbers proof strip */}
        {stats && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3.4}
            className="mb-16 -mt-6"
          >
            <StatStrip stats={stats} />
          </motion.div>
        )}

        {/* Countdown */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={4}
        >
          {!isLive ? (
            <>
              <p className="text-[#3a4560] text-[11px] uppercase tracking-widest mb-5">
                {t("hero.kickoffIn")}
              </p>
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <CountdownUnit value={display.days} label={t("hero.days")} />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={display.hours} label={t("hero.hours")} />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={display.minutes} label={t("hero.minutes")} />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={display.seconds} label={t("hero.seconds")} />
              </div>
            </>
          ) : (
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-neon animate-pulse-neon"
              whileHover={{ scale: 1.03 }}
            >
              <Zap size={14} className="text-[var(--accent)]" />
              <span className="text-[var(--accent)] font-semibold text-sm">{t("hero.live")}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="mt-14 flex justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <ArrowDown size={16} className="text-[#2a3550]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
