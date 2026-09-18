"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { searchClubsAction } from "@/actions/clubs";
import type { ClubSummary } from "@/lib/club-data";

/**
 * "Quelle équipe ?" — a debounced club search over the 7 covered competitions.
 * Used by the onboarding (step 1) and the dashboard home.
 */
export default function TeamSearch({
  onSelect,
  autoFocus = false,
  placeholder = "Tape le nom d'une équipe : Paris, Real Madrid, Arsenal…",
}: {
  onSelect: (club: ClubSummary) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  // Results + the query they answer; "loading" is derived from the mismatch.
  const [resolved, setResolved] = useState<{ query: string; results: ClubSummary[] }>({ query: "", results: [] });
  const seq = useRef(0);
  const query = q.trim();
  const active = query.length >= 1;
  const loading = active && resolved.query !== query;
  const results = active && resolved.query === query ? resolved.results : [];
  const searched = active && resolved.query === query;

  useEffect(() => {
    if (query.length < 1) return;
    const id = ++seq.current;
    const t = setTimeout(() => {
      searchClubsAction(query)
        .then((r) => {
          if (seq.current === id) setResolved({ query, results: r });
        })
        .catch(() => {
          if (seq.current === id) setResolved({ query, results: [] });
        });
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="w-full">
      <label className="relative block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </span>
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl glass-strong pl-12 pr-4 py-4 text-base text-[var(--text)] placeholder:text-[var(--text-muted)]/70 outline-none focus:border-[var(--accent)]/60 transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {results.length > 0 && (
        <ul className="mt-2 rounded-2xl glass overflow-hidden divide-y divide-white/5">
          {results.map((c) => (
            <li key={c.apiId}>
              <button
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.05] transition-colors"
              >
                <TeamCrest logo={c.logo} name={c.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--text)] truncate">{c.name}</span>
                  <span className="block text-[11px] text-[var(--text-muted)]">
                    {c.competition.flag} {c.competition.name}
                    {c.rank ? ` · ${c.rank}${c.rank === 1 ? "er" : "e"}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="mt-3 text-sm text-[var(--text-muted)] text-center">
          Aucune équipe trouvée. Copafever couvre la Ligue 1, la Premier League, la Liga, la Serie A, la
          Bundesliga, la Ligue des Champions et la Ligue Europa.
        </p>
      )}
    </div>
  );
}
