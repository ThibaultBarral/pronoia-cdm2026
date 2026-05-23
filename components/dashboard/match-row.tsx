import Link from "next/link";
import { ChevronRight, Calendar, MapPin } from "lucide-react";
import { Match } from "@/lib/types";

interface MatchRowProps {
  match: Match;
}

function OddPill({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center px-2.5 py-1.5 border text-center min-w-[48px] transition-colors ${
        highlight
          ? "border-[#00ff88]/25 bg-[#00ff88]/5 text-[#00ff88]"
          : "border-[#181818] bg-[#0d0d0d] text-[#666]"
      }`}
    >
      <span className="text-[9px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-bold tabular-nums leading-tight">{value.toFixed(2)}</span>
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  const now = new Date();
  const matchDate = new Date(`${match.date}T${match.time}:00`);
  const diffMs = matchDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
    const h = match.score?.home;
    const a = match.score?.away;
    if (h != null && a != null) {
      return (
        <span className="text-xs font-bold text-[#888] tabular-nums">
          {h} — {a}
        </span>
      );
    }
    return <span className="text-[10px] text-[#555]">Terminé</span>;
  }

  if (match.status === "1H" || match.status === "2H" || match.status === "HT") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22c55e]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        Live
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="text-[10px] font-semibold text-[#ffd700]">Aujourd&apos;hui</span>
    );
  }
  if (diffDays === 1) {
    return <span className="text-[10px] text-[#888]">Demain</span>;
  }

  return null;
}

export default function MatchRow({ match }: MatchRowProps) {
  const odds = match.odds[0]; // Best odds (first bookmaker)

  return (
    <Link
      href={`/match/${match.id}`}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors border-b border-[#0f0f0f] last:border-0"
    >
      {/* Teams */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Home */}
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            <span className="text-xs font-semibold text-[#c0c0c0] truncate hidden sm:block">
              {match.homeTeam.shortName}
            </span>
            <span className="text-lg shrink-0">{match.homeTeam.flag}</span>
          </div>

          {/* VS + time */}
          <div className="flex flex-col items-center shrink-0 w-14">
            <span className="text-[9px] font-bold text-[#00ff88] tabular-nums">
              {match.time}
            </span>
            <span className="text-[9px] text-[#444]">
              {new Date(match.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          </div>

          {/* Away */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-lg shrink-0">{match.awayTeam.flag}</span>
            <span className="text-xs font-semibold text-[#c0c0c0] truncate hidden sm:block">
              {match.awayTeam.shortName}
            </span>
          </div>
        </div>

        {/* Venue — desktop only */}
        <div className="hidden lg:flex items-center gap-1 text-[#333] text-[10px] shrink-0">
          <MapPin size={10} />
          <span className="truncate max-w-[100px]">{match.city}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="shrink-0 w-16 text-center">
        <StatusBadge match={match} />
      </div>

      {/* Odds chips — desktop */}
      {odds ? (
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <OddPill label={match.homeTeam.shortName} value={odds.home} />
          <OddPill label="N" value={odds.draw} />
          <OddPill label={match.awayTeam.shortName} value={odds.away} />
        </div>
      ) : (
        <div className="hidden md:block w-[148px] shrink-0" />
      )}

      {/* CTA */}
      <div className="shrink-0">
        <div className="flex items-center gap-1 text-[10px] text-[#444] group-hover:text-[#00ff88] transition-colors font-medium">
          <span className="hidden sm:block">Analyser</span>
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
