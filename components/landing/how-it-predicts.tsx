"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Trophy, Swords, UserX, Percent } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

const INPUTS = [
  { icon: Activity, fr: "Forme récente", en: "Recent form" },
  { icon: TrendingUp, fr: "Buts attendus (xG)", en: "Expected goals (xG)" },
  { icon: Trophy, fr: "Classements", en: "Rankings" },
  { icon: Swords, fr: "Confrontations directes", en: "Head-to-head" },
  { icon: UserX, fr: "Absents & blessés", en: "Absentees & injuries" },
];

function Bar({ label, pct, accent }: { label: string; pct: number; accent: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#b8bfca]">{label}</span>
        <span className={`text-sm font-black tabular-nums ${accent ? "text-[var(--accent)]" : "text-[#e8e8e8]"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: accent ? "var(--accent)" : "#5b6472" }}
        />
      </div>
    </div>
  );
}

export default function HowItPredicts() {
  const en = useLocale() === "en";
  const copy = en
    ? {
        eyebrow: "How it works",
        title: "Cold hard numbers,",
        titleAccent: "a clear verdict.",
        subtitle: "No crystal ball. Real stats, a model that shows its work, and a read you can actually understand.",
        methodBadge: "The recipe",
        methodTitle: "What the AI really looks at.",
        methodBody:
          "It pulls live signals — form, expected goals, rankings, past meetings, who's injured — and weighs them all to work out how likely each outcome is. You just get the bottom line: which way the match leans.",
        estimated: "ESTIMATED RESULT",
        home: "Home win",
        draw: "Draw",
        away: "Away win",
        example: "Sample read",
      }
    : {
        eyebrow: "Comment ça marche",
        title: "Des chiffres bruts,",
        titleAccent: "un verdict clair.",
        subtitle: "Pas de boule de cristal. De vraies stats, un modèle qui montre son raisonnement, et une lecture que tu comprends vraiment.",
        methodBadge: "La recette",
        methodTitle: "Ce que l'IA regarde vraiment.",
        methodBody:
          "Elle récupère des signaux en direct — forme, buts attendus, classements, confrontations passées, joueurs absents — et pèse le tout pour estimer la probabilité de chaque issue. Toi, tu récupères l'essentiel : de quel côté penche le match.",
        estimated: "RÉSULTAT ESTIMÉ",
        home: "Victoire dom.",
        draw: "Match nul",
        away: "Victoire ext.",
        example: "Exemple de lecture",
      };

  return (
    <section id="how-it-works" className="border-t border-white/5 px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
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

        <div className="rounded-3xl glass p-6 sm:p-8 grid gap-8 lg:grid-cols-2 items-center">
          {/* Left — method */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-bold text-[var(--text-muted)] mb-5">
              <Percent size={13} className="text-[var(--accent)]" /> {copy.methodBadge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#f4f5f7] leading-tight mb-4">{copy.methodTitle}</h3>
            <p className="text-[#9aa3b2] text-[15px] leading-relaxed mb-6">{copy.methodBody}</p>
            <div className="flex flex-wrap gap-2">
              {INPUTS.map((inp) => {
                const Icon = inp.icon;
                return (
                  <span
                    key={inp.en}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/5 px-3 py-1.5 text-[13px] text-[#c2c8d0]"
                  >
                    <Icon size={13} className="text-[var(--accent)]" />
                    {en ? inp.en : inp.fr}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right — 1X2 illustrative output */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">{copy.estimated}</span>
              <span className="text-xs font-black text-[var(--accent)]">1X2</span>
            </div>
            <div className="space-y-4">
              <Bar label={copy.home} pct={54} accent />
              <Bar label={copy.draw} pct={24} accent={false} />
              <Bar label={copy.away} pct={22} accent={false} />
            </div>
            <p className="text-[11px] text-[#5a6472] mt-5 text-center">{copy.example}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
