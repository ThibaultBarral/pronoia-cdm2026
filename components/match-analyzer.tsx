"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Sparkles } from "lucide-react";
import type { Match } from "@/lib/types";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

interface TeamLite {
  name: string;
  nameEn: string;
  flag: string;
}

/** Type a team → see its upcoming matches, each clickable to launch the analysis. */
export default function MatchAnalyzer({ matches }: { matches: Match[] }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<TeamLite | null>(null);

  // Unique team list from the fixtures.
  const teams = useMemo(() => {
    const map = new Map<string, TeamLite>();
    for (const m of matches) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        const key = t.nameEn ?? t.name;
        if (!map.has(key)) map.set(key, { name: t.name, nameEn: key, flag: t.flag });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [matches]);

  const suggestions = useMemo(() => {
    if (!q.trim() || picked) return [];
    const n = norm(q);
    return teams
      .filter((t) => norm(t.name).includes(n) || norm(t.nameEn).includes(n))
      .slice(0, 6);
  }, [q, teams, picked]);

  const upcoming = useMemo(() => {
    if (!picked) return [];
    return matches
      .filter(
        (m) =>
          (m.homeTeam.nameEn ?? m.homeTeam.name) === picked.nameEn ||
          (m.awayTeam.nameEn ?? m.awayTeam.name) === picked.nameEn
      )
      .filter((m) => (m.status ?? "NS") === "NS")
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
      )
      .slice(0, 12);
  }, [picked, matches]);

  return (
    <section className="rounded-2xl glass p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} className="text-[var(--accent)]" />
        <h2 className="text-sm font-black text-[var(--text)]">Analyser un match</h2>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Tape une équipe pour voir ses prochains matchs et lancer l&apos;analyse IA.
      </p>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={picked ? picked.name : q}
          onChange={(e) => {
            setPicked(null);
            setQ(e.target.value);
          }}
          placeholder="Cherche une équipe (ex. France, Brésil…)"
          className="w-full rounded-xl glass pl-10 pr-3 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full rounded-xl glass-strong overflow-hidden shadow-xl">
            {suggestions.map((t) => (
              <button
                key={t.nameEn}
                onClick={() => {
                  setPicked(t);
                  setQ("");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-xl">{t.flag}</span>
                <span className="text-sm font-semibold text-[var(--text)]">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {picked && (
        <div className="mt-4">
          {upcoming.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">
              Aucun match à venir trouvé pour {picked.name}.
            </p>
          ) : (
            <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
              {upcoming.map((m) => {
                const d = new Date(`${m.date}T12:00:00`);
                const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
                return (
                  <Link
                    key={m.id}
                    href={`/match/${m.id}`}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums w-16 shrink-0">
                      {label} · {m.time}
                    </span>
                    <span className="flex items-center gap-1.5 flex-1 min-w-0 text-sm">
                      <span>{m.homeTeam.flag}</span>
                      <span className="text-[var(--text)] truncate">{m.homeTeam.name}</span>
                      <span className="text-[var(--text-muted)] mx-1">vs</span>
                      <span>{m.awayTeam.flag}</span>
                      <span className="text-[var(--text)] truncate">{m.awayTeam.name}</span>
                    </span>
                    <ChevronRight size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
