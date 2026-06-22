import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, History as HistoryIcon } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import { listMyAnalyses } from "@/lib/supabase/analyses-db";

export const metadata: Metadata = {
  title: "Historique des analyses — Copafever",
  description: "Retrouve toutes tes analyses précédentes.",
};

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoriquePage() {
  const items = await listMyAnalyses();

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
              Historique des analyses
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Retrouve toutes tes analyses précédentes.
            </p>
          </header>

          {items.length === 0 ? (
            <div className="rounded-2xl glass flex flex-col items-center gap-3 py-16 text-[var(--text-muted)]">
              <HistoryIcon size={26} />
              <p className="text-sm">Aucune analyse pour le moment.</p>
              <Link
                href="/dashboard"
                className="text-xs text-[var(--accent)] hover:underline font-semibold"
              >
                Lancer ma première analyse
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const href =
                  it.kind === "match" ? `/match/${it.target}` : `/team/${it.target}`;
                return (
                  <Link
                    key={`${it.kind}:${it.target}`}
                    href={href}
                    className="group flex items-center gap-4 rounded-2xl glass px-5 py-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xl shrink-0">
                      {it.homeFlag && <span>{it.homeFlag}</span>}
                      {it.awayFlag && <span>{it.awayFlag}</span>}
                      {!it.homeFlag && !it.awayFlag && <span>🏳️</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {it.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <Clock size={11} /> {timeAgo(it.createdAt)}
                        <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] uppercase tracking-wide font-bold">
                          {it.kind === "match" ? "Match" : "Équipe"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-[var(--text-muted)] group-hover:text-[var(--accent)] shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
