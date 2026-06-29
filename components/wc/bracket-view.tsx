import Link from "next/link";
import { Info } from "lucide-react";
import type { Bracket, BracketSlot, BracketMatch } from "@/lib/bracket";

const LIVE = new Set(["1H", "HT", "2H", "ET", "P", "BT"]);

function Slot({ slot, finished }: { slot: BracketSlot | null; finished?: boolean }) {
  if (!slot || slot.placeholder) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[var(--text-muted)]">
        <span className="w-5 h-5 rounded bg-white/[0.04]" />
        <span className="text-xs truncate">{slot?.fr ?? "À déterminer"}</span>
      </div>
    );
  }

  const inner = (
    <>
      <span className="text-lg shrink-0">{slot.flag}</span>
      <span
        className={`text-xs truncate flex-1 ${
          slot.winner
            ? "font-bold text-[var(--text)]"
            : finished
              ? "font-medium text-[var(--text-muted)]"
              : "font-semibold text-[var(--text)]"
        }`}
      >
        {slot.fr}
      </span>
      {slot.goals != null && (
        <span
          className={`text-xs tabular-nums shrink-0 ${
            slot.winner ? "font-black text-[var(--accent)]" : "font-bold text-[var(--text-muted)]"
          }`}
        >
          {slot.goals}
        </span>
      )}
    </>
  );

  // A real, decided team links to its national-team page.
  return slot.slug ? (
    <Link
      href={`/team/${slot.slug}`}
      className="group flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/[0.05] transition-colors"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-2 px-2.5 py-1.5">{inner}</div>
  );
}

function MatchCard({ m }: { m: BracketMatch }) {
  const live = LIVE.has(m.status ?? "");
  const card = (
    <div className="rounded-xl glass divide-y divide-white/5 overflow-hidden transition-colors hover:border-[var(--accent)]/20">
      <Slot slot={m.home} finished={m.finished} />
      <Slot slot={m.away} finished={m.finished} />
      {(m.finished || live) && (
        <div className="px-2.5 py-1 flex items-center justify-center gap-1.5 bg-white/[0.02]">
          {live ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#22c55e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              En direct
            </span>
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {m.status === "PEN" ? "Terminé (t.a.b.)" : m.status === "AET" ? "Terminé (a.p.)" : "Terminé"}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Decided fixtures link to their full analysis / result page.
  return m.matchId ? (
    <Link href={`/match/${m.matchId}`} className="block group">
      {card}
    </Link>
  ) : (
    card
  );
}

export default function BracketView({ bracket }: { bracket: Bracket }) {
  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl glass px-4 py-3 mb-5 text-xs text-[var(--text-muted)]">
        <Info size={14} className="shrink-0 mt-0.5 text-[var(--accent)]" />
        {bracket.projected ? (
          <p>
            Tableau <span className="text-[var(--text)] font-semibold">projeté</span> par notre
            simulation (32 qualifiés les plus probables, têtes de série). Il bascule sur les
            résultats réels dès le premier match à élimination directe.
          </p>
        ) : (
          <p>
            Tableau <span className="text-[var(--text)] font-semibold">réel</span> de la phase
            finale — scores en direct et qualifiés officiels. Touchez un match pour son analyse.
          </p>
        )}
      </div>

      <div className="overflow-x-auto no-scrollbar pb-4">
        <div className="flex gap-4 min-w-max">
          {bracket.rounds.map((round) => (
            <div key={round.name} className="flex flex-col gap-3 w-48 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] text-center">
                {round.name}
              </h3>
              <div className="flex flex-col justify-around gap-3 flex-1">
                {round.matches.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
