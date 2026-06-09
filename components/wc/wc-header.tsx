"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";

/** Live countdown to kick-off (client-side so it ticks). */
function useCountdown(targetIso: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Defer the first set out of the effect body (client-only time avoids a
    // hydration mismatch); then refresh every minute.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (now === null) return null;
  const diff = Date.parse(targetIso) - now;
  if (diff <= 0) return { started: true, days: 0, hours: 0 };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return { started: false, days, hours };
}

export default function WcHeader({ kickoff }: { kickoff: string }) {
  const cd = useCountdown(kickoff);

  return (
    <div className="relative overflow-hidden rounded-3xl glass p-6 md:p-8">
      <div
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />
      <div className="relative flex items-start gap-5">
        <div className="hidden sm:flex w-16 h-16 rounded-2xl glass-neon items-center justify-center shrink-0">
          <Trophy size={28} className="text-[var(--accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">
            Édition dédiée
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mt-1">
            Coupe du Monde 2026
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> 11 juin – 19 juillet 2026
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> USA · Canada · Mexique
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl glass px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {cd?.started ? "En cours" : "Coup d'envoi dans"}
            </span>
            <span className="text-lg font-black text-[var(--accent)] tabular-nums">
              {cd === null ? "—" : cd.started ? "🔴 LIVE" : `${cd.days}j ${cd.hours}h`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
