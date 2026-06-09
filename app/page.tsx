import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import FeaturesSection from "@/components/features-section";
import SocialProof from "@/components/social-proof";
import HomeClient from "@/components/home-client";
import { getMatches } from "@/lib/data-service";

export const revalidate = 3600;

export default async function HomePage() {
  const matches = await getMatches();

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <FeaturesSection />
      <SocialProof />
      <div id="matches" />
      <HomeClient matches={matches} />
      <footer className="border-t border-[#1f1f1f] mt-6 py-6 px-4 text-center">
        <p className="text-xs text-[#555]">
          Copafever · CDM 2026 · 11 juin — 19 juillet · Données sportives en temps réel
        </p>
      </footer>
    </main>
  );
}
