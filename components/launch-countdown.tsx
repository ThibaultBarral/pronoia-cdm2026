"use client";

import { useEffect, useState } from "react";

/** The launch-pricing deadline: prices rise after the WC final. */
export const PRICE_HIKE_DEADLINE = "2026-07-19T23:59:59Z";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  total: number;
}

/** Live countdown to a target ISO instant (ticks client-side every minute). */
export function useCountdown(targetIso: string): Remaining {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, Date.parse(targetIso) - now);
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
  };
}

/** Short human string, e.g. "12j 04h" or "3h 20min" near the end. */
export function formatRemaining(r: Remaining): string {
  if (r.total <= 0) return "0h";
  if (r.days >= 1) return `${r.days}j ${String(r.hours).padStart(2, "0")}h`;
  if (r.hours >= 1) return `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`;
  return `${r.minutes}min`;
}

/**
 * Urgency pill for the pricing page: "⏳ Les tarifs de lancement disparaissent
 * dans Xj XXh — fin le 19 juillet." Renders nothing once the deadline passes.
 */
export default function LaunchCountdown({ className = "" }: { className?: string }) {
  const r = useCountdown(PRICE_HIKE_DEADLINE);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer out of the synchronous effect body (codebase idiom) to avoid a
    // hydration mismatch on the time-dependent label.
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!mounted || r.total <= 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${className}`}
      style={{
        background: "rgba(239,68,68,0.10)",
        border: "1px solid rgba(239,68,68,0.30)",
        color: "#ff6b6b",
      }}
    >
      <span aria-hidden>⏳</span>
      <span>
        L&apos;Accès à vie passe à 99 € dans{" "}
        <span className="tabular-nums">{formatRemaining(r)}</span> — le 19 juillet.
      </span>
    </div>
  );
}
