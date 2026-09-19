"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Download, Eye, Loader2, CalendarDays, NotebookPen, Share } from "lucide-react";
import TeamCrest from "@/components/clubs/team-crest";
import { COMPETITIONS } from "@/lib/competitions";
import type { ClubFixture } from "@/lib/club-data";

function when(f: ClubFixture): string {
  const d = new Date(f.kickoffIso);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function fileName(f: ClubFixture): string {
  const day = f.date.slice(5).replace("-", "");
  return slug(`copafever-${day}-${f.competition?.shortName ?? "match"}-${f.home.name}-vs-${f.away.name}.png`);
}

function cardUrl(f: ClubFixture): string {
  return `/match/${f.id}/share?v=lecture`;
}

function notebookUrl(date: string, page: number): string {
  return `/admin/cards/day?date=${date}&page=${page}`;
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * On a phone, `a.download` lands in Fichiers (iOS) or opens the PNG in a tab.
 * The share sheet is the only way into Photos ("Enregistrer l'image", and
 * "Enregistrer N images" for a batch), so on touch devices that can share
 * files we go through navigator.share instead of a download link.
 */
function canShareToPhotos(): boolean {
  const ua = navigator.userAgent;
  const touchMac = navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform); // iPadOS
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua) || touchMac;
  if (!mobile || typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}
const noop = () => () => {};
function useShareToPhotos(): boolean {
  // Server renders the download variant; the client swaps to the share sheet after hydration.
  return useSyncExternalStore(noop, canShareToPhotos, () => false);
}

async function fetchFile(url: string, name: string): Promise<{ file: File; pages: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  const blob = await res.blob();
  const pages = Number(res.headers.get("x-pages") ?? "1") || 1;
  return { file: new File([blob], name, { type: "image/png" }), pages };
}

function downloadFile(file: File) {
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/** True when the share sheet opened (or the user dismissed it); false when the
 * browser refused because the tap is too old — the caller then shows a button. */
async function shareFiles(files: File[]): Promise<boolean> {
  try {
    await navigator.share({ files });
    return true;
  } catch (e) {
    return (e as DOMException)?.name === "AbortError";
  }
}

async function mapLimit<T, R>(rows: T[], limit: number, fn: (row: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(rows.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, rows.length) }, async () => {
      while (next < rows.length) {
        const i = next++;
        out[i] = await fn(rows[i], i);
      }
    }),
  );
  return out;
}

type Batch = { label: string; done: number; total: number };

/**
 * Admin content studio: the day's slideshow (handwritten notebook pages with
 * every pick) and the per-match basic cards, grouped by competition. Desktop
 * downloads PNGs; on a phone everything goes to Photos through the share sheet.
 */
