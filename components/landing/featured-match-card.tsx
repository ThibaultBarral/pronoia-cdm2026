"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface FeaturedMatch {
  id: string;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  date: string;
  time: string;
  round: string;
}

/**
 * Real next-match card for the hero (replaces the illustrative winnings demo).
 * Shows an actual upcoming fixture and sends to signup → its free analysis.
 * 100% real data, no fabricated winnings.
 */
export default function FeaturedMatchCard({ match }: { match: FeaturedMatch }) {
  const en = useLocale() === "en";
  const copy = en
    ? { eyebrow: "Next big match", cta: "Analyze this match free", free: "1st analysis free · no card required", vs: "vs" }
    : { eyebrow: "Prochain gros match", cta: "Analyse ce match gratuitement", free: "1ʳᵉ analyse offerte · sans carte bancaire", vs: "vs" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-md mx-auto rounded-3xl glass-neon glow-neon p-5 text-left"
      style={{ borderColor: "rgba(var(--accent-rgb),0.45)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
          <Sparkles size={12} /> {copy.eyebrow}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[45%] text-right">{match.round}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-4xl leading-none">{match.home.flag}</span>
          <span className="text-sm font-black text-[var(--text)] text-center truncate w-full">{match.home.name}</span>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <span className="text-xs font-bold text-[var(--text-muted)] mb-1">{copy.vs}</span>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{match.time}</span>
          <span className="text-[10px] text-[#5a6472] tabular-nums">{match.date}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-4xl leading-none">{match.away.flag}</span>
          <span className="text-sm font-black text-[var(--text)] text-center truncate w-full">{match.away.name}</span>
        </div>
      </div>

      <a
        href="/login?mode=signup"
        onClick={() => trackEvent("signup_click", { location: "hero_match", matchId: match.id })}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
      >
        {copy.cta} <ArrowRight size={15} />
      </a>
      <p className="text-[11px] text-[var(--text-muted)] text-center mt-2.5">{copy.free}</p>
    </motion.div>
  );
}
