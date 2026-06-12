"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Check } from "lucide-react";
import type { WinItem } from "@/lib/predictions";
import { trackEvent } from "@/lib/analytics";

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: (i / 18) * 100,
  delay: Math.random() * 0.5,
  color: ["var(--accent)", "#ffd700", "var(--accent-soft)"][i % 3],
  rot: Math.random() * 360,
}));

function localDay() {
  return new Date().toLocaleDateString("en-CA");
}

export default function CelebrationModal({ wins }: { wins: WinItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!wins.length) return;
    const key = `celebration-seen-${localDay()}`;
    if (localStorage.getItem(key) === "1") return;
    const id = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(key, "1");
      trackEvent("proof_modal_view", { wins: wins.length });
    }, 1200);
    return () => clearTimeout(id);
  }, [wins]);

  if (!wins.length) return null;

  const cumOdds = wins.reduce((p, w) => p * (w.odds || 1), 1);
  const profit = Math.max(0, Math.round(100 * cumOdds - 100));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                className="absolute top-0 w-2 h-3 rounded-[1px]"
                style={{ left: `${c.x}%`, background: c.color }}
                initial={{ y: -30, opacity: 0, rotate: c.rot }}
                animate={{ y: "105vh", opacity: [0, 1, 1, 0.6], rotate: c.rot + 360 }}
                transition={{ duration: 2.6, delay: c.delay, ease: "easeIn" }}
              />
            ))}
          </div>

          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-[#ffd700]/25 bg-gradient-to-b from-[#ffd700]/[0.06] via-[#0d0d0d] to-[#0a0a0a] p-6"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>

            <div className="text-center">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-[#ffd700]/12 items-center justify-center mb-3">
                <Trophy size={22} className="text-[#ffd700]" />
              </div>
              <h2 className="text-xl font-black text-[#f0f0f0]">L&apos;IA Copafever l&apos;avait prédit ✅</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {wins.length === 1 ? "1 prédiction validée" : `${wins.length} prédictions validées`} aujourd&apos;hui
              </p>
            </div>

            {/* Ticket */}
            <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/5 divide-y divide-white/5">
              {wins.map((w) => (
                <div key={w.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <span className="text-sm shrink-0">
                    {w.homeFlag}{w.awayFlag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#e5e5e5] truncate">{w.selection}</div>
                    <div className="text-[10px] text-[#5a6472]">{w.matchLabel} · {w.market}</div>
                  </div>
                  <span className="text-xs font-bold text-[var(--accent)] tabular-nums shrink-0">@{w.odds.toFixed(2)}</span>
                  <Check size={14} strokeWidth={3} className="text-[var(--accent)] shrink-0" />
                </div>
              ))}
            </div>

            {/* Simulation */}
            <div className="mt-4 rounded-2xl bg-[#ffd700]/[0.05] border border-[#ffd700]/15 px-4 py-3 text-center">
              {wins.length > 1 && (
                <div className="text-[11px] text-[var(--text-muted)]">
                  Cote cumulée <span className="text-[#ffd700] font-black">×{cumOdds.toFixed(2)}</span>
                </div>
              )}
              <div className="text-sm text-[#cdd3db] mt-0.5">
                Mise simulée 100 € →{" "}
                <span className="text-[#ffd700] font-black">+{profit} €</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-4 w-full block text-center rounded-xl py-3 text-sm font-black text-[#06231a] glow-neon"
              style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
            >
              Voir l&apos;analyse du jour →
            </Link>

            <p className="text-[10px] text-[#5a6472] text-center mt-3 leading-relaxed">
              Basé sur les prédictions réelles et vérifiées de l&apos;IA Copafever — simulation de mise.
              18+ · Jouer comporte des risques · joueurs-info-service.fr
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
