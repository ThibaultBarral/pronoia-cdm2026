"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

/** A single verified, settled-as-won prediction (plain shape, server-mapped). */
export interface VerifiedRow {
  id: string;
  matchLabel: string;
  homeFlag: string | null;
  awayFlag: string | null;
  market: string;
  selection: string;
  odds: number;
}

export interface VerifiedResultsData {
  winRate: number;
  won: number;
  total: number;
  rows: VerifiedRow[];
}

/**
 * "Trouvé juste" — the honest, Elofoot-style proof section. Everything here is
 * REAL: predictions are logged before kickoff and verified after (won AND lost),
 * pulled from verified_predictions. The opposite of a tipster only flexing wins.
 * Rendered only by the server parent when there is meaningful data.
 */
export default function VerifiedResults({ data }: { data: VerifiedResultsData }) {
  const en = useLocale() === "en";
  const { winRate, won, rows } = data;

  const copy = en
    ? {
        eyebrow: "Verified predictions",
        title: "Found right.",
        titleAccent: "No storytelling after the fact.",
        subtitle:
          "Every pick is logged before kickoff and checked after — wins AND losses. The whole record is public.",
        stat1: `${winRate}% hit rate`,
        stat2: `${won} verified winning picks`,
        found: "Found right",
        cta: "See the full record",
      }
    : {
        eyebrow: "Pronostics vérifiés",
        title: "Trouvé juste.",
        titleAccent: "Aucun storytelling après coup.",
        subtitle:
          "Chaque prono est enregistré AVANT le coup d'envoi et vérifié après — gagnants ET perdants. Tout l'historique est public.",
        stat1: `${winRate}% de réussite`,
        stat2: `${won} pronos gagnants vérifiés`,
        found: "Trouvé juste",
        cta: "Voir tout l'historique",
      };

  return (
    <section className="border-t border-white/5 bg-[#060910]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-9">
          <p className="text-xs text-[var(--accent)] uppercase tracking-widest mb-2 font-bold inline-flex items-center gap-1.5">
            <ShieldCheck size={13} /> {copy.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0] leading-tight">
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
          <p className="text-sm text-[var(--text-muted)] mt-3 max-w-xl mx-auto">{copy.subtitle}</p>

          {winRate > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-5">
              <span className="text-sm font-black text-[var(--accent)]">{copy.stat1}</span>
              <span className="text-sm font-bold text-[var(--text-muted)]">{copy.stat2}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-2xl glass p-4 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {r.homeFlag && <span className="text-base shrink-0">{r.homeFlag}</span>}
                  <span className="text-sm font-bold text-[var(--text)] truncate">{r.matchLabel}</span>
                  {r.awayFlag && <span className="text-base shrink-0">{r.awayFlag}</span>}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)] shrink-0">
                  <Check size={11} strokeWidth={3} /> {copy.found}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {r.market && (
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{r.market}</p>
                  )}
                  <p className="text-sm text-[#d8dde5] font-semibold truncate">{r.selection}</p>
                </div>
                {r.odds > 0 && (
                  <span className="text-base font-black text-[var(--accent)] shrink-0 tabular-nums">
                    @{r.odds.toFixed(2)}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/track-record"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:text-[var(--accent-soft)] transition-colors"
          >
            {copy.cta} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
