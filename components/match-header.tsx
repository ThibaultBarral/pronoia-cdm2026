import Link from "next/link";
import { MapPin, Calendar, Shield } from "lucide-react";
import { Match } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { teamSlug } from "@/lib/data-service";

export default function MatchHeader({ match }: { match: Match }) {
  const date = new Date(`${match.date}T${match.time}:00`);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const live = match.status === "1H" || match.status === "2H" || match.status === "HT";
  const finished =
    match.status === "FT" || match.status === "AET" || match.status === "PEN";
  const started =
    (live || finished) && match.score?.home != null && match.score?.away != null;

  return (
    <div className="relative overflow-hidden rounded-2xl glass p-6 md:p-8">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Round + group badges */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge className="bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20 text-xs">
            {match.round}
          </Badge>
          <Badge
            variant="outline"
            className="text-[#888] border-[#1f1f1f] text-xs"
          >
            Groupe {match.group}
          </Badge>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-3 items-center gap-4 mb-6">
          <Link
            href={`/team/${teamSlug(match.homeTeam.nameEn ?? match.homeTeam.name)}`}
            className="group flex flex-col items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-5xl md:text-7xl">{match.homeTeam.flag}</span>
            <div className="text-center">
              <div className="text-lg md:text-xl font-bold text-[#f0f0f0] group-hover:text-[var(--accent)] transition-colors">
                {match.homeTeam.name}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Shield size={11} className="text-[#888]" />
                <span className="text-xs text-[#888]">
                  #{match.homeTeam.fifaRanking} FIFA
                </span>
              </div>
              <div className="text-[10px] text-[#888] mt-0.5">{match.homeTeam.coach}</div>
              <div className="text-[9px] text-[var(--accent)]/0 group-hover:text-[var(--accent)] transition-colors mt-0.5">
                Voir l&apos;analyse d&apos;équipe →
              </div>
            </div>
          </Link>

          <div className="flex flex-col items-center gap-2">
            {started ? (
              <>
                <div className="px-4 py-2 rounded-2xl glass flex items-center gap-2.5">
                  <span className="text-3xl md:text-4xl font-black tabular-nums text-[#f0f0f0]">
                    {match.score!.home}
                  </span>
                  <span className="text-xl text-[#555]">–</span>
                  <span className="text-3xl md:text-4xl font-black tabular-nums text-[#f0f0f0]">
                    {match.score!.away}
                  </span>
                </div>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22c55e]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                    {match.status === "HT" ? "Mi-temps" : "En direct"}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#888]">
                    {match.status === "AET"
                      ? "Terminé (a.p.)"
                      : match.status === "PEN"
                        ? "Terminé (t.a.b.)"
                        : "Terminé"}
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
                  <span className="text-lg font-black text-[#888]">VS</span>
                </div>
                <span className="text-[var(--accent)] text-sm font-bold">{match.time}</span>
              </>
            )}
          </div>

          <Link
            href={`/team/${teamSlug(match.awayTeam.nameEn ?? match.awayTeam.name)}`}
            className="group flex flex-col items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-5xl md:text-7xl">{match.awayTeam.flag}</span>
            <div className="text-center">
              <div className="text-lg md:text-xl font-bold text-[#f0f0f0] group-hover:text-[var(--accent)] transition-colors">
                {match.awayTeam.name}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Shield size={11} className="text-[#888]" />
                <span className="text-xs text-[#888]">
                  #{match.awayTeam.fifaRanking} FIFA
                </span>
              </div>
              <div className="text-[10px] text-[#888] mt-0.5">{match.awayTeam.coach}</div>
              <div className="text-[9px] text-[var(--accent)]/0 group-hover:text-[var(--accent)] transition-colors mt-0.5">
                Voir l&apos;analyse d&apos;équipe →
              </div>
            </div>
          </Link>
        </div>

        {/* Match info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-[#888]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[var(--accent)]" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <span className="hidden sm:block opacity-30">·</span>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[var(--accent)]" />
            <span>{match.stadium}, {match.city}</span>
            <span className="ml-1 text-xs opacity-60">({match.country})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
