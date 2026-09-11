"use client";

import Link from "next/link";
import { Lock, Sparkles, Clock } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import type { ClubFixture } from "@/lib/club-data";

const LIVE = new Set(["1H", "HT", "2H"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

function dayLabel(f: ClubFixture): string {
  const d = new Date(`${f.date}T${f.time || "00:00"}:00`);
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(d);
  return `${s} · ${f.time}`;
}

/**
 * One fixture line. Upcoming matches inside the 7-day window carry an
 * "Analyser" action; further ones say when the analysis opens; finished ones
 * show the score. `highlightTeamId` bolds the club whose page we're on.
 */
export default function ClubFixtureRow({
  fixture: f,
  highlightTeamId,
  onAnalyze,
}: {
  fixture: ClubFixture;
  highlightTeamId?: number;
  /** When given, the row calls this instead of linking to /match/[id]. */
  onAnalyze?: (f: ClubFixture) => void;
}) {
  const finished = FINISHED.has(f.status ?? "");
  const live = LIVE.has(f.status ?? "");
  const bold = (id: number) => (highlightTeamId === id ? "text-[var(--text)] font-black" : "text-[#c3cbe3] font-semibold");

  const inner = (
    <>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TeamCrest logo={f.home.logo} name={f.home.name} size={30} />
        <span className={`text-sm truncate ${bold(f.home.id)}`}>{f.home.name}</span>
      </div>

      <div className="shrink-0 text-center w-16">
        {finished || live ? (
          <span className={`text-base font-black tabular-nums ${live ? "text-[var(--accent-soft)]" : "text-[var(--text)]"}`}>
            {f.score.home ?? 0} - {f.score.away ?? 0}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">vs</span>
        )}
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className={`text-sm truncate text-right ${bold(f.away.id)}`}>{f.away.name}</span>
        <TeamCrest logo={f.away.logo} name={f.away.name} size={30} />
      </div>
    </>
  );

  return (
    <div className="rounded-2xl glass p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] text-[var(--text-muted)] truncate">
          {f.competition?.flag} {f.competition?.shortName} · {dayLabel(f)}
        </span>
        {live && (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--accent-soft)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" /> En direct
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">{inner}</div>

      {!finished && !live && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          {f.analyzable ? (
            onAnalyze ? (
              <button
                onClick={() => onAnalyze(f)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-bold px-3.5 py-2 transition-colors"
              >
                <Sparkles size={13} /> Analyser ce match
              </button>
            ) : (
              <Link
                href={`/match/${f.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-bold px-3.5 py-2 transition-colors"
              >
                <Sparkles size={13} /> Analyser ce match
              </Link>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Lock size={12} /> Analyse ouverte 7 jours avant le match
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Clock size={11} />
            {f.daysUntil === 0 ? "aujourd'hui" : f.daysUntil === 1 ? "demain" : `dans ${f.daysUntil} jours`}
          </span>
        </div>
      )}
    </div>
  );
}
