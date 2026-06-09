import Link from "next/link";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Match } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  match: Match;
  index?: number;
}

function OddsChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-[#888] uppercase">{label}</span>
      <span className="text-sm font-bold text-[#f0f0f0] tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

export default function MatchCard({ match, index = 0 }: MatchCardProps) {
  const winamax = match.odds[0];
  const delayClass = [`delay-100`, `delay-200`, `delay-300`, `delay-400`, `delay-500`, ``][
    index % 6
  ];

  const date = new Date(`${match.date}T${match.time}:00`);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/match/${match.id}`}
      className={`match-card block p-4 md:p-5 animate-fade-in-up opacity-0 ${delayClass} cursor-pointer group`}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <Badge
          variant="outline"
          className="text-[10px] border-[#1f1f1f] text-[#888] bg-transparent"
        >
          Groupe {match.group}
        </Badge>
        <div className="flex items-center gap-1 text-[#888] text-xs">
          <MapPin size={11} />
          <span>{match.city}</span>
          <span className="ml-1 text-[10px] opacity-60">{match.country}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-3xl md:text-4xl">{match.homeTeam.flag}</span>
          <span className="text-sm font-semibold text-center text-[#f0f0f0] leading-tight truncate w-full text-center">
            {match.homeTeam.name}
          </span>
          <span className="text-[10px] text-[#888]">#{match.homeTeam.fifaRanking} FIFA</span>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-10 h-10 rounded-full border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center">
            <span className="text-xs font-bold text-[#888]">VS</span>
          </div>
          <div className="flex items-center gap-1 text-[#888] text-[10px]">
            <Calendar size={10} />
            <span>{match.time}</span>
          </div>
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-3xl md:text-4xl">{match.awayTeam.flag}</span>
          <span className="text-sm font-semibold text-center text-[#f0f0f0] leading-tight truncate w-full text-center">
            {match.awayTeam.name}
          </span>
          <span className="text-[10px] text-[#888]">#{match.awayTeam.fifaRanking} FIFA</span>
        </div>
      </div>

      {/* Date + Stadium */}
      <div className="flex items-center justify-center gap-2 mb-3 text-[#888] text-xs">
        <Calendar size={11} />
        <span className="capitalize">{dateStr}</span>
        <span className="opacity-40">·</span>
        <span>{match.stadium}</span>
      </div>

      {/* Odds bar */}
      {winamax && (
        <div className="flex items-center justify-around border-t border-[#1f1f1f] pt-3">
          <OddsChip label={match.homeTeam.shortName} value={winamax.home} />
          <div className="w-px h-8 bg-[#1f1f1f]" />
          <OddsChip label="Nul" value={winamax.draw} />
          <div className="w-px h-8 bg-[#1f1f1f]" />
          <OddsChip label={match.awayTeam.shortName} value={winamax.away} />
          <div className="w-px h-8 bg-[#1f1f1f]" />
          <div className="flex items-center gap-1 text-[var(--accent)] text-xs font-medium group-hover:gap-2 transition-all">
            <span>Analyser</span>
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
    </Link>
  );
}
