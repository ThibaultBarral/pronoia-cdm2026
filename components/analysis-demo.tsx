"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Check, TrendingUp } from "lucide-react";

interface Scenario {
  homeFlag: string;
  home: string;
  awayFlag: string;
  away: string;
  reco: string;
  detail: string;
  start: number;
  target: number;
}

const SCENARIOS: Scenario[] = [
  { homeFlag: "🇫🇷", home: "France", awayFlag: "🇸🇳", away: "Sénégal", reco: "France gagne", detail: "cote 1.45 · confiance élevée", start: 100, target: 245 },
  { homeFlag: "🇧🇷", home: "Brésil", awayFlag: "🇲🇦", away: "Maroc", reco: "Plus de 2,5 buts", detail: "cote 1.80 · value détectée", start: 150, target: 320 },
  { homeFlag: "🇪🇸", home: "Espagne", awayFlag: "🇩🇪", away: "Allemagne", reco: "Les deux équipes marquent", detail: "cote 1.70 · confiance moyenne", start: 80, target: 216 },
  { homeFlag: "🇦🇷", home: "Argentine", awayFlag: "🇲🇽", away: "Mexique", reco: "Messi buteur", detail: "cote 2.10 · pari osé", start: 120, target: 372 },
];

function useCountUp(run: boolean, from: number, to: number): number {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!run) {
      setV(from);
      return;
    }
    let raf = 0;
    let startTs: number | null = null;
    const dur = 1100;
    const step = (t: number) => {
      if (startTs === null) startTs = t;
      const p = Math.min((t - startTs) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, from, to]);
  return v;
}

/**
 * Self-looping hero demo cycling through different matches & amounts.
 * Each scenario runs 4 phases (~1.5s each): 0 scan · 1 reco · 2 cagnotte · 3 hold.
 */
export default function AnalysisDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const phase = tick % 4;
  const idx = Math.floor(tick / 4) % SCENARIOS.length;
  const sc = SCENARIOS[idx];

  const showReco = phase >= 1;
  const showMoney = phase >= 2;
  const amount = useCountUp(showMoney, sc.start, sc.target);

  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl glass-strong p-5 text-left relative overflow-hidden">
      <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/25 flex items-center justify-center">
          <Bot size={16} className="text-[var(--accent)]" />
        </div>
        <div className="text-sm font-bold text-[#f0f0f0]">Analyse Copafever IA</div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--accent)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" /> live
        </span>
      </div>

      {/* Match (changes per scenario) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`match-${idx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="relative flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 mb-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{sc.homeFlag}</span>
            <span className="text-sm font-bold text-[#f0f0f0] truncate">{sc.home}</span>
          </div>
          <span className="text-[10px] text-[#5a6472] px-1">vs</span>
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="text-sm font-bold text-[#f0f0f0] truncate">{sc.away}</span>
            <span className="text-2xl">{sc.awayFlag}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reco / scanning */}
      <div className="relative min-h-[52px] mb-3">
        <AnimatePresence mode="wait">
          {!showReco ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-[#7a8599] py-3"
            >
              <span className="w-4 h-4 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin-custom" />
              L&apos;IA analyse forme, cotes &amp; value bets…
            </motion.div>
          ) : (
            <motion.div
              key={`reco-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-2 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/25 px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0">
                  <Check size={13} strokeWidth={3} color="#06231a" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#f0f0f0] truncate">{sc.reco}</div>
                  <div className="text-[10px] text-[#7a8599] truncate">{sc.detail}</div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wide text-[#06231a] bg-[var(--accent)] rounded-full px-2.5 py-1 shrink-0">
                Value
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bankroll rising */}
      <div className="relative flex items-end justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
        <div>
          <div className="text-[10px] text-[#5a6472] uppercase tracking-wide mb-0.5">Ta cagnotte</div>
          <div className="text-2xl font-black tabular-nums text-[var(--accent)]">{amount} €</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <motion.span
            animate={{ opacity: showMoney ? 1 : 0, y: showMoney ? 0 : 6 }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-soft)]"
          >
            <TrendingUp size={13} /> +{sc.target - sc.start} €
          </motion.span>
          <svg width="92" height="34" viewBox="0 0 92 34" fill="none">
            <motion.path
              key={`spark-${idx}`}
              d="M2 30 L20 26 L36 27 L52 18 L68 14 L90 3"
              stroke="url(#spark)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: showMoney ? 1 : 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="92" y2="0">
                <stop stopColor="#0F9D58" />
                <stop offset="1" stopColor="#3DF08A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
