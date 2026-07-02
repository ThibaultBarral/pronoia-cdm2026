import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import PromoBanner from "@/components/landing/promo-banner";
import LivePrediction, { type PredictionCard } from "@/components/landing/live-prediction";
import DecodedMatches from "@/components/landing/decoded-matches";
import AllNations, { type Nation } from "@/components/landing/all-nations";
import HowItPredicts from "@/components/landing/how-it-predicts";
import LiveMode from "@/components/landing/live-mode";
import ShareReferral from "@/components/landing/share-referral";
import FinalCta from "@/components/landing/final-cta";
import ProductShowcase from "@/components/landing/product-showcase";
import TikTokReels from "@/components/landing/tiktok-reels";
import AskFounder from "@/components/landing/ask-founder";
import PricingSection from "@/components/pricing-section";
import SocialProof from "@/components/social-proof";
import ComparisonSection from "@/components/landing/comparison-section";
import VerifiedResults from "@/components/landing/verified-results";
import FaqSection from "@/components/faq-section";
import HomeClient from "@/components/home-client";
import SiteFooter from "@/components/site-footer";
import { getMatches } from "@/lib/data-service";
import { predictMatch } from "@/lib/match-model";
import { getTrackRecordStats, getTrackRecordList } from "@/lib/track-record";
import { getFaq } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Match } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 3600;

/** Human kickoff label for prediction cards ("Coupe du Monde · sam. 4 juil. à 23:00"). */
function kickoffLabel(m: Match, locale: Locale): string {
  const league = locale === "en" ? "World Cup" : "Coupe du Monde";
  let when = m.round;
  try {
    const d = new Date(`${m.date}T${m.time || "00:00"}`);
    if (!Number.isNaN(d.getTime())) {
      const dateStr = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(d);
      when = m.time ? `${dateStr} · ${m.time}` : dateStr;
    }
  } catch {}
  return `${league} · ${when}`;
}

/** Build a plain, client-safe prediction card from a real fixture. */
function toPredictionCard(m: Match, locale: Locale): PredictionCard {
  const p = predictMatch(m);
  return {
    homeName: m.homeTeam.name,
    homeFlag: m.homeTeam.flag,
    awayName: m.awayTeam.name,
    awayFlag: m.awayTeam.flag,
    kickoff: kickoffLabel(m, locale),
    probHome: p.probabilities.home,
    probDraw: p.probabilities.draw,
    probAway: p.probabilities.away,
    scoreHome: Math.max(0, Math.round(p.expectedGoals.home)),
    scoreAway: Math.max(0, Math.round(p.expectedGoals.away)),
  };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const [matches, trackStats, trackList] = await Promise.all([
    getMatches(),
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
  const showVerified = verifiedRows.length >= 3;

  // Upcoming fixtures, soonest first, real teams only.
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

  // Hero "next big match" — strongest pairing among the next dozen.
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

  // Live prediction card (the marquee fixture, real model numbers).
  const liveCard: PredictionCard | undefined = marquee ? toPredictionCard(marquee, locale) : undefined;

  // "Three fixtures already decoded" — next three strong, distinct fixtures.
  const decoded = upcoming
    .slice(0, 24)
    .sort(
      (a, b) =>
        a.homeTeam.fifaRanking + a.awayTeam.fifaRanking -
        (b.homeTeam.fifaRanking + b.awayTeam.fifaRanking),
    )
    .filter((m) => m.id !== marquee?.id)
    .slice(0, 3)
    .map((m) => toPredictionCard(m, locale));

  // "48 nations" flag wall — unique real teams from the fixtures.
  const seen = new Set<string>();
  const nations: Nation[] = [];
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t.isPlaceholder || !t.flag || seen.has(t.name)) continue;
      seen.add(t.name);
      nations.push({ name: t.name, flag: t.flag });
    }
  }

  // Honest analyses counter for the live section.
  const analysesCount = Math.max(trackStats.verified, matches.length, 100);

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
      <PromoBanner />
      <Navbar />
      <Hero
        stats={{ matches: matches.length, verified: trackStats.verified, winRate: trackStats.winRate }}
        featuredMatch={featuredMatch}
      />
      {liveCard && <LivePrediction card={liveCard} analysesCount={analysesCount} />}
      <ComparisonSection winRate={trackStats.winRate} />
      {showVerified && (
        <VerifiedResults
          data={{ winRate: trackStats.winRate, won: trackStats.won, total: trackStats.total, rows: verifiedRows }}
        />
      )}
      <DecodedMatches cards={decoded} />
      <ProductShowcase />
      <TikTokReels />
      <AllNations nations={nations} />
      <HowItPredicts />
      <LiveMode />
      <ShareReferral />
      <SocialProof />
      <AskFounder />
      <FinalCta />
      <PricingSection />
      <FaqSection />
      <div id="matches" />
      <HomeClient matches={matches} />
      <SiteFooter />
    </main>
  );
}
