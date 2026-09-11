import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import TeamCrest from "@/components/clubs/team-crest";
import ClubFixtureRow from "@/components/clubs/club-fixture-row";
import { getClubDetail } from "@/lib/competition-data";
import { getCompetition } from "@/lib/competitions";
import { getClubFixtures, getClubSquad } from "@/lib/club-data";
import type { Player } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string; club: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, club } = await params;
  const detail = await getClubDetail(slug, club);
  if (!detail) {
    const comp = getCompetition(slug);
    return { title: comp ? `${comp.name} : équipe introuvable` : "Équipe introuvable" };
  }
  const { competition, club: c } = detail;
  return {
    title: `${c.name} : composition, forme et matchs ${competition.seasonLabel} | Copafever`,
    description: `${c.name} en ${competition.name} : classement, forme récente, effectif, matchs passés et à venir. Analyse de match 7 jours avant le coup d'envoi.`,
  };
}

export const revalidate = 1800;

const POSITION_LABEL: Record<string, string> = {
  GK: "Gardiens",
  CB: "Défenseurs",
  CM: "Milieux",
  ST: "Attaquants",
};
const POSITION_ORDER = ["GK", "CB", "CM", "ST"];

function FormChip({ r }: { r: string }) {
  const bg = r === "W" ? "var(--accent)" : r === "D" ? "rgba(var(--star-rgb),0.35)" : "#ef4444";
  return (
    <span
      className="w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center text-white"
      style={{ background: bg }}
    >
      {r === "W" ? "V" : r === "D" ? "N" : "D"}
    </span>
  );
}

export default async function ClubPage({ params }: PageProps) {
  const { slug, club } = await params;
  const detail = await getClubDetail(slug, club);
  if (!detail) notFound();

  const { competition: comp, club: c } = detail;
  const [{ past, upcoming }, squad] = await Promise.all([
    getClubFixtures(c.apiId),
    getClubSquad(c.apiId),
  ]);

  // Recent form from real results (newest first → shown oldest → newest).
  const form = past
    .slice(0, 5)
    .map((f) => {
      const isHome = f.home.id === c.apiId;
      const tg = isHome ? f.score.home ?? 0 : f.score.away ?? 0;
      const og = isHome ? f.score.away ?? 0 : f.score.home ?? 0;
      return tg > og ? "W" : tg < og ? "L" : "D";
    })
    .reverse();

  const byPosition = POSITION_ORDER.map((pos) => ({
    pos,
    label: POSITION_LABEL[pos],
    players: squad.players.filter((p: Player) => p.position === pos),
  })).filter((g) => g.players.length > 0);

  const stat = (label: string, value: string) => (
    <div className="rounded-xl glass px-3 py-2.5 text-center">
      <div className="text-base font-black text-[var(--text)] tabular-nums">{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</div>
    </div>
  );

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          <Link
            href={`/dashboard/competitions/${comp.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-5"
          >
            <ArrowLeft size={14} /> {comp.name}
          </Link>

          {/* Header */}
          <header className="rounded-3xl glass p-6 mb-6 flex items-center gap-4">
            <TeamCrest logo={c.logo} name={c.name} size={64} />
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-[var(--text)] truncate">{c.name}</h1>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {comp.flag} {comp.name} · {c.rank}
                <sup>{c.rank === 1 ? "er" : "e"}</sup> · {c.points} pts
              </div>
            </div>
          </header>

          {/* Season stats + form */}
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Saison {comp.seasonLabel}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {stat("Class.", `${c.rank}`)}
              {stat("Pts", `${c.points}`)}
              {stat("J", `${c.played}`)}
              {stat("V-N-D", `${c.win}-${c.draw}-${c.lose}`)}
              {stat("Diff.", `${c.goalsDiff > 0 ? "+" : ""}${c.goalsDiff}`)}
              <div className="rounded-xl glass px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  {form.length ? form.map((r, i) => <FormChip key={i} r={r} />) : (
                    <span className="text-base font-black text-[var(--text-muted)]">–</span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mt-1.5">Forme</div>
              </div>
            </div>
          </section>

          {/* Upcoming */}
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Matchs à venir
            </h2>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
                Aucun match programmé pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 6).map((f) => (
                  <ClubFixtureRow key={f.id} fixture={f} highlightTeamId={c.apiId} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Derniers matchs
            </h2>
            {past.length === 0 ? (
              <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
                Aucun match joué cette saison pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {past.slice(0, 6).map((f) => (
                  <ClubFixtureRow key={f.id} fixture={f} highlightTeamId={c.apiId} />
                ))}
              </div>
            )}
          </section>

          {/* Squad */}
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Effectif
            </h2>
            {byPosition.length === 0 ? (
              <div className="rounded-2xl glass p-6 text-center text-sm text-[var(--text-muted)]">
                Effectif indisponible pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {byPosition.map((g) => (
                  <div key={g.pos} className="rounded-2xl glass p-4">
                    <div className="text-[11px] font-black uppercase tracking-wide text-[var(--accent-soft)] mb-3">
                      {g.label} · {g.players.length}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {g.players.map((p) => (
                        <div key={p.apiId ?? p.name} className="flex items-center gap-2.5 min-w-0">
                          {p.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover bg-white/5 shrink-0" loading="lazy" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm text-[var(--text)] truncate">{p.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {p.number ? `#${p.number}` : ""}
                              {p.age ? `${p.number ? " · " : ""}${p.age} ans` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <LegalFooter className="text-center" />
        </main>
      </div>
    </>
  );
}
