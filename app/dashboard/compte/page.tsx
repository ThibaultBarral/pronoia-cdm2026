import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppSidebar from "@/components/dashboard/app-sidebar";
import AccountClient from "@/components/account/account-client";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/ai-guard";
import { planName } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Mon compte — Copafever",
  description: "Gère tes informations personnelles et ton abonnement.",
};

export const dynamic = "force-dynamic";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@copafever.com";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/compte");

  const sub = await getSubscription();

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const statusLabel = sub?.access
    ? "✓ Actif"
    : sub?.status === "expired"
      ? "Expiré"
      : sub?.cancelAtPeriodEnd
        ? "Résiliation programmée"
        : "Aucun abonnement actif";

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">Mon compte</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Gère tes informations personnelles.
            </p>
          </header>

          <AccountClient
            email={user.email ?? ""}
            memberSince={memberSince}
            planLabel={planName(sub?.plan)}
            statusLabel={statusLabel}
            hasAccess={sub?.access ?? false}
            supportEmail={SUPPORT_EMAIL}
          />
        </main>
      </div>
    </>
  );
}
