"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import TeamSearch from "@/components/clubs/team-search";
import TeamCrest from "@/components/clubs/team-crest";
import ClubFixtureRow from "@/components/clubs/club-fixture-row";
import { getClubFixturesAction, getCompetitionFixturesAction } from "@/actions/clubs";
import { COMPETITIONS } from "@/lib/competitions";
import { trackEvent } from "@/lib/analytics";
import type { ClubSummary, ClubFixture } from "@/lib/club-data";

/**
 * The landing page IS the product entry (2026-09-16): one headline, one search
 * field, the competitions as chips. Pick a team or a competition → its next
 * matches appear right here → one tap opens the public match page, where the
 * scan and the account gate take over. No marketing sections above the fold.
 */
export default function HeroSearch({ matches }: { matches: number }) {
  const [club, setClub] = useState<ClubSummary | null>(null);
  const [comp, setComp] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; rows: ClubFixture[] } | null>(null);

  const key = club ? `club:${club.apiId}` : comp ? `comp:${comp}` : null;
  const rows = key && loaded?.key === key ? loaded.rows : null;

  useEffect(() => {
    if (!key) return;
    const req = club
      ? getClubFixturesAction(club.apiId).then((r) => r.upcoming.slice(0, 6))
      : getCompetitionFixturesAction(comp!);
    req.then((r) => setLoaded({ key, rows: r })).catch(() => setLoaded({ key, rows: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function pickClub(c: ClubSummary) {
    trackEvent("landing_team_select", { team: c.name });
    setComp(null);
    setClub(c);
  }

  function pickComp(slug: string) {
    trackEvent("landing_competition_select", { competition: slug });
    setClub(null);
    setComp(slug);
  }

  function reset() {
    setClub(null);
    setComp(null);
  }

  const compMeta = comp ? COMPETITIONS.find((c) => c.slug === comp) : null;

  return (
    <section className="gradient-hero starfield px-4 pt-14 pb-16 sm:pt-24 sm:pb-24">
      <div className="max-w-2xl mx-auto">
        {!key ? (
          <>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--text)] leading-[1.02] text-center">
              Tape une équipe.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                On te lit le match.
              </span>
            </h1>
            <p className="text-[var(--text-muted)] text-base sm:text-lg mt-5 mb-8 text-center leading-relaxed">
              Forme, effectifs, confrontations, probabilités. {matches.toLocaleString("fr-FR")} matchs sur la saison,
              7 compétitions.
            </p>
            <TeamSearch onSelect={pickClub} placeholder="Une équipe : Marseille, Arsenal, Real Madrid…" />
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {COMPETITIONS.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => pickComp(c.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-sm font-semibold text-[#c3cbe3] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors"
                >
                  <span>{c.flag}</span> {c.shortName}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-5"
            >
              <ArrowLeft size={14} /> Autre recherche
            </button>
            <div className="flex items-center gap-3 mb-5">
              {club ? (
                <TeamCrest logo={club.logo} name={club.name} size={44} />
              ) : (
                <span className="text-3xl leading-none">{compMeta?.flag}</span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] leading-tight">
                {club ? `Les prochains matchs de ${club.name}` : compMeta?.name}
              </h1>
            </div>

            {rows === null ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin" /> On cherche les matchs…
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
                Aucun match à venir pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((f) => (
                  <ClubFixtureRow key={f.id} fixture={f} highlightTeamId={club?.apiId} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
