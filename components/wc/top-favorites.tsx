"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { TeamSimResult } from "@/lib/simulation";

const RANK_STYLE = [
  { ring: "var(--accent)", badge: "var(--accent)", fg: "#06231a" },
  { ring: "#9aa3af", badge: "#9aa3af", fg: "#0a0a0a" },
  { ring: "#c8862b", badge: "#c8862b", fg: "#1a1300" },
];

export default function TopFavorites({ favorites }: { favorites: TeamSimResult[] }) {
  if (!favorites.length) return null;

  return (
    <section className="rounded-3xl glass p-5 md:p-6">
      <h2 className="text-lg font-black text-[var(--text)]">Top 3 favoris</h2>
      <p className="text-xs text-[var(--text-muted)] mb-5">
        Victoire finale — notre simulation pondérée par les cotes du marché
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {favorites.map((t, i) => {
          const s = RANK_STYLE[i] ?? RANK_STYLE[2];
          return (
            <motion.div
              key={t.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <Link
                href={`/team/${t.slug}`}
                className="group relative flex flex-col items-center gap-2 rounded-2xl glass p-5 hover:bg-white/[0.05] transition-colors"
              >
                <span
                  className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: s.badge, color: s.fg }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-5xl rounded-full"
                  style={{ filter: `drop-shadow(0 0 12px ${s.ring}55)` }}
                >
                  {t.flag}
                </span>
                <span className="text-sm font-black text-[var(--text)] group-hover:text-[var(--accent)] transition-colors text-center">
                  {t.fr}
                </span>
                <span className="text-2xl font-black" style={{ color: s.badge }}>
                  {t.title.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                  simu {t.modelTitle.toFixed(1)}% · marché {t.marketTitle.toFixed(1)}%
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
