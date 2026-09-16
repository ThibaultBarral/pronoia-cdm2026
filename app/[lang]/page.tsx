import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import LivePrediction, { type PredictionCard } from "@/components/landing/live-prediction";
import DecodedMatches from "@/components/landing/decoded-matches";
import DataEngine from "@/components/landing/data-engine";
import AnalysisAnatomy from "@/components/landing/analysis-anatomy";
import CompetitionsSection from "@/components/landing/competitions-section";
import NotABettingApp from "@/components/landing/not-a-betting-app";
import AskFounder from "@/components/landing/ask-founder";
import FinalCta from "@/components/landing/final-cta";
import PricingSection from "@/components/pricing-section";
import FaqSection from "@/components/faq-section";
import SiteFooter from "@/components/site-footer";
import type { PhoneMockupProps } from "@/components/landing/phone-mockup";
import { getMatches } from "@/lib/data-service";
import { predictMatch } from "@/lib/match-model";
import { getFaq } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";
import { COMPETITIONS, TOTAL_SEASON_MATCHES } from "@/lib/competitions";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Match } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 3600;

/** Human kickoff label for prediction cards ("Ligue 1 · sam. 4 oct. · 21:00"). */
function kickoffLabel(m: Match): string {
  let when = m.round;
  try {
    const d = new Date(`${m.date}T${m.time || "00:00"}`);
    if (!Number.isNaN(d.getTime())) {
      const dateStr = new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(d);
      when = m.time ? `${dateStr} · ${m.time}` : dateStr;
    }
  } catch {}
  return `${competitionLabel(m)} · ${when}`;
}

/** Competition name for a fixture (club competitions once wired; national otherwise). */
function competitionLabel(m: Match): string {
  const withComp = m as Match & { competition?: { name?: string } };
  return withComp.competition?.name ?? "Sélections";
}

/** Build a plain, client-safe prediction card from a real fixture. */
function toPredictionCard(m: Match): PredictionCard {
  const p = predictMatch(m);
  return {
    homeName: m.homeTeam.name,
    homeFlag: m.homeTeam.flag,
    awayName: m.awayTeam.name,
    awayFlag: m.awayTeam.flag,
    kickoff: kickoffLabel(m),
    probHome: p.probabilities.home,
    probDraw: p.probabilities.draw,
    probAway: p.probabilities.away,
    scoreHome: Math.max(0, Math.round(p.expectedGoals.home)),
    scoreAway: Math.max(0, Math.round(p.expectedGoals.away)),
  };
}

/** W/D/L string (oldest → newest, last 5) from a team's real recent form. */
function formString(m: Match["homeTeam"]): string | undefined {
  const f = m.recentForm?.slice(0, 5).map((r) => r.result).reverse().join("");
  return f && f.length ? f : undefined;
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  void locale;

  const matches = await getMatches().catch(() => [] as Match[]);

  // Upcoming fixtures (kickoff still ahead), soonest first, real teams only.
  const now = Date.now();
  const upcoming = matches
    .filter(
      (m) =>
        (m.status ?? "NS") === "NS" &&
        !m.homeTeam.isPlaceholder &&
        !m.awayTeam.isPlaceholder &&
        new Date(`${m.date}T${m.time || "00:00"}`).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
    );

  // Hero mockup: the soonest marquee fixture with real model numbers when there
  // is one; otherwise an illustrative example (clearly labelled as such).
  const marquee = upcoming
    .slice(0, 12)
    .sort(
      (a, b) =>
        a.homeTeam.fifaRanking + a.awayTeam.fifaRanking -
        (b.homeTeam.fifaRanking + b.awayTeam.fifaRanking),
    )[0];

  let mockup: PhoneMockupProps | undefined;
  if (marquee) {
    const p = predictMatch(marquee);
    mockup = {
      homeFlag: marquee.homeTeam.flag,
      homeName: marquee.homeTeam.name,
      awayFlag: marquee.awayTeam.flag,
      awayName: marquee.awayTeam.name,
      competition: competitionLabel(marquee),
      probHome: p.probabilities.home,
      probDraw: p.probabilities.draw,
      probAway: p.probabilities.away,
      xgHome: p.expectedGoals.home,
      xgAway: p.expectedGoals.away,
      formHome: formString(marquee.homeTeam),
      formAway: formString(marquee.awayTeam),
      illustrative: false,
    };
  }

  // Live read card (the marquee fixture, real model numbers).
  const liveCard: PredictionCard | undefined = marquee ? toPredictionCard(marquee) : undefined;

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
    .map(toPredictionCard);

  const FAQ = getFaq(locale);
  const description =
    "Copafever analyse chaque match de football à partir de millions de données réelles : forme, effectifs, confrontations, statistiques joueurs. Une lecture claire du match.";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Copafever",
      url: "https://copafever.com",
      logo: "https://copafever.com/copafever-icon.svg",
      description,
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
      <Hero
        stats={{ matches: TOTAL_SEASON_MATCHES, competitions: COMPETITIONS.length }}
        mockup={mockup}
      />
      {liveCard && <LivePrediction card={liveCard} analysesCount={Math.max(matches.length, 100)} />}
      <DataEngine />
      <AnalysisAnatomy />
      <CompetitionsSection />
      <NotABettingApp />
      {decoded.length >= 3 && <DecodedMatches cards={decoded} />}
      <AskFounder />
      <FinalCta />
      <PricingSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
