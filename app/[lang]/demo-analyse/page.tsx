import type { Metadata } from "next";
import Link from "next/link";
import { Bot } from "lucide-react";
import AnalysisResult from "@/components/analysis-result";
import type { MatchAnalysisData } from "@/lib/analysis-schema";

// Temporary preview page to validate the redesigned analysis on a live URL
// (all real fixtures in the dataset are "finished", so the analysis UI can't be
// reached normally). Not indexed. Safe to delete once the design is approved.
export const metadata: Metadata = {
  title: "Démo — Analyse redesign | Copafever",
  robots: { index: false, follow: false },
};

const HOME = { name: "Espagne", shortName: "ESP" };
const AWAY = { name: "Portugal", shortName: "POR" };

const DEMO: MatchAnalysisData = {
  summary:
    "L'Espagne, 2ᵉ nation FIFA et favorite incontestée, aborde ce choc ibérique avec un milieu de terrain qui étouffe l'adversaire. Le Portugal peut compter sur des individualités, mais devra défendre bas et espérer un contre.",
  scenario:
    "L'Espagne monopolise le ballon et pousse le Portugal dans ses 30 mètres. Le premier but devrait tomber avant la mi-temps et forcer le Portugal à s'ouvrir, ce qui laisserait des espaces à la Roja pour faire le break.",
  confidence: "Très élevé",
  probabilities: { home: 64, draw: 22, away: 14 },
  secondaryScenarios: [
    { title: "Match à plus de 2,5 buts", detail: "Les deux attaques ont du volume : un scénario ouvert est probable si le Portugal encaisse tôt." },
    { title: "L'Espagne garde sa cage inviolée", detail: "Sa solidité défensive rend le clean sheet crédible face à un Portugal réduit aux contres." },
  ],
  keyStrengths: [
    { team: "home", points: ["Milieu de terrain dominateur", "Pressing haut très bien coordonné", "Banc de touche profond"] },
    { team: "away", points: ["Individualités capables d'un exploit", "Efficacité sur coups de pied arrêtés"] },
  ],
  factors: [
    { label: "Espagne favorite", kind: "pos" },
    { label: "Possession Espagne", kind: "pos" },
    { label: "Portugal en contre", kind: "neutral" },
    { label: "Absence défenseur POR", kind: "neg" },
  ],
  comparison: [
    { label: "Possession", home: 62, away: 38 },
    { label: "Attaque", home: 58, away: 42 },
    { label: "Défense", home: 56, away: 44 },
    { label: "Forme", home: 70, away: 30 },
  ],
  expectedGoals: { home: 2.1, away: 0.9 },
  markets: { over25: 61, under25: 39, bttsYes: 48, bttsNo: 52 },
  probableScorers: [
    { name: "Álvaro Morata", team: "home", note: "Pointe de l'attaque, en confiance et bien alimenté." },
    { name: "Rafael Leão", team: "away", note: "La meilleure arme portugaise en transition." },
  ],
  firstScorer: "Álvaro Morata",
  keyPlayers: [
    { name: "Pedri", team: "home", role: "Meneur de jeu", note: "Le métronome qui dicte le tempo espagnol." },
    { name: "Bruno Fernandes", team: "away", role: "Milieu offensif", note: "Le danger n°1 sur les transitions et les coups francs." },
  ],
  // Not rendered here (betting lives in its own section) — present only to
  // satisfy the type.
  recommendation: {
    bet: "—",
    confidence: "Très élevé",
    stake: "—",
    rationale: "—",
  },
};

export default function DemoAnalysePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border border-[#ffd700]/25 bg-[#ffd700]/[0.06] px-4 py-3 text-center text-xs text-[#ffd700]">
          Page de démo — aperçu du redesign de l&apos;analyse (données fictives). À supprimer après validation.
        </div>

        {/* Analysis section — same shell as the real match page */}
        <section className="rounded-2xl glass overflow-hidden">
          {/* Header (redesigned) */}
          <div className="flex items-start gap-3 px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[var(--accent)]/6 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <Bot size={19} className="text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#f0f0f0] text-sm truncate">Analyse Copafever IA</span>
                <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5 rounded-full">
                  Analyse complète
                </span>
              </div>
              <div className="text-[11px] text-[#666] mt-0.5">Probabilités · Buts attendus · Scénarios</div>
            </div>
          </div>

          <div className="p-5">
            <div className="space-y-6">
              <AnalysisResult data={DEMO} home={HOME} away={AWAY} canPlayers />
            </div>
          </div>
        </section>

        {/* Discreet betting entry point (kept off the analysis) */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3 text-xs text-[#666] hover:border-[var(--accent)]/25 hover:text-[var(--accent)] transition-colors"
        >
          🎲 Pari conseillé &amp; cotes du match →
        </Link>
      </div>
    </div>
  );
}
