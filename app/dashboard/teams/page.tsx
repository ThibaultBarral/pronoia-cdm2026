import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import { TEAM_META } from "@/lib/team-ids";
import { teamSlug } from "@/lib/data-service";

export const metadata: Metadata = {
  title: "Équipes — Analyse IA par nation",
  description: "Analyse IA de chaque nation de la Coupe du Monde 2026.",
};

export default function TeamsPage() {
  const teams = Object.entries(TEAM_META)
    .map(([en, meta]) => ({ en, ...meta, slug: teamSlug(en) }))
    .sort((a, b) => a.fr.localeCompare(b.fr, "fr"));

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">Équipes</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Choisis une nation pour son analyse IA : forme, joueurs à suivre et idées de paris.
            </p>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((t) => (
              <Link
                key={t.en}
                href={`/team/${t.slug}`}
                className="group flex items-center gap-3 rounded-2xl glass p-4 hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-3xl shrink-0">{t.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#f0f0f0] truncate group-hover:text-[var(--accent)] transition-colors">
                    {t.fr}
                  </div>
                  <div className="text-[10px] text-[#5a6472]">#{t.fifaRanking} FIFA</div>
                </div>
                <ChevronRight size={15} className="text-[#3a4250] group-hover:text-[var(--accent)] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
