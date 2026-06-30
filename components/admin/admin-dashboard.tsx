import {
  Users, Euro, Percent, Zap, UserCheck, CalendarPlus,
  ArrowUpRight, ArrowDownRight, Minus, type LucideIcon,
} from "lucide-react";
import type { AdminStats } from "@/lib/admin";
import SignupsChart from "@/components/admin/signups-chart";

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

/* ── Acquisition par CA ──────────────────────────────────────────────────────
 * Quel canal rapporte le plus d'argent : barres pondérées par le CA réel Whop
 * (et non par le simple volume d'inscrits). Repli sur le volume tant qu'aucun
 * canal n'a encore généré de revenu. */
function AcquisitionByRevenue({ stats }: { stats: AdminStats }) {
  const { acquisitionBreakdown: rows, acquisitionAnswered, totalUsers } = stats;
  const totalChannelRevenue = rows.reduce((s, c) => s + c.revenue, 0);
  const hasRevenue = totalChannelRevenue > 0;
  const top = hasRevenue ? rows[0] : null; // déjà trié par CA décroissant
  const maxBar = Math.max(1, ...rows.map((c) => (hasRevenue ? c.revenue : c.count)));
  const eur = (n: number) => `${Math.round(n)} €`;

  return (
    <div className="rounded-2xl glass px-5 py-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#9aa3b2]">
          Acquisition — qui rapporte le plus
        </h3>
        <span className="text-[11px] text-[#5a6472]">
          {acquisitionAnswered}/{totalUsers} ont répondu
        </span>
      </div>

      {top ? (
        <p className="text-[11px] text-[#9aa3b2] mb-4">
          🏆 <span className="text-[var(--accent)] font-bold">{top.emoji} {top.label}</span> est ton
          canal #1 — <span className="font-semibold text-[#f0f0f0]">{eur(top.revenue)}</span> de CA
          {top.paidCount > 0 && ` (${top.paidCount} payant${top.paidCount > 1 ? "s" : ""})`}.
        </p>
      ) : (
        <p className="text-[11px] text-[#5a6472] mb-4">
          Aucun CA attribué pour l&apos;instant — classement par volume d&apos;inscrits.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-xs text-[#5a6472] py-4 text-center">
          Aucune réponse pour l&apos;instant — les nouveaux inscrits verront la question.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const metric = hasRevenue ? c.revenue : c.count;
            return (
              <div key={c.channel}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#f0f0f0] font-semibold">
                    {c.emoji} {c.label}
                  </span>
                  <span className="tabular-nums text-[#9aa3b2]">
                    <span className="font-bold text-[var(--accent)]">{eur(c.revenue)}</span>
                    <span className="text-[#5a6472]">
                      {" · "}{c.count} inscrit{c.count > 1 ? "s" : ""}
                      {c.paidCount > 0 && ` · ${c.paidCount} payant${c.paidCount > 1 ? "s" : ""}`}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(2, (metric / maxBar) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-[#5a6472] mt-3">
        CA réel Whop attribué au canal déclaré à l&apos;inscription. Le détail libre est dans la
        colonne « Canal » du tableau ci-dessous.
      </p>
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export default function AdminDashboard({ stats }: { stats: AdminStats }) {
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
      <div className="grid grid-cols-2 gap-3">
        <MiniCard
          icon={UserCheck} label="Actifs (7j)" value={String(stats.activeUsers7d)}
          sub={`${stats.activeUsers30d} sur 30j`}
        />
        <MiniCard
          icon={CalendarPlus} label="Nouveaux (30j)" value={String(stats.newUsers30d)}
          sub={`${stats.newUsers7d} sur 7j`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Signups 14 days (interactive) */}
        <div className="lg:col-span-2 rounded-2xl glass px-5 py-4">
          <SignupsChart data={stats.signupsByDay} weekTotal={stats.newUsers7d} />
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

      {/* Acquisition channels — classés par CA généré (quel canal rapporte le plus) */}
      <AcquisitionByRevenue stats={stats} />
    </div>
  );
}
