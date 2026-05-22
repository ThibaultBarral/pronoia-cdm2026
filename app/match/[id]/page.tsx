import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Wifi } from "lucide-react";
import { getMatchData } from "@/lib/data-service";
import MatchHeader from "@/components/match-header";
import TeamForm from "@/components/team-form";
import H2HStats from "@/components/h2h-stats";
import MatchStats from "@/components/match-stats";
import OddsTable from "@/components/odds-table";
import Lineup from "@/components/lineup";
import AIAnalysis from "@/components/ai-analysis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchData(id);
  if (!match) return { title: "Match introuvable" };
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} — Analyse IA CDM 2026 | Pronoia`,
    description: `Analyse IA complète : forme, stats, cotes et recommandation pari pour ${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.round} · CDM 2026`,
  };
}

export const revalidate = 1800; // re-fetch every 30min

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatchData(id);

  if (!match) notFound();

  const hasRealData = Boolean(match.apiFixtureId);

  return (
    <main className="min-h-screen">
      {/* Top nav */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f0f0f0] transition-colors"
          >
            <ArrowLeft size={14} />
            Retour
          </Link>
          <div className="h-4 w-px bg-[#1f1f1f]" />
          <span className="text-sm text-[#888]">
            {match.homeTeam.flag} {match.homeTeam.shortName} vs{" "}
            {match.awayTeam.flag} {match.awayTeam.shortName}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {hasRealData && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#00ff88]/70 border border-[#00ff88]/10 bg-[#00ff88]/5 px-2 py-0.5 rounded">
                <Wifi size={9} />
                Live API
              </span>
            )}
            <span className="text-[10px] text-[#00ff88] font-mono border border-[#00ff88]/20 bg-[#00ff88]/5 px-2 py-0.5 rounded">
              CDM 2026
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <MatchHeader match={match} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          <TeamForm team={match.homeTeam} />
          <TeamForm team={match.awayTeam} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-100">
          <H2HStats match={match} />
          <MatchStats homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        </div>

        {match.odds.length > 0 && (
          <div className="animate-fade-in-up delay-200">
            <OddsTable match={match} />
          </div>
        )}

        {/* Squad sections — only when we have real squad data */}
        {(match.homeTeam.lineup.players.length > 0 ||
          match.awayTeam.lineup.players.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-300">
            <Lineup team={match.homeTeam} />
            <Lineup team={match.awayTeam} />
          </div>
        )}

        <div className="animate-fade-in-up delay-400">
          <AIAnalysis match={match} />
        </div>
      </div>

      <footer className="border-t border-[#1f1f1f] mt-10 py-6 px-4 text-center">
        <p className="text-xs text-[#555]">
          Pronoia · Analyse IA CDM 2026 ·{" "}
          {hasRealData ? "Données en direct API-Football" : "Données mockées"}
        </p>
      </footer>
    </main>
  );
}
