import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import ProductShowcase from "@/components/landing/product-showcase";
import TikTokReels from "@/components/landing/tiktok-reels";
import AskFounder from "@/components/landing/ask-founder";
import FeaturesSection from "@/components/features-section";
import PricingSection from "@/components/pricing-section";
import SocialProof from "@/components/social-proof";
import ComparisonSection from "@/components/landing/comparison-section";
import VerifiedResults from "@/components/landing/verified-results";
import FaqSection from "@/components/faq-section";
import HomeClient from "@/components/home-client";
import SiteFooter from "@/components/site-footer";
import OddsTicker from "@/components/combo/odds-ticker";
import ComboSection from "@/components/combo/combo-section";
import { getMatches } from "@/lib/data-service";
import { getTrackRecordStats, getTrackRecordList } from "@/lib/track-record";
import { getTodayTicker } from "@/lib/combo";
import { FEATURE } from "@/lib/feature-flags";
import { getFaq } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const [matches, ticker, trackStats, trackList] = await Promise.all([
    getMatches(),
    FEATURE.combo ? getTodayTicker() : Promise.resolve([]),
    getTrackRecordStats(),
    getTrackRecordList(60),
  ]);

  // Honest "Trouvé juste" proof — only the real settled-as-won predictions.
  const verifiedRows = trackList
    .filter((r) => r.status === "won")
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      matchLabel: r.matchLabel,
      homeFlag: r.homeFlag,
      awayFlag: r.awayFlag,
      market: r.market,
      selection: r.selection,
      odds: r.odds,
    }));
  // Show the section only when there's something real to show.
  const showVerified = verifiedRows.length >= 3;

  // Hero "next big match" — soonest upcoming fixture, strongest pairing among the
  // next dozen (lowest summed FIFA rank). Real data; falls back to the demo if none.
  const upcoming = matches
    .filter(
      (m) =>
        (m.status ?? "NS") === "NS" &&
        !m.homeTeam.isPlaceholder &&
        !m.awayTeam.isPlaceholder,
    )
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
    );
  const marquee = upcoming
    .slice(0, 12)
    .sort(
      (a, b) =>
        a.homeTeam.fifaRanking + a.awayTeam.fifaRanking -
        (b.homeTeam.fifaRanking + b.awayTeam.fifaRanking),
    )[0];
  const featuredMatch = marquee
    ? {
        id: marquee.id,
        home: { name: marquee.homeTeam.name, flag: marquee.homeTeam.flag },
        away: { name: marquee.awayTeam.name, flag: marquee.awayTeam.flag },
        date: marquee.date,
        time: marquee.time,
        round: marquee.round,
      }
    : undefined;

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
      <Hero
        stats={{ matches: matches.length, verified: trackStats.verified, winRate: trackStats.winRate }}
        featuredMatch={featuredMatch}
      />
      <ProductShowcase />
      <TikTokReels />
      <AskFounder />
      <FeaturesSection />
      <ComboSection locale={locale} />
      <SocialProof />
      <ComparisonSection />
      {showVerified && (
        <VerifiedResults
          data={{ winRate: trackStats.winRate, won: trackStats.won, total: trackStats.total, rows: verifiedRows }}
        />
      )}
      <PricingSection />
      <FaqSection />
      <div id="matches" />
      <HomeClient matches={matches} />
      <SiteFooter />
    </main>
  );
}