export default function CardsStudio({ fixtures, today }: { fixtures: ClubFixture[]; today: string }) {
  const toPhotos = useShareToPhotos();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Files fetched but not yet handed to the share sheet (iOS forgets the tap
  // after a few seconds, so a long batch needs a second tap).
  const [pending, setPending] = useState<{ label: string; files: File[] } | null>(null);
  const busy = batch !== null;

  async function deliver(label: string, files: File[]) {
    if (!files.length) return;
    if (toPhotos) {
      const shown = await shareFiles(files);
      setPending(shown ? null : { label, files });
      return;
    }
    for (const f of files) {
      downloadFile(f);
      // A beat between files so the browser queues them cleanly.
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  async function run(label: string, jobs: { url: string; name: string }[]) {
    if (!jobs.length || busy) return;
    setError(null);
    setPending(null);
    setBatch({ label, done: 0, total: jobs.length });
    let done = 0;
    const results = await mapLimit(jobs, 3, async (j) => {
      const r = await fetchFile(j.url, j.name).catch(() => null);
      done++;
      setBatch({ label, done, total: jobs.length });
      return r;
    });
    const files = results.filter((r): r is NonNullable<typeof r> => r !== null).map((r) => r.file);
    const failed = jobs.length - files.length;
    setBatch(null);
    if (failed) setError(`${failed} card${failed > 1 ? "s" : ""} non générée${failed > 1 ? "s" : ""}.`);
    await deliver(label, files);
  }

  // ── Slides du jour ────────────────────────────────────────────────────────
  const [date, setDate] = useState(today);
  const [notebook, setNotebook] = useState<{ date: string; files: File[]; urls: string[] } | null>(null);
  // Loading = the slides on screen are not the ones of the selected date yet.
  const loadingNotebook = notebook?.date !== date;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const first = await fetchFile(notebookUrl(date, 1), `copafever-slide-${date}-1.png`);
        const rest = await Promise.all(
          Array.from({ length: first.pages - 1 }, (_, i) =>
            fetchFile(notebookUrl(date, i + 2), `copafever-slide-${date}-${i + 2}.png`),
          ),
        );
        if (cancelled) return;
        const files = [first.file, ...rest.map((r) => r.file)];
        setNotebook({ date, files, urls: files.map((f) => URL.createObjectURL(f)) });
      } catch {
        if (!cancelled) setError("Slides non générées.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => () => notebook?.urls.forEach((u) => URL.revokeObjectURL(u)), [notebook]);

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`)),
    [date],
  );

  // ── Cards par match ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState<ClubFixture | null>(fixtures[0] ?? null);
  const [q, setQ] = useState("");
  const url = selected ? cardUrl(selected) : null;
  const filter = q.trim().toLowerCase();
  const shown = filter ? fixtures.filter((f) => `${f.home.name} ${f.away.name}`.toLowerCase().includes(filter)) : fixtures;
  const todays = fixtures.filter((f) => f.date === today);
  const groups = COMPETITIONS.map((c) => ({ comp: c, rows: shown.filter((f) => f.competition?.slug === c.slug) })).filter(
    (g) => g.rows.length > 0,
  );
  const jobsFor = (rows: ClubFixture[]) => rows.map((f) => ({ url: cardUrl(f), name: fileName(f) }));

  const saveLabel = toPhotos ? "Enregistrer dans Photos" : "Télécharger";
  const SaveIcon = toPhotos ? Share : Download;

  return (
    <div className="space-y-8">
      {/* Second tap for iOS when the batch took longer than the tap allows */}
      {pending && (
        <button
          type="button"
          onClick={async () => {
            const shown = await shareFiles(pending.files);
            if (shown) setPending(null);
          }}
          className="sticky top-3 z-20 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-white text-sm font-bold px-4 py-3.5 shadow-lg shadow-black/40"
        >
          <Share size={16} /> Enregistrer {pending.files.length} image{pending.files.length > 1 ? "s" : ""} dans Photos
        </button>
      )}

      {/* ── Slides du jour ── */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="inline-flex items-center gap-2 text-base font-black text-[var(--text)]">
            <NotebookPen size={16} className="text-[var(--accent)]" /> Slides du jour
          </h2>
          <span className="text-xs text-[var(--text-muted)] capitalize">{dateLabel}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {[
              { label: "Aujourd'hui", d: today },
              { label: "Demain", d: shiftDate(today, 1) },
            ].map((o) => (
              <button
                key={o.d}
                type="button"
                onClick={() => setDate(o.d)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  date === o.d ? "bg-[var(--accent)] text-white" : "glass text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {o.label}
              </button>
            ))}
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-lg glass px-2 py-1 text-[11px] text-[var(--text)] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {loadingNotebook && (
            <div className="rounded-2xl glass aspect-[9/16] flex items-center justify-center text-[var(--text-muted)]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          {!loadingNotebook && notebook?.urls.map((u, i) => (
            <div key={u} className="rounded-2xl overflow-hidden glass aspect-[9/16] bg-[var(--bg)] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
              {notebook.urls.length > 1 && (
                <span className="absolute top-2 right-2 rounded-md bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5">
                  {i + 1}/{notebook.urls.length}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => notebook && deliver("slides", notebook.files)}
            disabled={!notebook || loadingNotebook}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-bold px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            <SaveIcon size={15} /> {saveLabel} les {notebook?.files.length ?? ""} slides
          </button>
          <a
            href={notebookUrl(date, 1)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl glass px-3.5 text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Ouvrir en grand"
          >
            <Eye size={16} />
          </a>
        </div>
      </section>

      {/* ── Cards par match ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => run("aujourd'hui", jobsFor(todays))}
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
                    onClick={() => run(comp.shortName, jobsFor(rows))}
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-bold px-2.5 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {busy && batch?.label === comp.shortName ? <Loader2 size={12} className="animate-spin" /> : <SaveIcon size={12} />}
                    Tout {toPhotos ? "enregistrer" : "télécharger"}
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
                          onClick={() => run(`${f.home.name}-${f.away.name}`, jobsFor([f]))}
                          disabled={busy}
                          aria-label={`${saveLabel} cette card`}
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/[0.05] disabled:opacity-50"
                        >
                          <SaveIcon size={14} />
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
                  onClick={() => run(`${selected.home.name}-${selected.away.name}`, jobsFor([selected]))}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-bold px-4 py-2.5 transition-colors disabled:opacity-60"
                >
                  <SaveIcon size={15} /> {saveLabel}
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
      </section>
    </div>
  );
}
