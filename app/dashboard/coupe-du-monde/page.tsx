import type { Metadata } from "next";
import AppSidebar from "@/components/dashboard/app-sidebar";
import WcHeader from "@/components/wc/wc-header";
import TopFavorites from "@/components/wc/top-favorites";
import TeamSearch from "@/components/wc/team-search";
import WcTabs from "@/components/wc/wc-tabs";
import GroupsGrid from "@/components/wc/groups-grid";
import BracketView from "@/components/wc/bracket-view";
import FeatureGate from "@/components/feature-gate";
import { getGroups, getAllTeams } from "@/lib/groups";
import { getSimulation, getTopFavorites } from "@/lib/simulation";
import { getBracket } from "@/lib/bracket";

export const metadata: Metadata = {
  title: "Coupe du Monde 2026 — Favoris, groupes & tableau | Copafever",
  description:
    "Top favoris, groupes A→L et tableau final de la Coupe du Monde 2026, projetés par notre simulation IA. Analyse paris de chaque nation.",
};

/** First kick-off (Mexico opener) — drives the countdown. */
const KICKOFF = "2026-06-11T19:00:00Z";

// Revalidate hourly; heavy data (groups/sim/bracket) is itself cached daily.
export const revalidate = 3600;

export default async function CoupeDuMondePage() {
  const [groups, allTeams, sim, favorites, bracket] = await Promise.all([
    getGroups(),
    getAllTeams(),
    getSimulation(),
    getTopFavorites(3),
    getBracket(),
  ]);

  const simBySlug = new Map(sim.map((s) => [s.slug, s]));

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-6">
          <WcHeader kickoff={KICKOFF} />
          <TopFavorites favorites={favorites} />
          <TeamSearch teams={allTeams} />
          <WcTabs
            groupsSlot={<GroupsGrid groups={groups} simBySlug={simBySlug} />}
            bracketSlot={
              <FeatureGate feature="bracket" label="Le tableau final est réservé au Pass & Accès à vie">
                <BracketView bracket={bracket} />
              </FeatureGate>
            }
          />

          <p className="text-[11px] text-[var(--text-muted)] text-center pt-2">
            Projections fournies à titre informatif uniquement.
          </p>
        </main>
      </div>
    </>
  );
}
