import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import PricingSection from "@/components/pricing-section";
import FaqSection from "@/components/faq-section";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Tarifs | Copafever, l'analyse de matchs de foot par la data",
  description:
    "Semaine 9,99 € · Mois 19,99 € · Saison 169 €. Un seul plan, trois durées : analyses de match complètes sur les 7 grandes compétitions de la saison 2026/27.",
  alternates: { canonical: "/tarifs" },
};

export const revalidate = 3600;

export default function TarifsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <header className="max-w-3xl mx-auto px-4 pt-16 pb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f0f0f0]">
          Tarifs Copafever
        </h1>
        <p className="text-base text-[var(--text-muted)] mt-3">
          Choisis l&apos;offre qui te ressemble. Sans surprise, annulable à tout moment.
        </p>
      </header>
      <PricingSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
