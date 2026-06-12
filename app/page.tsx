import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import FeaturesSection from "@/components/features-section";
import PricingSection from "@/components/pricing-section";
import SocialProof from "@/components/social-proof";
import FaqSection from "@/components/faq-section";
import HomeClient from "@/components/home-client";
import SiteFooter from "@/components/site-footer";
import { getMatches } from "@/lib/data-service";
import { FAQ } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";

export const revalidate = 3600;

export default async function HomePage() {
  const matches = await getMatches();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Copafever",
      url: "https://copafever.com",
      logo: "https://copafever.com/copafever-icon.svg",
      description:
        "Assistant de paris propulsé par l'IA : analyses, value bets et suivi de bankroll pour la Coupe du Monde 2026 et les grands championnats.",
      sameAs: SOCIAL_LINKS.map((s) => s.href),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Copafever",
      url: "https://copafever.com",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <SocialProof />
      <FaqSection />
      <div id="matches" />
      <HomeClient matches={matches} />
      <SiteFooter />
    </main>
  );
}
