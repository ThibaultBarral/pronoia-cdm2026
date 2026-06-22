import type { Metadata } from "next";
import { ShieldCheck, TrendingUp, Flame, ListChecks } from "lucide-react";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import TrackRecordList from "@/components/track-record-list";
import { getTrackRecordStats, getTrackRecordList } from "@/lib/track-record";
import { settlePendingPredictions } from "@/lib/predictions";

export const metadata: Metadata = {
  title: "Track record — les prédictions vérifiées de l'IA Copafever",
  description:
    "La preuve, pas la promesse : toutes les prédictions de l'IA Copafever, vérifiées contre les résultats réels — gagnées comme ratées. Taux de réussite, série en cours, historique complet.",
  alternates: { canonical: "/track-record" },
};

export const revalidate = 300;

function Kpi({ icon: Icon, value, label, color }: { icon: typeof Flame; value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl glass px-4 py-5 text-center">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 16%, transparent)` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-2xl md:text-3xl font-black" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

export default async function TrackRecordPage() {
  await settlePendingPredictions().catch(() => {});
  const [stats, rows] = await Promise.all([getTrackRecordStats(), getTrackRecordList()]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 pt-14 pb-6 text-center">
        <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">La preuve, pas la promesse</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#f0f0f0]">
          Le track record de l&apos;IA Copafever
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)] mt-3 max-w-xl mx-auto">
          Chaque prédiction de l&apos;IA, vérifiée contre le résultat réel —{" "}
          <span className="text-[#cdd3db]">les ratées comprises</span>. On préfère prouver.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={TrendingUp} value={stats.total > 0 ? `${stats.winRate}%` : "—"} label="de pronos validés" color="var(--accent)" />
          <Kpi icon={ListChecks} value={String(stats.verified)} label="prédictions vérifiées" color="#ffd700" />
          <Kpi icon={ShieldCheck} value={String(stats.won)} label="gagnées" color="var(--accent-soft)" />
          <Kpi icon={Flame} value={stats.currentStreak > 0 ? `${stats.currentStreak} ✅` : "—"} label="série en cours" color="#ff6b35" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <TrackRecordList rows={rows} />
        <p className="text-[11px] text-[var(--text-muted)] text-center mt-6 leading-relaxed">
          Prédictions générées par l&apos;IA Copafever à partir de données et cotes réelles, vérifiées
          contre les résultats officiels. Aucune garantie de gain · Analyses à titre informatif ·
          18+ · Jouer comporte des risques · joueurs-info-service.fr · 09 74 75 13 13
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
