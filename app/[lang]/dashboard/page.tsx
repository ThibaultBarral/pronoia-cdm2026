"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import MatchRow from "@/components/dashboard/match-row";
import MatchHeroCard from "@/components/dashboard/match-hero-card";
import { Match } from "@/lib/types";
import { getMatchesAction } from "@/actions/get-matches";
import { createClient } from "@/lib/supabase/client";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Focused home: the user's team hero card up top (no scroll needed), then a
// short list of upcoming matches. Search + group filters live on /dashboard/matchs.
export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportedNation, setSupportedNation] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getMatchesAction().then((m) => {
        if (!active) return;
        setMatches(m);
        setLoading(false);
      });
    load();
    // Poll so live scores / finished results update without a manual reload.
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const nation = data.user?.user_metadata?.supported_nation;
      if (typeof nation === "string" && nation) setSupportedNation(nation);
    });
  }, []);

  const upcoming = matches
    .filter((m) => !m.status || m.status === "NS")
    .sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  const nationQuery = supportedNation ? norm(supportedNation) : null;
  const isTeamMatch = (m: Match) =>
    nationQuery != null &&
    [m.homeTeam.name, m.homeTeam.nameEn, m.homeTeam.shortName, m.awayTeam.name, m.awayTeam.nameEn, m.awayTeam.shortName]
      .filter(Boolean)
      .some((s) => norm(s as string) === nationQuery);

  const heroMatch = (nationQuery ? upcoming.find(isTeamMatch) : undefined) ?? upcoming[0];
  const isFavorite = heroMatch ? isTeamMatch(heroMatch) : false;
  const restMatches = upcoming.filter((m) => m.id !== heroMatch?.id).slice(0, 6);

  return (
    <>
      <AppSidebar />

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="rounded-3xl glass p-8 animate-pulse h-64" />
          ) : heroMatch ? (
            <>
              <MatchHeroCard match={heroMatch} isFavorite={isFavorite} />
              {!isFavorite && !supportedNation && (
                <Link
                  href="/onboarding"
                  className="block text-center text-xs text-[#666] hover:text-[var(--accent)] transition-colors -mt-3"
                >
                  Choisis ton équipe pour voir ses matchs en premier →
                </Link>
              )}
            </>
          ) : (
            <div className="rounded-2xl glass flex flex-col items-center gap-2 py-16 text-[#3a4560]">
              <p className="text-sm">Aucun match à venir pour le moment</p>
            </div>
          )}

          {!loading && restMatches.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#333] mb-2">
                Prochains matchs
              </h3>
              <div className="rounded-2xl glass overflow-hidden">
                {restMatches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </div>
          )}

          {!loading && (
            <Link
              href="/dashboard/matchs"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[var(--accent)] transition-colors py-2"
            >
              Voir tous les matchs
              <ArrowRight size={13} />
            </Link>
          )}
        </main>
      </div>
    </>
  );
}
