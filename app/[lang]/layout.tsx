import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { notFound } from "next/navigation";
import ContactFab from "@/components/contact-fab";
import { locales, defaultLocale, isLocale, localeMeta, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://copafever.com";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

/** hreflang map: FR at root, EN under /en. */
function alternateUrls(path = "/") {
  const clean = path === "/" ? "" : path;
  return {
    canonical: clean || "/",
    languages: {
      fr: `${SITE}${clean || "/"}`,
      en: `${SITE}/en${clean}`,
      "x-default": `${SITE}${clean || "/"}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const en = locale === "en";

  const title = en
    ? "Copafever — AI analysis & betting picks for the 2026 World Cup"
    : "Copafever — Analyses IA & paris de la Coupe du Monde 2026";
  const description = en
    ? "Copafever: AI analysis, value bets, live odds, lineups and real stats for every 2026 World Cup match. Bet smarter."
    : "Copafever : analyses IA, value bets, cotes en direct, compositions et stats réelles pour chaque match de la Coupe du Monde 2026. Parie plus malin.";

  return {
    metadataBase: new URL(SITE),
    title: { default: title, template: "%s | Copafever" },
    description,
    applicationName: "Copafever",
    keywords: en
      ? ["Copafever", "World Cup 2026", "AI football analysis", "sports betting 2026", "value bets", "World Cup odds", "World Cup 2026 predictions"]
      : ["Copafever", "Coupe du Monde 2026", "CDM 2026", "analyse IA football", "paris sportifs CDM 2026", "value bets", "cotes Coupe du Monde", "pronostics CDM 2026"],
    authors: [{ name: "Copafever" }],
    creator: "Copafever",
    publisher: "Copafever",
    alternates: alternateUrls("/"),
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Copafever" },
    openGraph: {
      type: "website",
      siteName: "Copafever",
      title,
      description,
      url: en ? `${SITE}/en` : SITE,
      locale: localeMeta[locale].ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: en ? "Copafever — AI analysis 2026 World Cup" : "Copafever — Analyses IA CDM 2026",
      description: en
        ? "AI analysis, value bets and live odds for the 2026 World Cup."
        : "Analyses IA, value bets et cotes en direct pour la Coupe du Monde 2026.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    icons: { icon: "/api/pwa-icon?size=192", apple: "/api/pwa-icon?size=180" },
    verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const dict = getDictionary(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={localeMeta[locale].htmlLang} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] antialiased" suppressHydrationWarning>
        <Analytics />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE}/#organization`,
                  name: "Copafever",
                  alternateName: "Copa Fever",
                  url: SITE,
                  logo: `${SITE}/copafever-icon.svg`,
                  description:
                    locale === "en"
                      ? "AI analysis and value bets for the 2026 World Cup."
                      : "Analyses IA et value bets pour la Coupe du Monde 2026.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE}/#website`,
                  url: SITE,
                  name: "Copafever",
                  alternateName: "Copa Fever",
                  publisher: { "@id": `${SITE}/#organization` },
                  inLanguage: localeMeta[locale].htmlLang,
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${SITE}/?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <LocaleProvider locale={locale} dict={dict}>
          {children}
          <ContactFab />
        </LocaleProvider>
      </body>
    </html>
  );
}
