import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppSidebar from "@/components/dashboard/app-sidebar";
import AdminDashboard from "@/components/admin/admin-dashboard";
import UsersTable from "@/components/admin/users-table";
import { isAdmin, getAdminData, computeAdminStats } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Copafever", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) notFound();

  const { users, totalRevenue } = await getAdminData();
  const stats = computeAdminStats(users, totalRevenue);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">Tableau de bord</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Acquisition, activation, rétention et rentabilité de Copafever.
            </p>
          </header>

          <div className="mb-6 flex flex-wrap gap-2.5">
            <a
              href="/admin/predictions"
              className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-white/[0.05] transition-colors"
            >
              🎯 Prédictions vérifiées (track record) →
            </a>
            <a
              href="/admin/couts"
              className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-white/[0.05] transition-colors"
            >
              💸 Coûts &amp; rentabilité (IA) →
            </a>
          </div>

          {/* Analytics dashboard */}
          <AdminDashboard stats={stats} />

          {/* Users table — sortable + filterable (toggles admin/VIP par ligne) */}
          <UsersTable users={users} />

          <p className="text-[11px] text-[#5a6472] mt-4">
            « CA » = chiffre d&apos;affaires réel encaissé via Whop (paiements payés − remboursements).
          </p>
        </main>
      </div>
    </div>
  );
}
