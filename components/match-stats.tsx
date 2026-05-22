import { BarChart3 } from "lucide-react";
import { Team } from "@/lib/types";

function StatRow({
  label,
  homeVal,
  awayVal,
  format = (v: number) => String(v),
  higherIsBetter = true,
}: {
  label: string;
  homeVal: number;
  awayVal: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(homeVal, awayVal) || 1;
  const homeWidth = (homeVal / max) * 100;
  const awayWidth = (awayVal / max) * 100;
  const homeLeads = higherIsBetter ? homeVal >= awayVal : homeVal <= awayVal;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={`font-semibold tabular-nums ${homeLeads ? "text-[#00ff88]" : "text-[#f0f0f0]"}`}>
          {format(homeVal)}
        </span>
        <span className="text-[#888] text-xs">{label}</span>
        <span className={`font-semibold tabular-nums ${!homeLeads ? "text-[#00ff88]" : "text-[#f0f0f0]"}`}>
          {format(awayVal)}
        </span>
      </div>
      <div className="flex gap-0.5 h-1.5">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-l-full bg-[#00ff88]/60 transition-all"
            style={{ width: `${homeWidth}%` }}
          />
        </div>
        <div className="w-px bg-[#1f1f1f]" />
        <div className="flex-1">
          <div
            className="h-full rounded-r-full bg-[#3b82f6]/60 transition-all"
            style={{ width: `${awayWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MatchStats({
  homeTeam,
  awayTeam,
}: {
  homeTeam: Team;
  awayTeam: Team;
}) {
  const h = homeTeam.stats;
  const a = awayTeam.stats;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-[#00ff88]" />
        <span className="font-semibold text-[#f0f0f0]">Stats CDM 2026</span>
      </div>

      {/* Team headers */}
      <div className="flex justify-between mb-4 text-xs text-[#888]">
        <div className="flex items-center gap-1.5">
          <span>{homeTeam.flag}</span>
          <span>{homeTeam.shortName}</span>
          <span className="w-2 h-2 rounded-full bg-[#00ff88]/60 ml-1" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]/60" />
          <span>{awayTeam.shortName}</span>
          <span>{awayTeam.flag}</span>
        </div>
      </div>

      <div className="space-y-4">
        <StatRow label="Possession %" homeVal={h.possession} awayVal={a.possession} format={(v) => `${v}%`} />
        <StatRow label="Buts marqués" homeVal={h.goalsScored} awayVal={a.goalsScored} />
        <StatRow label="Buts encaissés" homeVal={h.goalsConceded} awayVal={a.goalsConceded} higherIsBetter={false} />
        <StatRow label="xG Pour" homeVal={h.xGFor} awayVal={a.xGFor} format={(v) => v.toFixed(1)} />
        <StatRow label="xG Contre" homeVal={h.xGAgainst} awayVal={a.xGAgainst} format={(v) => v.toFixed(1)} higherIsBetter={false} />
        <StatRow label="Clean sheets" homeVal={h.cleanSheets} awayVal={a.cleanSheets} />
      </div>

      {/* Qualification paths */}
      <div className="mt-4 pt-4 border-t border-[#1f1f1f] space-y-2">
        <div className="flex items-start gap-2 text-xs">
          <span>{homeTeam.flag}</span>
          <span className="text-[#888]">{h.qualificationPath}</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <span>{awayTeam.flag}</span>
          <span className="text-[#888]">{a.qualificationPath}</span>
        </div>
      </div>
    </div>
  );
}
