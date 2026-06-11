import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import { getClubDetail } from "@/lib/competition-data";
import { getCompetition } from "@/lib/competitions";

interface PageProps {
  params: Promise<{ slug: string; club: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, club } = await params;
  const detail = await getClubDetail(slug, club);
  if (!detail) {
    const comp = getCompetition(slug);
    return { title: comp ? `${comp.name} — club introuvable` : "Club introuvable" };
  }
  const { competition, club: c } = detail;
  return {
    title: `${c.name} — Analyse IA ${competition.name} ${competition.seasonLabel} | Copafever`,
    description: `${c.name} : classement ${competition.dataSeasonLabel}, forme et stats. Analyse IA, value bets et pronostics dès la reprise (${competition.availableFrom}).`,
  };
}

export const revalidate = 3600;

// MODE B (analyse verrouillée) : la fiche club est consultable par tous (vitrine
// de conversion + SEO), avec des données 2025/26 réelles ; l'analyse IA est
// déverrouillée pour tout le monde à la reprise (mi-août). Le gating par plan est
// préparé mais inactif — pour réserver la fiche à l'Accès à vie, dé-commenter :
//   import { getSubscription } from "@/lib/ai-guard";
//   import { hasFeature } from "@/lib/plans";
//   const sub = await getSubscription();
//   const unlocked = hasFeature(sub, "simulator"); // ou un nouveau Feature "clubs"

export default async function ClubFichePage({ params }: PageProps) {
  const { slug, club } = await params;
  const detail = await getClubDetail(slug, club);
  if (!detail) notFound();

  const { competition: comp, club: c } = detail;
  const isEuropean = comp.kind === "european";
  const form = c.form?.slice(-5).split("") ?? [];

  const stat = (label: string, value: string) => (
    <div className="rounded-xl glass px-3 py-2.5 text-center">
      <div className="text-base font-black text-[#f0f0f0]">{value}</div>
      <div className="text-[10px] text-[#5a6472] uppercase tracking-wide">{label}</div>
    </div>
  );

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          {/* Back */}
          <Link
            href={`/dashboard/competitions/${comp.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#f0f0f0] transition-colors mb-5"
          >
            <ArrowLeft size={14} /> {comp.name}
          </Link>

          {/* Header */}
          <header className="rounded-3xl glass p-6 mb-6 flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-base font-black text-[#cdd3db]">
              {c.monogram}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-[#f0f0f0] truncate">{c.name}</h1>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {comp.flag} {comp.name} · {c.rank}
                <sup>{c.rank === 1 ? "er" : "e"}</sup> en {comp.dataSeasonLabel}
              </div>
            </div>
          </header>

          {/* Real 2025/26 stats */}
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3a4250] mb-3">
              Saison {comp.dataSeasonLabel} · données réelles
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {stat("Class.", `${c.rank}`)}
              {stat("Pts", `${c.points}`)}
              {stat("J", `${c.played}`)}
              {stat("V-N-D", `${c.win}-${c.draw}-${c.lose}`)}
              {stat("Diff.", `${c.goalsDiff > 0 ? "+" : ""}${c.goalsDiff}`)}
              <div className="rounded-xl glass px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  {form.length ? (
                    form.map((r, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-[3px] text-[8px] font-black flex items-center justify-center"
                        style={{
                          background:
                            r === "W"
                              ? "var(--accent)"
                              : r === "D"
                                ? "#6b7280"
                                : "#ef4444",
                          color: r === "D" ? "#fff" : "#06231a",
                        }}
                      >
                        {r === "W" ? "V" : r === "D" ? "N" : "D"}
                      </span>
                    ))
                  ) : (
                    <span className="text-base font-black text-[#5a6472]">—</span>
                  )}
                </div>
                <div className="text-[10px] text-[#5a6472] uppercase tracking-wide mt-1.5">
                  Forme
                </div>
              </div>
            </div>
          </section>

          {/* Locked AI analysis (MODE B) */}
          <section className="rounded-3xl p-[1px] bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent-soft)] mb-8">
            <div className="rounded-3xl bg-[#0a0e16] px-6 py-8 text-center">
              <span className="inline-flex w-12 h-12 rounded-2xl bg-[var(--accent)]/12 items-center justify-center mb-4">
                <Lock size={20} className="text-[var(--accent)]" />
              </span>
              <h3 className="text-lg font-black text-[#f0f0f0]">
                Analyse IA disponible dès la reprise
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
                Forces, faiblesses, joueurs à suivre, value bets et pronostics sur{" "}
                {c.name} arrivent avec le coup d&apos;envoi de {comp.name}{" "}
                ({comp.availableFrom}). En attendant, tu retrouves ici ses données{" "}
                {comp.dataSeasonLabel} réelles.
              </p>
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center justify-center gap-2 mt-5 rounded-xl px-5 py-3 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))",
                }}
              >
                <Sparkles size={15} /> Débloquer toutes les compétitions
              </Link>
              {isEuropean && (
                <p className="text-[11px] text-[var(--text-muted)] mt-4">
                  Participation {comp.seasonLabel} confirmée cet été.
                </p>
              )}
            </div>
          </section>

          <LegalFooter className="text-center" />
        </main>
      </div>
    </>
  );
}
