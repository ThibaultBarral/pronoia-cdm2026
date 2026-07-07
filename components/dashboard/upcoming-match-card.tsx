import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Match } from "@/lib/types";
import FlagTile from "./flag-tile";

interface UpcomingMatchCardProps {
  match: Match;
}

/** Medium tap-first tile for the home feed — team names stay visible on
 * mobile (unlike the dense MatchRow used on /dashboard/matchs). */
export default function UpcomingMatchCard({ match }: UpcomingMatchCardProps) {
  const d = new Date(match.date + "T12:00:00");
  const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <Link
      href={`/match/${match.id}`}
      className="group flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
        <span className="text-sm font-semibold text-[#d8d8d8] truncate">
          {match.homeTeam.name}
        </span>
        <FlagTile flag={match.homeTeam.flag} size="sm" />
      </div>

      <div className="flex flex-col items-center shrink-0 w-16">
        <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{match.time}</span>
        <span className="text-[10px] text-[#666] capitalize">{dayLabel}</span>
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <FlagTile flag={match.awayTeam.flag} size="sm" />
        <span className="text-sm font-semibold text-[#d8d8d8] truncate">
          {match.awayTeam.name}
        </span>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-[#444] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}
