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

/** hreflang map: French-only site, served at the root. */
function alternateUrls(path = "/") {
  const clean = path === "/" ? "" : path;
  return {
    canonical: clean || "/",
    languages: {
      fr: `${SITE}${clean || "/"}`,
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

  const title = "Copafever — Analyses IA & paris de la Coupe du Monde 2026";
  const description =
    "Copafever : analyses IA, value bets, cotes en direct, compositions et stats réelles pour chaque match de la Coupe du Monde 2026. Parie plus malin.";

  return {
    metadataBase: new URL(SITE),
    title: { default: title, template: "%s | Copafever" },
    description,
    applicationName: "Copafever",
    keywords: ["Copafever", "Coupe du Monde 2026", "CDM 2026", "analyse IA football", "paris sportifs CDM 2026", "value bets", "cotes Coupe du Monde", "pronostics CDM 2026"],
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
      url: SITE,
      locale: localeMeta[locale].ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Copafever — Analyses IA CDM 2026",
      description: "Analyses IA, value bets et cotes en direct pour la Coupe du Monde 2026.",
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
                  description: "Analyses IA et value bets pour la Coupe du Monde 2026.",
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
