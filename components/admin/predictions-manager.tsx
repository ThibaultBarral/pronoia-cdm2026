"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { settleNow, setPredictionStatus } from "@/actions/predictions";

export interface PredictionRow {
  id: string;
  match_label: string | null;
  market: string | null;
  selection: string | null;
  odds: number | null;
  confidence: string | null;
  status: string;
  result_note: string | null;
  match_date: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  won: "text-[var(--accent)]",
  lost: "text-[#ef4444]",
  void: "text-[#9aa3b2]",
  pending: "text-[#ffd700]",
};

export default function PredictionsManager({ rows }: { rows: PredictionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function runSettle() {
    start(async () => {
      await settleNow();
      router.refresh();
    });
  }

  function mark(id: string, status: "won" | "lost" | "void" | "pending") {
    start(async () => {
      await setPredictionStatus(id, status);
      router.refresh();
    });
  }

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={runSettle}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-4 py-2 text-sm disabled:opacity-60"
        >
          <RefreshCw size={14} className={pending ? "animate-spin" : ""} /> Régler les matchs finis
        </button>
        <span className="text-[11px] text-[#5a6472]">
          {counts.pending ?? 0} en attente · {counts.won ?? 0} ✅ · {counts.lost ?? 0} ❌ · {rows.length} total
        </span>
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[#5a6472] border-b border-white/5">
                <th className="text-left font-semibold px-4 py-3">Match</th>
                <th className="text-left font-semibold px-3 py-3">Pari</th>
                <th className="text-right font-semibold px-3 py-3">Cote</th>
                <th className="text-left font-semibold px-3 py-3">Conf.</th>
                <th className="text-left font-semibold px-3 py-3">Statut</th>
                <th className="text-left font-semibold px-3 py-3">Marquer</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#5a6472] text-xs">
                    Aucune prédiction encore. Elles se loggent automatiquement quand une analyse est générée.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-[#f0f0f0] font-semibold">{r.match_label ?? "—"}</div>
                      <div className="text-[11px] text-[#5a6472]">
                        {r.match_date ?? ""}{r.result_note ? ` · ${r.result_note}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#cdd3db]">
                      <div>{r.selection}</div>
                      <div className="text-[10px] text-[#5a6472]">{r.market}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--accent)]">{(r.odds ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-[#9aa3b2]">{r.confidence ?? "—"}</td>
                    <td className={`px-3 py-3 font-bold ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {(["won", "lost", "void", "pending"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => mark(r.id, s)}
                            disabled={pending || r.status === s}
                            className="text-[10px] px-2 py-1 rounded-md border border-white/10 text-[#9aa3b2] hover:bg-white/[0.05] disabled:opacity-40"
                          >
                            {s === "won" ? "✅" : s === "lost" ? "❌" : s === "void" ? "∅" : "↺"}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
