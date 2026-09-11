"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Swords,
  Users,
  UserX,
  Goal,
  Trophy,
  BarChart3,
  Home,
  Database,
  Cpu,
  MessageSquareText,
} from "lucide-react";

/** The real signals every analysis is built on (all from live sports data). */
const SIGNALS = [
  { icon: Activity, label: "Forme sur les 10 derniers matchs" },
  { icon: Goal, label: "Buts marqués & encaissés" },
  { icon: Home, label: "Rendement domicile / extérieur" },
  { icon: Swords, label: "Confrontations directes" },
  { icon: Users, label: "Effectifs & compositions" },
  { icon: UserX, label: "Blessés & suspendus" },
  { icon: Trophy, label: "Classement & dynamique" },
  { icon: BarChart3, label: "Stats individuelles des joueurs" },
];

const STEPS = [
  {
    icon: Database,
    title: "On collecte",
    body: "Des millions de données de matchs, mises à jour en continu sur les 7 grandes compétitions : résultats, buts, compositions, absents, statistiques joueurs.",
  },
  {
    icon: Cpu,
    title: "On calcule",
    body: "Un modèle statistique pèse chaque signal et estime la probabilité de chaque issue, les buts attendus et le rapport de force des deux équipes.",
  },
  {
    icon: MessageSquareText,
    title: "On explique",
    body: "L'IA traduit les chiffres en une lecture claire : le scénario probable, les forces et faiblesses, les joueurs à suivre. Et tu peux lui poser tes questions.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DataEngine() {
  return (
    <section id="how-it-works" className="relative border-t border-white/5 px-4 py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 starfield opacity-60" />
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Comment ça marche</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)] leading-[1.08]">
            Des millions de données,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              une seule lecture.
            </span>
          </h2>
          <p className="text-[var(--text-muted)] text-base sm:text-lg mt-4 leading-relaxed">
            Pas de boule de cristal, pas d&apos;avis de comptoir. Copafever part de ce qui s&apos;est vraiment passé sur le
            terrain et te montre son raisonnement.
          </p>
        </div>

        {/* Three steps */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="rounded-3xl glass p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.14)] flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[var(--accent-soft)]" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wide text-[var(--text-muted)]">
                    Étape {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[var(--text)] mb-2">{s.title}</h3>
                <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">{s.body}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Signals */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          custom={3}
          className="rounded-3xl glass p-6 sm:p-8"
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="text-lg font-black text-[var(--text)]">Ce qui entre dans chaque analyse</h3>
            <span className="hidden sm:inline text-xs text-[var(--text-muted)]">Données réelles, jamais inventées</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SIGNALS.map((s) => {
              const Icon = s.icon;
              return (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-[13px] text-[#c3cbe3]"
                >
                  <Icon size={14} className="text-[var(--accent-soft)] shrink-0" />
                  {s.label}
                </span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
