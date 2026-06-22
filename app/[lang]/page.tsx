import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import TikTokReels from "@/components/landing/tiktok-reels";
import AskFounder from "@/components/landing/ask-founder";
import FeaturesSection from "@/components/features-section";
import PricingSection from "@/components/pricing-section";
import SocialProof from "@/components/social-proof";
import FaqSection from "@/components/faq-section";
import HomeClient from "@/components/home-client";
import SiteFooter from "@/components/site-footer";
import OddsTicker from "@/components/combo/odds-ticker";
import ComboSection from "@/components/combo/combo-section";
import { getMatches } from "@/lib/data-service";
import { getTodayTicker } from "@/lib/combo";
import { FEATURE } from "@/lib/feature-flags";
import { getFaq } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const [matches, ticker] = await Promise.all([
    getMatches(),
    FEATURE.combo ? getTodayTicker() : Promise.resolve([]),
  ]);

  const FAQ = getFaq(locale);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Copafever",
      url: "https://copafever.com",
      logo: "https://copafever.com/copafever-icon.svg",
      description:
        locale === "en"
          ? "AI-powered betting assistant: analysis, value bets and bankroll tracking for the 2026 World Cup and major leagues."
          : "Assistant de paris propulsé par l'IA : analyses, value bets et suivi de bankroll pour la Coupe du Monde 2026 et les grands championnats.",
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
      <OddsTicker items={ticker} locale={locale} />
      <Hero />
      <TikTokReels />
      <AskFounder />
      <FeaturesSection />
      <ComboSection locale={locale} />
      <SocialProof />
      <PricingSection />
      <FaqSection />
      <div id="matches" />
      <HomeClient matches={matches} />
      <SiteFooter />
    </main>
  );
}
