"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";
import type { PredictionCard } from "./live-prediction";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trackEvent } from "@/lib/analytics";

function MiniBar({ label, pct, accent }: { label: string; pct: number; accent: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-[#aab1bd] truncate pr-2">{label}</span>
        <span className={`text-[13px] font-black tabular-nums shrink-0 ${accent ? "text-[var(--accent)]" : "text-[#dfe3e9]"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: accent ? "var(--accent)" : "#5b6472" }}
        />
      </div>
    </div>
  );
}

function DecodedCard({ card, index }: { card: PredictionCard; index: number }) {
  const en = useLocale() === "en";
  const max = Math.max(card.probHome, card.probDraw, card.probAway);
  const topLabel = card.probHome === max ? card.homeName : card.probAway === max ? card.awayName : en ? "Draw" : "Nul";
  const copy = {
    league: en ? "World Cup" : "Coupe du Monde",
    predictionLabel: en ? "AI READ" : "LECTURE IA",
    predictionBody: en
      ? "Probabilities crunched by Copafever from real data — expected goals, form and past meetings."
      : "Probabilités calculées par Copafever à partir de vraies données — buts attendus, forme et confrontations passées.",
    mostLikely: en ? "MOST LIKELY" : "LE PLUS PROBABLE",
    score: en ? "Likely score" : "Score probable",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.1, 0.3) }}
      className="rounded-3xl glass p-5 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--accent)]">
          <Trophy size={12} /> {copy.league}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[45%] text-right">{card.kickoff}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl">{card.homeFlag}</span>
          <span className="text-[13px] font-black text-[#f4f5f7] text-center truncate w-full">{card.homeName}</span>
        </div>
        <span className="text-sm font-black text-[var(--text-muted)] shrink-0">VS</span>
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl">{card.awayFlag}</span>
          <span className="text-[13px] font-black text-[#f4f5f7] text-center truncate w-full">{card.awayName}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-2.5 pt-4 border-t border-white/5">
        <MiniBar label={card.homeName} pct={card.probHome} accent={card.probHome === max} />
        <MiniBar label={en ? "Draw" : "Nul"} pct={card.probDraw} accent={card.probDraw === max} />
        <MiniBar label={card.awayName} pct={card.probAway} accent={card.probAway === max} />
      </div>

      {/* Prediction note */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)] mb-1">{copy.predictionLabel}</p>
        <p className="text-[13px] text-[#c2c8d0] leading-relaxed">{copy.predictionBody}</p>
      </div>

      {/* Most likely outcome */}
      <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)] mb-0.5">{copy.mostLikely}</p>
            <p className="text-sm font-black text-[#f4f5f7]">
              {topLabel} <span className="text-[var(--accent)]">{max}%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)] mb-0.5">{copy.score}</p>
            <p className="text-sm font-black text-[#f4f5f7] tabular-nums">{card.scoreHome} - {card.scoreAway}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DecodedMatches({ cards }: { cards: PredictionCard[] }) {
  const en = useLocale() === "en";
  if (!cards.length) return null;
  const copy = en
    ? {
        eyebrow: "See for yourself",
        title: "Big fixtures,",
        titleAccent: "put through the grinder.",
        subtitle: "Real examples, straight from the app: the favourite, a likely score and the trends that tip the match.",
        cta: "Try it on a match — free",
      }
    : {
        eyebrow: "Juge par toi-même",
        title: "Des gros matchs,",
        titleAccent: "passés à la moulinette.",
        subtitle: "De vrais exemples, directement tirés de l'appli : le favori, un score probable et les tendances qui font pencher le match.",
        cta: "Teste sur un match — offert",
      };

  return (
    <section className="border-t border-white/5 bg-[#060910] px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">{copy.eyebrow}</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f4f5f7] leading-[1.08]">
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
          <p className="text-[#9aa3b2] text-base sm:text-lg mt-4 leading-relaxed">{copy.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.slice(0, 3).map((c, i) => (
            <DecodedCard key={`${c.homeName}-${c.awayName}`} card={c} index={i} />
          ))}
        </div>

        <div className="text-center mt-12">
          <motion.a
            href="/login?mode=signup"
            onClick={() => trackEvent("signup_click", { location: "decoded_matches" })}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(var(--accent-rgb),0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[var(--accent-soft)]"
          >
            <Sparkles size={16} />
            {copy.cta}
            <ArrowRight size={16} />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
