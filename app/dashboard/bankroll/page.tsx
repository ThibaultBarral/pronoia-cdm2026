"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Wallet, TrendingUp, TrendingDown, Target,
  Percent, BarChart2, Flame, Trophy, RefreshCw, Download,
} from "lucide-react";
import StaticSidebar from "@/components/dashboard/static-sidebar";
import EquityChart from "@/components/bankroll/equity-chart";
import BetForm from "@/components/bankroll/bet-form";
import BetTable from "@/components/bankroll/bet-table";
import {
  BankrollData, Bet, BetResult, computeStats, calcProfit,
} from "@/lib/bankroll";
import { loadUserBankroll, saveUserBankroll, deleteUserBankroll } from "@/lib/supabase/bankroll-db";

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onSetup }: { onSetup: (amount: number) => void }) {
  const [amount, setAmount] = useState("200");

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center mx-auto mb-5">
          <Wallet size={24} className="text-[#00ff88]" />
        </div>
        <h2 className="text-xl font-black text-[#f0f0f0] text-center mb-2">
          Configure ta bankroll
        </h2>
        <p className="text-sm text-[#555] text-center mb-8 leading-relaxed">
          Entre le montant de ta bankroll de départ. Cette valeur servira de référence pour calculer ton ROI et tes mises en pourcentage.
        </p>

        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wide mb-1.5">
              Bankroll initiale
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="10"
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-2xl font-black text-[#f0f0f0] pr-10 focus:outline-none focus:border-[#00ff88]/30 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] text-xl font-bold">€</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[100, 200, 500, 1000, 2000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                  amount === String(v)
                    ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]"
                    : "border-[#141414] text-[#444] hover:text-[#666] hover:bg-[#111]"
                }`}
              >
                {v}€
              </button>
            ))}
          </div>

          <button
            onClick={() => onSetup(parseFloat(amount) || 200)}
            className="w-full py-3 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all hover:scale-[1.01] glow-neon"
          >
            Démarrer le suivi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#141414] bg-[#0d0d0d] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[11px] text-[#444] uppercase tracking-wide">{label}</span>
      </div>
      <div
        className="text-xl font-black tabular-nums"
        style={{ color: positive !== undefined ? (positive ? "#22c55e" : "#ef4444") : "#f0f0f0" }}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-[#444] mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BankrollPage() {
  const [data, setData] = useState<BankrollData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"overview" | "history">("overview");

  useEffect(() => {
    loadUserBankroll().then((d) => { setData(d); setMounted(true); });
  }, []);

  const persist = useCallback(async (next: BankrollData) => {
    setData(next);
    const id = await saveUserBankroll(next);
    if (id && !next.id) setData({ ...next, id });
  }, []);

  function handleSetup(amount: number) {
    persist({ initialAmount: amount, bets: [] });
  }

  function handleAddBet(bet: Bet) {
    if (!data) return;
    persist({ ...data, bets: [...data.bets, bet] });
    setShowForm(false);
  }

  function handleAddMultiple(bets: Bet[]) {
    if (!data) return;
    persist({ ...data, bets: [...data.bets, ...bets] });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!data) return;
    persist({ ...data, bets: data.bets.filter((b) => b.id !== id) });
  }

  function handleUpdateResult(id: string, result: BetResult) {
    if (!data) return;
    const bets = data.bets.map((b) => {
      if (b.id !== id) return b;
      const profit = calcProfit(b.stake, b.odds, result);
      return { ...b, result, profit };
    });
    persist({ ...data, bets });
  }

  async function handleReset() {
    if (!confirm("Réinitialiser toute la bankroll ? Cette action est irréversible.")) return;
    if (data?.id) await deleteUserBankroll(data.id);
    setData(null);
  }

  function handleExportCSV() {
    if (!data) return;
    const header = "Date,Match,Type,Bookmaker,Cote,Mise,Résultat,P/L";
    const rows = data.bets.map((b) =>
      `${b.date},"${b.match}","${b.betType}",${b.bookmaker},${b.odds},${b.stake},${b.result},${b.profit}`
    );
    const csv = [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "pronoia-bankroll.csv";
    a.click();
  }

  if (!mounted) return null;

  return (
    <>
      <StaticSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="safe-header sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#141414]">
        <div className="h-14 flex items-center gap-3 px-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#333]">Dashboard</span>
            <span className="text-[#222]">/</span>
            <span className="text-[#666] font-medium">Bankroll</span>
          </div>
          {data && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
              >
                <Download size={12} />
                CSV
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
              >
                <RefreshCw size={12} />
                Reset
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00ff88] text-[#0a0a0a] text-xs font-bold hover:bg-[#00cc6a] transition-all"
              >
                <Plus size={13} />
                Nouveau pari
              </button>
            </div>
          )}
        </div>
        </header>

        {!data ? (
          <SetupScreen onSetup={handleSetup} />
        ) : (
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">
            {/* Stats computed */}
            {(() => {
              const s = computeStats(data);
              return (
                <>
                  {/* Bankroll header */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div>
                      <p className="text-xs text-[#444] uppercase tracking-widest mb-1">Bankroll actuelle</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-[#f0f0f0] tabular-nums">
                          {s.currentAmount.toFixed(2)}€
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            s.totalProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}
                        >
                          {s.totalProfit >= 0 ? "+" : ""}{s.totalProfit.toFixed(2)}€
                          {" "}
                          ({s.roiPercent >= 0 ? "+" : ""}{s.roiPercent}%)
                        </span>
                      </div>
                      <p className="text-xs text-[#444] mt-0.5">
                        Bankroll initiale : {data.initialAmount}€
                      </p>
                    </div>
                    <div className="sm:ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setTab("overview")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tab === "overview"
                            ? "border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]"
                            : "border-[#141414] text-[#444] hover:text-[#666]"
                        }`}
                      >
                        Aperçu
                      </button>
                      <button
                        onClick={() => setTab("history")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tab === "history"
                            ? "border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]"
                            : "border-[#141414] text-[#444] hover:text-[#666]"
                        }`}
                      >
                        Historique{" "}
                        {data.bets.length > 0 && (
                          <span className="opacity-50">{data.bets.length}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {tab === "overview" ? (
                    <>
                      {/* KPI grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard
                          icon={Target}
                          label="Win Rate"
                          value={`${s.winRate.toFixed(0)}%`}
                          sub={`${s.wonBets}V / ${s.lostBets}D sur ${s.totalBets}`}
                          color="#00ff88"
                          positive={s.winRate >= 50}
                        />
                        <KpiCard
                          icon={Percent}
                          label="ROI"
                          value={`${s.roiPercent >= 0 ? "+" : ""}${s.roiPercent}%`}
                          sub={`Misé : ${s.totalStaked.toFixed(0)}€`}
                          color="#00d4ff"
                          positive={s.roiPercent >= 0}
                        />
                        <KpiCard
                          icon={BarChart2}
                          label="Cote moyenne"
                          value={s.avgOdds > 0 ? s.avgOdds.toFixed(2) : "—"}
                          sub={`Mise moy. : ${s.avgStake.toFixed(2)}€`}
                          color="#ffd700"
                        />
                        <KpiCard
                          icon={Flame}
                          label="Série actuelle"
                          value={
                            s.currentStreak === 0
                              ? "—"
                              : s.currentStreak > 0
                              ? `${s.currentStreak}V 🔥`
                              : `${Math.abs(s.currentStreak)}D ❄️`
                          }
                          sub={`Meilleure : ${s.bestStreak}V`}
                          color="#ff6b35"
                        />
                      </div>

                      {/* Secondary KPIs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard
                          icon={TrendingUp}
                          label="Meilleur gain"
                          value={s.biggestWin > 0 ? `+${s.biggestWin.toFixed(2)}€` : "—"}
                          color="#22c55e"
                          positive
                        />
                        <KpiCard
                          icon={TrendingDown}
                          label="Plus grosse perte"
                          value={s.biggestLoss > 0 ? `-${s.biggestLoss.toFixed(2)}€` : "—"}
                          color="#ef4444"
                          positive={false}
                        />
                        <KpiCard
                          icon={Trophy}
                          label="En attente"
                          value={`${s.pendingBets}`}
                          sub="paris à régler"
                          color="#ffd700"
                        />
                        <KpiCard
                          icon={Wallet}
                          label="Total paris"
                          value={`${data.bets.length}`}
                          sub={`${s.totalBets} réglés`}
                          color="#888"
                        />
                      </div>

                      {/* Equity curve */}
                      <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-[#888] text-sm">Courbe de bankroll</h3>
                            <p className="text-[10px] text-[#444] mt-0.5">
                              Évolution de ta bankroll après chaque pari
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#444]">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-px bg-[#1f1f1f]" style={{ borderStyle: "dashed" }} />
                              <span>Initiale</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className="w-4 h-0.5 rounded"
                                style={{
                                  background:
                                    s.currentAmount >= data.initialAmount ? "#00ff88" : "#ef4444",
                                }}
                              />
                              <span>Bankroll</span>
                            </div>
                          </div>
                        </div>
                        <EquityChart
                          data={s.equityCurve}
                          initialAmount={data.initialAmount}
                          height={160}
                        />
                      </div>

                      {/* Empty state CTA */}
                      {data.bets.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#1a1a1a] flex flex-col items-center gap-3 py-12 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/5 border border-[#00ff88]/10 flex items-center justify-center">
                            <Plus size={20} className="text-[#00ff88]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#888]">Aucun pari enregistré</p>
                            <p className="text-xs text-[#444] mt-1">
                              Commence à tracker tes paris CDM 2026
                            </p>
                          </div>
                          <button
                            onClick={() => setShowForm(true)}
                            className="px-5 py-2 rounded-lg bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all"
                          >
                            Ajouter mon premier pari
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* History tab */
                    <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#888] text-sm">
                          Historique des paris
                        </h3>
                        <button
                          onClick={() => setShowForm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 text-xs font-medium hover:bg-[#00ff88]/15 transition-all"
                        >
                          <Plus size={12} />
                          Ajouter
                        </button>
                      </div>
                      <BetTable
                        bets={data.bets}
                        onDelete={handleDelete}
                        onUpdateResult={handleUpdateResult}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </main>
        )}
      </div>

      {/* Bet form modal */}
      {showForm && data && (
        <BetForm
          onAdd={handleAddBet}
          onAddMultiple={handleAddMultiple}
          onClose={() => setShowForm(false)}
          currentBankroll={computeStats(data).currentAmount}
        />
      )}
    </>
  );
}
