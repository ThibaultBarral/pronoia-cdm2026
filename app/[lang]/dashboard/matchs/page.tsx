"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import MatchRow from "@/components/dashboard/match-row";
import { Match } from "@/lib/types";
import { getMatchesAction } from "@/actions/get-matches";

// Full match browser — search + group filters. Moved off the home page so the
// dashboard home can stay a focused, personalized feed (hero + upcoming).
export default function AllMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const load = () =>
      getMatchesAction().then((m) => {
        if (!active) return;
        setMatches(m);
        setLoading(false);
      });
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const filtered = matches
    .filter((m) => activeGroup === "ALL" || m.group === activeGroup)
    .filter((m) => {
      if (!search) return true;
      const norm = (s: string) =>
        s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      const q = norm(search);
      const hay = [
        m.homeTeam.name, m.homeTeam.nameEn, m.homeTeam.shortName,
        m.awayTeam.name, m.awayTeam.nameEn, m.awayTeam.shortName,
      ]
        .filter(Boolean)
        .map((s) => norm(s as string));
      return hay.some((h) => h.includes(q));
    })
    .sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  // Group by date for display
  const byDate: Record<string, Match[]> = {};
  for (const m of filtered) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  }

  const today = new Date().toISOString().split("T")[0];

  const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

  return (
    <>
      <AppSidebar />

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar — search + group filter (sticky on desktop only; the mobile
            burger bar already sits pinned above on small screens). */}
        <header className="md:sticky md:top-0 z-30 bg-[#080b12]/90 backdrop-blur-xl border-b border-white/5">
          <div className="h-14 flex items-center gap-3 px-4">
            {/* Search */}
            <div className="flex-1 max-w-sm relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" />
              <input
                type="text"
                placeholder="Chercher une équipe…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#111] border border-[#1a1a1a] text-sm text-[#c0c0c0] placeholder-[#333] focus:outline-none focus:border-[var(--accent)]/30 transition-colors"
              />
            </div>

            <span className="ml-auto text-[11px] text-[#444] tabular-nums shrink-0">
              {filtered.length} match{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Group filter chips — scrollable */}
          <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveGroup("ALL")}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeGroup === "ALL"
                  ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/20"
                  : "text-[#444] border border-[#181818] hover:text-[#666] hover:bg-[#111]"
              }`}
            >
              Tous
            </button>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeGroup === g
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20"
                    : "text-[#444] border border-[#1a1a1a] hover:text-[#666] hover:bg-[#111]"
                }`}
              >
                Gr. {g}
              </button>
            ))}
          </div>
        </header>

        {/* Match list */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="rounded-2xl glass divide-y divide-white/5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-32 bg-[#111] rounded" />
                  <div className="ml-auto h-4 w-24 bg-[#111] rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl glass flex flex-col items-center gap-2 py-16 text-[#3a4560]">
              <Search size={24} />
              <p className="text-sm">Aucun match trouvé</p>
              <button
                className="text-xs text-[var(--accent)] hover:underline"
                onClick={() => { setSearch(""); setActiveGroup("ALL"); }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byDate).map(([date, dayMatches]) => {
                const d = new Date(date + "T12:00:00");
                const label =
                  date === today
                    ? "Aujourd'hui"
                    : d.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      });

                return (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wide ${
                          date === today ? "text-[var(--accent)]" : "text-[#333]"
                        }`}
                      >
                        {label}
                      </h3>
                      <div className="flex-1 h-px bg-[#141414]" />
                      <span className="text-[10px] text-[#2a2a2a]">
                        {dayMatches.length} match{dayMatches.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Match rows */}
                    <div className="rounded-2xl glass overflow-hidden">
                      {dayMatches.map((m) => (
                        <MatchRow key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
