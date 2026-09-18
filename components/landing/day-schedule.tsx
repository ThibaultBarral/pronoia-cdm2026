"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { getDayScheduleAction } from "@/actions/clubs";
import { trackEvent } from "@/lib/analytics";
import type { ClubFixture, DaySchedule as Schedule } from "@/lib/club-data";

const LIVE = new Set(["1H", "HT", "2H"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
const RANGE_DAYS = 7;

function shift(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(date: string, today: string): string {
  if (date === today) return "Aujourd'hui";
  if (date === shift(today, 1)) return "Demain";
  if (date === shift(today, -1)) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/**
 * The day's matches across the 7 covered competitions, Flashscore-style:
 * one block per competition, one compact line per match (time, the two
 * clubs, score when played), day navigation ±7 days. Server-rendered for
 * today, then the arrows fetch other days through a server action.
 */
export default function DaySchedule({ initial, today }: { initial: Schedule; today: string }) {
  const [schedule, setSchedule] = useState<Schedule>(initial);
  const [date, setDate] = useState(initial.date);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (date === schedule.date) return;
    startTransition(async () => {
      const next = await getDayScheduleAction(date).catch(() => ({ date, groups: [] }));
      setSchedule(next);
    });
  }, [date, schedule.date]);

  const delta = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  function go(days: number) {
    const next = shift(date, days);
    trackEvent("landing_day_change", { date: next });
    setDate(next);
  }

  const total = schedule.groups.reduce((n, g) => n + g.fixtures.length, 0);

  return (
    <section className="px-4 pb-14 -mt-6 sm:-mt-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
            Les matchs du jour
          </h2>
          <div className="inline-flex items-center rounded-xl glass overflow-hidden">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={delta <= -RANGE_DAYS}
              aria-label="Jour précédent"
              className="px-2.5 py-2 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2 text-sm font-bold text-[var(--text)] tabular-nums min-w-[7.5rem] justify-center">
              {pending ? <Loader2 size={13} className="animate-spin text-[var(--text-muted)]" /> : <CalendarDays size={13} className="text-[var(--accent-soft)]" />}
              {dayLabel(date, today)}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={delta >= RANGE_DAYS}
              aria-label="Jour suivant"
              className="px-2.5 py-2 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
            {pending ? "On cherche les matchs…" : "Aucun match dans les 7 compétitions ce jour-là."}
          </div>
        ) : (
          <div className={`space-y-3 transition-opacity ${pending ? "opacity-50" : ""}`}>
            {schedule.groups.map(({ competition, fixtures }) => (
              <div key={competition.slug} className="rounded-2xl glass overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-base leading-none">{competition.flag}</span>
                  <span className="text-xs font-black uppercase tracking-wide text-[var(--text)]">{competition.name}</span>
                  <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
                    {fixtures.length} match{fixtures.length > 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="divide-y divide-white/5">
                  {fixtures.map((f) => (
                    <li key={f.id}>
                      <FixtureLine f={f} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FixtureLine({ f }: { f: ClubFixture }) {
  const live = LIVE.has(f.status ?? "");
  const finished = FINISHED.has(f.status ?? "");
  const played = live || finished;
  return (
    <Link
      href={`/match/${f.id}`}
      onClick={() => trackEvent("landing_day_match_click", { match_id: String(f.id) })}
      className="group grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
    >
      <span className="text-xs tabular-nums text-[var(--text-muted)]">
        {live ? (
          <span className="inline-flex items-center gap-1 font-black text-[var(--accent-soft)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" /> Live
          </span>
        ) : finished ? (
          "Terminé"
        ) : (
          f.time
        )}
      </span>
      <span className="min-w-0 space-y-1">
        <span className="flex items-center gap-2 min-w-0">
          <TeamCrest logo={f.home.logo} name={f.home.name} size={20} />
          <span className="text-sm text-[var(--text)] truncate">{f.home.name}</span>
          {played && <span className="ml-auto text-sm font-black tabular-nums text-[var(--text)]">{f.score.home ?? 0}</span>}
        </span>
        <span className="flex items-center gap-2 min-w-0">
          <TeamCrest logo={f.away.logo} name={f.away.name} size={20} />
          <span className="text-sm text-[var(--text)] truncate">{f.away.name}</span>
          {played && <span className="ml-auto text-sm font-black tabular-nums text-[var(--text)]">{f.score.away ?? 0}</span>}
        </span>
      </span>
      <span className="shrink-0">
        {!played && f.analyzable ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 text-[var(--accent-soft)] group-hover:bg-[var(--accent)] group-hover:text-white text-[11px] font-bold px-2.5 py-1.5 transition-colors">
            <Sparkles size={11} /> Analyser
          </span>
        ) : (
          <ChevronRight size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
        )}
      </span>
    </Link>
  );
}
