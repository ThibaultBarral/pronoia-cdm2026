"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, ArrowDown, Sparkles } from "lucide-react";

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
        <span className="text-2xl md:text-3xl font-black text-[#00ff88] tabular-nums text-glow-neon">
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

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLive = Object.values(timeLeft).every((v) => v === 0);

  return (
    <section className="gradient-hero relative overflow-hidden pt-16 pb-24 px-4">
      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-[#00ff88]/8 blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-20 right-[8%] w-64 h-64 rounded-full bg-[#00d4ff]/6 blur-3xl"
          animate={{ y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-[#ffd700]/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[#00ff88]/40 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">

        {/* Badge */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon mb-8 shadow-lg"
        >
          <Trophy size={12} className="text-[#ffd700]" />
          <span className="text-[11px] text-[#ffd700] font-semibold tracking-wide uppercase">
            USA · Canada · Mexique · 11 juin — 19 juillet 2026
          </span>
          <Sparkles size={10} className="text-[#ffd700]/60" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="text-5xl sm:text-6xl md:text-[76px] font-black leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-[#f0f0f0]">Trouvez le bon pari sur chaque match de la CDM,</span>
          <br />
          <span
            className="text-glow-neon"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            en 15 secondes.
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="text-[#7a8599] text-base md:text-lg max-w-2xl mx-auto mb-3 leading-relaxed"
        >
          L&apos;IA analyse forme, stats, cotes et value bets pour te livrer une recommandation directe sur chaque match de la Coupe du Monde 2026.
        </motion.p>

        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="text-[#3a4560] text-sm mb-10"
        >
          104 matchs · 48 équipes · données en temps réel
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <motion.a
            href="#matches"
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,255,136,0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#00ff88] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[#00e87a]"
          >
            <Zap size={15} />
            Analyser un match maintenant
          </motion.a>
          <motion.a
            href="#how-it-works"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl glass text-[#7a8599] text-sm hover:text-[#f0f0f0] transition-colors"
          >
            Comment ça marche
          </motion.a>
        </motion.div>

        {/* Countdown */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={4}
        >
          {!isLive ? (
            <>
              <p className="text-[#3a4560] text-[11px] uppercase tracking-widest mb-5">
                Coup d&apos;envoi dans
              </p>
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <CountdownUnit value={timeLeft.days} label="jours" />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={timeLeft.hours} label="heures" />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={timeLeft.minutes} label="min" />
                <span className="text-[#2a3550] text-2xl font-light mb-5">:</span>
                <CountdownUnit value={timeLeft.seconds} label="sec" />
              </div>
            </>
          ) : (
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-neon animate-pulse-neon"
              whileHover={{ scale: 1.03 }}
            >
              <Zap size={14} className="text-[#00ff88]" />
              <span className="text-[#00ff88] font-semibold text-sm">CDM 2026 en cours — analyses live disponibles</span>
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
