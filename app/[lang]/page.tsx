import Navbar from "@/components/navbar";
import HeroSearch from "@/components/landing/hero-search";
import PricingSection from "@/components/pricing-section";
import FaqSection from "@/components/faq-section";
import SiteFooter from "@/components/site-footer";
import { getFaq } from "@/lib/faq";
import { SOCIAL_LINKS } from "@/lib/social";
import { TOTAL_SEASON_MATCHES } from "@/lib/competitions";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 3600;

/**
 * Landing page, stripped down on 2026-09-16 at Thibault's request: the search
 * IS the page. Headline + team search + competition chips, then the three
 * steps, the plans and the FAQ. Every former marketing section (live card,
 * data engine, anatomy, competitions grid, decoded matches, founder, final CTA)
 * is gone from here; their components stay in the repo.
 */
const STEPS = [
  { n: "1", t: "Choisis ton équipe", d: "Ou une compétition." },
  { n: "2", t: "Choisis le match", d: "Jusqu'à 7 jours avant le coup d'envoi." },
  { n: "3", t: "Lis l'analyse", d: "Scénario, forces, joueurs à suivre, chat IA." },
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;

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
      <HeroSearch matches={TOTAL_SEASON_MATCHES} />

      <section id="how-it-works" className="border-t border-white/5 px-4 py-12">
        <ol className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl glass p-5">
              <span className="text-[11px] font-black text-[var(--accent-soft)]">{s.n}</span>
              <p className="text-base font-black text-[var(--text)] mt-1">{s.t}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <PricingSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
