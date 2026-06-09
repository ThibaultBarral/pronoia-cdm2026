import { Team, MatchResult, TeamMomentum } from "@/lib/types";

function ResultBadge({ result }: { result: MatchResult }) {
  const config: Record<MatchResult, { label: string; classes: string }> = {
    W: { label: "V", classes: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30" },
    D: { label: "N", classes: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30" },
    L: { label: "D", classes: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30" },
  };
  const { label, classes } = config[result];
  return (
    <span className={`w-6 h-6 rounded border text-[10px] font-black flex items-center justify-center shrink-0 ${classes}`}>
      {label}
    </span>
  );
}

function MomentumBadge({ momentum }: { momentum: TeamMomentum }) {
  const config = {
    hot: { label: "En forme", emoji: "🔥", classes: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30" },
    cold: { label: "En méforme", emoji: "❄️", classes: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30" },
    neutral: { label: "Irrégulier", emoji: "➖", classes: "bg-[#888]/15 text-[#aaa] border-[#888]/30" },
  }[momentum.trend];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${config.classes}`}>
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

export default function TeamForm({ team }: { team: Team }) {
  const m = team.momentum;
  const count = team.recentForm.length;

  return (
    <div className="rounded-xl glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{team.flag}</span>
        <span className="font-semibold text-[#f0f0f0]">{team.name}</span>
        {m && <MomentumBadge momentum={m} />}
        <span className="ml-auto text-[10px] text-[#888] uppercase tracking-wide">
          {count} derniers
        </span>
      </div>

      {/* Momentum summary */}
      {m && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[11px] text-[#888]">
          <span>
            <span className="text-[#f0f0f0] font-semibold">{m.last5Pts}/15</span> sur 5
          </span>
          <span>
            ⚽ <span className="text-[#f0f0f0] font-semibold">{m.goalsForAvg}</span> marqués/match
          </span>
          <span>
            🥅 <span className="text-[#f0f0f0] font-semibold">{m.goalsAgainstAvg}</span> encaissés/match
          </span>
          <span>
            🧤 <span className="text-[#f0f0f0] font-semibold">{m.cleanSheets}</span> clean sheets
          </span>
        </div>
      )}

      <div className="space-y-2">
        {team.recentForm.slice(0, 10).map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <ResultBadge result={f.result} />
            <span className="text-[#f0f0f0] font-medium min-w-[44px]">{f.score}</span>
            {f.venue && (
              <span className="text-[9px] text-[#555] uppercase shrink-0 w-4">
                {f.venue === "H" ? "dom" : "ext"}
              </span>
            )}
            <span className="text-[#888] truncate flex-1">{f.opponent}</span>
            <span className="text-[10px] text-[#555] shrink-0 hidden sm:block">{f.competition}</span>
          </div>
        ))}
      </div>

      {/* Injuries / Suspensions */}
      {(team.injuries.length > 0 || team.suspensions.length > 0) && (
        <div className="mt-3 pt-3 border-t border-[#1f1f1f] space-y-1">
          {team.injuries.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
              <span className="text-[#f59e0b]">Blessure :</span>
              <span className="text-[#888]">{p}</span>
            </div>
          ))}
          {team.suspensions.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
              <span className="text-[#ef4444]">Suspension :</span>
              <span className="text-[#888]">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
