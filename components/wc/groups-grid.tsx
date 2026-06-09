import Link from "next/link";
import type { Group } from "@/lib/groups";
import type { TeamSimResult } from "@/lib/simulation";

/**
 * The 12 groups, each showing its 4 teams ordered by *projected* finishing
 * position (from the simulation). Top 2 are flagged as likely qualifiers.
 */
export default function GroupsGrid({
  groups,
  simBySlug,
}: {
  groups: Group[];
  simBySlug: Map<string, TeamSimResult>;
}) {
  return (
    <div>
      <h2 className="text-lg font-black text-[var(--text)] mb-1">Groupes</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Classement projeté par notre simulation · les 2 premiers se qualifient
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {groups.map((g) => {
          const teams = [...g.teams].sort((a, b) => {
            const sa = simBySlug.get(a.slug)?.winGroup ?? 0;
            const sb = simBySlug.get(b.slug)?.winGroup ?? 0;
            return sb - sa;
          });

          return (
            <div key={g.letter} className="rounded-2xl glass p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Groupe {g.letter}
                </h3>
                <span className="text-[10px] text-[var(--text-muted)]">% 1er</span>
              </div>

              <ul className="space-y-1">
                {teams.map((t, i) => {
                  const sim = simBySlug.get(t.slug);
                  const qualifies = i < 2;
                  return (
                    <li key={t.slug}>
                      <Link
                        href={`/team/${t.slug}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.05] transition-colors"
                      >
                        <span
                          className={`w-4 text-center text-xs font-bold ${
                            qualifies ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xl">{t.flag}</span>
                        <span className="text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors flex-1 truncate">
                          {t.fr}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                          {sim ? `${sim.winGroup.toFixed(0)}%` : "—"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
