"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { GroupTeam } from "@/lib/groups";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function TeamSearch({ teams }: { teams: GroupTeam[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const n = norm(q);
    return teams
      .filter((t) => norm(t.fr).includes(n) || norm(t.nameEn).includes(n))
      .slice(0, 8);
  }, [q, teams]);

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher une équipe…"
          className="w-full rounded-2xl glass pl-11 pr-4 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl glass-strong overflow-hidden shadow-xl">
          {results.map((t) => (
            <button
              key={t.slug}
              onMouseDown={() => router.push(`/team/${t.slug}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-2xl">{t.flag}</span>
              <span className="text-sm font-semibold text-[var(--text)] flex-1">
                {t.fr}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Gr. {t.group} · #{t.fifaRanking}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
