import { Target, Sword, BarChart2, Lightbulb, Clock, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    color: "#00ff88",
    title: "Contexte & Enjeux",
    desc: "Forme récente, blessures, suspensions, pression psychologique et historique des confrontations. Rien n'est laissé au hasard.",
  },
  {
    icon: Sword,
    color: "#ffd700",
    title: "Forces & Faiblesses",
    desc: "Analyse tactique poussée des deux équipes sur ce tournoi. Qui domine les duels aériens ? Quelle défense est poreuse sur les contres ?",
  },
  {
    icon: BarChart2,
    color: "#00d4ff",
    title: "Décryptage des cotes",
    desc: "L'IA compare les probabilités implicites des bookmakers avec sa propre évaluation et détecte les value bets sous-cotés.",
  },
  {
    icon: Lightbulb,
    color: "#ff6b35",
    title: "Recommandation directe",
    desc: "Un pari actionnable avec raisonnement complet et niveau de confiance. Faible · Moyen · Élevé. Pas de flou, juste de la clarté.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choisissez un match",
    desc: "Parcourez les 72 matchs de groupe de la CDM 2026, filtrés par groupe ou date.",
  },
  {
    step: "02",
    title: "Lancez l'analyse IA",
    desc: "Un clic. Claude reçoit toutes les données du match et génère une analyse structurée en temps réel.",
  },
  {
    step: "03",
    title: "Pariez avec conviction",
    desc: "Obtenez votre recommandation en moins de 15 secondes. Contexte, cotes, value bet — tout est là.",
  },
];

export default function FeaturesSection() {
  return (
    <>
      {/* Feature cards */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 pt-4 pb-12">
        {/* Section label */}
        <div className="text-center mb-10">
          <p className="text-xs text-[#555] uppercase tracking-widest mb-2">Ce que l&apos;IA analyse</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f0f0f0]">
            Une analyse complète,{" "}
            <span className="text-[#00ff88]">pas juste des stats</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-5 flex flex-col gap-3 hover:border-[#2a2a2a] transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <h3 className="font-bold text-[#f0f0f0] text-sm mb-1">{title}</h3>
                <p className="text-[#666] text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-14 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-[#00ff88]/20 via-[#ffd700]/20 to-[#00ff88]/20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center">
                  <span className="text-xs font-black text-[#00ff88] tracking-wider">{step}</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#f0f0f0] text-sm mb-1">{title}</h4>
                  <p className="text-[#666] text-xs leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed + precision badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            { icon: Clock, text: "Analyse en < 15 secondes", color: "#00ff88" },
            { icon: Shield, text: "Données API-Football en temps réel", color: "#ffd700" },
            { icon: BarChart2, text: "Modèle Claude claude-sonnet-4-5 — Anthropic", color: "#00d4ff" },
          ].map(({ icon: Icon, text, color }) => (
            <div
              key={text}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1f1f1f] bg-[#111] text-xs"
              style={{ color }}
            >
              <Icon size={11} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
