"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy, LayoutGrid, CreditCard, User, LogOut, Zap, ChevronRight,
} from "lucide-react";

const MOCK_USER = {
  name: "Thibault B.",
  plan: "Free",
  analysesToday: 3,
  analysesLimit: 5,
};

const NAV = [
  { href: "/dashboard", icon: LayoutGrid, label: "Matchs CDM 2026" },
  { href: "/dashboard/pricing", icon: CreditCard, label: "Pricing" },
];

export default function StaticSidebar() {
  const pathname = usePathname();
  const usagePct = Math.min((MOCK_USER.analysesToday / MOCK_USER.analysesLimit) * 100, 100);

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-[#0a0a0a] border-r border-[#141414]">
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
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/15"
                  : "text-[#555] hover:text-[#888] hover:bg-[#111]"
              }`}
            >
              <Icon size={15} />
              <span className="font-medium">{label}</span>
              {label === "Pricing" && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-[#ffd700]/20 bg-[#ffd700]/5 text-[#ffd700]">
                  Pro
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage */}
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
            className="h-full rounded-full"
            style={{
              width: `${usagePct}%`,
              background: "linear-gradient(90deg, #00ff88, #00cc6a)",
            }}
          />
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-[#141414] space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff88]/30 to-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center shrink-0">
            <User size={14} className="text-[#00ff88]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#c0c0c0] truncate">{MOCK_USER.name}</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#ffd700]/20 bg-[#ffd700]/5 text-[#ffd700]">
              {MOCK_USER.plan}
            </span>
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
