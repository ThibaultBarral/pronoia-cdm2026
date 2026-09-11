import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import { COMPETITIONS, TOTAL_SEASON_MATCHES, COVERED_SEASON_LABEL } from "@/lib/competitions";

export const metadata: Metadata = {
  title: "Compétitions | Copafever",
  description:
    "Saison 2026/27 : Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Ligue des Champions et Ligue Europa. Choisis une compétition, une équipe, un match.",
};

export const revalidate = 3600;

export default function CompetitionsPage() {
  const european = COMPETITIONS.filter((c) => c.kind === "european");
  const domestic = COMPETITIONS.filter((c) => c.kind === "domestic");

  const Card = ({ c }: { c: (typeof COMPETITIONS)[number] }) => (
    <Link
      href={`/dashboard/competitions/${c.slug}`}
      className="group flex items-center gap-4 rounded-2xl glass p-4 hover:bg-white/[0.05] transition-colors"
    >
      <span className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl shrink-0">
        {c.flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-black text-[var(--text)] truncate group-hover:text-[var(--accent-soft)] transition-colors">
          {c.name}
        </div>
        <div className="text-[11px] text-[var(--text-muted)]">
          {c.country} · {c.matchCount} matchs
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-soft)] transition-colors shrink-0" />
    </Link>
  );

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
          <header className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)] mb-2">
              Saison {COVERED_SEASON_LABEL}
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">Compétitions</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              {TOTAL_SEASON_MATCHES.toLocaleString("fr-FR")} matchs sur la saison. Choisis une compétition,
              puis une équipe : composition, forme, matchs passés et à venir.
            </p>
          </header>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Coupes d&apos;Europe</h2>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {european.map((c) => (
              <Card key={c.slug} c={c} />
            ))}
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Championnats</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {domestic.map((c) => (
              <Card key={c.slug} c={c} />
            ))}
          </div>

          <LegalFooter className="mt-10 text-center" />
        </main>
      </div>
    </>
  );
}
