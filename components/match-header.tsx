import { MapPin, Shield } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { Match } from "@/lib/types";

function TeamColumn({ team }: { team: Match["homeTeam"] }) {
  const inner = (
    <>
      {team.logo ? (
        <TeamCrest logo={team.logo} name={team.name} size={56} />
      ) : (
        <span className="text-4xl md:text-6xl">{team.flag}</span>
      )}
      <div className="text-center">
        <div className="text-sm md:text-lg font-bold text-[#f0f0f0] group-hover:text-[var(--accent)] transition-colors leading-tight">
          {team.name}
        </div>
        {!team.isPlaceholder && (team.leagueRank || team.fifaRanking > 0) && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Shield size={10} className="text-[#666]" />
            <span className="text-[11px] text-[#666]">
              {team.leagueRank ? `${team.leagueRank}${team.leagueRank === 1 ? "er" : "e"} au classement` : `#${team.fifaRanking} FIFA`}
            </span>
          </div>
        )}
      </div>
    </>
  );

  return <div className="flex flex-col items-center gap-1.5 px-1">{inner}</div>;
}

export default function MatchHeader({ match }: { match: Match }) {
  const date = new Date(`${match.date}T${match.time}:00`);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const live = match.status === "1H" || match.status === "2H" || match.status === "HT";
  const finished =
    match.status === "FT" || match.status === "AET" || match.status === "PEN";
  const started =
    (live || finished) && match.score?.home != null && match.score?.away != null;

  return (
    <div className="relative overflow-hidden rounded-2xl glass p-4 md:p-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Teams */}
        <div className="grid grid-cols-3 items-center gap-2 md:gap-4">
          <TeamColumn team={match.homeTeam} />

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
                <span className="text-[var(--accent)] text-lg font-black tabular-nums">{match.time}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#666]">{dateStr}</span>
              </>
            )}
          </div>

          <TeamColumn team={match.awayTeam} />
        </div>

        {/* Venue — one quiet line, the analysis is what the page is for. */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#666] truncate">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{match.stadium}, {match.city}</span>
        </p>
      </div>
    </div>
  );
}
