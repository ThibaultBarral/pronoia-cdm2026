"use client";

import Link from "next/link";
import type { Match } from "@/lib/types";

/** Statuses we treat as "live right now" (a ball is in play / paused on pitch). */
const LIVE: ReadonlyArray<NonNullable<Match["status"]>> = ["1H", "HT", "2H"];

/** Short French label for an in-play status. */
function phaseLabel(status: Match["status"]): string {
  switch (status) {
    case "1H":
      return "1re MT";
    case "HT":
      return "Mi-temps";
    case "2H":
      return "2e MT";
    default:
      return "";
  }
}

/**
 * "EN DIRECT MAINTENANT" — a horizontal strip of matches currently in play, with
 * their live score. Mirrors the competitor's signature dashboard element while
 * staying fully data-driven (real scores from the polled fixtures; nothing is
 * fabricated). Renders nothing when no match is live, so it never shows an empty
 * bar during quiet hours.
 */
export default function LiveTicker({ matches }: { matches: Match[] }) {
  const live = matches.filter((m) => m.status && LIVE.includes(m.status));
  if (live.length === 0) return null;

  return (
    <section aria-label="Matchs en direct">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#22c55e]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
          </span>
          En direct maintenant
        </span>
        <span className="text-[10px] text-[#333] tabular-nums">
          {live.length} match{live.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1">
        {live.map((m) => {
          const h = m.score?.home ?? 0;
          const a = m.score?.away ?? 0;
          return (
            <Link
              key={m.id}
              href={`/match/${m.id}`}
              className="group shrink-0 rounded-xl glass px-3.5 py-2.5 hover:border-[var(--accent)]/30 transition-colors min-w-[180px]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#22c55e]">
                  {phaseLabel(m.status)}
                </span>
                <span className="text-[9px] text-[#444] group-hover:text-[var(--accent)] transition-colors">
                  Analyser →
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base shrink-0">{m.homeTeam.flag}</span>
                    <span className="text-xs font-semibold text-[#c0c0c0] truncate">
                      {m.homeTeam.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-base shrink-0">{m.awayTeam.flag}</span>
                    <span className="text-xs font-semibold text-[#c0c0c0] truncate">
                      {m.awayTeam.shortName}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 tabular-nums">
                  <span className="text-base font-black leading-tight text-[#f0f0f0]">{h}</span>
                  <span className="text-base font-black leading-tight text-[#f0f0f0] mt-1">{a}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
