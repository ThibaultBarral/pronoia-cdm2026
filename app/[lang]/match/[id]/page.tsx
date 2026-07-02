import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Wifi } from "lucide-react";
import { getMatchData } from "@/lib/data-service";
import { createClient } from "@/lib/supabase/server";
import MatchHeader from "@/components/match-header";
import TeamForm from "@/components/team-form";
import H2HStats from "@/components/h2h-stats";
import MatchStats from "@/components/match-stats";
import Lineup from "@/components/lineup";
import AIAnalysis from "@/components/ai-analysis";
import MatchResult from "@/components/match-result";
import AppSidebar from "@/components/dashboard/app-sidebar";

const FINISHED = new Set(["FT", "AET", "PEN"]);

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchData(id);
  if (!match) return { title: "Match introuvable" };
  const done = FINISHED.has(match.status ?? "");
  const title = done
    ? `${match.homeTeam.name} ${match.score?.home}–${match.score?.away} ${match.awayTeam.name} — Résultat & stats CDM 2026 | Copafever`
    : `${match.homeTeam.name} vs ${match.awayTeam.name} — Analyse IA & pronostic CDM 2026 | Copafever`;
  const description = done
    ? `Résultat, stats et forme pour ${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.round} · CDM 2026`
    : `Analyse IA complète : forme, stats et prédiction pour ${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.round} · CDM 2026`;
  const canonical = `/match/${id}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `https://copafever.com${canonical}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const COUNTRY_NAME: Record<string, string> = {
  USA: "États-Unis",
  Canada: "Canada",
  Mexique: "Mexique",
};

export const revalidate = 60; // re-fetch every 60s so live scores/results stay fresh

export default async function MatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const [match, { data: { user } }] = await Promise.all([
    getMatchData(id),
    supabase.auth.getUser(),
  ]);

  if (!match) notFound();

  const finished = FINISHED.has(match.status ?? "");
  // Knockout fixture whose participants aren't known yet → no analysis to run.
  const decided = !match.homeTeam.isPlaceholder && !match.awayTeam.isPlaceholder;
  // Signed-in users came from the dashboard → send "Retour" back there (not to
  // the public marketing landing, which looks like being logged out).
  const backHref = user ? "/dashboard" : "/";

  // Real once we resolved this match's API-Football fixture (real odds/live/squad)
  // or got live form for a team. Honest "live data" signal.
  const hasRealData =
    Boolean(match.apiFixtureId) ||
    match.homeTeam.dataSource === "live" ||
    match.awayTeam.dataSource === "live";

  const sportsEvent = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    description: `${match.round} de la Coupe du Monde 2026 — ${match.homeTeam.name} contre ${match.awayTeam.name}.`,
    sport: "Football",
    startDate: `${match.date}T${match.time}:00+02:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://copafever.com/match/${id}`,
    location: {
      "@type": "Place",
      name: match.stadium,
      address: {
        "@type": "PostalAddress",
        addressLocality: match.city,
        addressCountry: COUNTRY_NAME[match.country] ?? match.country,
      },
    },
    homeTeam: { "@type": "SportsTeam", name: match.homeTeam.name },
    awayTeam: { "@type": "SportsTeam", name: match.awayTeam.name },
    competitor: [
      { "@type": "SportsTeam", name: match.homeTeam.name },
      { "@type": "SportsTeam", name: match.awayTeam.name },
    ],
    organizer: {
      "@type": "Organization",
      name: "FIFA",
      url: "https://www.fifa.com",
    },
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEvent) }}
      />
      <AppSidebar />
      <main className="flex-1 min-w-0">
      {/* Top nav */}
      <div className="safe-header sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href={backHref}
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
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--accent)]/70 border border-[var(--accent)]/10 bg-[var(--accent)]/5 px-2 py-0.5">
                <Wifi size={9} />
                En direct
              </span>
            )}
            <span className="text-[10px] text-[var(--accent)] font-mono border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-0.5">
              CDM 2026
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <MatchHeader match={match} />
        </div>

        {/* Analysis first — it's the core value. Keeps the user from scrolling
            past form/H2H/stats/squad (the supporting context, now below). */}
        <div className="animate-fade-in-up">
          {!decided ? (
            <div className="rounded-2xl glass p-6 md:p-8 text-center space-y-3">
              <div className="text-3xl">🏆</div>
              <h2 className="text-lg font-bold text-[#f0f0f0]">
                Affiche à venir — adversaires à déterminer
              </h2>
              <p className="text-sm text-[#888] max-w-md mx-auto">
                Ce match de {match.round} oppose {match.homeTeam.name} à{" "}
                {match.awayTeam.name}. L&apos;analyse IA complète (forme, stats
                et prédiction) sera générée dès que les deux qualifiés
                seront connus.
              </p>
              <Link
                href="/dashboard/coupe-du-monde"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Voir le tableau final →
              </Link>
            </div>
          ) : finished ? (
            <MatchResult match={match} canShare={Boolean(user)} />
          ) : (
            <AIAnalysis match={match} autoStart={welcome === "1"} />
          )}
        </div>

        {/* Supporting context below the analysis — only when both teams exist. */}
        {decided && (
          <>
            <div className="pt-2 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
              Les données derrière l&apos;analyse
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
              <TeamForm team={match.homeTeam} />
              <TeamForm team={match.awayTeam} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-100">
              <H2HStats match={match} />
              <MatchStats homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
            </div>
          </>
        )}

        {/* Betting toolkit lives in its own section — kept off the analysis
            page. Discreet entry point only (never a betting-first framing). */}
        {!finished && decided && (
          <div className="animate-fade-in-up delay-200">
            <Link
              href={`/match/${id}/paris`}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3 text-xs text-[#666] hover:border-[var(--accent)]/25 hover:text-[var(--accent)] transition-colors"
            >
              🎲 Pari conseillé &amp; cotes du match →
            </Link>
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
      </div>

      <footer className="border-t border-[#1f1f1f] mt-10 py-6 px-4 text-center">
        <p className="text-xs text-[#555]">
          Copafever · Analyse IA CDM 2026 ·{" "}
          {hasRealData ? "Données en direct" : "Données indisponibles"}
        </p>
      </footer>
      </main>
    </div>
  );
}
