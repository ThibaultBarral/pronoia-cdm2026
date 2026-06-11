import Link from "next/link";
import { Flag, ChevronRight } from "lucide-react";
import type { Match } from "@/lib/types";
import { teamSlug } from "@/lib/data-service";

/**
 * Shown instead of the pre-match AI analysis once a match is finished — a
 * pre-match prediction / value-bet read is pointless after kickoff. Surfaces the
 * result and redirects to where analysis still adds value (teams + next matches).
 */
export default function MatchResult({ match }: { match: Match }) {
  const h = match.score?.home ?? 0;
  const a = match.score?.away ?? 0;
  const winner = h > a ? match.homeTeam : a > h ? match.awayTeam : null;

  return (
    <div className="rounded-2xl glass p-6 text-center">
      <div className="inline-flex items-center gap-2 text-[var(--accent)] mb-3">
        <Flag size={16} />
        <span className="text-sm font-black uppercase tracking-wide">Match terminé</span>
      </div>

      <p className="text-sm text-[#cdd3db]">
        {winner
          ? `${winner.flag} ${winner.name} l'emporte ${Math.max(h, a)}–${Math.min(h, a)}.`
          : `Match nul ${h}–${a}.`}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-2 max-w-md mx-auto">
        L&apos;analyse pré-match (value bets, pronostic) n&apos;est disponible que pour les
        matchs à venir. Pour parier malin, vise les prochaines affiches.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        <Link
          href={`/team/${teamSlug(match.homeTeam.nameEn ?? match.homeTeam.name)}`}
          className="inline-flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-xs font-bold text-[#cdd3db] hover:bg-white/[0.06] transition-colors"
        >
          {match.homeTeam.flag} Analyse {match.homeTeam.name}
        </Link>
        <Link
          href={`/team/${teamSlug(match.awayTeam.nameEn ?? match.awayTeam.name)}`}
          className="inline-flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-xs font-bold text-[#cdd3db] hover:bg-white/[0.06] transition-colors"
        >
          {match.awayTeam.flag} Analyse {match.awayTeam.name}
        </Link>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-[var(--accent)] hover:underline"
      >
        Voir les matchs à venir <ChevronRight size={14} />
      </Link>
    </div>
  );
}
