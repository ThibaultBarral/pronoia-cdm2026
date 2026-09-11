"use client";

import { motion } from "framer-motion";
import { Ban, Check } from "lucide-react";

const NOT = [
  {
    title: "Pas un site de paris",
    body: "Aucune cote, aucune mise, aucun lien vers un bookmaker. Copafever ne te dit jamais sur quoi placer de l'argent.",
  },
  {
    title: "Pas une promesse de gains",
    body: "On ne parle ni d'argent, ni de rendement, ni de « méthode qui rapporte ». Un match de foot reste imprévisible, et on le dit.",
  },
  {
    title: "Pas des pronos de comptoir",
    body: "Aucune intuition, aucun « j'ai un bon feeling ». Chaque phrase de l'analyse s'appuie sur une donnée réelle qu'on te montre.",
  },
];

const IS = [
  {
    title: "Comprendre le match avant le coup d'envoi",
    body: "Qui est en forme, qui manque, qui a l'avantage et pourquoi. La lecture d'un supporter qui aurait tout épluché.",
  },
  {
    title: "Voir les chiffres derrière chaque affirmation",
    body: "Forme, buts, confrontations, effectifs : la donnée est là, sous la lecture. Tu peux vérifier.",
  },
  {
    title: "Poser tes questions à l'IA sur ce match précis",
    body: "Un doute sur la défense, une question sur un joueur ? L'IA répond à partir des données du match.",
  },
];

export default function NotABettingApp() {
  return (
    <section className="border-t border-white/5 px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Pour être clair</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)] leading-[1.08]">
            Copafever analyse des matchs.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Point.
            </span>
          </h2>
          <p className="text-[var(--text-muted)] text-base sm:text-lg mt-4 leading-relaxed">
            Le foot se comprend mieux avec les bonnes données. C&apos;est tout ce qu&apos;on fait, et on préfère le dire
            noir sur blanc.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* What it is NOT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl glass p-6 sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a8a] mb-5">Ce que ce n&apos;est pas</p>
            <ul className="space-y-5">
              {NOT.map((n) => (
                <li key={n.title} className="flex gap-3.5">
                  <span className="w-8 h-8 rounded-lg bg-[#ef4444]/12 border border-[#ef4444]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Ban size={14} className="text-[#ff8a8a]" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[var(--text)] mb-1">{n.title}</h3>
                    <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* What it IS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-3xl glass-neon p-6 sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)] mb-5">Ce que c&apos;est</p>
            <ul className="space-y-5">
              {IS.map((n) => (
                <li key={n.title} className="flex gap-3.5">
                  <span className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.16)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} className="text-[var(--accent-soft)]" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[var(--text)] mb-1">{n.title}</h3>
                    <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
