"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  LayoutGrid,
  ChevronRight,
  User,
  LogOut,
  Zap,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Match } from "@/lib/types";

interface SidebarProps {
  matches: Match[];
  activeGroup: string;
  onGroupChange: (g: string) => void;
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const MOCK_USER = {
  name: "Thibault B.",
  email: "thibault.barral3347@gmail.com",
  plan: "Free",
  analysesToday: 3,
  analysesLimit: 5,
};

export default function Sidebar({ matches, activeGroup, onGroupChange }: SidebarProps) {
  // Get first 2 flags for each group for quick visual ID
  const groupFlags: Record<string, string> = {};
  for (const g of GROUPS) {
    const ms = matches.filter((m) => m.group === g);
    if (ms.length > 0) {
      groupFlags[g] = `${ms[0].homeTeam.flag}${ms[0].awayTeam.flag}`;
    }
  }

  const usagePercent = Math.min(
    (MOCK_USER.analysesToday / MOCK_USER.analysesLimit) * 100,
    100
  );

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-[#0a0a0a] border-r border-[#141414] overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#141414]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
            <Trophy size={15} className="text-[#00ff88]" />
          </div>
          <div>
            <div className="font-black text-[#f0f0f0] text-sm tracking-tight leading-none">
              Pronoia<span className="text-[#00ff88]">.</span>
            </div>
            <div className="text-[10px] text-[#444] mt-0.5">Analyse IA CDM 2026</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {/* All matches */}
        <button
          onClick={() => onGroupChange("ALL")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            activeGroup === "ALL"
              ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/15"
              : "text-[#555] hover:text-[#888] hover:bg-[#111]"
          }`}
        >
          <LayoutGrid size={15} />
          <span className="font-medium">Tous les matchs</span>
          <span className="ml-auto text-[10px] tabular-nums opacity-50">{matches.length}</span>
        </button>

        {/* Groups */}
        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] text-[#333] uppercase tracking-widest font-semibold mb-2">
            Groupes
          </p>
          {GROUPS.map((g) => {
            const count = matches.filter((m) => m.group === g).length;
            if (!count) return null;
            return (
              <button
                key={g}
                onClick={() => onGroupChange(g)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeGroup === g
                    ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/15"
                    : "text-[#555] hover:text-[#888] hover:bg-[#111]"
                }`}
              >
                <span className="text-base leading-none">{groupFlags[g] ?? "🌍"}</span>
                <span className="font-medium">Groupe {g}</span>
                <span className="ml-auto text-[10px] tabular-nums opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Knockout — coming soon */}
        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] text-[#333] uppercase tracking-widest font-semibold mb-2">
            Phase éliminatoire
          </p>
          {["32e de finale", "16e de finale", "Quarts", "Demis", "Finale"].map((phase) => (
            <div
              key={phase}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-[#2a2a2a] cursor-not-allowed"
            >
              <ChevronRight size={13} />
              <span>{phase}</span>
              <span className="ml-auto text-[9px] border border-[#1f1f1f] text-[#2a2a2a] px-1.5 py-0.5 rounded">
                Bientôt
              </span>
            </div>
          ))}
        </div>

        {/* Trending */}
        <div className="pt-3">
          <p className="px-3 text-[10px] text-[#333] uppercase tracking-widest font-semibold mb-2">
            Top analyses
          </p>
          {[
            { flag: "🇫🇷", label: "France vs Sénégal", trend: "+142" },
            { flag: "🇦🇷", label: "Argentine vs Algérie", trend: "+98" },
            { flag: "🇧🇷", label: "Brésil vs Maroc", trend: "+87" },
          ].map(({ flag, label, trend }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#444] hover:text-[#666] hover:bg-[#111] transition-all cursor-pointer"
            >
              <span className="text-sm">{flag}</span>
              <span className="truncate">{label}</span>
              <span className="ml-auto text-[#00ff88] text-[10px] shrink-0">{trend}</span>
            </div>
          ))}
        </div>

        {/* Pricing link */}
        <div className="pt-3">
          <Link
            href="/dashboard/pricing"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#555] hover:text-[#888] hover:bg-[#111] transition-all"
          >
            <CreditCard size={15} />
            <span className="font-medium">Pricing</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-[#ffd700]/20 bg-[#ffd700]/5 text-[#ffd700]">
              Pro
            </span>
          </Link>
        </div>
      </nav>

      {/* Usage bar */}
      <div className="px-4 py-3 border-t border-[#141414]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#555]">
            <Zap size={11} className="text-[#00ff88]" />
            <span>Analyses du jour</span>
          </div>
          <span className="text-xs font-bold text-[#888]">
            {MOCK_USER.analysesToday}/{MOCK_USER.analysesLimit}
          </span>
        </div>
        <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usagePercent}%`,
              background:
                usagePercent > 80
                  ? "linear-gradient(90deg, #ef4444, #ff6b35)"
                  : "linear-gradient(90deg, #00ff88, #00cc6a)",
            }}
          />
        </div>
        {usagePercent >= 80 && (
          <p className="text-[10px] text-[#ef4444] mt-1">
            Presque épuisé ·{" "}
            <span className="text-[#ffd700] cursor-pointer hover:underline">Upgrade</span>
          </p>
        )}
      </div>

      {/* User section */}
      <div className="px-3 py-3 border-t border-[#141414] space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff88]/30 to-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center shrink-0">
            <User size={14} className="text-[#00ff88]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#c0c0c0] truncate">{MOCK_USER.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#ffd700]/20 bg-[#ffd700]/5 text-[#ffd700]">
                {MOCK_USER.plan}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[#444] hover:text-[#888] hover:bg-[#111] transition-all"
        >
          <LogOut size={13} />
          <span>Retour au site</span>
        </Link>
      </div>
    </aside>
  );
}
