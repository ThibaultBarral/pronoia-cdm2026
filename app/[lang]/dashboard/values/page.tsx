import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import FeatureGate from "@/components/feature-gate";
import { getDailyValues } from "@/lib/daily-values";
import { fmtCote } from "@/lib/value";

export const metadata: Metadata = {
  title: "Values du jour — Copafever",
  description: "Les paris à valeur (proba modèle × cote réelle > 1) détectés aujourd'hui.",
};

export const revalidate = 600;

export default async function ValuesPage() {
  const values = await getDailyValues();

  return (
    <>
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-6">
          <header>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] flex items-center gap-2.5">
              <TrendingUp size={24} className="text-[var(--accent)]" />
              Values du jour
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Les paris où notre modèle estime une probabilité supérieure à ce que la cote
              implique — calculés sur les cotes réelles des prochains matchs.
            </p>
          </header>

          {values.length === 0 ? (
            <div className="rounded-2xl glass flex flex-col items-center gap-2 py-16 text-center text-[var(--text-muted)]">
              <p className="text-sm">Aucune value détectée pour le moment.</p>
              <p className="text-xs">Reviens à l&apos;approche des prochains matchs.</p>
            </div>
          ) : (
            <FeatureGate feature="value_bets" label="Les values du jour sont réservées à Copafever Pro">
              <div className="space-y-3">
                {values.map((v, i) => (
                  <Link
                    key={`${v.matchId}-${v.market}-${v.selection}-${i}`}
                    href={`/match/${v.matchId}`}
                    className="flex items-center gap-4 rounded-2xl glass px-5 py-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xl shrink-0">
                      <span>{v.homeFlag}</span>
                      <span>{v.awayFlag}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text)] truncate">
                        {v.selection}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {v.matchLabel} · {v.market}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-[var(--accent)] tabular-nums">
                        {fmtCote(v.cote)}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        EV +{Math.round(v.ev * 100)}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </FeatureGate>
          )}

          <p className="text-[11px] text-[var(--text-muted)] text-center pt-2">
            Fourni à titre informatif · 18+ · Jouer comporte des risques
          </p>
        </main>
      </div>
    </>
  );
}
