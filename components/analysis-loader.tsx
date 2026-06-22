"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

/**
 * Stepped "analysis in progress" loader (Elofoot-style). Purely cosmetic — it
 * walks through the real phases of the pipeline so the wait feels productive,
 * holding on the last step until the actual result replaces it.
 */
const STEPS = [
  "Récupération du contexte du match",
  "Identification des joueurs clés",
  "Évaluation des forces & faiblesses",
  "Projection des scénarios",
  "Calcul du pari à valeur",
];

export default function AnalysisLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => Math.min(a + 1, STEPS.length - 1)),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(((active + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-2xl glass p-5 my-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-black text-[var(--text)]">Analyse en cours…</span>
        <span className="text-[11px] text-[var(--text-muted)]">~20-30 secondes</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent-soft)]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <ul className="space-y-2.5">
        {STEPS.map((s, i) => {
          const done = i < active;
          const on = i === active;
          return (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-[var(--accent)]"
                    : on
                      ? "bg-[rgba(var(--accent-rgb),0.15)]"
                      : "bg-white/[0.05]"
                }`}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} className="text-[#06231a]" />
                ) : on ? (
                  <Loader2 size={12} className="text-[var(--accent)] animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </span>
              <span
                className={
                  done
                    ? "text-[var(--text-muted)]"
                    : on
                      ? "text-[var(--text)] font-semibold"
                      : "text-[#4a5568]"
                }
              >
                {s}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
