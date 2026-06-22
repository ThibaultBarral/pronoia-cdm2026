"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import MatchCard from "@/components/match-card";
import MatchFilters from "@/components/match-filters";
import { Match } from "@/lib/types";
import { useTranslations } from "@/lib/i18n/locale-provider";

export default function HomeClient({ matches }: { matches: Match[] }) {
  const t = useTranslations();
  const [filtered, setFiltered] = useState<Match[]>(matches);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f0f0f0] flex items-center gap-2">
            <Zap size={18} className="text-[var(--accent)]" />
            {t("home.matchesTitle")}
          </h2>
          <p className="text-sm text-[#888] mt-0.5">
            {t(filtered.length > 1 ? "home.matchesCountMany" : "home.matchesCountOne", { count: filtered.length })}
          </p>
        </div>
        <div className="sm:ml-auto">
          <MatchFilters matches={matches} onFilter={setFiltered} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#888]">
          <p className="text-lg font-medium mb-1">{t("home.emptyTitle")}</p>
          <p className="text-sm">{t("home.emptySubtitle")}</p>
        </div>
      )}
    </section>
  );
}
