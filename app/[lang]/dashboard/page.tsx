"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import UpcomingMatchCard from "@/components/dashboard/upcoming-match-card";
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

  const kickoffMs = (m: Match) => new Date(m.date + "T" + m.time + ":00").getTime();

  // Scheduled matches, soonest first. The free API can't flip the 2026 season to
  // FT, so past matches stay "NS" — we must exclude ones whose kickoff already
  // passed, otherwise a stale match becomes the "next match" hero. Fall back to
  // all scheduled if nothing is genuinely upcoming, so the home is never empty.
  const scheduled = matches
    .filter((m) => !m.status || m.status === "NS")
    .sort((a, b) => kickoffMs(a) - kickoffMs(b));
  const nowMs = Date.now();
  const future = scheduled.filter((m) => kickoffMs(m) > nowMs);
  const upcoming = future.length > 0 ? future : scheduled;

  const nationQuery = supportedNation ? norm(supportedNation) : null;
  const isTeamMatch = (m: Match) =>
    nationQuery != null &&
    [m.homeTeam.name, m.homeTeam.nameEn, m.homeTeam.shortName, m.awayTeam.name, m.awayTeam.nameEn, m.awayTeam.shortName]
      .filter(Boolean)
      .some((s) => norm(s as string) === nationQuery);

  const heroMatch = (nationQuery ? upcoming.find(isTeamMatch) : undefined) ?? upcoming[0];
  const isFavorite = heroMatch ? isTeamMatch(heroMatch) : false;
  const restMatches = upcoming.filter((m) => m.id !== heroMatch?.id).slice(0, 6);
  const today = new Date().toISOString().split("T")[0];

  // Group the rest into date buckets so the feed reads as "Aujourd'hui" / "Ven. 3 juil." sections.
  const byDate: Record<string, Match[]> = {};
  for (const m of restMatches) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  }

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
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#555]">
                Prochains matchs
              </h3>
              {Object.entries(byDate).map(([date, dayMatches]) => {
                const d = new Date(date + "T12:00:00");
                const label =
                  date === today
                    ? "Aujourd'hui"
                    : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-2">
                      <h4
                        className={`text-[11px] font-bold uppercase tracking-wide ${
                          date === today ? "text-[var(--accent)]" : "text-[#444]"
                        }`}
                      >
                        {label}
                      </h4>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>
                    <div className="rounded-2xl glass overflow-hidden">
                      {dayMatches.map((m) => (
                        <UpcomingMatchCard key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && (
            <Link
              href="/dashboard/matchs"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] py-3 text-sm font-semibold text-[#999] hover:text-[var(--accent)] hover:border-[var(--accent)]/25 hover:bg-white/[0.02] transition-colors"
            >
              Voir tous les matchs
              <ArrowRight size={14} />
            </Link>
          )}
        </main>
      </div>
    </>
  );
}
