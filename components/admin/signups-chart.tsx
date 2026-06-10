"use client";

import { useState } from "react";

interface Day {
  date: string; // YYYY-MM-DD
  count: number;
}

const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/**
 * Interactive 14-day signups bar chart. Hover (or tap) a bar to read its exact
 * day + count; the most recent day is selected by default so you immediately
 * see "today vs the rest".
 */
export default function SignupsChart({
  data,
  weekTotal,
}: {
  data: Day[];
  weekTotal: number;
}) {
  const [active, setActive] = useState(data.length - 1);
  const max = Math.max(1, ...data.map((d) => d.count));
  const sel = data[Math.min(active, data.length - 1)] ?? { date: "", count: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#9aa3b2]">
          Inscriptions · 14 derniers jours
        </h3>
        <span className="text-[11px] text-[#5a6472]">{weekTotal} cette semaine</span>
      </div>

      {/* Selected-day readout */}
      <div className="flex items-baseline gap-2 mb-3 h-7">
        <span className="text-2xl font-black text-[#f0f0f0] tabular-nums leading-none">
          {sel.count}
        </span>
        <span className="text-xs text-[#9aa3b2]">
          inscrit{sel.count > 1 ? "s" : ""} · {fmtDay(sel.date)}
        </span>
      </div>

      {/* Bars — row has an explicit height so the % heights resolve. */}
      <div className="flex gap-1.5 h-28">
        {data.map((d, i) => {
          const pct = d.count > 0 ? Math.max((d.count / max) * 100, 8) : 2;
          const isActive = i === active;
          const isToday = i === data.length - 1;
          return (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${fmtDay(d.date)} : ${d.count} inscrit${d.count > 1 ? "s" : ""}`}
              className="flex-1 h-full flex items-end p-0 bg-transparent cursor-pointer"
            >
              <span
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${pct}%`,
                  background: isActive ? "var(--accent)" : "var(--accent-soft)",
                  opacity: isActive ? 1 : d.count > 0 ? 0.55 : 0.2,
                  boxShadow: isToday && !isActive ? "inset 0 0 0 1px rgba(var(--accent-rgb),0.4)" : undefined,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Day-of-month labels */}
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <span
            key={d.date}
            className={`flex-1 text-center text-[9px] tabular-nums ${
              i === active ? "text-[var(--accent)] font-bold" : "text-[#5a6472]"
            }`}
          >
            {Number(d.date.slice(8, 10))}
          </span>
        ))}
      </div>
    </div>
  );
}
