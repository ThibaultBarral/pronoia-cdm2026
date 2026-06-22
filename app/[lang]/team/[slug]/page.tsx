import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTeamBySlug } from "@/lib/data-service";
import { getTeamSimulation } from "@/lib/simulation";
import AppSidebar from "@/components/dashboard/app-sidebar";
import TeamForm from "@/components/team-form";
import Lineup from "@/components/lineup";
import TeamSimCard from "@/components/wc/team-sim-card";
import TeamAnalysis from "@/components/team-analysis";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return { title: "Équipe introuvable" };
  return {
    title: `${team.name} — Analyse d'équipe IA CDM 2026 | Copafever`,
    description: `Forme, effectif, forces & faiblesses et idées de paris pour ${team.name} à la Coupe du Monde 2026.`,
  };
}

export const revalidate = 1800;

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const [team, sim] = await Promise.all([
    getTeamBySlug(slug),
    getTeamSimulation(slug),
  ]);
  if (!team) notFound();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {/* Top nav */}
        <div className="safe-header sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f0f0f0] transition-colors"
            >
              <ArrowLeft size={14} /> Retour
            </Link>
            <div className="h-4 w-px bg-[#1f1f1f]" />
            <span className="text-sm font-semibold text-[#f0f0f0]">
              {team.flag} {team.name}
            </span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl glass p-6 flex items-center gap-4">
            <span className="text-5xl">{team.flag}</span>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-[#f0f0f0] truncate">{team.name}</h1>
              <div className="text-xs text-[#888] mt-1">
                #{team.fifaRanking} au classement FIFA
                {team.coach ? ` · ${team.coach}` : ""}
              </div>
            </div>
          </div>

          <TeamSimCard team={team} sim={sim} />
          <TeamForm team={team} />
          <Lineup team={team} />
          <TeamAnalysis team={team} slug={slug} />
        </div>
      </main>
    </div>
  );
}
