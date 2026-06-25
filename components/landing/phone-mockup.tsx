"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Target } from "lucide-react";

export interface PhoneMockupProps {
  homeFlag?: string;
  homeName?: string;
  awayFlag?: string;
  awayName?: string;
  /** Illustrative 1X2 probabilities (sum ~100). */
  probHome?: number;
  probDraw?: number;
  probAway?: number;
  /** Expected goals shown in the mini stat row. */
  xgHome?: number;
  xgAway?: number;
  over25?: number;
}

/**
 * A pure-CSS iPhone frame showing a faithful, lightweight replica of the app's
 * match analysis (model verdict + 1X2 bars + a locked "full analysis" teaser).
 * No screenshot → never goes stale, themes with the emerald DA, fully responsive.
 * Decorative country flags float around the device.
 */
export default function PhoneMockup({
  homeFlag = "🇫🇷",
  homeName = "France",
  awayFlag = "🇧🇷",
  awayName = "Brésil",
  probHome = 52,
  probDraw = 26,
  probAway = 22,
  xgHome = 1.7,
  xgAway = 1.1,
  over25 = 54,
}: PhoneMockupProps) {
  const probs = [
    { label: `Victoire ${homeName}`, pct: probHome, accent: probHome >= probAway },
    { label: "Match nul", pct: probDraw, accent: false },
    { label: `Victoire ${awayName}`, pct: probAway, accent: probAway > probHome },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Floating flags */}
      <motion.div
        aria-hidden
        className="absolute -left-6 top-16 z-20 w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-lg"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {homeFlag}
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute -right-5 bottom-28 z-20 w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-lg"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {awayFlag}
      </motion.div>

      {/* Glow behind the device */}
      <div className="absolute inset-0 -z-10 blur-3xl bg-[var(--accent)]/15 rounded-full scale-90" />

      {/* Device frame */}
      <div className="relative rounded-[2.8rem] border border-white/10 bg-[#050709] p-2.5 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-[#0a0a0a] aspect-[9/19.3]">
          {/* Dynamic island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-20 h-5 rounded-full bg-black" />

          {/* App content */}
          <div className="absolute inset-0 flex flex-col px-3.5 pt-9 pb-4 text-left">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] text-[#8a93a3]">‹ Retour</span>
              <span className="text-[10px] font-bold text-[#e8e8e8]">
                {homeFlag} vs {awayFlag}
              </span>
              <span className="text-[8px] text-[var(--accent)] border border-[var(--accent)]/30 rounded px-1 py-0.5">
                CDM 2026
              </span>
            </div>

            {/* Verdict card */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-[var(--accent)]">
                  <Target size={9} /> Verdict du modèle
                </span>
                <span className="text-[7px] text-[#6a7488] border border-white/10 rounded-full px-1.5 py-0.5">
                  Aperçu
                </span>
              </div>

              <div className="space-y-2">
                {probs.map((p) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className="text-[#b8bfca]">{p.label}</span>
                      <span
                        className={`font-black tabular-nums ${
                          p.accent ? "text-[var(--accent)]" : "text-[#b8bfca]"
                        }`}
                      >
                        {p.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pct}%`,
                          background: p.accent ? "var(--accent)" : "#5b6472",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini stat row */}
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                {[
                  { v: xgHome, l: `Buts ${homeName.slice(0, 3)}` },
                  { v: xgAway, l: `Buts ${awayName.slice(0, 3)}` },
                  { v: `${over25}%`, l: "+2.5 buts" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.04] py-1.5 text-center">
                    <div className="text-[11px] font-black text-[#f0f0f0] tabular-nums">{s.v}</div>
                    <div className="text-[7px] text-[#6a7488] truncate">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked full analysis teaser */}
            <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[var(--accent)]">
              <Sparkles size={9} /> Analyse complète IA
            </div>
            <div className="mt-2 space-y-2">
              {[
                "Scénario probable du match",
                "Buteurs probables & joueurs clés",
                "Value bet & recommandation",
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-2"
                >
                  <Lock size={9} className="text-[#5a6472] shrink-0" />
                  <span className="text-[9px] text-[#aab1bd] truncate">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-auto">
              <div
                className="w-full rounded-xl py-2.5 text-center text-[10px] font-black text-[#06231a]"
                style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
              >
                Débloquer l&apos;analyse →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
