"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import TeamSearch from "@/components/clubs/team-search";
import TeamCrest from "@/components/clubs/team-crest";
import ClubFixtureRow from "@/components/clubs/club-fixture-row";
import { getClubFixturesAction, saveFavoriteClubAction } from "@/actions/clubs";
import { trackEvent } from "@/lib/analytics";
import type { ClubSummary, ClubFixture } from "@/lib/club-data";

/**
 * Onboarding in two moves: pick your club → pick one of its next matches. The
 * match page then shows the free short read and the paid full analysis.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubSummary | null>(null);
  // Fixtures keyed by club id, so switching club shows a loader without a sync reset.
  const [loaded, setLoaded] = useState<{ clubId: number; upcoming: ClubFixture[] } | null>(null);
  const upcoming = club && loaded?.clubId === club.apiId ? loaded.upcoming : null;
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    trackEvent("onboarding_team_view");
  }, []);

  useEffect(() => {
    if (!club) return;
    const id = club.apiId;
    getClubFixturesAction(id)
      .then((r) => setLoaded({ clubId: id, upcoming: r.upcoming.slice(0, 6) }))
      .catch(() => setLoaded({ clubId: id, upcoming: [] }));
  }, [club]);

  function pickClub(c: ClubSummary) {
    trackEvent("onboarding_team_select", { team: c.name });
    setClub(c);
  }

  function pickMatch(f: ClubFixture) {
    if (!club) return;
    trackEvent("onboarding_match_select", { team: club.name, matchId: f.id });
    startSaving(async () => {
      await saveFavoriteClubAction({
        apiId: club.apiId,
        name: club.name,
        logo: club.logo,
        competitionSlug: club.competition.slug,
      }).catch(() => ({ ok: false }));
      trackEvent("onboarding_complete", { matchId: f.id });
      router.push(`/match/${f.id}`);
    });
  }

  function skipToDashboard() {
    if (!club) return;
    startSaving(async () => {
      await saveFavoriteClubAction({
        apiId: club.apiId,
        name: club.name,
        logo: club.logo,
        competitionSlug: club.competition.slug,
      }).catch(() => ({ ok: false }));
      router.push("/dashboard");
    });
  }

  const step = club ? 2 : 1;

  return (
    <main className="min-h-screen gradient-hero starfield px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/copafever-primary.svg?v=3" alt="Copafever" className="h-6 w-auto" />
          <div className="flex items-center gap-1.5">
            {[1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-[var(--accent)]" : "w-4 bg-white/10"}`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!club ? (
            <motion.section
              key="team"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)] mb-3">Étape 1 sur 2</p>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] leading-tight mb-3">
                Quelle équipe tu veux analyser ?
              </h1>
              <div className="mb-6" />
              <TeamSearch onSelect={pickClub} autoFocus />
            </motion.section>
          ) : (
            <motion.section
              key="match"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setClub(null)}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-5"
              >
                <ArrowLeft size={14} /> Changer d&apos;équipe
              </button>

              <div className="flex items-center gap-3 mb-5">
                <TeamCrest logo={club.logo} name={club.name} size={48} />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">Étape 2 sur 2</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] leading-tight truncate">
                    Les prochains matchs de {club.name}
                  </h1>
                </div>
              </div>
              <div className="mb-5" />

              {upcoming === null ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
                  <Loader2 size={16} className="animate-spin" /> On cherche les prochains matchs…
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-2xl glass p-6 text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    Aucun match à venir pour {club.name} pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((f) => (
                    <ClubFixtureRow key={f.id} fixture={f} highlightTeamId={club.apiId} onAnalyze={pickMatch} />
                  ))}
                </div>
              )}

              <button
                onClick={skipToDashboard}
                disabled={saving}
                className="mt-6 w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-60"
              >
                {saving ? "Un instant…" : "Continuer vers mon espace →"}
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
