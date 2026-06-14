"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Target, CreditCard, BarChart2, Plus, X, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { BankrollData, Bet, computeStats } from "@/lib/bankroll";
import {
  loadUserBankroll, saveUserBankroll, deleteUserBankroll,
} from "@/lib/supabase/bankroll-db";
import BetForm from "@/components/bankroll/bet-form";

const inputCls =
  "w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-[#c0c0c0] placeholder-[#333] focus:outline-none focus:border-[var(--accent)]/30 transition-colors";
const labelCls = "block text-[10px] text-[#555] uppercase tracking-widest mb-2 font-medium";

// ── Setup modal (first time) ──────────────────────────────────────────────────

function SetupModal({
  onSetup,
  onSkip,
}: {
  onSetup: (name: string, amount: number, startDate: string) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("100");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative px-6 pt-6 pb-2 text-center">
          <button onClick={onSkip} className="absolute top-4 right-4 text-[#444] hover:text-[#888] transition-colors">
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={20} className="text-[var(--accent)]" />
          </div>
          <h2 className="text-lg font-bold text-[#f0f0f0] mb-1">Configure ta bankroll</h2>
          <p className="text-sm text-[#555] mb-5">Crée ta première bankroll pour commencer le suivi</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className={labelCls}>Nom de la bankroll</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Paris sportifs 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Montant initial (€)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="1" step="10" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date de début</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={() => onSetup(name.trim() || "Ma bankroll", parseFloat(amount) || 100, startDate)}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all mt-1"
          >
            Créer ma première bankroll
          </button>
          <button onClick={onSkip}
            className="w-full text-center text-sm text-[#444] hover:text-[#666] transition-colors py-1">
            Créer plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit / delete modal ───────────────────────────────────────────────────────

function EditModal({
  data,
  onSave,
  onDelete,
  onClose,
}: {
  data: BankrollData;
  onSave: (name: string, amount: number, startDate: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(data.name ?? "");
  const [amount, setAmount] = useState(String(data.initialAmount));
  const [startDate, setStartDate] = useState(data.startDate ?? new Date().toISOString().split("T")[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
              <Settings size={13} className="text-[#888]" />
            </div>
            <span className="font-bold text-[#f0f0f0] text-sm">Modifier la bankroll</span>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-[#888] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className={labelCls}>Nom</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la bankroll" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Montant initial (€)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="1" step="10" className={inputCls} />
            <p className="text-[10px] text-[#444] mt-1.5">Modifier le montant initial recalcule le ROI et la courbe.</p>
          </div>
          <div>
            <label className={labelCls}>Date de début</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>

          <button
            onClick={() => onSave(name.trim() || "Ma bankroll", parseFloat(amount) || data.initialAmount, startDate)}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all"
          >
            Enregistrer
          </button>

          <div className="border-t border-[#141414] pt-3">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#ef4444]/20 text-[#ef4444] text-sm font-medium hover:bg-[#ef4444]/5 transition-all"
              >
                <Trash2 size={14} />
                Supprimer la bankroll
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#ef4444] text-center font-medium">
                  Supprimer tous les paris et la bankroll ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#1a1a1a] text-xs text-[#888] hover:text-[#f0f0f0] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-xs font-bold hover:bg-[#cc2222] transition-all"
                  >
                    Oui, supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

interface BankrollWidgetProps {
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
}

/** Once the user skips the first-time setup, don't auto-open it again (they can
 *  still open it via the "Configure ta bankroll" CTA). Persisted so it survives
 *  navigation / remounts — fixes the modal re-appearing on every page load. */
const SETUP_DISMISSED_KEY = "cf_bankroll_setup_dismissed";

export default function BankrollWidget({ externalShowForm, onExternalFormClose }: BankrollWidgetProps) {
  const [data, setData] = useState<BankrollData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadUserBankroll().then((d) => {
      setData(d);
      const skipped =
        typeof window !== "undefined" &&
        localStorage.getItem(SETUP_DISMISSED_KEY) === "1";
      if (!d && !skipped) setShowSetup(true);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!externalShowForm) return;
    if (data) {
      setShowForm(true);
    } else {
      setShowSetup(true);
      setDismissed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalShowForm]);

  const persist = useCallback(async (next: BankrollData) => {
    setData(next);
    const id = await saveUserBankroll(next);
    if (id && !next.id) setData({ ...next, id });
  }, []);

  function handleSetup(name: string, amount: number, startDate: string) {
    persist({ name, startDate, initialAmount: amount, bets: [] });
    setShowSetup(false);
    setDismissed(false);
    try { localStorage.removeItem(SETUP_DISMISSED_KEY); } catch {}
  }

  function handleEditSave(name: string, amount: number, startDate: string) {
    if (!data) return;
    persist({ ...data, name, startDate, initialAmount: amount });
    setShowEdit(false);
  }

  async function handleDelete() {
    if (data?.id) await deleteUserBankroll(data.id);
    setData(null);
    setShowEdit(false);
    setShowSetup(true);
    setDismissed(false);
  }

  function handleAddBet(bet: Bet) {
    if (!data) return;
    persist({ ...data, bets: [...data.bets, bet] });
    setShowForm(false);
    onExternalFormClose?.();
  }

  function handleAddMultiple(bets: Bet[]) {
    if (!data) return;
    persist({ ...data, bets: [...data.bets, ...bets] });
    setShowForm(false);
    onExternalFormClose?.();
  }

  function handleCloseForm() {
    setShowForm(false);
    onExternalFormClose?.();
  }

  if (!mounted) return null;

  return (
    <>
      {/* Setup modal */}
      {showSetup && !data && (
        <SetupModal
          onSetup={handleSetup}
          onSkip={() => {
            setShowSetup(false);
            setDismissed(true);
            try { localStorage.setItem(SETUP_DISMISSED_KEY, "1"); } catch {}
          }}
        />
      )}

      {/* Edit modal */}
      {showEdit && data && (
        <EditModal
          data={data}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setShowEdit(false)}
        />
      )}

      {!data ? (
        dismissed ? null : (
          <div
            className="rounded-2xl border border-dashed border-[#1a1a1a] bg-[#0d0d0d] flex flex-col items-center gap-3 py-8 cursor-pointer hover:border-[var(--accent)]/20 transition-all group"
            onClick={() => setShowSetup(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/10 transition-all">
              <TrendingUp size={18} className="text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#555]">Configurer ma bankroll</p>
              <p className="text-xs text-[#333] mt-0.5">Suivez vos paris CDM 2026</p>
            </div>
          </div>
        )
      ) : (
        (() => {
          const s = computeStats(data);
          const recentBets = [...data.bets].reverse().slice(0, 3);
          return (
            <>
              {/* Bankroll actuelle card */}
              <div
                className="rounded-2xl p-5 relative"
                style={{ background: "linear-gradient(135deg, #141c28 0%, #0f1520 100%)", border: "1px solid #1e2a3a" }}
              >
                <button
                  onClick={() => setShowEdit(true)}
                  className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-[#ffffff08] flex items-center justify-center text-[#3a5a7a] hover:text-[#6a9aba] hover:bg-[#ffffff12] transition-all"
                  title="Modifier la bankroll"
                >
                  <Settings size={13} />
                </button>
                <p className="text-[10px] text-[#4a6a8a] uppercase tracking-widest font-medium mb-2">
                  {data.name || "Bankroll actuelle"}
                </p>
                <p className="text-4xl font-black text-white tabular-nums mb-1">
                  {s.currentAmount.toFixed(2)}€
                </p>
                <p className={`text-sm font-semibold ${s.totalProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {s.totalProfit >= 0 ? "+" : ""}{s.totalProfit.toFixed(2)}€ depuis le début
                </p>
              </div>

              {/* KPI 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">ROI</p>
                    <p className={`text-xl font-black tabular-nums ${s.roiPercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {s.roiPercent >= 0 ? "+" : ""}{s.roiPercent}%
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-[#22c55e]" />
                  </div>
                </div>

                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">Taux réussite</p>
                    <p className="text-xl font-black tabular-nums text-[#f0f0f0]">{s.winRate.toFixed(0)}%</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#888]/10 flex items-center justify-center">
                    <Target size={16} className="text-[#888]" />
                  </div>
                </div>

                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">Total misé</p>
                    <p className="text-xl font-black tabular-nums text-[#f0f0f0]">{s.totalStaked.toFixed(0)}€</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#888]/10 flex items-center justify-center">
                    <CreditCard size={16} className="text-[#888]" />
                  </div>
                </div>

                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">Nombre de paris</p>
                    <p className="text-xl font-black tabular-nums text-[#f0f0f0]">{data.bets.length}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#888]/10 flex items-center justify-center">
                    <BarChart2 size={16} className="text-[#888]" />
                  </div>
                </div>
              </div>

              {/* Derniers paris */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#f0f0f0] text-sm">Derniers paris</h3>
                  <Link href="/dashboard/bankroll" className="text-xs text-[#444] hover:text-[#888] transition-colors">
                    Tout voir
                  </Link>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                  {recentBets.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#111] border border-[#141414] flex items-center justify-center">
                        <BarChart2 size={18} className="text-[#2a2a2a]" />
                      </div>
                      <p className="text-sm text-[#333]">Aucun pari enregistré</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1a1a1a] text-xs font-medium text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
                      >
                        <Plus size={12} />
                        Ajouter un pari
                      </button>
                    </div>
                  ) : (
                    <>
                      {recentBets.map((bet) => (
                        <div key={bet.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0f0f0f] last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#888] truncate">{bet.match}</p>
                            <p className="text-[10px] text-[#444] mt-0.5">{bet.betType} · @{bet.odds.toFixed(2)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-bold tabular-nums ${
                              bet.result === "won" ? "text-[#22c55e]" :
                              bet.result === "lost" ? "text-[#ef4444]" :
                              "text-[#ffd700]"
                            }`}>
                              {bet.profit > 0 ? "+" : ""}{bet.profit.toFixed(2)}€
                            </p>
                            <p className="text-[10px] text-[#444] mt-0.5">{bet.stake.toFixed(0)}€ misés</p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowForm(true)}
                        className="w-full py-2.5 text-xs text-[#333] hover:text-[#555] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus size={11} />
                        Ajouter un pari
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()
      )}

      {showForm && data && (
        <BetForm
          onAdd={handleAddBet}
          onAddMultiple={handleAddMultiple}
          onClose={handleCloseForm}
          currentBankroll={computeStats(data).currentAmount}
        />
      )}
    </>
  );
}
