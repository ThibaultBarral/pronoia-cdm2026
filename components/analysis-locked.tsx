"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * Sober, single lock card shown under the free short read. One clear CTA to
 * the plans page (Semaine / Mois / Saison), where the user picks a duration.
 */
export default function AnalysisLocked({ matchId }: { matchId: string }) {
  const what = [
    "Le scénario probable du match",
    "Forces & faiblesses des deux équipes",
    "Les joueurs à suivre, les absents qui pèsent",
    "Tes questions à l'IA sur ce match",
  ];
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-gradient-to-b from-[var(--accent)]/[0.06] to-transparent py-7 px-5">
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Lock size={24} className="text-[var(--accent-soft)]" />
        </div>
        <div>
          <p className="text-[var(--text)] font-bold text-base mb-1">L&apos;analyse complète</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed mx-auto">
            La lecture courte est offerte. Pour le reste, choisis une durée : semaine, mois ou saison.
          </p>
        </div>
        <ul className="text-left space-y-1.5">
          {what.map((w) => (
            <li key={w} className="flex items-center gap-2 text-[13px] text-[#c3cbe3]">
              <Sparkles size={12} className="text-[var(--accent-soft)] shrink-0" /> {w}
            </li>
          ))}
        </ul>
        <Link
          href={`/dashboard/pricing?next=/match/${matchId}`}
          onClick={() => trackEvent("unlock_ticket_click", { plan: "pricing", match_id: matchId })}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-bold px-6 py-2.5 text-sm glow-neon transition-all hover:scale-105"
        >
          <Sparkles size={15} /> Débloquer l&apos;analyse complète
        </Link>
        <p className="text-[11px] text-[var(--text-muted)]">Dès 9,99 € la semaine · sans engagement</p>
      </div>
    </div>
  );
}
