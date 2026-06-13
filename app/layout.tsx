import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import ContactFab from "@/components/contact-fab";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://copafever.com"),
  title: {
    default: "Copafever — Analyses IA & paris de la Coupe du Monde 2026",
    template: "%s | Copafever",
  },
  description:
    "Copafever : analyses IA, value bets, cotes en direct, compositions et stats réelles pour chaque match de la Coupe du Monde 2026. Parie plus malin.",
  applicationName: "Copafever",
  keywords: [
    "Copafever",
    "Coupe du Monde 2026",
    "CDM 2026",
    "analyse IA football",
    "paris sportifs CDM 2026",
    "value bets",
    "cotes Coupe du Monde",
    "pronostics CDM 2026",
  ],
  authors: [{ name: "Copafever" }],
  creator: "Copafever",
  publisher: "Copafever",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Copafever",
  },
  openGraph: {
    type: "website",
    siteName: "Copafever",
    title: "Copafever — Analyses IA & paris de la Coupe du Monde 2026",
    description:
      "Analyses IA, value bets et cotes en direct pour chaque match de la CDM 2026. Parie plus malin avec Copafever.",
    url: "https://copafever.com",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Copafever — Analyses IA CDM 2026",
    description: "Analyses IA, value bets et cotes en direct pour la Coupe du Monde 2026.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/api/pwa-icon?size=192",
    apple: "/api/pwa-icon?size=180",
  },
  // Google Search Console: set NEXT_PUBLIC_GSC_VERIFICATION to the meta-tag token.
  verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] antialiased" suppressHydrationWarning>
        {/* Vercel Web Analytics (à activer dans le dashboard du projet) */}
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
                  "@id": "https://copafever.com/#organization",
                  name: "Copafever",
                  alternateName: "Copa Fever",
                  url: "https://copafever.com",
                  logo: "https://copafever.com/copafever-icon.svg",
                  description:
                    "Analyses IA et value bets pour la Coupe du Monde 2026.",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://copafever.com/#website",
                  url: "https://copafever.com",
                  name: "Copafever",
                  alternateName: "Copa Fever",
                  publisher: { "@id": "https://copafever.com/#organization" },
                  inLanguage: "fr-FR",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://copafever.com/?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        {children}
        <ContactFab />
      </body>
    </html>
  );
}
