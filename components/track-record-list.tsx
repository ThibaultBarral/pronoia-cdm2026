"use client";

import { useMemo, useState } from "react";
import { Check, X, Minus } from "lucide-react";
import type { TrackRow } from "@/lib/track-record";

const STATUS_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "won", label: "✅ Gagnés" },
  { id: "lost", label: "❌ Ratés" },
  { id: "pending", label: "En attente" },
] as const;

const CONF_FILTERS = ["Tous", "Élevé", "Moyen", "Faible"];

export default function TrackRecordList({ rows }: { rows: TrackRow[] }) {
  const [status, setStatus] = useState<string>("all");
  const [conf, setConf] = useState<string>("Tous");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (conf === "Tous" || r.confidence === conf),
      ),
    [rows, status, conf],
  );

  const chip = "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={`${chip} ${status === f.id ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/10 text-[#7a8290] hover:text-[#cdd3db]"}`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 text-white/10">|</span>
        {CONF_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setConf(c)}
            className={`${chip} ${conf === c ? "border-[#ffd700]/30 bg-[#ffd700]/10 text-[#ffd700]" : "border-white/10 text-[#7a8290] hover:text-[#cdd3db]"}`}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[#5a6472] tabular-nums">{filtered.length} prédictions</span>
      </div>

      <div className="rounded-2xl glass divide-y divide-white/5">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#5a6472]">
            Aucune prédiction pour ce filtre.
          </p>
        ) : (
          filtered.map((r) => {
            const won = r.status === "won";
            const lost = r.status === "lost";
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    won ? "bg-[var(--accent)]/12 text-[var(--accent)]" : lost ? "bg-[#ef4444]/12 text-[#ef4444]" : "bg-white/[0.04] text-[#7a8290]"
                  }`}
                >
                  {won ? <Check size={15} strokeWidth={3} /> : lost ? <X size={15} strokeWidth={3} /> : <Minus size={14} />}
                </span>
                <span className="text-sm shrink-0">{r.homeFlag}{r.awayFlag}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#e5e5e5] truncate">{r.selection}</div>
                  <div className="text-[10px] text-[#5a6472]">
                    {r.matchLabel} · {r.market}
                    {r.resultNote ? ` · ${r.resultNote}` : ""}
                    {r.date ? ` · ${r.date}` : ""}
                  </div>
                </div>
                {r.confidence && (
                  <span className="hidden sm:inline text-[10px] text-[#7a8290] shrink-0">{r.confidence}</span>
                )}
                <span className="text-sm font-bold text-[var(--accent)] tabular-nums shrink-0">@{r.odds.toFixed(2)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
