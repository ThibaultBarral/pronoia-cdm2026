import { History } from "lucide-react";
import { Match } from "@/lib/types";

export default function H2HStats({ match }: { match: Match }) {
  const { homeTeam, awayTeam, h2h } = match;

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  h2h.forEach((m) => {
    const parts = m.score.split("-");
    if (parts.length !== 2) return;
    const home = parseInt(parts[0]);
    const away = parseInt(parts[1].split(" ")[0]);
    if (isNaN(home) || isNaN(away)) return;
    const isHomeTeamFirst = m.homeTeam === homeTeam.name;
    if (home === away) draws++;
    else if (home > away) isHomeTeamFirst ? homeWins++ : awayWins++;
    else isHomeTeamFirst ? awayWins++ : homeWins++;
  });

  const total = homeWins + draws + awayWins || 1;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-[#00ff88]" />
        <span className="font-semibold text-[#f0f0f0]">Confrontations directes</span>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div>
          <div className="text-xl font-bold text-[#22c55e]">{homeWins}</div>
          <div className="text-[10px] text-[#888] truncate">{homeTeam.shortName}</div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#888]">{draws}</div>
          <div className="text-[10px] text-[#888]">Nuls</div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#22c55e]">{awayWins}</div>
          <div className="text-[10px] text-[#888] truncate">{awayTeam.shortName}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex rounded-full overflow-hidden h-1.5 mb-5">
        <div
          className="bg-[#22c55e] transition-all"
          style={{ width: `${(homeWins / total) * 100}%` }}
        />
        <div
          className="bg-[#888]"
          style={{ width: `${(draws / total) * 100}%` }}
        />
        <div
          className="bg-[#3b82f6] transition-all"
          style={{ width: `${(awayWins / total) * 100}%` }}
        />
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {h2h.map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-[10px] text-[#555] w-10 shrink-0">{m.date.slice(0, 4)}</span>
            <span className="text-[#888] text-xs truncate flex-1">{m.homeTeam}</span>
            <span className="font-bold text-[#f0f0f0] tabular-nums text-center min-w-[60px]">
              {m.score}
            </span>
            <span className="text-[#888] text-xs truncate flex-1 text-right">{m.awayTeam}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
