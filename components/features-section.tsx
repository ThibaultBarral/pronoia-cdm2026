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
    desc: "Un clic. Pronoia IA reçoit toutes les données du match et génère une analyse structurée en temps réel.",
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
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 pt-4 pb-14">
        {/* Section label */}
        <div className="text-center mb-12">
          <p className="text-[10px] text-[#444] uppercase tracking-[0.2em] mb-3">Ce que l&apos;IA analyse</p>
          <h2
            className="font-bold text-[#f0f0f0]"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: "1.05" }}
          >
            Une analyse complète,{" "}
            <span className="text-[#00ff88]">pas juste des stats</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="bg-[#0d0d0d] p-6 flex flex-col gap-4 hover:bg-[#111] transition-colors group"
            >
              <div
                className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{ background: `${color}12`, border: `1px solid ${color}20` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <h3 className="font-bold text-[#f0f0f0] text-sm mb-2 tracking-tight">{title}</h3>
                <p className="text-[#555] text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 relative">
          <div className="hidden md:block absolute top-5 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-[#1e1e1e]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1e1e1e] flex items-center justify-center">
                  <span className="text-[11px] font-black text-[#00ff88] tracking-wider">{step}</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#f0f0f0] text-sm mb-1.5 tracking-tight">{title}</h4>
                  <p className="text-[#555] text-xs leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {[
            { icon: Clock, text: "Analyse en < 15 secondes", color: "#00ff88" },
            { icon: Shield, text: "Données API-Football en temps réel", color: "#ffd700" },
            { icon: BarChart2, text: "Analyse IA data-driven en temps réel", color: "#00d4ff" },
          ].map(({ icon: Icon, text, color }) => (
            <div
              key={text}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] bg-[#0d0d0d] text-xs"
              style={{ color }}
            >
              <Icon size={10} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
