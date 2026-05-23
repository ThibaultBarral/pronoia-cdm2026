"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Trophy, LayoutGrid, TrendingUp, CreditCard,
  User, LogOut, Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NAV = [
  { href: "/dashboard", icon: LayoutGrid, label: "Matchs CDM 2026", exact: true },
  { href: "/dashboard/bankroll", icon: TrendingUp, label: "Bankroll" },
  { href: "/dashboard/pricing", icon: CreditCard, label: "Pricing", badge: "Pro" },
];

const USAGE = { today: 3, limit: 20 };

export default function AppSidebar() {
  const pathname = usePathname();
  const usagePct = Math.min((USAGE.today / USAGE.limit) * 100, 100);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const pseudo = user?.user_metadata?.pseudo
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "…";
  const avatar = user?.user_metadata?.avatar_url;
  const initials = pseudo.slice(0, 2).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden md:flex md:flex-col w-56 shrink-0 h-screen sticky top-0 bg-[#0a0a0a] border-r border-[#141414]">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#141414]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#00ff88]/10 border border-[#00ff88]/15 flex items-center justify-center">
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
        {NAV.map(({ href, icon: Icon, label, exact, badge }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-all ${
                active
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/15"
                  : "text-[#555] hover:text-[#888] hover:bg-[#111]"
              }`}
            >
              <Icon size={15} />
              <span className="font-medium">{label}</span>
              {badge && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 border border-[#ffd700]/20 bg-[#ffd700]/5 text-[#ffd700]">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage bar */}
      <div className="px-4 py-3 border-t border-[#141414]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#555]">
            <Zap size={11} className="text-[#00ff88]" />
            <span>Analyses du jour</span>
          </div>
          <span className="text-xs font-bold text-[#888]">
            {USAGE.today}/{USAGE.limit}
          </span>
        </div>
        <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usagePct}%`,
              background: usagePct > 80
                ? "linear-gradient(90deg, #ef4444, #ff6b35)"
                : "linear-gradient(90deg, #00ff88, #00cc6a)",
            }}
          />
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-[#141414] space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2">
          {avatar ? (
            <img src={avatar} alt={pseudo} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#00ff88]">{initials}</span>
            </div>
          )}
          <span className="text-xs text-[#666] truncate flex-1">{pseudo}</span>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#444] hover:text-[#ef4444] hover:bg-[#ef4444]/5 transition-all"
        >
          <LogOut size={13} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
