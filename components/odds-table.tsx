import { TrendingUp } from "lucide-react";
import { Match } from "@/lib/types";

function impliedProb(odds: number) {
  return ((1 / odds) * 100).toFixed(0);
}

function bestOdd(values: number[]) {
  return Math.max(...values);
}

export default function OddsTable({ match }: { match: Match }) {
  const { odds, homeTeam, awayTeam } = match;

  if (odds.length === 0) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#ffd700]" />
          <span className="font-semibold text-[#f0f0f0]">Cotes</span>
        </div>
        <div className="py-6 text-center text-xs text-[#555]">
          Cotes indisponibles pour le moment.
        </div>
      </div>
    );
  }

  const bestHome = bestOdd(odds.map((o) => o.home));
  const bestDraw = bestOdd(odds.map((o) => o.draw));
  const bestAway = bestOdd(odds.map((o) => o.away));

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-[#ffd700]" />
        <span className="font-semibold text-[#f0f0f0]">Cotes en direct</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-2 mb-2 text-[10px] text-[#888] uppercase tracking-wide">
        <div>Bookmaker</div>
        <div className="text-center">{homeTeam.flag} {homeTeam.shortName}</div>
        <div className="text-center">Nul</div>
        <div className="text-center">{awayTeam.flag} {awayTeam.shortName}</div>
      </div>

      <div className="space-y-1">
        {odds.map((o) => (
          <div
            key={o.bookmaker}
            className="grid grid-cols-4 gap-2 py-2 border-b border-[#1a1a1a] last:border-0"
          >
            <div className="text-sm text-[#888] font-medium">{o.bookmaker}</div>
            <div className={`text-center text-sm font-bold tabular-nums ${o.home === bestHome ? "text-[var(--accent)]" : "text-[#f0f0f0]"}`}>
              {o.home.toFixed(2)}
            </div>
            <div className={`text-center text-sm font-bold tabular-nums ${o.draw === bestDraw ? "text-[#ffd700]" : "text-[#f0f0f0]"}`}>
              {o.draw.toFixed(2)}
            </div>
            <div className={`text-center text-sm font-bold tabular-nums ${o.away === bestAway ? "text-[var(--accent)]" : "text-[#f0f0f0]"}`}>
              {o.away.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Implied probabilities */}
      <div className="mt-3 pt-3 border-t border-[#1f1f1f]">
        <div className="text-[10px] text-[#888] uppercase tracking-wide mb-2">
          Probabilités implicites (meilleures cotes)
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: homeTeam.shortName, prob: impliedProb(bestHome) },
            { label: "Nul", prob: impliedProb(bestDraw) },
            { label: awayTeam.shortName, prob: impliedProb(bestAway) },
          ].map(({ label, prob }) => (
            <div key={label}>
              <div className="text-lg font-bold text-[#f0f0f0]">{prob}%</div>
              <div className="text-[10px] text-[#888]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
