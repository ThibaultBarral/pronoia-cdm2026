"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Wallet, TrendingUp, TrendingDown, Target, MoreHorizontal,
  Percent, BarChart2, Flame, Trophy, RefreshCw, Download, ChevronRight,
} from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import EquityChart from "@/components/bankroll/equity-chart";
import BetForm from "@/components/bankroll/bet-form";
import BetTable from "@/components/bankroll/bet-table";
import {
  BankrollData, Bet, BetResult, Playstyle, PLAYSTYLES, computeStats, calcProfit,
} from "@/lib/bankroll";
import { loadUserBankroll, saveUserBankroll, deleteUserBankroll } from "@/lib/supabase/bankroll-db";
import { createClient } from "@/lib/supabase/client";

/** Keep the authoritative profile (auth metadata) in sync so AI analyses adapt. */
async function syncBettorProfile(playstyle: Playstyle) {
  try {
    await createClient().auth.updateUser({ data: { bettor_profile: playstyle } });
  } catch {
    /* bankroll playstyle still persisted; non-blocking */
  }
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onSetup }: { onSetup: (amount: number, playstyle: Playstyle) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("200");
  const [playstyle, setPlaystyle] = useState<Playstyle>("balanced");

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${
                s === step ? "w-8 bg-[var(--accent)]" : s < step ? "w-4 bg-[var(--accent)]/40" : "w-4 bg-[#1a1a1a]"
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-5">
              <Wallet size={24} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-black text-[#f0f0f0] text-center mb-2">
              Bankroll de départ
            </h2>
            <p className="text-sm text-[#555] text-center mb-8 leading-relaxed">
              Ce montant sert de référence pour ton ROI et tes mises en pourcentage.
            </p>

            <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-[#555] uppercase tracking-wide mb-1.5">
                  Montant initial
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="10"
                    className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-2xl font-black text-[#f0f0f0] pr-10 focus:outline-none focus:border-[var(--accent)]/30 tabular-nums"
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
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[#141414] text-[#444] hover:text-[#666] hover:bg-[#111]"
                    }`}
                  >
                    {v}€
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!parseFloat(amount) || parseFloat(amount) <= 0}
                className="w-full py-3 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Suivant
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl text-center mb-3">🎮</div>
            <h2 className="text-xl font-black text-[#f0f0f0] text-center mb-2">
              Ton style de jeu
            </h2>
            <p className="text-sm text-[#555] text-center mb-6 leading-relaxed">
              Copafever adapte ses recommandations — types de paris et mises suggérées — à ton profil.
            </p>

            <div className="space-y-2 mb-5">
              {PLAYSTYLES.map((ps) => (
                <button
                  key={ps.id}
                  onClick={() => setPlaystyle(ps.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    playstyle === ps.id
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                      : "border-[#141414] bg-[#0d0d0d] hover:bg-[#111] hover:border-[#222]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">{ps.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-[#f0f0f0]">{ps.label}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ color: ps.color, background: ps.accent }}
                        >
                          {ps.stakeRange} bankroll
                        </span>
                        {playstyle === ps.id && (
                          <span className="ml-auto text-[10px] text-[var(--accent)] font-medium">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#555] leading-relaxed">{ps.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-[#1a1a1a] text-[#555] text-sm hover:text-[#888] hover:bg-[#111] transition-all"
              >
                Retour
              </button>
              <button
                onClick={() => onSetup(parseFloat(amount) || 200, playstyle)}
                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all hover:scale-[1.01] glow-neon"
              >
                Démarrer le suivi
              </button>
            </div>
          </>
        )}
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
          style={{ background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 13%, transparent)` }}
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [tab, setTab] = useState<"overview" | "history">("overview");

  useEffect(() => {
    loadUserBankroll().then((d) => { setData(d); setMounted(true); });
  }, []);

  const persist = useCallback(async (next: BankrollData) => {
    setData(next);
    const id = await saveUserBankroll(next);
    if (id && !next.id) setData({ ...next, id });
  }, []);

  function handleSetup(amount: number, playstyle: Playstyle) {
    persist({ initialAmount: amount, playstyle, bets: [] });
    syncBettorProfile(playstyle);
  }

  function handleSetPlaystyle(playstyle: Playstyle) {
    if (!data) return;
    persist({ ...data, playstyle });
    // Authoritative source for the AI recommendation + personalised stake.
    syncBettorProfile(playstyle);
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
    a.download = "copafever-bankroll.csv";
    a.click();
  }

  if (!mounted) return null;

  return (
    <>
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="safe-header sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#141414]">
        <div className="h-14 flex items-center gap-3 px-4">
          {/* Title — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-[#333]">Dashboard</span>
            <span className="text-[#222]">/</span>
            <span className="text-[#666] font-medium">Bankroll</span>
          </div>
          {/* Mobile title */}
          <span className="md:hidden font-bold text-[#f0f0f0] text-sm">Bankroll</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Desktop: CSV + Reset */}
            {data && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
                >
                  <Download size={12} />
                  CSV
                </button>
                <button
                  onClick={handleReset}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1a1a] text-xs text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
                >
                  <RefreshCw size={12} />
                  Reset
                </button>
                {/* Mobile: ⋮ menu for CSV/Reset */}
                <div className="relative md:hidden">
                  <button
                    onClick={() => setShowMobileMenu((v) => !v)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {showMobileMenu && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden z-50">
                      <button onClick={() => { handleExportCSV(); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888] hover:bg-[#111] transition-colors">
                        <Download size={13} /> Exporter CSV
                      </button>
                      <button onClick={() => { handleReset(); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#ef4444] hover:bg-[#111] transition-colors border-t border-[#141414]">
                        <RefreshCw size={13} /> Réinitialiser
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Add bet button — icon only on mobile, icon+text on desktop */}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[var(--accent)] text-[#0a0a0a] text-xs font-bold hover:bg-[var(--accent-strong)] transition-all"
            >
              <Plus size={15} />
              <span className="hidden md:inline">Nouveau pari</span>
            </button>
          </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-[#444] uppercase tracking-widest">Bankroll actuelle</p>
                        {data.playstyle && (() => {
                          const ps = PLAYSTYLES.find((p) => p.id === data.playstyle);
                          if (!ps) return null;
                          return (
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ color: ps.color, background: ps.accent }}
                            >
                              {ps.emoji} {ps.label}
                            </span>
                          );
                        })()}
                      </div>
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
                            ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[#141414] text-[#444] hover:text-[#666]"
                        }`}
                      >
                        Aperçu
                      </button>
                      <button
                        onClick={() => setTab("history")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tab === "history"
                            ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
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

                  {/* Style de pari — toujours modifiable (les analyses & mises s'y adaptent) */}
                  <div
                    className={`rounded-2xl border p-4 ${
                      data.playstyle
                        ? "border-[#141414] bg-[#0d0d0d]"
                        : "border-[#ffd700]/20 bg-[#ffd700]/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={`text-xs font-semibold ${
                          data.playstyle ? "text-[#888]" : "text-[#ffd700]"
                        }`}
                      >
                        🎮 Mon style de pari
                      </p>
                      <span className="text-[10px] text-[#444]">Analyses & mises adaptées</span>
                    </div>
                    <p className="text-[11px] text-[#555] mb-3">
                      Ta bankroll grandit ? Ajuste ton style — l&apos;IA suit (type de pari,
                      audace et mise conseillée).
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {PLAYSTYLES.map((ps) => {
                        const active = data.playstyle === ps.id;
                        return (
                          <button
                            key={ps.id}
                            onClick={() => handleSetPlaystyle(ps.id)}
                            className={`text-left rounded-xl border p-3 transition-all ${
                              active
                                ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                                : "border-[#141414] bg-[#0d0d0d] hover:bg-[#111] hover:border-[#222]"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">{ps.emoji}</span>
                              <span className="text-xs font-bold text-[#f0f0f0]">{ps.label}</span>
                              {active && (
                                <span className="ml-auto text-[10px] text-[var(--accent)] font-bold">✓</span>
                              )}
                            </div>
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ color: ps.color, background: ps.accent }}
                            >
                              {ps.stakeRange} bankroll
                            </span>
                          </button>
                        );
                      })}
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
                          color="var(--accent)"
                          positive={s.winRate >= 50}
                        />
                        <KpiCard
                          icon={Percent}
                          label="ROI"
                          value={`${s.roiPercent >= 0 ? "+" : ""}${s.roiPercent}%`}
                          sub={`Misé : ${s.totalStaked.toFixed(0)}€`}
                          color="var(--accent-soft)"
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
                                    s.currentAmount >= data.initialAmount ? "var(--accent)" : "#ef4444",
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
                          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center">
                            <Plus size={20} className="text-[var(--accent)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#888]">Aucun pari enregistré</p>
                            <p className="text-xs text-[#444] mt-1">
                              Commence à tracker tes paris CDM 2026
                            </p>
                          </div>
                          <button
                            onClick={() => setShowForm(true)}
                            className="px-5 py-2 rounded-lg bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-medium hover:bg-[var(--accent)]/15 transition-all"
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
