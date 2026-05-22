import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Pronoia — Analyse IA Coupe du Monde 2026",
  description:
    "Analyses IA des matchs de la Coupe du Monde 2026. Statistiques, cotes, compositions et recommandations de paris alimentées par Claude AI.",
  keywords: ["Coupe du Monde 2026", "CDM 2026", "analyse football", "paris sportifs", "IA"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pronoia",
  },
  openGraph: {
    title: "Pronoia — Analyse IA CDM 2026",
    description: "L'analyse IA ultime pour la Coupe du Monde 2026",
    type: "website",
  },
  icons: {
    icon: "/api/pwa-icon?size=192",
    apple: "/api/pwa-icon?size=180",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] antialiased">
        {children}
      </body>
    </html>
  );
}
