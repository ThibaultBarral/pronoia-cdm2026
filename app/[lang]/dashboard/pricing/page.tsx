import type { Metadata } from "next";
import { getSubscription } from "@/lib/ai-guard";
import AppSidebar from "@/components/dashboard/app-sidebar";
import PaywallContent from "@/components/paywall-content";
import PassExpiryBanner from "@/components/pass-expiry-banner";

export const metadata: Metadata = {
  title: "Abonnement — Copafever",
  description: "Débloque les analyses IA de la CDM 2026.",
};

export default async function PricingPage() {
  const sub = await getSubscription();

  return (
    <>
      <AppSidebar />

      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-10 md:py-14">
          {sub && (
            <div className="max-w-5xl mx-auto">
              <PassExpiryBanner sub={sub} className="mb-6" />
            </div>
          )}
          <PaywallContent
            currentPlan={sub?.plan ?? null}
            hasAccess={sub?.access ?? false}
            manageUrl={sub?.manageUrl ?? null}
          />
        </main>
      </div>
    </>
  );
}
