"use client";

import { useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import type { ClubFixture } from "@/lib/club-data";

function when(f: ClubFixture): string {
  const d = new Date(f.kickoffIso);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Fixture list + live preview of the basic card, with a one-click PNG download. */
export default function CardsStudio({ fixtures }: { fixtures: ClubFixture[] }) {
  const [selected, setSelected] = useState<ClubFixture | null>(fixtures[0] ?? null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const url = selected ? `/match/${selected.id}/share?v=lecture` : null;
  const shown = q.trim()
    ? fixtures.filter((f) => `${f.home.name} ${f.away.name}`.toLowerCase().includes(q.trim().toLowerCase()))
    : fixtures;

  async function download() {
    if (!url || !selected) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `copafever-${selected.home.name}-${selected.away.name}.png`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrer : Marseille, Arsenal…"
          className="w-full rounded-xl glass px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/70 outline-none focus:border-[var(--accent)]/60 mb-3"
        />
        <ul className="rounded-2xl glass overflow-hidden divide-y divide-white/5">
          {shown.map((f) => {
            const active = selected?.id === f.id;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setSelected(f)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-[var(--accent)]/12" : "hover:bg-white/[0.04]"}`}
                >
                  <span className="text-[11px] text-[var(--text-muted)] w-28 shrink-0">{when(f)}</span>
                  <TeamCrest logo={f.home.logo} name={f.home.name} size={24} />
                  <span className="text-sm text-[var(--text)] truncate">{f.home.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">vs</span>
                  <TeamCrest logo={f.away.logo} name={f.away.name} size={24} />
                  <span className="text-sm text-[var(--text)] truncate">{f.away.name}</span>
                  <span className="ml-auto text-[10px] text-[var(--text-muted)] shrink-0">{f.competition?.flag} {f.competition?.shortName}</span>
                </button>
              </li>
            );
          })}
          {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Aucun match.</li>}
        </ul>
      </div>

      <div className="lg:sticky lg:top-6 self-start">
        {url ? (
          <>
            <div className="rounded-2xl overflow-hidden glass aspect-[9/16] bg-[var(--bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={url} src={url} alt="Aperçu de la card" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={download}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-bold px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Télécharger le PNG
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl glass px-3.5 text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Ouvrir en grand"
              >
                <Eye size={16} />
              </a>
            </div>
          </>
        ) : (
          <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">Choisis un match.</div>
        )}
      </div>
    </div>
  );
}
