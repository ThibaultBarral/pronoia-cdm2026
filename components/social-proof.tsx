import { Star, TrendingUp, Users, Zap } from "lucide-react";

const STATS = [
  { value: "3 200+", label: "analyses générées", icon: Zap, color: "#00ff88" },
  { value: "72", label: "matchs CDM analysés", icon: TrendingUp, color: "#ffd700" },
  { value: "4.8/5", label: "satisfaction parieurs", icon: Star, color: "#00d4ff" },
  { value: "18 k+", label: "visiteurs uniques", icon: Users, color: "#ff6b35" },
];

const TESTIMONIALS = [
  {
    name: "Antoine B.",
    location: "Paris",
    avatar: "AB",
    avatarBg: "#00ff88",
    stars: 5,
    quote:
      "Suivi la reco sur Allemagne-Curaçao à 2.1 cotes. L'IA avait identifié la défense poreuse de Curaçao sur les 20 premières minutes. Match plié à la 18e. Impressionnant.",
    tag: "Parieur régulier",
  },
  {
    name: "Clara M.",
    location: "Lyon",
    avatar: "CM",
    avatarBg: "#ffd700",
    stars: 5,
    quote:
      "Enfin un outil qui explique POURQUOI parier sur un match et pas juste des stats incompréhensibles. Le contexte psychologique des équipes, c'est ce qui change tout.",
    tag: "Fan CDM depuis 2006",
  },
  {
    name: "Romain D.",
    location: "Bordeaux",
    avatar: "RD",
    avatarBg: "#00d4ff",
    stars: 5,
    quote:
      "Le streaming temps réel de l'analyse IA, c'est satisfaisant. J'ai l'impression d'avoir un expert dans ma poche. J'utilise ça avant chaque match de la phase de groupes.",
    tag: "Abonné depuis le lancement",
  },
];

const AI_SNIPPET = `## 💡 Recommandation pari

**France — 1X (victoire ou nul) à 1.65 cotes**

La France entre dans ce match avec une *supériorité technique évidente* et une défense solide (5 clean sheets en qualification). Le Sénégal présente des incertitudes offensives sans Mané à 100%.

La cote 1X à 1.65 offre une value réelle : les bookmakers surévaluent le Sénégal sur la base de leur CDM 2022. Le contexte 2026 est différent.

**Niveau de confiance : Élevé** ▸ Mise recommandée : 3-5% de bankroll`;

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-[#ffd700] fill-[#ffd700]" />
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="border-t border-[#1f1f1f] bg-[#080808]">
      {/* Stats bar */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map(({ value, label, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2"
                style={{ background: `${color}12`, border: `1px solid ${color}20` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs text-[#666] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials + AI demo */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <p className="text-xs text-[#555] uppercase tracking-widest mb-2">Ils nous font confiance</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f0f0f0]">
            Ce qu&apos;en disent les{" "}
            <span className="text-[#ffd700]">parieurs</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {TESTIMONIALS.map(({ name, location, avatar, avatarBg, stars, quote, tag }) => (
            <div
              key={name}
              className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-5 flex flex-col gap-4"
            >
              {/* Stars */}
              <StarRating count={stars} />

              {/* Quote */}
              <p className="text-[#c0c0c0] text-sm leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#1a1a1a]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-[#0a0a0a] shrink-0"
                  style={{ background: avatarBg }}
                >
                  {avatar}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#f0f0f0]">{name}</div>
                  <div className="text-[10px] text-[#555]">{location} · {tag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI demo snippet */}
        <div className="rounded-2xl border border-[#00ff88]/15 bg-[#00ff88]/3 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs text-[#00ff88] font-semibold uppercase tracking-wide">
              Exemple d&apos;analyse générée
            </span>
            <span className="ml-auto text-[10px] text-[#555] border border-[#1f1f1f] bg-[#111] px-2 py-0.5 rounded">
              Pronoia IA
            </span>
          </div>
          <div className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-[#c0c0c0] ai-response">
            {AI_SNIPPET.split("\n").map((line, i) => {
              if (line.startsWith("## "))
                return (
                  <div key={i} className="text-[#00ff88] font-bold text-sm mb-2">
                    {line.slice(3)}
                  </div>
                );
              if (line.startsWith("**") && line.endsWith("**"))
                return (
                  <div key={i} className="text-[#f0f0f0] font-semibold mt-2 mb-1">
                    {line.slice(2, -2)}
                  </div>
                );
              if (line.startsWith("**") && line.includes("**"))
                return (
                  <p
                    key={i}
                    className="text-[#c0c0c0] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: line
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic">$1</em>'),
                    }}
                  />
                );
              if (!line.trim()) return <div key={i} className="h-2" />;
              return (
                <p
                  key={i}
                  className="text-[#c0c0c0] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic">$1</em>'),
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
