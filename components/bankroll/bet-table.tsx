"use client";

import { useState } from "react";
import { Trash2, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { Bet, BetResult } from "@/lib/bankroll";

interface BetTableProps {
  bets: Bet[];
  onDelete: (id: string) => void;
  onUpdateResult: (id: string, result: BetResult) => void;
}

const RESULT_STYLE: Record<BetResult, string> = {
  won: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20",
  lost: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20",
  void: "text-[#888] bg-[#888]/10 border-[#888]/20",
  pending: "text-[#ffd700] bg-[#ffd700]/10 border-[#ffd700]/20",
};

const RESULT_LABEL: Record<BetResult, string> = {
  won: "✅ Gagné",
  lost: "❌ Perdu",
  void: "↩️ Annulé",
  pending: "⏳ En attente",
};

export default function BetTable({ bets, onDelete, onUpdateResult }: BetTableProps) {
  const [filter, setFilter] = useState<BetResult | "all">("all");
  const [sortKey, setSortKey] = useState<"date" | "odds" | "stake" | "profit">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = bets
    .filter((b) => filter === "all" || b.result === filter)
    .sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === "date") { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortKey === "odds") { va = a.odds; vb = b.odds; }
      else if (sortKey === "stake") { va = a.stake; vb = b.stake; }
      else { va = a.profit; vb = b.profit; }
      return sortDir === "asc" ? va - vb : vb - va;
    });

  function SortIcon({ k }: { k: typeof sortKey }) {
    if (sortKey !== k) return <ChevronUp size={10} className="text-[#333]" />;
    return sortDir === "asc" ? <ChevronUp size={10} className="text-[var(--accent)]" /> : <ChevronDown size={10} className="text-[var(--accent)]" />;
  }

  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-[#333]">
        <Filter size={20} />
        <p className="text-sm">Aucun pari enregistré</p>
        <p className="text-xs">Clique sur &quot;Nouveau pari&quot; pour commencer</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(["all", "pending", "won", "lost", "void"] as const).map((f) => {
          const count = f === "all" ? bets.length : bets.filter((b) => b.result === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                filter === f
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20"
                  : "text-[#444] border-[#141414] hover:text-[#666] bg-[#0d0d0d]"
              }`}
            >
              {f === "all" ? "Tous" : RESULT_LABEL[f].split(" ")[1]}{" "}
              <span className="opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#141414]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#141414] bg-[#0a0a0a]">
              <th
                className="text-left px-4 py-2.5 text-[#444] font-medium cursor-pointer hover:text-[#666]"
                onClick={() => toggleSort("date")}
              >
                <div className="flex items-center gap-1">Date <SortIcon k="date" /></div>
              </th>
              <th className="text-left px-4 py-2.5 text-[#444] font-medium">Match / Pari</th>
              <th className="text-left px-4 py-2.5 text-[#444] font-medium hidden sm:table-cell">Bkmkr</th>
              <th
                className="text-right px-4 py-2.5 text-[#444] font-medium cursor-pointer hover:text-[#666]"
                onClick={() => toggleSort("odds")}
              >
                <div className="flex items-center justify-end gap-1">Cote <SortIcon k="odds" /></div>
              </th>
              <th
                className="text-right px-4 py-2.5 text-[#444] font-medium cursor-pointer hover:text-[#666]"
                onClick={() => toggleSort("stake")}
              >
                <div className="flex items-center justify-end gap-1">Mise <SortIcon k="stake" /></div>
              </th>
              <th className="text-center px-4 py-2.5 text-[#444] font-medium">Résultat</th>
              <th
                className="text-right px-4 py-2.5 text-[#444] font-medium cursor-pointer hover:text-[#666]"
                onClick={() => toggleSort("profit")}
              >
                <div className="flex items-center justify-end gap-1">P/L <SortIcon k="profit" /></div>
              </th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((bet) => (
              <tr
                key={bet.id}
                className="border-b border-[#0f0f0f] last:border-0 hover:bg-[#111]/40 transition-colors"
              >
                <td className="px-4 py-2.5 text-[#555] whitespace-nowrap">
                  {new Date(bet.date + "T12:00:00").toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short",
                  })}
                </td>
                <td className="px-4 py-2.5 min-w-[160px]">
                  <div className="font-medium text-[#888]">{bet.match}</div>
                  <div className="text-[#444] mt-0.5">{bet.betType}</div>
                  {bet.note && <div className="text-[#333] mt-0.5 italic truncate max-w-[180px]">{bet.note}</div>}
                </td>
                <td className="px-4 py-2.5 text-[#555] hidden sm:table-cell whitespace-nowrap">
                  {bet.bookmaker}
                </td>
                <td className="px-4 py-2.5 text-right text-[#888] font-mono tabular-nums">
                  {bet.odds.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#888] tabular-nums">
                  {bet.stake.toFixed(2)}€
                </td>
                <td className="px-4 py-2.5 text-center">
                  {editingId === bet.id ? (
                    <select
                      autoFocus
                      value={bet.result}
                      onChange={(e) => {
                        onUpdateResult(bet.id, e.target.value as BetResult);
                        setEditingId(null);
                      }}
                      onBlur={() => setEditingId(null)}
                      className="bg-[#111] border border-[var(--accent)]/30 rounded text-xs text-[#c0c0c0] px-1 py-0.5"
                    >
                      {(["pending", "won", "lost", "void"] as BetResult[]).map((r) => (
                        <option key={r} value={r}>{RESULT_LABEL[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingId(bet.id)}
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${RESULT_STYLE[bet.result]}`}
                    >
                      {RESULT_LABEL[bet.result]}
                    </button>
                  )}
                </td>
                <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                  bet.profit > 0 ? "text-[#22c55e]" :
                  bet.profit < 0 ? "text-[#ef4444]" :
                  "text-[#555]"
                }`}>
                  {bet.profit > 0 ? "+" : ""}{bet.profit.toFixed(2)}€
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onDelete(bet.id)}
                    className="text-[#2a2a2a] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#333] text-xs">
          Aucun pari dans cette catégorie
        </div>
      )}
    </div>
  );
}
