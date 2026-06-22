import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import { COMPETITIONS, getCompetition } from "@/lib/competitions";
import { getCompetitionClubs } from "@/lib/competition-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return COMPETITIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comp = getCompetition(slug);
  if (!comp) return { title: "Compétition introuvable" };
  return {
    title: `Analyse IA ${comp.name} ${comp.seasonLabel} — clubs, value bets, pronostics | Copafever`,
    description: `Tous les clubs de ${comp.name} ${comp.seasonLabel} ${comp.flag}, classement, forme et analyses IA. Value bets et pronostics dès la reprise (${comp.availableFrom}).`,
  };
}

export const revalidate = 3600;

export default async function CompetitionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const comp = getCompetition(slug);
  if (!comp) notFound();

  const clubs = await getCompetitionClubs(slug);
  const isEuropean = comp.kind === "european";

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          {/* Back */}
          <Link
            href="/dashboard/competitions"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#f0f0f0] transition-colors mb-5"
          >
            <ArrowLeft size={14} /> Compétitions
          </Link>

          {/* Header */}
          <header className="rounded-3xl glass p-6 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl shrink-0">{comp.flag}</span>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0] truncate">
                  {comp.name}
                </h1>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {comp.country} · Saison {comp.seasonLabel} · {comp.matchCount} matchs
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#ffd700]/12 text-[#ffd700] border border-[#ffd700]/25">
              <Lock size={12} /> Analyses dès la reprise — {comp.availableFrom}
            </div>
          </header>

          {/* Clubs */}
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3a4250]">
              {isEuropean ? "Participants" : "Clubs"}
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">
              {clubs.length
                ? `Classement ${comp.dataSeasonLabel}`
                : ""}
            </span>
          </div>

          {clubs.length === 0 ? (
            <div className="rounded-2xl glass p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                {isEuropean
                  ? `Les clubs qualifiés pour ${comp.name} ${comp.seasonLabel} seront annoncés cet été.`
                  : "Composition disponible prochainement."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">
                {isEuropean
                  ? `Participants de la saison ${comp.dataSeasonLabel} (les qualifiés ${comp.seasonLabel} seront confirmés cet été). Données réelles.`
                  : `Classement final ${comp.dataSeasonLabel} (les promus/relégués ${comp.seasonLabel} seront confirmés cet été). Données réelles.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clubs.map((club) => (
                  <Link
                    key={club.apiId}
                    href={`/dashboard/competitions/${comp.slug}/${club.slug}`}
                    className="group flex items-center gap-3 rounded-2xl glass p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-xs font-black text-[#cdd3db] group-hover:text-[var(--accent)] transition-colors">
                      {club.monogram}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#f0f0f0] truncate group-hover:text-[var(--accent)] transition-colors">
                        {club.name}
                      </div>
                      <div className="text-[10px] text-[#5a6472]">
                        {club.rank}
                        <sup>{club.rank === 1 ? "er" : "e"}</sup> · {club.points} pts
                        {isEuropean ? ` · ${club.groupLabel}` : ""}
                      </div>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-[#3a4250] group-hover:text-[var(--accent)] transition-colors shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </>
          )}

          <LegalFooter className="mt-8 text-center" />
        </main>
      </div>
    </>
  );
}
