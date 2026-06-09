"use client";

import { motion, type Variants } from "framer-motion";
import { Target, Sword, BarChart2, Lightbulb, Clock, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    color: "var(--accent)",
    grad: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), color-mix(in srgb, var(--accent-soft) 5%, transparent))",
    title: "Contexte & Enjeux",
    desc: "Forme récente, blessures, suspensions, pression psychologique et historique des confrontations. Rien n'est laissé au hasard.",
  },
  {
    icon: Sword,
    color: "#ffd700",
    grad: "linear-gradient(135deg, color-mix(in srgb, #ffd700 15%, transparent), color-mix(in srgb, #ff6b35 5%, transparent))",
    title: "Forces & Faiblesses",
    desc: "Analyse tactique poussée des deux équipes. Qui domine les duels aériens ? Quelle défense est poreuse sur les contres ?",
  },
  {
    icon: BarChart2,
    color: "var(--accent-soft)",
    grad: "linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 15%, transparent), color-mix(in srgb, #7c3aed 5%, transparent))",
    title: "Décryptage des cotes",
    desc: "L'IA compare les probabilités implicites des bookmakers avec sa propre évaluation et détecte les value bets sous-cotés.",
  },
  {
    icon: Lightbulb,
    color: "#ff6b35",
    grad: "linear-gradient(135deg, color-mix(in srgb, #ff6b35 15%, transparent), color-mix(in srgb, #ffd700 5%, transparent))",
    title: "Recommandation directe",
    desc: "Un pari actionnable avec raisonnement complet. Faible · Moyen · Élevé. Pas de flou, juste de la clarté.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Choisissez un match", desc: "Parcourez les 72 matchs de groupe de la CDM 2026, filtrés par groupe ou date." },
  { step: "02", title: "Lancez l'analyse IA", desc: "Un clic. Copafever IA reçoit toutes les données et génère une analyse structurée en temps réel." },
  { step: "03", title: "Pariez avec conviction", desc: "Recommandation en moins de 15 secondes. Contexte, cotes, value bet — tout est là." },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function FeaturesSection() {
  return (
    <>
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 pt-4 pb-14">
        {/* Label + H2 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-3 font-medium">Ce que l&apos;IA analyse</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0] leading-tight">
            Une analyse complète,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              pas juste des stats
            </span>
          </h2>
        </motion.div>

        {/* Feature cards — glass avec hover */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {FEATURES.map(({ icon: Icon, color, grad, title, desc }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -6, boxShadow: `0 20px 40px color-mix(in srgb, ${color} 9%, transparent)` }}
              className="glass rounded-2xl p-5 flex flex-col gap-4 cursor-default transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundImage: grad, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <h3 className="font-bold text-[#f0f0f0] text-sm mb-1.5">{title}</h3>
                <p className="text-[#4a5568] text-xs leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          className="mt-16"
          variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">Comment ça marche</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-[var(--accent)]/20 via-[var(--accent-soft)]/20 to-[var(--accent)]/20" />
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step} variants={item}
                className="flex flex-col items-center text-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1, boxShadow: "0 0 24px rgba(var(--accent-rgb),0.3)" }}
                  className="w-14 h-14 rounded-2xl glass-neon flex items-center justify-center"
                >
                  <span className="text-sm font-black text-[var(--accent)] tracking-wider">{step}</span>
                </motion.div>
                <div>
                  <h4 className="font-bold text-[#f0f0f0] text-sm mb-1">{title}</h4>
                  <p className="text-[#4a5568] text-xs leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { icon: Clock, text: "Analyse en < 15 secondes", color: "var(--accent)" },
            { icon: Shield, text: "Données sportives en temps réel", color: "#ffd700" },
            { icon: BarChart2, text: "Analyse IA data-driven en temps réel", color: "var(--accent-soft)" },
          ].map(({ icon: Icon, text, color }) => (
            <motion.div
              key={text}
              whileHover={{ scale: 1.04 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs"
              style={{ color }}
            >
              <Icon size={11} />
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}
