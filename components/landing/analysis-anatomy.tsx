"use client";

import { motion } from "framer-motion";
import { BookOpenText, Percent, Goal, Scale, Users, MessageCircleQuestion } from "lucide-react";

/** What one Copafever analysis contains — the product, section by section. */
const BLOCKS = [
  {
    icon: BookOpenText,
    title: "Le scénario probable",
    body: "Comment le match devrait se dérouler : qui va avoir le ballon, qui va attendre, où ça peut basculer.",
  },
  {
    icon: Percent,
    title: "Les probabilités",
    body: "Victoire, nul, défaite : la part de chaque issue selon le modèle, avec le niveau de confiance.",
  },
  {
    icon: Goal,
    title: "Les buts attendus",
    body: "Combien de buts chaque équipe devrait marquer au vu de sa forme, de ses attaquants et de la défense en face.",
  },
  {
    icon: Scale,
    title: "Forces & faiblesses",
    body: "Le duel poste par poste : attaque, défense, milieu, forme du moment. Ce qui fait pencher le match.",
  },
  {
    icon: Users,
    title: "Les joueurs à suivre",
    body: "Ceux qui jouent et marquent vraiment en ce moment, et les absents qui changent l'équilibre.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Tes questions",
    body: "« Ils tiennent combien sans encaisser ? » « Le nouveau milieu change quoi ? » L'IA répond sur ce match précis.",
  },
];

function Bar({ label, pct, accent }: { label: string; pct: number; accent: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#c3cbe3]">{label}</span>
        <span className={`text-sm font-black tabular-nums ${accent ? "text-[var(--accent-soft)]" : "text-[var(--text)]"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: accent ? "var(--accent)" : "rgba(var(--star-rgb),0.25)" }}
        />
      </div>
    </div>
  );
}

export default function AnalysisAnatomy() {
  return (
    <section className="border-t border-white/5 px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Ce que tu obtiens</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)] leading-[1.08]">
            Une analyse complète,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              pas un tableau de stats.
            </span>
          </h2>
          <p className="text-[var(--text-muted)] text-base sm:text-lg mt-4 leading-relaxed">
            En moins d&apos;une minute, tu sais ce qui va compter dans le match. Comme si un pote calé avait
            épluché toutes les données à ta place.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 items-start">
          {/* Left — illustrative read (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl glass-strong p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Rapport de force</span>
              <span className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)] border border-white/10 rounded-full px-2 py-0.5">
                Exemple
              </span>
            </div>
            <div className="space-y-4">
              <Bar label="Victoire domicile" pct={54} accent />
              <Bar label="Match nul" pct={24} accent={false} />
              <Bar label="Victoire extérieur" pct={22} accent={false} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              {[
                { v: "1,8", l: "buts attendus dom." },
                { v: "0,9", l: "buts attendus ext." },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/[0.04] py-3 text-center">
                  <div className="text-2xl font-black text-[var(--text)] tabular-nums">{s.v}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-[#c3cbe3] leading-relaxed border-t border-white/5 pt-4">
              <span className="font-black text-[var(--accent-soft)]">Lecture : </span>
              l&apos;équipe à domicile enchaîne 4 victoires et marque à chaque match, l&apos;adversaire voyage mal
              et perd son meilleur défenseur. Avantage net, mais un match nul reste crédible si le bloc bas tient.
            </p>
          </div>

          {/* Right — the six blocks (3 cols) */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
            {BLOCKS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="rounded-2xl glass p-5"
                >
                  <span className="w-9 h-9 rounded-xl bg-[rgba(var(--accent-rgb),0.14)] flex items-center justify-center mb-3">
                    <Icon size={16} className="text-[var(--accent-soft)]" />
                  </span>
                  <h3 className="text-base font-black text-[var(--text)] mb-1.5">{b.title}</h3>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{b.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
