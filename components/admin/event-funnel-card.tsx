import { Gift, MessageCircle } from "lucide-react";
import type { EventStats } from "@/lib/admin";

const CHANNEL_LABEL: Record<string, string> = {
  twitter: "X (Twitter)",
  instagram: "Instagram",
};

function rate(num: number, den: number): string {
  if (den <= 0) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[#5a6472]">{label}</div>
      <div className="text-lg font-black text-[#f0f0f0] tabular-nums leading-tight mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-[#5a6472] mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * In-app funnel for the new conversion levers (welcome offer + contact widget),
 * fed by the app_events table. Complements the headline KPIs above; full
 * per-event detail lives in GA4.
 */
export default function EventFunnelCard({ stats }: { stats: EventStats }) {
  return (
    <div className="rounded-2xl glass px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#9aa3b2]">
          Tunnel de conversion
        </h3>
        <span className="text-[10px] text-[#5a6472]">{stats.days} derniers jours</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Welcome offer */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ffd700] mb-2">
            <Gift size={13} /> Offre de bienvenue (−20%)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Vues" value={stats.welcomeView} />
            <Stat label="Clics" value={stats.welcomeClick} />
            <Stat label="Taux clic" value={rate(stats.welcomeClick, stats.welcomeView)} />
          </div>
        </div>

        {/* Contact widget */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent)] mb-2">
            <MessageCircle size={13} /> Widget contact
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Ouvertures" value={stats.contactOpen} />
            <Stat label="Clics DM" value={stats.contactClick} />
            <Stat label="Taux clic" value={rate(stats.contactClick, stats.contactOpen)} />
          </div>
          {stats.contactByChannel.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.contactByChannel.map((c) => (
                <span
                  key={c.channel}
                  className="text-[10px] text-[#9aa3b2] bg-white/[0.04] rounded-full px-2 py-0.5"
                >
                  {CHANNEL_LABEL[c.channel] ?? c.channel} · {c.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#5a6472] mt-3">
        Conversion finale (abonnements) = cartes « CA réel » &amp; « Répartition des offres »
        ci-dessus. Détail par event dans GA4.
      </p>
    </div>
  );
}
