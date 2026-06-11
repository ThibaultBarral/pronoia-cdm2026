import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Trophy, Sparkles, Check } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import LegalFooter from "@/components/legal-footer";
import { getSubscription } from "@/lib/ai-guard";
import {
  COMPETITIONS,
  TOTAL_SEASON_MATCHES,
  WC_MATCH_COUNT,
  COVERED_SEASON_LABEL,
} from "@/lib/competitions";

export const metadata: Metadata = {
  title: "Compétitions — Analyse IA football | Copafever",
  description:
    "La Coupe du Monde 2026 puis la saison 2026/27 : Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Ligue des Champions et Ligue Europa. 2 100+ matchs analysables.",
};

export const revalidate = 3600;

export default async function CompetitionsPage() {
  const sub = await getSubscription();
  const isLifetime = sub?.plan === "lifetime" && sub.access;

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">
              Compétitions
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              La Coupe du Monde maintenant, les grands championnats dès la
              reprise. Explore les clubs réels de la saison {COVERED_SEASON_LABEL}.
            </p>
          </header>

          {/* Hero — World Cup, live */}
          <Link
            href="/dashboard/coupe-du-monde"
            className="group block rounded-3xl glass-neon glow-neon p-6 mb-8 hover:bg-[var(--accent)]/[0.06] transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                <Trophy size={22} className="text-[var(--accent)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent)] text-[#06231a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06231a] animate-pulse" />
                    En cours
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {WC_MATCH_COUNT} matchs
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-[#f0f0f0] truncate">
                  🌍 Coupe du Monde 2026
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Favoris, groupes, bracket et analyses IA de chaque match.
                </p>
              </div>
              <ChevronRight
                size={20}
                className="text-[var(--accent)]/60 group-hover:text-[var(--accent)] transition-colors shrink-0"
              />
            </div>
          </Link>

          {/* Season 2026/27 grid */}
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3a4250]">
              Saison {COVERED_SEASON_LABEL}
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">
              {COMPETITIONS.length} compétitions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COMPETITIONS.map((c) => {
              const live = c.status === "live";
              return (
                <Link
                  key={c.slug}
                  href={`/dashboard/competitions/${c.slug}`}
                  className="group flex flex-col rounded-2xl glass p-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl shrink-0">{c.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#f0f0f0] truncate group-hover:text-[var(--accent)] transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#5a6472]">{c.country}</div>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-[#3a4250] group-hover:text-[var(--accent)] transition-colors shrink-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {c.matchCount} matchs / saison
                    </span>
                    {live ? (
                      <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent)] text-[#06231a]">
                        En cours
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffd700]/12 text-[#ffd700] border border-[#ffd700]/25">
                        Dès {c.availableFrom}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Key-figure banner */}
          <div className="mt-8 rounded-3xl p-[1px] bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent-soft)]">
            <div className="rounded-3xl bg-[#0a0e16] px-6 py-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-3xl md:text-4xl font-black text-[var(--accent)]">
                  {TOTAL_SEASON_MATCHES.toLocaleString("fr-FR")}+ matchs
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  analysables sur la saison {COVERED_SEASON_LABEL} — contre{" "}
                  {WC_MATCH_COUNT} pour la Coupe du Monde.
                </p>
              </div>
              {isLifetime ? (
                <span className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 shrink-0">
                  <Check size={16} strokeWidth={3} /> Couvert par ton Accès à vie
                </span>
              ) : (
                <Link
                  href="/dashboard/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-[#06231a] shrink-0 transition-transform hover:scale-[1.02]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))",
                  }}
                >
                  <Sparkles size={15} /> Tout débloquer à vie
                </Link>
              )}
            </div>
          </div>

          <LegalFooter className="mt-8 text-center" />
        </main>
      </div>
    </>
  );
}
