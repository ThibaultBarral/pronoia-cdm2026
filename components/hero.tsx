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
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-[#111] border border-[#1e1e1e] flex items-center justify-center">
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
    <section className="gradient-hero grid-bg relative overflow-hidden pt-16 pb-20 px-4">
      {/* Decorative lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-48 bg-gradient-to-b from-[#00ff88]/50 to-transparent" />
        <div className="absolute top-0 left-1/4 w-px h-28 bg-gradient-to-b from-[#ffd700]/20 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-28 bg-gradient-to-b from-[#ffd700]/20 to-transparent" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00ff88]/4 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">

        {/* Pill badge — sharp */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#ffd700]/25 bg-[#ffd700]/5 mb-8 animate-fade-in">
          <Trophy size={11} className="text-[#ffd700]" />
          <span className="text-[10px] text-[#ffd700] font-semibold tracking-widest uppercase">
            USA · Canada · Mexique · 11 juin — 19 juillet 2026
          </span>
        </div>

        {/* Main headline — Remakeit-inspired */}
        <h1
          className="font-black text-[#f0f0f0] mb-6 animate-fade-in-up"
          style={{
            fontSize: "clamp(52px, 9vw, 100px)",
            lineHeight: "0.95",
            letterSpacing: "-0.04em",
          }}
        >
          Stop parier<br />
          à{" "}
          <span
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
        <p
          className="text-[#777] max-w-2xl mx-auto mb-3 animate-fade-in-up delay-100 leading-relaxed"
          style={{ fontSize: "clamp(15px, 2vw, 18px)" }}
        >
          <span className="text-[#c0c0c0] font-medium">Pronoia IA</span> analyse chaque match de la CDM 2026 en profondeur —
          forme, statistiques, cotes et value bets — et te livre une recommandation directe en quelques secondes.
        </p>

        <p className="text-[#444] text-sm mb-10 animate-fade-in-up delay-100">
          104 matchs · 48 équipes · données en temps réel
        </p>

        {/* CTA — sharp buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-fade-in-up delay-200">
          <a
            href="#matches"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all glow-neon"
          >
            <Zap size={14} />
            Analyser un match maintenant
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#222] text-[#777] text-sm hover:border-[#00ff88]/30 hover:text-[#f0f0f0] transition-all"
          >
            Comment ça marche
          </a>
        </div>

        {/* Countdown — flat tiles */}
        {!isLive ? (
          <div className="animate-fade-in-up delay-300">
            <p className="text-[#444] text-[10px] uppercase tracking-widest mb-5">
              Coup d&apos;envoi dans
            </p>
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <CountdownUnit value={timeLeft.days} label="jours" />
              <span className="text-[#333] text-2xl font-thin mb-5">:</span>
              <CountdownUnit value={timeLeft.hours} label="heures" />
              <span className="text-[#333] text-2xl font-thin mb-5">:</span>
              <CountdownUnit value={timeLeft.minutes} label="min" />
              <span className="text-[#333] text-2xl font-thin mb-5">:</span>
              <CountdownUnit value={timeLeft.seconds} label="sec" />
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 animate-pulse-neon">
            <Zap size={14} className="text-[#00ff88]" />
            <span className="text-[#00ff88] font-semibold text-sm">CDM 2026 en cours — analyses live disponibles</span>
          </div>
        )}

        {/* Scroll hint */}
        <div className="mt-14 flex justify-center animate-fade-in delay-500">
          <ArrowDown size={14} className="text-[#2a2a2a] animate-bounce" />
        </div>
      </div>
    </section>
  );
}
