"use client";

import { Flame } from "lucide-react";

export type FeverLevel = "high" | "medium" | "low";

/**
 * Extracts the confidence level from the AI analysis text.
 * The model already emits a line `Confiance: [Faible|Moyen|Élevé] · Mise: …`
 * (see actions/analyze-match.ts) — we only read it, never change the prompt.
 */
export function parseFeverLevel(text: string): FeverLevel | null {
  const line = text.match(/confiance\s*:?[^\n]*/i)?.[0];
  if (!line) return null;
  // strip diacritics so "Élevé"/"Elevée" both match "eleve"
  const norm = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (norm.includes("eleve")) return "high";
  if (norm.includes("moyen")) return "medium";
  if (norm.includes("faible")) return "low";
  return null;
}

const CONFIG: Record<
  FeverLevel,
  { label: string; pct: number; color: string; fill: string; desc: string }
> = {
  high: {
    label: "Élevé",
    pct: 90,
    color: "var(--accent)",
    fill: "linear-gradient(90deg, var(--accent-strong), var(--accent-soft))",
    desc: "Signal fort — value confirmée, données fiables",
  },
  medium: {
    label: "Moyen",
    pct: 56,
    color: "var(--amber)",
    fill: "var(--amber)",
    desc: "Signal correct — écart modéré ou données partielles",
  },
  low: {
    label: "Faible",
    pct: 26,
    color: "var(--text-muted)",
    fill: "var(--text-muted)",
    desc: "Prudence — trop d'incertitudes pour engager gros",
  },
};

export default function FeverScore({ level }: { level: FeverLevel }) {
  const c = CONFIG[level];
  return (
    <div className="rounded-xl glass p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={15} style={{ color: c.color }} />
          <span className="text-xs font-bold uppercase tracking-wider text-[#f0f0f0]">
            Fever Score
          </span>
        </div>
        <span className="text-xs font-bold" style={{ color: c.color }}>
          {c.label}
        </span>
      </div>

      {/* Gauge — bar + knob, à la copafever-gauge.svg */}
      <div className="relative h-2 rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${c.pct}%`, background: c.fill }}
        />
        <div
          className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${c.pct}%`, background: "var(--bg)", borderColor: c.color }}
        />
      </div>

      <p className="text-[10px] text-[#666] mt-2.5">{c.desc}</p>
    </div>
  );
}
