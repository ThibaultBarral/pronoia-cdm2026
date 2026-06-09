"use client";

import { useState } from "react";

type Tab = "groups" | "bracket";

export default function WcTabs({
  groupsSlot,
  bracketSlot,
}: {
  groupsSlot: React.ReactNode;
  bracketSlot: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("groups");

  return (
    <div>
      <div className="inline-flex items-center gap-1 rounded-2xl glass p-1 mb-6">
        <button
          onClick={() => setTab("groups")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === "groups"
              ? "bg-[var(--accent)] text-[#06231a]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          Phase de groupes
        </button>
        <button
          onClick={() => setTab("bracket")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === "bracket"
              ? "bg-[var(--accent)] text-[#06231a]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          Tableau final
        </button>
      </div>

      <div className={tab === "groups" ? "" : "hidden"}>{groupsSlot}</div>
      <div className={tab === "bracket" ? "" : "hidden"}>{bracketSlot}</div>
    </div>
  );
}
