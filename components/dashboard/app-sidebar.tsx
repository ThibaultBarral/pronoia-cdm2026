"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutGrid, Globe, Trophy, TrendingUp, Sparkles, Crown, LogOut, ChevronRight, ShieldCheck, History, User, Layers, Map, Lock, Ticket, MessageCircleQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/use-subscription";
import { FREE_ANALYSES_LIMIT, cdmIntroActive } from "@/lib/plans";
import { FEATURE } from "@/lib/feature-flags";
import { LOCKED_TEASERS, type LockedTeaser } from "@/lib/upsell";
import UpsellModal from "@/components/dashboard/upsell-modal";
import { trackEvent } from "@/lib/analytics";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const TEASER_ICONS: Record<LockedTeaser["id"], typeof Ticket> = {
  combos: Ticket,
  chat_ia: MessageCircleQuestion,
};

const NAV = [
  { href: "/dashboard", icon: LayoutGrid, label: "Matchs", exact: true },
  { href: "/dashboard/competitions", icon: Layers, label: "Compétitions" },
  { href: "/dashboard/roadmap", icon: Map, label: "Roadmap" },
  { href: "/dashboard/coupe-du-monde", icon: Trophy, label: "Coupe du monde" },
  { href: "/dashboard/teams", icon: Globe, label: "Équipes" },
  { href: "/dashboard/bankroll", icon: TrendingUp, label: "Bankroll" },
  { href: "/dashboard/historique", icon: History, label: "Historique" },
  { href: "/dashboard/compte", icon: User, label: "Compte" },
  { href: "/dashboard/pricing", icon: Sparkles, label: "Abonnement" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const sub = useSubscription();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [teaser, setTeaser] = useState<LockedTeaser | null>(null);
  const supabase = createClient();

  // Free (non-member) state → counter + locked teasers.
  const isFree = Boolean(sub) && !sub!.access;
  const remaining = sub ? Math.max(0, FREE_ANALYSES_LIMIT - sub.freeAnalysesUsed) : 0;
  const showLocked = FEATURE.lockedNav && isFree;

  function openTeaser(t: LockedTeaser) {
    trackEvent("locked_nav_click", { item: t.id });
    setTeaser(t);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const pseudo =
    user?.user_metadata?.pseudo ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Invité";
  const avatar = user?.user_metadata?.avatar_url;
  const initials = pseudo.slice(0, 2).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-white/5"
      style={{ background: "linear-gradient(180deg, #0a0e16 0%, #070a10 100%)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="flex flex-col gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-6 w-auto" />
          <div className="text-[10px] text-[#3a4250] tracking-wide">Analyse IA · Football</div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#3a4250]">
          Navigation
        </p>
        <div className="space-y-1">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                    : "text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[var(--accent)]" />
                )}
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    active ? "bg-[var(--accent)]/15" : "bg-white/[0.03] group-hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="font-semibold">{label}</span>
              </Link>
            );
          })}

          {showLocked &&
            LOCKED_TEASERS.map((t) => {
              const Icon = TEASER_ICONS[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => openTeaser(t)}
                  className="group relative w-full flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-xl text-sm text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.03] transition-all"
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.03] group-hover:bg-white/[0.06]">
                    <Icon size={16} />
                  </span>
                  <span className="font-semibold flex-1 text-left">{t.label}</span>
                  <Lock size={13} className="text-[#5a6472] shrink-0" />
                </button>
              );
            })}

          {user?.app_metadata?.is_admin === true && (
            <Link
              href="/admin"
              className={`group relative flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-xl text-sm transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-[#ffd700]/12 text-[#ffd700]"
                  : "text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.03]"
              }`}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.03] group-hover:bg-white/[0.06]">
                <ShieldCheck size={16} />
              </span>
              <span className="font-semibold">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Subscription card */}
      <div className="px-3 pb-3">
        {sub?.access ? (
          <Link
            href="/dashboard/pricing"
            className="flex items-center gap-2.5 rounded-2xl glass-neon px-3.5 py-3 hover:bg-[var(--accent)]/[0.08] transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
              <Crown size={15} className="text-[var(--accent)]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[var(--accent)] truncate">
                {sub.label ?? "Premium actif"}
              </div>
              <div className="text-[10px] text-[#5a6472]">Gérer mon abonnement</div>
            </div>
            <ChevronRight size={14} className="text-[var(--accent)]/60 shrink-0" />
          </Link>
        ) : (
          <Link
            href="/dashboard/pricing"
            className="block rounded-2xl p-[1px]"
            style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
          >
            <div className="rounded-2xl bg-[#0a0e16] px-3.5 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-[#8a929e]">
                  Plan gratuit
                </span>
                <span className="text-[10px] font-bold text-[var(--accent)] tabular-nums">
                  {remaining}/{FREE_ANALYSES_LIMIT}
                </span>
              </div>
              <p className="text-[13px] font-bold text-[#f0f0f0] leading-snug mb-1">
                {remaining > 0
                  ? `${remaining} analyse${remaining > 1 ? "s" : ""} découverte restante${remaining > 1 ? "s" : ""}`
                  : "Analyses découverte épuisées"}
              </p>
              <p className="text-[11px] text-[#8a929e] leading-snug mb-2.5">
                {cdmIntroActive()
                  ? "Pass Coupe du Monde — 9,99 € le 1er mois, puis 14,99 €/mois."
                  : "Passe en illimité dès 14,99 €/mois."}
              </p>
              <div className="w-full text-center rounded-lg bg-[var(--accent)] text-[#06231a] text-xs font-bold py-2">
                Voir les plans →
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/5 flex items-center gap-2.5">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={pseudo} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-[var(--accent)]">{initials}</span>
          </div>
        )}
        <span className="text-xs font-medium text-[#aab1bd] truncate flex-1">{pseudo}</span>
        <button
          onClick={signOut}
          aria-label="Se déconnecter"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a6472] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>

      <UpsellModal teaser={teaser} onClose={() => setTeaser(null)} />
    </aside>
  );
}
