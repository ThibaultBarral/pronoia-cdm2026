import {
  Users, Euro, Percent, Zap, UserCheck, Activity, Gift, CalendarPlus,
  ArrowUpRight, ArrowDownRight, Minus, type LucideIcon,
} from "lucide-react";
import type { AdminStats } from "@/lib/admin";

/* ── Building blocks ─────────────────────────────────────────────────────── */

function Delta({ now, prev }: { now: number; prev: number }) {
  const diff = now - prev;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#5a6472]">
        <Minus size={11} /> stable
      </span>
    );
  }
  const up = diff > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        up ? "text-[var(--accent)]" : "text-[#ef4444]"
      }`}
    >
      <Icon size={11} />
      {up ? "+" : ""}{diff} vs 7j préc.
    </span>
  );
}

function HeroCard({
  icon: Icon, label, value, sub, accent = "var(--accent)",
}: {
  icon: LucideIcon; label: string; value: string; sub?: React.ReactNode; accent?: string;
}) {
  return (
    <div className="rounded-2xl glass px-5 py-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#5a6472] mb-2">
        <Icon size={13} style={{ color: accent }} /> {label}
      </div>
      <div className="text-3xl font-black text-[#f0f0f0] leading-none">{value}</div>
      {sub && <div className="mt-2 text-[11px] text-[#9aa3b2]">{sub}</div>}
    </div>
  );
}

function MiniCard({
  icon: Icon, label, value, sub, accent = "var(--accent)",
}: {
  icon: LucideIcon; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-2xl glass px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#5a6472] mb-1.5">
        <Icon size={12} style={{ color: accent }} /> {label}
      </div>
      <div className="text-xl font-black text-[#f0f0f0]">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-[#5a6472]">{sub}</div>}
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export default function AdminDashboard({ stats }: { stats: AdminStats }) {
  const maxSignup = Math.max(1, ...stats.signupsByDay.map((d) => d.count));
  const maxPlan = Math.max(1, ...stats.planBreakdown.map((p) => p.count));

  return (
    <div className="space-y-3 mb-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard
          icon={Users}
          label="Utilisateurs"
          value={String(stats.totalUsers)}
          sub={<Delta now={stats.newUsers7d} prev={stats.prevNewUsers7d} />}
        />
        <HeroCard
          icon={Euro}
          label="CA réel (Whop)"
          value={`${stats.totalRevenue.toFixed(0)} €`}
          sub={stats.paidUsers > 0 ? `${stats.arpu.toFixed(2)} € / client payant` : "Aucun paiement"}
        />
        <HeroCard
          icon={Percent}
          label="Taux de conversion"
          value={`${stats.conversionRate.toFixed(1)} %`}
          sub={`${stats.paidUsers} client${stats.paidUsers > 1 ? "s" : ""} payant${stats.paidUsers > 1 ? "s" : ""}${stats.vipUsers ? ` · ${stats.vipUsers} VIP` : ""}`}
          accent="#ffd700"
        />
        <HeroCard
          icon={Zap}
          label="Analyses lancées"
          value={String(stats.totalAnalyses)}
          sub={`${stats.avgAnalysesPerUser} / utilisateur`}
          accent="var(--accent-soft)"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniCard
          icon={UserCheck} label="Actifs (7j)" value={String(stats.activeUsers7d)}
          sub={`${stats.activeUsers30d} sur 30j`}
        />
        <MiniCard
          icon={Activity} label="Activation" value={`${stats.activationRate.toFixed(0)} %`}
          sub={`${stats.usersWithAnalysis} ont analysé`} accent="var(--accent-soft)"
        />
        <MiniCard
          icon={Gift} label="Onboarding" value={`${stats.onboardedRate.toFixed(0)} %`}
          sub="profil complété" accent="#ffd700"
        />
        <MiniCard
          icon={CalendarPlus} label="Nouveaux (30j)" value={String(stats.newUsers30d)}
          sub={`${stats.newUsers7d} sur 7j`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Signups 14 days */}
        <div className="lg:col-span-2 rounded-2xl glass px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#9aa3b2]">
              Inscriptions · 14 derniers jours
            </h3>
            <span className="text-[11px] text-[#5a6472]">{stats.newUsers7d} cette semaine</span>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {stats.signupsByDay.map((d) => {
              const h = Math.round((d.count / maxSignup) * 100);
              const isToday = d.date === stats.signupsByDay[stats.signupsByDay.length - 1].date;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end h-full" title={`${d.date} · ${d.count}`}>
                    <div
                      className="w-full rounded-t-md transition-all group-hover:opacity-100"
                      style={{
                        height: `${Math.max(h, d.count > 0 ? 6 : 2)}%`,
                        background: isToday ? "var(--accent)" : "var(--accent-soft)",
                        opacity: d.count > 0 ? 0.85 : 0.25,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-[#5a6472] tabular-nums">
                    {Number(d.date.slice(8, 10))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="rounded-2xl glass px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#9aa3b2] mb-4">
            Répartition des offres
          </h3>
          <div className="space-y-2.5">
            {stats.planBreakdown.map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={p.plan === "free" ? "text-[#9aa3b2]" : "text-[#f0f0f0] font-semibold"}>
                    {p.label}
                  </span>
                  <span className="tabular-nums text-[#9aa3b2]">{p.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.count / maxPlan) * 100}%`,
                      background: p.plan === "free" ? "#3a4250" : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
