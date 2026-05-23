"use client";

import { useEffect, useState } from "react";
import { Trophy, Zap, ArrowDown } from "lucide-react";

const KICKOFF = new Date("2026-06-11T19:00:00-04:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#111] border border-[#1f1f1f] flex items-center justify-center glow-neon">
        <span className="text-2xl md:text-3xl font-black text-[#00ff88] tabular-nums text-glow-neon">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-[#555] uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLive = Object.values(timeLeft).every((v) => v === 0);

  return (
    <section className="gradient-hero relative overflow-hidden pt-14 pb-16 px-4">
      {/* Decorative grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[#00ff88]/40 to-transparent" />
        <div className="absolute top-0 left-1/4 w-px h-24 bg-gradient-to-b from-[#ffd700]/20 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-24 bg-gradient-to-b from-[#ffd700]/20 to-transparent" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00ff88]/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ffd700]/25 bg-[#ffd700]/5 mb-7 animate-fade-in">
          <Trophy size={12} className="text-[#ffd700]" />
          <span className="text-[11px] text-[#ffd700] font-semibold tracking-wide uppercase">
            USA · Canada · Mexique · 11 juin — 19 juillet 2026
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-[68px] font-black tracking-tight leading-[1.05] mb-5 animate-fade-in-up">
          <span className="text-[#f0f0f0]">Stop parier</span>
          <br />
          <span className="text-[#f0f0f0]">à </span>
          <span
            className="text-[#00ff88] text-glow-neon"
            style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            l&apos;aveugle
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-[#888] text-base md:text-xl max-w-2xl mx-auto mb-3 animate-fade-in-up delay-100 leading-relaxed">
          <span className="text-[#c0c0c0] font-medium">Pronoia IA</span> analyse chaque match de la CDM 2026 en profondeur —
          forme, statistiques, cotes et value bets — et te livre une recommandation directe en quelques secondes.
        </p>

        <p className="text-[#555] text-sm mb-9 animate-fade-in-up delay-100">
          104 matchs · 48 équipes · données en temps réel
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-in-up delay-200">
          <a
            href="#matches"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all hover:scale-105 glow-neon"
          >
            <Zap size={15} />
            Analyser un match maintenant
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#1f1f1f] text-[#888] text-sm hover:border-[#00ff88]/30 hover:text-[#f0f0f0] transition-all"
          >
            Comment ça marche
          </a>
        </div>

        {/* Countdown */}
        {!isLive ? (
          <div className="animate-fade-in-up delay-300">
            <p className="text-[#555] text-[11px] uppercase tracking-widest mb-4">
              Coup d&apos;envoi dans
            </p>
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <CountdownUnit value={timeLeft.days} label="jours" />
              <span className="text-[#00ff88]/40 text-xl font-bold mb-4">:</span>
              <CountdownUnit value={timeLeft.hours} label="heures" />
              <span className="text-[#00ff88]/40 text-xl font-bold mb-4">:</span>
              <CountdownUnit value={timeLeft.minutes} label="min" />
              <span className="text-[#00ff88]/40 text-xl font-bold mb-4">:</span>
              <CountdownUnit value={timeLeft.seconds} label="sec" />
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 animate-pulse-neon">
            <Zap size={14} className="text-[#00ff88]" />
            <span className="text-[#00ff88] font-semibold text-sm">CDM 2026 en cours — analyses live disponibles</span>
          </div>
        )}

        {/* Scroll hint */}
        <div className="mt-12 flex justify-center animate-fade-in delay-500">
          <ArrowDown size={16} className="text-[#333] animate-bounce" />
        </div>
      </div>
    </section>
  );
}
