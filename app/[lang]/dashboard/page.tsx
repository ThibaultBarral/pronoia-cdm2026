"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Star, X } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import TeamSearch from "@/components/clubs/team-search";
import TeamCrest from "@/components/clubs/team-crest";
import ClubFixtureRow from "@/components/clubs/club-fixture-row";
import { getClubFixturesAction, saveFavoriteClubAction } from "@/actions/clubs";
import { createClient } from "@/lib/supabase/client";
import type { ClubSummary, ClubFixture } from "@/lib/club-data";

interface FavoriteClub {
  apiId: number;
  name: string;
  logo: string | null;
  competitionSlug: string;
}

/**
 * Home = "Analyser un match". The supporter's club (from onboarding) comes
 * first with its next fixtures; the search lets them pick any other club.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [favorite, setFavorite] = useState<FavoriteClub | null | undefined>(undefined);
  const [picked, setPicked] = useState<ClubSummary | null>(null);
  // Fixtures keyed by club id: a club switch shows the loader without a sync reset.
  const [loaded, setLoaded] = useState<{ clubId: number; upcoming: ClubFixture[] } | null>(null);

  // The club we're showing: the one just searched, else the favourite.
  const current: { apiId: number; name: string; logo: string | null } | null =
    picked ?? (favorite ? { apiId: favorite.apiId, name: favorite.name, logo: favorite.logo } : null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const m = data.user?.user_metadata ?? {};
      if (typeof m.favorite_club_id === "number" && typeof m.favorite_club_name === "string") {
        setFavorite({
          apiId: m.favorite_club_id,
          name: m.favorite_club_name,
          logo: typeof m.favorite_club_logo === "string" ? m.favorite_club_logo : null,
          competitionSlug: typeof m.favorite_club_competition === "string" ? m.favorite_club_competition : "",
        });
      } else {
        setFavorite(null);
      }
    });
  }, []);

  const currentId = current?.apiId;
  useEffect(() => {
    if (!currentId) return;
    let active = true;
    getClubFixturesAction(currentId)
      .then((r) => active && setLoaded({ clubId: currentId, upcoming: r.upcoming }))
      .catch(() => active && setLoaded({ clubId: currentId, upcoming: [] }));
    return () => {
      active = false;
    };
  }, [currentId]);

  function makeFavorite(c: ClubSummary) {
    saveFavoriteClubAction({ apiId: c.apiId, name: c.name, logo: c.logo, competitionSlug: c.competition.slug })
      .then(() => setFavorite({ apiId: c.apiId, name: c.name, logo: c.logo, competitionSlug: c.competition.slug }))
      .catch(() => {});
  }

  const fixturesReady = current && loaded?.clubId === current.apiId;
  const upcoming = fixturesReady ? loaded!.upcoming.slice(0, 5) : [];
  const isFavorite = current && favorite && current.apiId === favorite.apiId;

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          <header className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)] mb-2">Analyser un match</p>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] leading-tight">
              Quelle équipe tu veux analyser ?
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Cherche un club, choisis un de ses matchs à venir. L&apos;analyse s&apos;ouvre 7 jours avant le
              coup d&apos;envoi.
            </p>
          </header>

          <TeamSearch onSelect={setPicked} />

          {favorite === undefined && !picked && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin" /> Chargement…
            </div>
          )}

          {current && (
            <section className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <TeamCrest logo={current.logo} name={current.name} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-[var(--text)] truncate">{current.name}</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">Prochains matchs</p>
                </div>
                {picked && !isFavorite && (
                  <button
                    onClick={() => makeFavorite(picked)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-soft)] hover:text-[var(--text)] transition-colors"
                  >
                    <Star size={13} /> Mon équipe
                  </button>
                )}
                {isFavorite && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-soft)]">
                    <Star size={13} fill="currentColor" /> Mon équipe
                  </span>
                )}
                {picked && favorite && (
                  <button
                    onClick={() => setPicked(null)}
                    aria-label="Revenir à mon équipe"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05] transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {!fixturesReady ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-muted)]">
                  <Loader2 size={16} className="animate-spin" /> On cherche les prochains matchs…
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
                  Aucun match à venir pour {current.name} pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((f) => (
                    <ClubFixtureRow
                      key={f.id}
                      fixture={f}
                      highlightTeamId={current.apiId}
                      onAnalyze={(fx) => router.push(`/match/${fx.id}`)}
                    />
                  ))}
                </div>
              )}

              <Link
                href="/dashboard/competitions"
                className="mt-5 inline-flex text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Parcourir les compétitions →
              </Link>
            </section>
          )}

          {favorite === null && !picked && (
            <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
              Ou{" "}
              <Link href="/dashboard/competitions" className="text-[var(--accent-soft)] hover:underline">
                parcours les compétitions
              </Link>{" "}
              pour trouver une équipe.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
