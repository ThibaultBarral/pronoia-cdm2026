"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * "Why our AI beats the tipsters" — the Elofoot-style trust section. Leads with a
 * real, honest hit-rate figure, then attacks the dishonest tipster playbook (only
 * showing winning bets, gut feeling, hidden bookmaker affiliations) and contrasts
 * it with the honest, data-driven product. Bilingual inline (FR/EN).
 */
export default function ComparisonSection({ winRate = 0 }: { winRate?: number }) {
  const locale = useLocale();
  const en = locale === "en";

  const copy = en
    ? {
        eyebrow: "Numbers in hand",
        heading: "The AI, not some influencer's gut feeling",
        headingSub: "Zero hype, zero sponsored bet. Just real data and a public record you can check yourself.",
        bigStatLabel: "correct calls (winner or draw) on the matches the AI has crunched",
        title: "Influencers sell you dreams.",
        titleAccent: "We give you probabilities.",
        subtitle: "The difference between a tipster and real AI analysis.",
        tipster: "The average tipster",
        us: "Copafever",
        rows: [
          ["Only shows you their winning bets", "Public track record: wins AND losses"],
          ["Gut feeling and vibes", "xG, form, H2H, line-ups — real data"],
          ["Pushes 10/1 accumulators", "An honest confidence level per bet"],
          ["Vanishes after a bad run", "Model recomputed & verifiable every match"],
          ["Secretly affiliated with bookmakers", "Zero hidden affiliation — just the analysis"],
        ],
      }
    : {
        eyebrow: "Chiffres en main",
        heading: "L'IA, pas le feeling d'un influenceur",
        headingSub: "Zéro hype, zéro pari sponsorisé. Juste des vraies données et un historique public que tu peux vérifier toi-même.",
        bigStatLabel: "de résultats corrects (vainqueur ou nul) sur les matchs passés au crible de l'IA",
        title: "Un influenceur te vend du rêve.",
        titleAccent: "Nous, des probabilités.",
        subtitle: "La différence entre un tipster et une vraie analyse par IA.",
        tipster: "L'influenceur lambda",
        us: "Copafever",
        rows: [
          ["Ne te montre que ses paris gagnants", "Track record public : gains ET pertes"],
          ["Du feeling, des intuitions", "xG, forme, H2H, compos — données réelles"],
          ["Te pousse des combinés à 10 de cote", "Un niveau de confiance honnête par pari"],
          ["Disparaît après une mauvaise série", "Modèle recalculé et vérifiable à chaque match"],
          ["Affilié aux bookmakers en douce", "Zéro affiliation cachée — juste l'analyse"],
        ],
      };

  return (
    <section className="border-t border-white/5 bg-[#060910]">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Proof-in-the-facts header */}
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">{copy.eyebrow}</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f4f5f7] leading-[1.08]">{copy.heading}</h2>
          <p className="text-[#9aa3b2] text-base sm:text-lg mt-4 leading-relaxed">{copy.headingSub}</p>
        </div>

        {winRate > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div
              className="text-7xl sm:text-8xl font-black tabular-nums leading-none"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {winRate}%
            </div>
            <p className="text-[var(--text-muted)] text-sm sm:text-base mt-4 max-w-md mx-auto leading-relaxed">
              {copy.bigStatLabel}
            </p>
          </motion.div>
        )}

        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-[#f0f0f0] leading-tight">
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
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-3 max-w-lg mx-auto">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Tipster column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl glass p-6 opacity-90"
          >
            <h3 className="text-base font-black text-[var(--text-muted)] mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#ef4444]/12 flex items-center justify-center shrink-0">
                <X size={15} className="text-[#ff6b6b]" />
              </span>
              {copy.tipster}
            </h3>
            <ul className="space-y-3.5">
              {copy.rows.map(([bad]) => (
                <li key={bad} className="flex items-start gap-2.5 text-sm text-[#8a93a5]">
                  <X size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-[#ef4444]/70" />
                  <span className="line-through decoration-[#ef4444]/30">{bad}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Copafever column */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl glass-neon glow-neon p-6"
            style={{ borderColor: "rgba(var(--accent-rgb),0.55)" }}
          >
            <h3 className="text-base font-black text-[var(--text)] mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[rgba(var(--accent-rgb),0.14)] flex items-center justify-center shrink-0">
                <Check size={15} strokeWidth={3} className="text-[var(--accent)]" />
              </span>
              {copy.us}
            </h3>
            <ul className="space-y-3.5">
              {copy.rows.map(([, good]) => (
                <li key={good} className="flex items-start gap-2.5 text-sm text-[#d8dde5]">
                  <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  <span>{good}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
