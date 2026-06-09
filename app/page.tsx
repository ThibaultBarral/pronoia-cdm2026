import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import FeaturesSection from "@/components/features-section";
import SocialProof from "@/components/social-proof";
import HomeClient from "@/components/home-client";
import { getMatches } from "@/lib/data-service";

export const revalidate = 3600;

const FAQ = [
  {
    q: "Comment fonctionne Copafever ?",
    a: "Copafever analyse chaque match de la Coupe du Monde 2026 avec une IA qui croise forme récente, statistiques réelles, compositions et cotes du marché pour produire une analyse claire et une recommandation de pari. Tu choisis un match, tu lances l'analyse, et tu reçois probabilités, value bets et conseils en quelques secondes.",
  },
  {
    q: "Qu'est-ce qu'un value bet ?",
    a: "Un value bet est un pari dont la probabilité réelle estimée est supérieure à celle qu'impliquent les cotes du bookmaker. Autrement dit, le bookmaker sous-évalue une issue : sur le long terme, miser sur ces situations est statistiquement rentable. Copafever détecte automatiquement ces écarts pour chaque match.",
  },
  {
    q: "Les données de Copafever sont-elles réelles ?",
    a: "Oui. Copafever utilise des données sportives réelles : forme des équipes, confrontations directes, statistiques et cotes en direct. Les analyses ne reposent jamais sur des chiffres inventés.",
  },
  {
    q: "Copafever est-il gratuit ?",
    a: "Tu peux commencer gratuitement et tester une première analyse. Pour débloquer toutes les analyses IA de la Coupe du Monde 2026, plusieurs offres (pass CDM, hebdomadaire, mensuelle, à vie) sont disponibles.",
  },
];

export default async function HomePage() {
  const matches = await getMatches();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <Navbar />
      <Hero />
      <FeaturesSection />
      <SocialProof />
      <div id="matches" />
      <HomeClient matches={matches} />
      <footer className="border-t border-[#1f1f1f] mt-6 py-6 px-4 text-center">
        <p className="text-xs text-[#555]">
          Copafever · CDM 2026 · 11 juin — 19 juillet · Données sportives en temps réel
        </p>
      </footer>
    </main>
  );
}
