"use client";

import { useState } from "react";
import {
  Search, Trophy, Calendar,
  TrendingUp, Zap, Menu, X, Plus,
} from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import MatchRow from "@/components/dashboard/match-row";
import BankrollWidget from "@/components/dashboard/bankroll-widget";
import UserMenu from "@/components/auth/user-menu";
import { Match } from "@/lib/types";
import { useEffect } from "react";
import { getMatches } from "@/lib/data-service";

// Client wrapper that fetches data + handles state
export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBetForm, setShowBetForm] = useState(false);

  useEffect(() => {
    getMatches().then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, []);

  const filtered = matches
    .filter((m) => activeGroup === "ALL" || m.group === activeGroup)
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.homeTeam.shortName.toLowerCase().includes(q) ||
        m.awayTeam.shortName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  // Group by date for display
  const byDate: Record<string, Match[]> = {};
  for (const m of filtered) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  }

  const today = new Date().toISOString().split("T")[0];

  const statsBar = [
    {
      icon: Trophy,
      label: "Phase de groupes",
      value: `${matches.filter((m) => m.group !== "—").length} matchs`,
      color: "#ffd700",
    },
    {
      icon: Calendar,
      label: "Prochain match",
      value: matches[0]
        ? `${matches[0].homeTeam.flag} vs ${matches[0].awayTeam.flag}`
        : "—",
      color: "#00ff88",
    },
    {
      icon: TrendingUp,
      label: "Matchs analysés",
      value: "0",
      color: "#00d4ff",
    },
    {
      icon: Zap,
      label: "Crédits restants",
      value: "5 / 5",
      color: "#ff6b35",
    },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, slide-in on toggle */}
      <div
        className={`fixed md:sticky top-0 left-0 z-50 h-screen transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          matches={matches}
          activeGroup={activeGroup}
          onGroupChange={(g) => {
            setActiveGroup(g);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#141414] flex items-center gap-3 px-4">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 rounded-lg text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-[#333]">CDM 2026</span>
            <span className="text-[#222]">/</span>
            <span className="text-[#666] font-medium">
              {activeGroup === "ALL" ? "Tous les matchs" : `Groupe ${activeGroup}`}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto md:mx-0 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" />
            <input
              type="text"
              placeholder="Chercher une équipe…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg text-sm text-[#c0c0c0] placeholder-[#333] focus:outline-none focus:border-[#00ff88]/30 transition-colors"
            />
          </div>

          {/* Right: count + add bet */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#444] tabular-nums hidden sm:block">
              {filtered.length} match{filtered.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowBetForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88] text-[#0a0a0a] text-xs font-bold hover:bg-[#00cc6a] transition-all"
            >
              <Plus size={12} />
              Pari
            </button>
            <UserMenu />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {/* Bankroll widget */}
          <div className="space-y-4">
            <BankrollWidget
              externalShowForm={showBetForm}
              onExternalFormClose={() => setShowBetForm(false)}
            />
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statsBar.map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-[#141414] bg-[#0d0d0d] px-4 py-3 flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}12`, border: `1px solid ${color}20` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#888] truncate">{value}</div>
                  <div className="text-[10px] text-[#333] truncate">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Match list */}
          {loading ? (
            <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] divide-y divide-[#0f0f0f]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-32 bg-[#111] rounded" />
                  <div className="ml-auto h-4 w-24 bg-[#111] rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] flex flex-col items-center gap-2 py-16 text-[#333]">
              <Search size={24} />
              <p className="text-sm">Aucun match trouvé</p>
              <button
                className="text-xs text-[#00ff88] hover:underline"
                onClick={() => { setSearch(""); setActiveGroup("ALL"); }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byDate).map(([date, dayMatches]) => {
                const d = new Date(date + "T12:00:00");
                const label =
                  date === today
                    ? "Aujourd'hui"
                    : d.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      });

                return (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wide ${
                          date === today ? "text-[#00ff88]" : "text-[#333]"
                        }`}
                      >
                        {label}
                      </h3>
                      <div className="flex-1 h-px bg-[#141414]" />
                      <span className="text-[10px] text-[#2a2a2a]">
                        {dayMatches.length} match{dayMatches.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Match rows */}
                    <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] overflow-hidden">
                      {dayMatches.map((m) => (
                        <MatchRow key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
