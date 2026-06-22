import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import OddsTicker from "@/components/combo/odds-ticker";
import ComboTicket from "@/components/combo/combo-ticket";
import { getDailyCombo, getTodayTicker } from "@/lib/combo";
import { getSubscription } from "@/lib/ai-guard";

export const metadata: Metadata = {
  title: "Combiné IA du jour — pronostics Coupe du Monde 2026 | Copafever",
  description:
    "Le combiné du jour sélectionné par l'IA Copafever : 2 à 3 pronos haute confiance sur cotes réelles, cote totale en direct. Coupe du Monde 2026.",
  alternates: { canonical: "/combine-du-jour" },
};

export const revalidate = 600;

export default async function CombineDuJourPage() {
  const [combo, ticker, sub] = await Promise.all([
    getDailyCombo(),
    getTodayTicker(),
    getSubscription(),
  ]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <OddsTicker items={ticker} />

      <section className="max-w-3xl mx-auto px-4 pt-12 pb-16">
        <div className="text-center mb-7">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#f0f0f0]">
            Le combiné IA du jour
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] mt-3 max-w-lg mx-auto">
            L&apos;IA Copafever sélectionne les pronos les plus confiants du jour, sur cotes réelles.
            La sélection complète est réservée aux membres.
          </p>
        </div>

        {combo ? (
          <ComboTicket combo={combo} unlocked={sub?.access ?? false} />
        ) : (
          <div className="rounded-2xl glass p-8 text-center max-w-md mx-auto">
            <p className="text-sm text-[var(--text-muted)]">
              Pas de combiné disponible pour l&apos;instant — reviens à l&apos;approche des prochains
              matchs.
            </p>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
