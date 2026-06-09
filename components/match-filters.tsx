"use client";

import { useState } from "react";
import { Match } from "@/lib/types";

interface MatchFiltersProps {
  matches: Match[];
  onFilter: (filtered: Match[]) => void;
}

const GROUPS = ["Tous", "A", "B", "C", "D", "E", "F"];

export default function MatchFilters({ matches, onFilter }: MatchFiltersProps) {
  const [activeGroup, setActiveGroup] = useState("Tous");

  function handleGroup(group: string) {
    setActiveGroup(group);
    if (group === "Tous") {
      onFilter(matches);
    } else {
      onFilter(matches.filter((m) => m.group === group));
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[#888] mr-1">Groupe :</span>
      {GROUPS.map((g) => (
        <button
          key={g}
          onClick={() => handleGroup(g)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            activeGroup === g
              ? "bg-[var(--accent)] text-[#0a0a0a] border-[var(--accent)] glow-neon"
              : "bg-transparent text-[#888] border-[#1f1f1f] hover:border-[var(--accent)]/40 hover:text-[#f0f0f0]"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
