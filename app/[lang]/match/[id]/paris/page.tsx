import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getMatchData } from "@/lib/data-service";
import { createClient } from "@/lib/supabase/server";
import { getMyAnalysis } from "@/lib/supabase/analyses-db";
import type { MatchAnalysisData } from "@/lib/analysis-schema";
import MatchHeader from "@/components/match-header";
import MatchBetting from "@/components/match-betting";
import OddsTable from "@/components/odds-table";
import AppSidebar from "@/components/dashboard/app-sidebar";

const FINISHED = new Set(["FT", "AET", "PEN"]);

interface PageProps {
  params: Promise<{ id: string }>;
}

// Utility page (betting toolkit), not meant for search indexing.
export const metadata: Metadata = {
  title: "Pari conseillé & cotes | Copafever",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function MatchBettingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [match, { data: { user } }] = await Promise.all([
    getMatchData(id),
    supabase.auth.getUser(),
  ]);

  if (!match) notFound();

  const finished = FINISHED.has(match.status ?? "");
  const decided = !match.homeTeam.isPlaceholder && !match.awayTeam.isPlaceholder;

  // Only paying users ever have a stored analysis (non-members get a preview
  // that's never persisted), so this doubles as the access gate.
  const stored = user ? await getMyAnalysis("match", id) : null;
  const analysis = stored?.data as MatchAnalysisData | undefined;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {/* Top nav */}
        <div className="safe-header sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link
              href={`/match/${id}`}
              className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f0f0f0] transition-colors"
            >
              <ArrowLeft size={14} />
              Analyse du match
            </Link>
            <div className="h-4 w-px bg-[#1f1f1f]" />
            <span className="text-sm text-[#888]">
              {match.homeTeam.flag} {match.homeTeam.shortName} vs{" "}
              {match.awayTeam.flag} {match.awayTeam.shortName}
            </span>
            <span className="ml-auto text-[10px] text-[var(--accent)] font-mono border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5">
              Paris
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="animate-fade-in">
            <MatchHeader match={match} />
          </div>

          <div className="pt-1 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
            Pari conseillé &amp; cotes
          </div>

          {!decided || finished ? (
            <div className="rounded-2xl glass p-6 text-center space-y-3">
              <div className="text-3xl">🎲</div>
              <p className="text-sm text-[#888] max-w-sm mx-auto">
                {finished
                  ? "Ce match est terminé — plus de pari à conseiller."
                  : "Les deux adversaires ne sont pas encore connus : le pari sera disponible une fois l'affiche décidée."}
              </p>
              <Link
                href={`/match/${id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Retour à l&apos;analyse →
              </Link>
            </div>
          ) : !analysis ? (
            <div className="rounded-2xl glass p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center">
                <Sparkles size={24} className="text-[var(--accent)]" />
              </div>
              <p className="text-sm text-[#888] max-w-sm mx-auto">
                Génère d&apos;abord l&apos;analyse IA du match : le pari conseillé et
                la mise se calculent à partir d&apos;elle.
              </p>
              <Link
                href={`/match/${id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[#0a0a0a] hover:bg-[var(--accent-strong)] transition-colors"
              >
                <Sparkles size={15} /> Générer l&apos;analyse
              </Link>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <MatchBetting analysis={analysis} />
              <OddsTable match={match} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
