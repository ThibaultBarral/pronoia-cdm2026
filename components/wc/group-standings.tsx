import Link from "next/link";
import type { GroupStanding, StandingRow } from "@/lib/group-standings";
import type { TeamSimResult } from "@/lib/simulation";

/**
 * Real, live group standings (one table per group), built from the matches
 * actually played. Adds a projected "qualification %" column from the
 * simulation. Top 2 are highlighted as the direct qualifiers.
 */

// Same column template for the header and every row (mobile: 6 cols; the G/N/P
// columns appear from sm: up, where the template grows to 9 cols).
const COLS =
  "grid grid-cols-[16px_1fr_22px_30px_28px_34px] sm:grid-cols-[16px_1fr_22px_22px_22px_22px_30px_28px_34px] items-center gap-x-1";

export default function GroupStandings({
  standings,
  simBySlug,
}: {
  standings: GroupStanding[];
  simBySlug: Map<string, TeamSimResult>;
}) {
  // Pre-tournament (no match played in a group): order by projected qualification.
  const ordered = (g: GroupStanding): StandingRow[] => {
    if (g.anyPlayed) return g.rows;
    const q = (r: StandingRow) => {
      const s = simBySlug.get(r.slug);
      return s ? s.winGroup + s.runnerUp : 0;
    };
    return [...g.rows].sort((a, b) => q(b) - q(a));
  };

  return (
    <div>
      <p className="text-[11px] text-[var(--text-muted)] mb-3">
        Classement réel mis à jour après chaque match · les 2 premiers se qualifient ·
        Q% = chance de qualification (simulation).
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {standings.map((g) => {
          const rows = ordered(g);
          return (
            <div key={g.letter} className="rounded-2xl glass p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-[#f0f0f0]">Groupe {g.letter}</h3>
                {!g.anyPlayed && (
                  <span className="text-[10px] text-[var(--text-muted)]">À venir</span>
                )}
              </div>

              {/* Header */}
              <div className={`${COLS} px-1 pb-1.5 text-[9px] uppercase tracking-wide text-[#5a6472]`}>
                <span />
                <span>Équipe</span>
                <span className="text-center">J</span>
                <span className="hidden sm:block text-center">G</span>
                <span className="hidden sm:block text-center">N</span>
                <span className="hidden sm:block text-center">P</span>
                <span className="text-center">Diff</span>
                <span className="text-center">Pts</span>
                <span className="text-center">Q%</span>
              </div>

              <div className="space-y-0.5">
                {rows.map((r, i) => {
                  const qualifier = i < 2;
                  const sim = simBySlug.get(r.slug);
                  const qPct = sim ? Math.round(sim.winGroup + sim.runnerUp) : null;
                  return (
                    <Link
                      key={r.nameEn}
                      href={`/team/${r.slug}`}
                      className={`${COLS} rounded-lg px-1 py-1.5 hover:bg-white/[0.04] transition-colors ${
                        qualifier ? "bg-[var(--accent)]/[0.04]" : ""
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold text-center ${
                          qualifier ? "text-[var(--accent)]" : "text-[#5a6472]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{r.flag}</span>
                        <span className="text-xs font-semibold text-[#e5e5e5] truncate">{r.fr}</span>
                      </span>
                      <span className="text-[11px] text-center tabular-nums text-[#aab1bd]">{r.played}</span>
                      <span className="hidden sm:block text-[11px] text-center tabular-nums text-[#aab1bd]">{r.win}</span>
                      <span className="hidden sm:block text-[11px] text-center tabular-nums text-[#aab1bd]">{r.draw}</span>
                      <span className="hidden sm:block text-[11px] text-center tabular-nums text-[#aab1bd]">{r.loss}</span>
                      <span className="text-[11px] text-center tabular-nums text-[#aab1bd]">
                        {r.gd > 0 ? `+${r.gd}` : r.gd}
                      </span>
                      <span className="text-xs text-center font-black tabular-nums text-[#f0f0f0]">{r.points}</span>
                      <span className="text-[11px] text-center tabular-nums text-[var(--accent)]/80">
                        {qPct != null ? qPct : "—"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
