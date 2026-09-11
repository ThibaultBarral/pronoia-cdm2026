import { MapPin, CalendarClock, Shield } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { Match } from "@/lib/types";

const COUNTRY_NAME: Record<string, string> = {
  USA: "États-Unis",
  Canada: "Canada",
  Mexique: "Mexique",
};

/** One clean labelled fact row — icon chip + uppercase label + bold value. */
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[var(--accent)]" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </div>
        <div className="text-sm font-semibold text-[#e8e8e8] truncate">{children}</div>
      </div>
    </div>
  );
}

function TeamColumn({ team }: { team: Match["homeTeam"] }) {
  const inner = (
    <>
      {team.logo ? (
        <TeamCrest logo={team.logo} name={team.name} size={72} />
      ) : (
        <span className="text-5xl md:text-7xl">{team.flag}</span>
      )}
      <div className="text-center">
        <div className="text-base md:text-xl font-bold text-[#f0f0f0] group-hover:text-[var(--accent)] transition-colors leading-tight">
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

  return <div className="flex flex-col items-center gap-2 px-2 py-1">{inner}</div>;
}

export default function MatchHeader({ match }: { match: Match }) {
  const date = new Date(`${match.date}T${match.time}:00`);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
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
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
                  <span className="text-lg font-black text-[#888]">VS</span>
                </div>
                <span className="text-[var(--accent)] text-sm font-bold">{match.time}</span>
              </>
            )}
          </div>

          <TeamColumn team={match.awayTeam} />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] my-6" />

        {/* Two clean facts — kickoff + venue. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={CalendarClock} label="Coup d'envoi">
            <span className="capitalize">{dateStr}</span> à {match.time}
          </InfoRow>
          <InfoRow icon={MapPin} label="Stade">
            {match.stadium}, {match.city} ({COUNTRY_NAME[match.country] ?? match.country})
          </InfoRow>
        </div>
      </div>
    </div>
  );
}
