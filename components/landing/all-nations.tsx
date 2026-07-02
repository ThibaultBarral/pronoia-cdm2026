"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface Nation {
  name: string;
  flag: string;
}

/**
 * "48 nations, one World Cup — we've got them all." A rotating hero flag flanked
 * by the neighbouring nations, over a wall of every qualified flag. Nations are
 * real teams passed from the server.
 */
export default function AllNations({ nations }: { nations: Nation[] }) {
  const en = useLocale() === "en";
  const [i, setI] = useState(0);

  useEffect(() => {
    if (nations.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % nations.length), 2200);
    return () => clearInterval(id);
  }, [nations.length]);

  if (!nations.length) return null;

  const prev = nations[(i - 1 + nations.length) % nations.length];
  const cur = nations[i];
  const next = nations[(i + 1) % nations.length];

  const copy = en
    ? {
        title: "48 nations qualified.",
        titleAccent: "Not one left out.",
        subtitle: "From the giants to the outsiders — form, stats and missing players, ready the moment the fixture drops.",
      }
    : {
        title: "48 nations qualifiées.",
        titleAccent: "Aucune oubliée.",
        subtitle: "Des cadors aux petits poucets — forme, stats et absents, prêts dès que le match tombe au calendrier.",
      };

  return (
    <section className="relative overflow-hidden border-t border-white/5 px-4 py-24">
      <div className="max-w-3xl mx-auto text-center">
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
        <p className="text-[#9aa3b2] text-base sm:text-lg mt-5 max-w-xl mx-auto leading-relaxed">{copy.subtitle}</p>

        {/* Rotating flag */}
        <div className="mt-14 flex items-center justify-center gap-6 sm:gap-12">
          <span className="hidden sm:block text-lg font-bold text-[#3a4150] truncate w-40 text-right">{prev.name}</span>
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            <div className="absolute inset-0 -z-10 blur-3xl bg-[var(--accent)]/20 rounded-full" />
            <AnimatePresence mode="wait">
              <motion.div
                key={cur.name}
                initial={{ opacity: 0, rotateY: -60, scale: 0.8 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 60, scale: 0.8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full rounded-3xl glass-strong flex items-center justify-center text-6xl sm:text-7xl"
              >
                {cur.flag}
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="hidden sm:block text-lg font-bold text-[#3a4150] truncate w-40 text-left">{next.name}</span>
        </div>
        <div className="mt-5 h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={cur.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-base font-black text-[var(--accent)]"
            >
              {cur.name}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Flag wall */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto opacity-70">
          {nations.map((n) => (
            <span
              key={n.name}
              title={n.name}
              className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-lg"
            >
              {n.flag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
