"use client";

import { motion } from "framer-motion";
import { COMPETITIONS, TOTAL_SEASON_MATCHES, COVERED_SEASON_LABEL } from "@/lib/competitions";

/** The 7 covered competitions — real ids / match counts from lib/competitions. */
export default function CompetitionsSection() {
  const domestic = COMPETITIONS.filter((c) => c.kind === "domestic");
  const european = COMPETITIONS.filter((c) => c.kind === "european");

  const Card = ({ c, i, big }: { c: (typeof COMPETITIONS)[number]; i: number; big?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05, duration: 0.4 }}
      className={`rounded-2xl p-5 flex items-center gap-4 ${big ? "glass-neon" : "glass"}`}
    >
      <span className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl shrink-0">
        {c.flag}
      </span>
      <div className="min-w-0">
        <div className="text-base font-black text-[var(--text)] truncate">{c.name}</div>
        <div className="text-xs text-[var(--text-muted)]">
          {c.country} · {c.matchCount} matchs
        </div>
      </div>
    </motion.div>
  );

  return (
    <section id="competitions" className="relative border-t border-white/5 px-4 py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 starfield opacity-50" />
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
            Saison {COVERED_SEASON_LABEL}
          </p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)] leading-[1.08]">
            Les grands championnats,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              et les soirées européennes.
            </span>
          </h2>
          <p className="text-[var(--text-muted)] text-base sm:text-lg mt-4 leading-relaxed">
            <span className="font-black text-[var(--accent-soft)] tabular-nums">
              {TOTAL_SEASON_MATCHES.toLocaleString("fr-FR")}
            </span>{" "}
            matchs analysables sur la saison, du vendredi soir de Ligue 1 à la finale de Ligue des Champions.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 mb-3">
          {european.map((c, i) => (
            <Card key={c.slug} c={c} i={i} big />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {domestic.map((c, i) => (
            <Card key={c.slug} c={c} i={i + 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
