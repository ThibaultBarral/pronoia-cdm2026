"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Match } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface Nation {
  name: string;
  flag: string;
  rank: number;
}

/**
 * Lightweight, direct favorite-team picker — sets `supported_nation` on the
 * user and closes immediately. Replaces the old full onboarding funnel (which
 * never returned to the dashboard, so picking a team felt broken).
 */
export default function FavoriteTeamModal({
  matches,
  onClose,
  onPicked,
}: {
  matches: Match[];
  onClose: () => void;
  onPicked: (nation: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const nations = useMemo<Nation[]>(() => {
    const byName = new Map<string, Nation>();
    for (const m of matches) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        if (t.isPlaceholder) continue;
        if (!byName.has(t.name)) {
          byName.set(t.name, { name: t.name, flag: t.flag, rank: t.fifaRanking });
        }
      }
    }
    return [...byName.values()].sort((a, b) => a.rank - b.rank);
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nations;
    return nations.filter((n) => n.name.toLowerCase().includes(q));
  }, [nations, query]);

  async function pick(name: string) {
    setSaving(name);
    try {
      await createClient().auth.updateUser({ data: { supported_nation: name } });
    } finally {
      onPicked(name);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-sm rounded-3xl glass-strong p-5 mb-4 sm:mb-0 max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-[var(--text)]">Ton équipe favorite</h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative mb-3 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cherche un pays (France, Brésil…)"
              className="w-full rounded-xl glass pl-10 pr-3 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors"
            />
          </div>

          <div className="overflow-y-auto -mx-1 px-1 grid grid-cols-2 gap-2">
            {filtered.map((n) => (
              <button
                key={n.name}
                onClick={() => pick(n.name)}
                disabled={saving !== null}
                className="flex items-center gap-2.5 rounded-xl glass hover:bg-white/[0.06] hover:border-[rgba(var(--accent-rgb),0.4)] transition-all px-3 py-3 text-left disabled:opacity-50"
              >
                <span className="text-xl leading-none shrink-0">{n.flag}</span>
                <span className="text-sm font-bold text-[var(--text)] truncate">
                  {saving === n.name ? "…" : n.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-center text-sm text-[var(--text-muted)] py-8">
                Aucun pays trouvé pour « {query} ».
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
