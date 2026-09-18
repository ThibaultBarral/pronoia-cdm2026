"use client";

import { useState } from "react";
import { Download, Eye, Loader2, CalendarDays } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { COMPETITIONS } from "@/lib/competitions";
import type { ClubFixture } from "@/lib/club-data";

function when(f: ClubFixture): string {
  const d = new Date(f.kickoffIso);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function fileName(f: ClubFixture): string {
  const day = f.date.slice(5).replace("-", "");
  return `copafever-${day}-${f.competition?.shortName ?? "match"}-${f.home.name}-vs-${f.away.name}.png`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function cardUrl(f: ClubFixture): string {
  return `/match/${f.id}/share?v=lecture`;
}

async function saveOne(f: ClubFixture): Promise<void> {
  const res = await fetch(cardUrl(f));
  if (!res.ok) throw new Error(`card ${f.id}`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName(f);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/**
 * Fixture list grouped by competition + live preview of the basic card.
 * One-click PNG per match, one click for a whole competition, one click for
 * everything today. Batches download one file after the other (the browser
 * asks once to allow multiple downloads).
 */
export default function CardsStudio({ fixtures, today }: { fixtures: ClubFixture[]; today: string }) {
  const [selected, setSelected] = useState<ClubFixture | null>(fixtures[0] ?? null);
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState<{ label: string; done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const url = selected ? cardUrl(selected) : null;
  const filter = q.trim().toLowerCase();
  const shown = filter ? fixtures.filter((f) => `${f.home.name} ${f.away.name}`.toLowerCase().includes(filter)) : fixtures;
  const todays = fixtures.filter((f) => f.date === today);
  const groups = COMPETITIONS.map((c) => ({ comp: c, rows: shown.filter((f) => f.competition?.slug === c.slug) })).filter(
    (g) => g.rows.length > 0,
  );

  async function saveMany(label: string, rows: ClubFixture[]) {
    if (!rows.length || batch) return;
    setError(null);
    setBatch({ label, done: 0, total: rows.length });
    let failed = 0;
    for (let i = 0; i < rows.length; i++) {
      try {
        await saveOne(rows[i]);
      } catch {
        failed++;
      }
      setBatch({ label, done: i + 1, total: rows.length });
      // A beat between files so the browser queues them cleanly.
      await new Promise((r) => setTimeout(r, 350));
    }
    setBatch(null);
    if (failed) setError(`${failed} card${failed > 1 ? "s" : ""} non générée${failed > 1 ? "s" : ""}.`);
  }

  const busy = batch !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div>
        {/* Quick action: everything today */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => saveMany("aujourd'hui", todays)}
            disabled={busy || todays.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-bold px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            {busy && batch?.label === "aujourd'hui" ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
            Toutes celles du jour ({todays.length})
          </button>
          {batch && (
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {batch.done}/{batch.total} · {batch.label}
            </span>
          )}
          {error && <span className="text-xs text-[#ef4444]">{error}</span>}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrer : Marseille, Arsenal…"
            className="ml-auto w-full sm:w-60 rounded-xl glass px-3.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/70 outline-none focus:border-[var(--accent)]/60"
          />
        </div>

        <div className="space-y-3">
          {groups.map(({ comp, rows }) => (
            <div key={comp.slug} className="rounded-2xl glass overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <span className="text-base leading-none">{comp.flag}</span>
                <span className="text-xs font-black uppercase tracking-wide text-[var(--text)]">{comp.name}</span>
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums">· {rows.length}</span>
                <button
                  type="button"
                  onClick={() => saveMany(comp.shortName, rows)}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-bold px-2.5 py-1.5 transition-colors disabled:opacity-50"
                >
                  {busy && batch?.label === comp.shortName ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Tout télécharger
                </button>
              </div>
              <ul className="divide-y divide-white/5">
                {rows.map((f) => {
                  const active = selected?.id === f.id;
                  return (
                    <li key={f.id} className={`flex items-center gap-2 pr-2 ${active ? "bg-[var(--accent)]/12" : "hover:bg-white/[0.04]"} transition-colors`}>
                      <button type="button" onClick={() => setSelected(f)} className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left">
                        <span className="text-[11px] text-[var(--text-muted)] w-28 shrink-0">{when(f)}</span>
                        <TeamCrest logo={f.home.logo} name={f.home.name} size={24} />
                        <span className="text-sm text-[var(--text)] truncate">{f.home.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">vs</span>
                        <TeamCrest logo={f.away.logo} name={f.away.name} size={24} />
                        <span className="text-sm text-[var(--text)] truncate">{f.away.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => saveMany(`${f.home.name}-${f.away.name}`, [f])}
                        disabled={busy}
                        aria-label="Télécharger cette card"
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/[0.05] disabled:opacity-50"
                      >
                        <Download size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {groups.length === 0 && <div className="rounded-2xl glass px-4 py-6 text-center text-sm text-[var(--text-muted)]">Aucun match.</div>}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 self-start">
        {url && selected ? (
          <>
            <div className="rounded-2xl overflow-hidden glass aspect-[9/16] bg-[var(--bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={url} src={url} alt="Aperçu de la card" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => saveMany(`${selected.home.name}-${selected.away.name}`, [selected])}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-bold px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                <Download size={15} /> Télécharger le PNG
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
