import Link from "next/link";
import { Info } from "lucide-react";
import type { Bracket, BracketSlot } from "@/lib/bracket";

function Slot({ slot }: { slot: BracketSlot | null }) {
  if (!slot) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[var(--text-muted)]">
        <span className="w-5 h-5 rounded bg-white/[0.04]" />
        <span className="text-xs">À déterminer</span>
      </div>
    );
  }
  return (
    <Link
      href={`/team/${slot.slug}`}
      className="group flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/[0.05] transition-colors"
    >
      <span className="text-lg">{slot.flag}</span>
      <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
        {slot.fr}
      </span>
    </Link>
  );
}

export default function BracketView({ bracket }: { bracket: Bracket }) {
  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl glass px-4 py-3 mb-5 text-xs text-[var(--text-muted)]">
        <Info size={14} className="shrink-0 mt-0.5 text-[var(--accent)]" />
        <p>
          Tableau <span className="text-[var(--text)] font-semibold">projeté</span> par notre
          simulation (32 qualifiés les plus probables, têtes de série). Il sera mis à jour avec les
          résultats réels dès la fin de la phase de groupes.
        </p>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-4">
        <div className="flex gap-4 min-w-max">
          {bracket.rounds.map((round) => (
            <div key={round.name} className="flex flex-col gap-3 w-44 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] text-center">
                {round.name}
              </h3>
              <div className="flex flex-col justify-around gap-3 flex-1">
                {round.matches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl glass divide-y divide-white/5 overflow-hidden"
                  >
                    <Slot slot={m.home} />
                    <Slot slot={m.away} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
