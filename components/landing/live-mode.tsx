"use client";

import { motion } from "framer-motion";
import { Radio, Timer, Goal, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function LiveMode() {
  const en = useLocale() === "en";
  const copy = en
    ? {
        live: "Live",
        eyebrow: "Match already kicked off?",
        title: "Lances it at halftime?",
        titleAccent: "The read adjusts.",
        subtitle:
          "Copafever doesn't ignore what's already happened. Open it mid-game and it reads from the real scoreline — not some theoretical kickoff — so the projection matches what you're actually watching.",
        cards: [
          {
            icon: Timer,
            title: "It starts from the real score",
            body: "It's 2-0 at the 60'? The projection builds on 2-0, not on a fresh kickoff. No more \"1-0 favourite\" when the game's already decided — you get the likely FINAL score from here.",
          },
          {
            icon: Goal,
            title: "Goals & minutes count",
            body: "Cards, goals, a shift in momentum — whatever already happened on the pitch is baked in, so the remaining scenarios stay grounded in reality.",
          },
          {
            icon: RefreshCw,
            title: "It keeps up as the game moves",
            body: "Relaunch after a red card or a late goal and the read shifts with it. The projection tracks the match instead of freezing at kickoff.",
          },
        ],
      }
    : {
        live: "En direct",
        eyebrow: "Match déjà commencé ?",
        title: "Tu lances à la mi-temps ?",
        titleAccent: "La lecture s'adapte.",
        subtitle:
          "Copafever ne fait pas comme si le match commençait. Ouvre-le en cours de jeu et il part du vrai score au tableau — pas d'un coup d'envoi théorique — pour coller à ce que tu regardes vraiment.",
        cards: [
          {
            icon: Timer,
            title: "Il part du vrai score",
            body: "C'est 2-0 à la 60' ? La projection se construit sur du 2-0, pas sur un match qui recommence. Fini le « favori à 1-0 » alors que c'est déjà plié — tu obtiens le score FINAL probable à partir d'ici.",
          },
          {
            icon: Goal,
            title: "Buts & minutes comptent",
            body: "Cartons, buts, un momentum qui bascule — tout ce qui s'est déjà passé sur le terrain est intégré, pour garder des scénarios ancrés dans le réel.",
          },
          {
            icon: RefreshCw,
            title: "Il suit le fil du match",
            body: "Relance après un carton rouge ou un but tardif : la lecture bouge avec. La projection suit le match au lieu de rester figée au coup d'envoi.",
          },
        ],
      };

  return (
    <section className="border-t border-white/5 bg-[#060910] px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 bg-[#ef4444]/12 border border-[#ef4444]/30">
            <Radio size={13} className="text-[#ff6b6b]" />
            <span className="text-[11px] font-black uppercase tracking-wide text-[#ff8585]">{copy.live}</span>
          </span>
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
          {copy.cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.1, 0.3) }}
                className="rounded-3xl glass p-6"
              >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(var(--accent-rgb),0.12)] border border-[rgba(var(--accent-rgb),0.25)] mb-5">
                  <Icon size={20} className="text-[var(--accent)]" />
                </span>
                <h3 className="text-lg font-black text-[#f4f5f7] mb-2.5">{c.title}</h3>
                <p className="text-sm text-[#9aa3b2] leading-relaxed">{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
