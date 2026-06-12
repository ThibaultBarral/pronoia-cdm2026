import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import PredictionsManager, { type PredictionRow } from "@/components/admin/predictions-manager";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Prédictions — Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPredictionsPage() {
  if (!(await isAdmin())) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("verified_predictions")
    .select("id, match_label, market, selection, odds, confidence, status, result_note, match_date, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []).map((r): PredictionRow => ({
    id: r.id as string,
    match_label: (r.match_label as string | null) ?? null,
    market: (r.market as string | null) ?? null,
    selection: (r.selection as string | null) ?? null,
    odds: r.odds == null ? null : Number(r.odds),
    confidence: (r.confidence as string | null) ?? null,
    status: (r.status as string) ?? "pending",
    result_note: (r.result_note as string | null) ?? null,
    match_date: (r.match_date as string | null) ?? null,
  }));

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#f0f0f0] mb-5">
            <ArrowLeft size={14} /> Admin
          </Link>
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">Prédictions vérifiées</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Le track record de l&apos;IA. Auto-loggées à l&apos;analyse, auto-réglées à la fin des
              matchs — corrige ou force ici si besoin.
            </p>
          </header>

          <PredictionsManager rows={rows} />
        </main>
      </div>
    </div>
  );
}
