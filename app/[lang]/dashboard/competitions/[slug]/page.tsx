import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import TeamCrest from "@/components/clubs/team-crest";
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
    title: `${comp.name} ${comp.seasonLabel} : équipes et analyses | Copafever`,
    description: `Toutes les équipes de ${comp.name} ${comp.seasonLabel} : classement, forme, composition, matchs passés et à venir, analyses de match.`,
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
          <Link
            href="/dashboard/competitions"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-5"
          >
            <ArrowLeft size={14} /> Compétitions
          </Link>

          <header className="rounded-3xl glass p-6 mb-6 flex items-center gap-4">
            <span className="text-5xl shrink-0">{comp.flag}</span>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] truncate">{comp.name}</h1>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {comp.country} · Saison {comp.seasonLabel} · {comp.matchCount} matchs
              </div>
            </div>
          </header>

          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {isEuropean ? "Participants" : "Classement"}
            </h2>
            {clubs.length > 0 && (
              <span className="text-[11px] text-[var(--text-muted)]">Données réelles, mises à jour chaque jour</span>
            )}
          </div>

          {clubs.length === 0 ? (
            <div className="rounded-2xl glass p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Les équipes de {comp.name} ne sont pas disponibles pour le moment. Réessaie dans quelques
                minutes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clubs.map((club) => (
                <Link
                  key={club.apiId}
                  href={`/dashboard/competitions/${comp.slug}/${club.slug}`}
                  className="group flex items-center gap-3 rounded-2xl glass p-4 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="w-6 text-center text-xs font-black text-[var(--text-muted)] tabular-nums shrink-0">
                    {club.rank}
                  </span>
                  <TeamCrest logo={club.logo} name={club.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text)] truncate group-hover:text-[var(--accent-soft)] transition-colors">
                      {club.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {club.points} pts · {club.played} j
                      {isEuropean && club.groupLabel ? ` · ${club.groupLabel}` : ""}
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent-soft)] transition-colors shrink-0"
                  />
                </Link>
              ))}
            </div>
          )}

          <LegalFooter className="mt-8 text-center" />
        </main>
      </div>
    </>
  );
}
