"use client";

import { useState } from "react";
import { ChevronDown, BarChart3 } from "lucide-react";

/**
 * Collapses the supporting context (form, H2H, stats, squads) so the match page
 * opens on a clean "confrontation + analysis" view. Children stay server-rendered
 * (passed through) so they remain in the DOM for SEO even while collapsed.
 */
export default function MatchDetailsCollapsible({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-2xl glass px-5 py-4 hover:bg-white/[0.04] transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
          <BarChart3 size={16} className="text-[var(--accent)]" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-sm font-semibold text-[#f0f0f0]">
            Les données derrière l&apos;analyse
          </div>
          <div className="text-[11px] text-[#666]">
            Forme · Confrontations · Stats · Compositions
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-[#666] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="mt-4 space-y-4 animate-fade-in">{children}</div>}
    </div>
  );
}
