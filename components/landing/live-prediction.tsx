"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, CheckCircle2, Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface PredictionCard {
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  kickoff: string; // pre-formatted "Coupe du Monde · sam. 4 juil. à 23:00"
  probHome: number;
  probDraw: number;
  probAway: number;
  scoreHome: number;
  scoreAway: number;
}

/** Count-up number that starts when scrolled into view. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("fr-FR")}
    </span>
  );
}

function Bar({ label, pct, accent }: { label: string; pct: number; accent: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#b8bfca]">{label}</span>
        <span className={`text-sm font-black tabular-nums ${accent ? "text-[var(--accent)]" : "text-[#e8e8e8]"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: accent ? "var(--accent)" : "#5b6472" }}
        />
      </div>
    </div>
  );
}

export default function LivePrediction({ card, analysesCount }: { card: PredictionCard; analysesCount: number }) {
  const en = useLocale() === "en";
  const copy = en
    ? {
        eyebrow: "matches already crunched on Copafever",
        title: "All the match stats,",
        titleAccent: "chewed up for you",
        aiLabel: "AI read",
        live: "Live",
        scoreEstimate: "Likely score",
        scorers: "Likely scorers",
      }
    : {
        eyebrow: "matchs déjà passés au crible sur Copafever",
        title: "Toutes les stats du match,",
        titleAccent: "mâchées pour toi",
        aiLabel: "Lecture IA",
        live: "En direct",
        scoreEstimate: "Score probable",
        scorers: "Buteurs probables",
      };

  const maxProb = Math.max(card.probHome, card.probDraw, card.probAway);

  return (
    <section className="relative overflow-hidden border-t border-white/5 px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          </span>
          <span className="text-sm text-[var(--text-muted)]">
            <CountUp to={analysesCount} className="font-black text-[var(--accent)] tabular-nums" /> {copy.eyebrow}
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f4f5f7] leading-[1.08] mb-12">
          {copy.title}{" "}
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

        {/* Live prediction card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl glass-strong p-5 sm:p-6 text-left"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[rgba(var(--accent-rgb),0.14)] flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[var(--accent)]" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-black text-[#f4f5f7]">{copy.aiLabel}</p>
                <p className="text-xs text-[var(--text-muted)] leading-snug">{card.kickoff}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--accent)] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              {copy.live}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-3xl shrink-0">
                {card.homeFlag}
              </span>
              <span className="text-sm font-black text-[#f4f5f7] text-center truncate w-full">{card.homeName}</span>
            </div>
            <span className="text-lg font-black text-[var(--text-muted)] shrink-0">VS</span>
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-3xl shrink-0">
                {card.awayFlag}
              </span>
              <span className="text-sm font-black text-[#f4f5f7] text-center truncate w-full">{card.awayName}</span>
            </div>
          </div>

          {/* Probability bars */}
          <div className="space-y-3.5 pt-5 border-t border-white/5">
            <Bar label={card.homeName} pct={card.probHome} accent={card.probHome === maxProb} />
            <Bar label={en ? "Draw" : "Match nul"} pct={card.probDraw} accent={card.probDraw === maxProb} />
            <Bar label={card.awayName} pct={card.probAway} accent={card.probAway === maxProb} />
          </div>

          {/* Estimated score + locked scorers */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-[#d8dde5]">
                <CheckCircle2 size={16} className="text-[var(--accent)]" />
                {copy.scoreEstimate} : <span className="font-black text-[#f4f5f7]">{card.scoreHome} - {card.scoreAway}</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">Free</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-[#8a93a5]">
                <Lock size={15} className="text-[#5a6472]" />
                {copy.scorers}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]">
                Pro
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
