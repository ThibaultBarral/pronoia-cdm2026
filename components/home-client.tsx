"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import MatchCard from "@/components/match-card";
import MatchFilters from "@/components/match-filters";
import { Match } from "@/lib/types";

export default function HomeClient({ matches }: { matches: Match[] }) {
  const [filtered, setFiltered] = useState<Match[]>(matches);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f0f0f0] flex items-center gap-2">
            <Zap size={18} className="text-[#00ff88]" />
            Matchs à analyser
          </h2>
          <p className="text-sm text-[#888] mt-0.5">
            {filtered.length} match{filtered.length > 1 ? "s" : ""} ·{" "}
            Cliquez pour l&apos;analyse IA complète
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
          <p className="text-lg font-medium mb-1">Aucun match dans ce groupe</p>
          <p className="text-sm">Sélectionnez un autre filtre</p>
        </div>
      )}
    </section>
  );
}
