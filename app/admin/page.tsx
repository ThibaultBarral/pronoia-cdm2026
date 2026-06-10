import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppSidebar from "@/components/dashboard/app-sidebar";
import AdminControls from "@/components/admin/admin-controls";
import AdminToggle from "@/components/admin/admin-toggle";
import FreeAccessControls from "@/components/admin/free-access-controls";
import VipToggle from "@/components/admin/vip-toggle";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { isAdmin, getAdminData, computeAdminStats } from "@/lib/admin";
import { planName } from "@/lib/plans";

export const metadata: Metadata = { title: "Admin — Copafever", robots: { index: false } };
export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<string, string> = {
  active: "Actif", trialing: "Essai", expired: "Expiré", canceled: "Annulé",
};

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

          {/* Analytics dashboard */}
          <AdminDashboard stats={stats} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <AdminControls />
            <FreeAccessControls />
          </div>

          {/* Users table */}
          <div className="rounded-2xl glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[920px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#5a6472] border-b border-white/5">
                    <th className="text-left font-semibold px-4 py-3">Utilisateur</th>
                    <th className="text-left font-semibold px-3 py-3">Profil</th>
                    <th className="text-left font-semibold px-3 py-3">Plan</th>
                    <th className="text-left font-semibold px-3 py-3">Statut</th>
                    <th className="text-right font-semibold px-3 py-3">Analyses</th>
                    <th className="text-right font-semibold px-3 py-3">CA</th>
                    <th className="text-left font-semibold px-3 py-3">Inscrit</th>
                    <th className="text-left font-semibold px-3 py-3">Dern. connexion</th>
                    <th className="text-left font-semibold px-3 py-3">Accès gratuit</th>
                    <th className="text-left font-semibold px-3 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="text-[#f0f0f0] font-semibold">{u.name ?? "—"}</div>
                        <div className="text-[11px] text-[#5a6472]">{u.email ?? "—"}</div>
                      </td>
                      <td className="px-3 py-3 text-[#9aa3b2] capitalize">{u.bettorProfile ?? "—"}</td>
                      <td className="px-3 py-3 text-[#9aa3b2]">{planName(u.plan) ?? "Gratuit"}</td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-[#9aa3b2]">
                          {u.status ? STATUS_LABEL[u.status] ?? u.status : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[#e0e0e0]">{u.analysesCount}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--accent)]">{u.revenue.toFixed(2)} €</td>
                      <td className="px-3 py-3 text-[#9aa3b2] whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-3 py-3 text-[#9aa3b2] whitespace-nowrap">{fmtDateTime(u.lastSignInAt)}</td>
                      <td className="px-3 py-3">
                        {u.email && <VipToggle email={u.email} vip={u.vip} />}
                      </td>
                      <td className="px-3 py-3">
                        {u.email && <AdminToggle email={u.email} isAdmin={u.isAdmin} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-[#5a6472] mt-4">
            « CA » = chiffre d&apos;affaires réel encaissé via Whop (paiements payés − remboursements).
          </p>
        </main>
      </div>
    </div>
  );
}
