import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import CreditCheckpointForm from "@/components/admin/credit-checkpoint-form";
import { isAdmin } from "@/lib/admin";
import { getCostDashboard } from "@/lib/ai-cost";

export const metadata: Metadata = { title: "Coûts & rentabilité — Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

// ── Formatting helpers ─────────────────────────────────────────────────────
const usd = (n: number) => (n >= 1 || n === 0 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`);
const eur = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const intFr = (n: number) => n.toLocaleString("fr-FR");
const dayShort = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">{label}</div>
      <div className="text-xl font-black text-[#f0f0f0] mt-1.5">{value}</div>
      {sub && <div className="text-[11px] text-[#5a6472] mt-0.5">{sub}</div>}
    </div>
  );
}

export default async function AdminCostsPage() {
  if (!(await isAdmin())) notFound();

  const d = await getCostDashboard();
  const maxDay = Math.max(...d.byDay.map((x) => x.cost), 0.0001);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#f0f0f0] mb-5">
            <ArrowLeft size={14} /> Admin
          </Link>
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">Coûts &amp; rentabilité</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Ce que l&apos;IA coûte en vrai (tokens Anthropic → $), combien il reste de crédit, et si
              Copafever est rentable. Le coût est compté par génération réelle (une analyse en cache
              ne coûte rien : un seul appel sert tout le monde).
            </p>
          </header>

          {/* ── Rentabilité ─────────────────────────────────────────────── */}
          <section className="rounded-2xl glass p-5 mb-6">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-3">
              Rentabilité (depuis le début)
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">CA réel (Whop)</div>
                <div className="text-lg md:text-2xl font-black text-[#f0f0f0] mt-1">{eur(d.revenueEur)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">Coût IA</div>
                <div className="text-lg md:text-2xl font-black text-[#f0f0f0] mt-1">−{eur(d.totalCostEur)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">Marge</div>
                <div className={`text-lg md:text-2xl font-black mt-1 ${d.marginEur >= 0 ? "text-[var(--accent)]" : "text-red-400"}`}>
                  {d.marginEur >= 0 ? "" : "−"}{eur(Math.abs(d.marginEur))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#5a6472] mt-3 text-center">
              Coût IA converti $→€ à un taux indicatif (~0,92). Le CA vient des paiements Whop encaissés.
            </p>
          </section>

          {/* ── Crédit restant ──────────────────────────────────────────── */}
          <section className="rounded-2xl glass p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                Crédit Anthropic estimé
              </div>
              {d.balanceAt && (
                <div className="text-[11px] text-[#5a6472]">
                  relevé le {new Date(d.balanceAt).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
            {d.remainingUsd != null ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">Reste estimé</div>
                  <div className={`text-2xl font-black mt-1 ${d.remainingUsd <= 5 ? "text-red-400" : d.remainingUsd <= 15 ? "text-amber-400" : "text-[var(--accent)]"}`}>
                    {usd(d.remainingUsd)}
                  </div>
                  <div className="text-[11px] text-[#5a6472] mt-0.5">
                    relevé {usd(d.balanceUsd ?? 0)} − {usd(d.costSinceCheckpointUsd)} consommés depuis
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">Conso / jour (7j)</div>
                  <div className="text-2xl font-black text-[#f0f0f0] mt-1">{usd(d.dailyBurnUsd)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">Autonomie</div>
                  <div className="text-2xl font-black text-[#f0f0f0] mt-1">
                    {d.daysUntilEmpty != null ? `~${d.daysUntilEmpty} j` : "—"}
                  </div>
                  {d.daysUntilEmpty != null && d.daysUntilEmpty <= 7 && (
                    <div className="text-[11px] text-red-400 mt-0.5 font-semibold">⚠️ Recharge bientôt</div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Aucun solde renseigné. Va sur console.anthropic.com (Plans &amp; Billing), relève ton
                crédit restant et entre-le ci-dessous pour suivre l&apos;autonomie.
              </p>
            )}
            <CreditCheckpointForm />
          </section>

          {/* ── KPIs coûts ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Kpi label="Coût total" value={usd(d.totalCostUsd)} sub={`${intFr(d.totalGenerations)} générations`} />
            <Kpi label="Aujourd'hui" value={usd(d.costTodayUsd)} />
            <Kpi label="7 derniers jours" value={usd(d.cost7dUsd)} />
            <Kpi label="30 derniers jours" value={usd(d.cost30dUsd)} />
            <Kpi label="Coût / génération" value={usd(d.avgCostPerGenUsd)} />
            <Kpi label="Conso / jour" value={usd(d.dailyBurnUsd)} sub="moyenne 7j" />
            <Kpi label="Projeté / mois" value={usd(d.projectedMonthlyUsd)} sub="au rythme actuel" />
            <Kpi label="Tokens cumulés" value={intFr(d.totalTokens)} />
          </div>

          {!d.hasData ? (
            <p className="text-sm text-[var(--text-muted)] rounded-2xl glass p-5">
              Aucune génération enregistrée pour l&apos;instant. Dès qu&apos;une analyse, un chat ou une
              lecture de ticket lance un vrai appel Claude, le coût apparaîtra ici.
            </p>
          ) : (
            <>
              {/* ── Coût par jour (14 j) ──────────────────────────────── */}
              <section className="rounded-2xl glass p-5 mb-6">
                <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-4">
                  Coût par jour (14 derniers jours)
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {d.byDay.map((x) => (
                    <div key={x.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full flex items-end justify-center h-full">
                        <div
                          className="w-full max-w-[28px] rounded-t bg-[var(--accent)]/70"
                          style={{ height: `${Math.max((x.cost / maxDay) * 100, x.cost > 0 ? 3 : 0)}%` }}
                          title={usd(x.cost)}
                        />
                      </div>
                      <div className="text-[9px] text-[#5a6472] whitespace-nowrap">{dayShort(x.date)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Par type & par modèle ─────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <section className="rounded-2xl glass p-5">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-3">
                    Coût par type
                  </div>
                  <div className="space-y-2">
                    {d.byKind.map((k) => (
                      <div key={k.kind} className="flex items-center justify-between text-sm">
                        <span className="text-[#f0f0f0]">{k.label}</span>
                        <span className="text-[var(--text-muted)]">
                          {usd(k.cost)} <span className="text-[#5a6472]">· {intFr(k.count)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl glass p-5">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-3">
                    Coût par modèle
                  </div>
                  <div className="space-y-2">
                    {d.byModel.map((m) => (
                      <div key={m.model} className="flex items-center justify-between text-sm">
                        <span className="text-[#f0f0f0] font-mono text-xs">{m.model}</span>
                        <span className="text-[var(--text-muted)]">
                          {usd(m.cost)} <span className="text-[#5a6472]">· {intFr(m.count)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Top consommateurs ─────────────────────────────────── */}
              {d.topConsumers.length > 0 && (
                <section className="rounded-2xl glass p-5 mb-6">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-3">
                    Utilisateurs les plus consommateurs
                  </div>
                  <div className="space-y-2">
                    {d.topConsumers.map((u) => (
                      <div key={u.userId} className="flex items-center justify-between text-sm gap-3">
                        <span className="text-[#f0f0f0] truncate min-w-0">
                          {u.name || u.email || u.userId.slice(0, 8)}
                          {u.name && u.email && (
                            <span className="text-[#5a6472] ml-1.5 text-xs">{u.email}</span>
                          )}
                        </span>
                        <span className="text-[var(--text-muted)] whitespace-nowrap">
                          {usd(u.cost)} <span className="text-[#5a6472]">· {intFr(u.count)} gén.</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <p className="text-[11px] text-[#5a6472] mt-4">
            Les coûts sont estimés à partir des tokens réellement facturés par Anthropic (entrée /
            sortie / cache) et des tarifs par modèle. Le « reste estimé » se recale chaque fois que tu
            saisis le solde réel relevé sur la console Anthropic.
          </p>
        </main>
      </div>
    </div>
  );
}
