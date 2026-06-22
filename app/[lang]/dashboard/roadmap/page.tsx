import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import { ROADMAP, PRODUCT_NEWS, type Milestone, type MilestoneTone } from "@/lib/roadmap";

export const metadata: Metadata = {
  title: "Roadmap — le futur de Copafever",
  description:
    "Coupe du Monde 2026, reprise des championnats, Ligue des Champions… la feuille de route de Copafever.",
};

const TONE: Record<
  MilestoneTone,
  { dot: string; ring: string; label: string; pill: string }
> = {
  live: {
    dot: "var(--accent)",
    ring: "rgba(var(--accent-rgb),0.30)",
    label: "var(--accent)",
    pill: "bg-[var(--accent)] text-[#06231a]",
  },
  urgent: {
    dot: "#ef4444",
    ring: "rgba(239,68,68,0.30)",
    label: "#ff6b6b",
    pill: "bg-[#ef4444] text-white",
  },
  gold: {
    dot: "#ffd700",
    ring: "rgba(255,215,0,0.30)",
    label: "#ffd700",
    pill: "bg-[#ffd700] text-[#1a1300]",
  },
  muted: {
    dot: "#3a4250",
    ring: "rgba(255,255,255,0.10)",
    label: "#7a8290",
    pill: "bg-white/10 text-[#aab1bd]",
  },
};

function TimelineItem({ m, last }: { m: Milestone; last: boolean }) {
  const tone = TONE[m.tone];
  return (
    <div className="relative pl-10 pb-8">
      {/* Vertical line */}
      {!last && (
        <span className="absolute left-[11px] top-5 bottom-0 w-px bg-white/8" />
      )}
      {/* Dot */}
      <span
        className="absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${tone.dot} 14%, transparent)`, border: `1px solid ${tone.ring}` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: tone.dot }}
        />
      </span>

      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[11px] font-black uppercase tracking-wider"
          style={{ color: tone.label }}
        >
          {m.when}
        </span>
        {m.tag && (
          <span
            className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${tone.pill}`}
          >
            {m.tag}
          </span>
        )}
      </div>

      <h3 className="text-lg font-black text-[#f0f0f0]">{m.title}</h3>
      <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-xl">
        {m.description}
      </p>

      {m.points && (
        <ul className="mt-3 space-y-1.5">
          {m.points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 text-sm text-[#cdd3db]"
            >
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: tone.dot }}
              />
              {p}
            </li>
          ))}
        </ul>
      )}

      {m.ctaLabel && m.ctaHref && (
        <Link
          href={m.ctaHref}
          className="inline-flex items-center gap-1.5 mt-4 rounded-xl px-4 py-2 text-sm font-bold transition-colors glass hover:bg-white/[0.06]"
          style={{ color: tone.label }}
        >
          {m.ctaLabel}
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const items = [...ROADMAP, ...PRODUCT_NEWS];

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">
              Roadmap
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Là où va Copafever — de la Coupe du Monde à toute la saison
              européenne.
            </p>
          </header>

          <div>
            {items.map((m, i) => (
              <TimelineItem key={m.id} m={m} last={i === items.length - 1} />
            ))}
          </div>

          <LegalFooter className="mt-4 text-center" />
        </main>
      </div>
    </>
  );
}
