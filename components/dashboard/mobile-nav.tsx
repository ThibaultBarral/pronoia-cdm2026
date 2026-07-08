"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/use-subscription";
import { DASHBOARD_NAV } from "./nav-items";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Mobile top bar + slide-in burger drawer.
 * Desktop keeps the persistent <AppSidebar>; this is `md:hidden` and replaces
 * the old bottom tab bar.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const sub = useSubscription();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    <>
      {/* Top bar (mobile only) */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[#080b12]/90 backdrop-blur-xl border-b border-white/5"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/dashboard" className="flex items-center" aria-label="Accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-6 w-auto" />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-[#cdd3db] hover:bg-white/[0.05] transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div
            className="absolute right-0 top-0 h-full w-[82%] max-w-xs flex flex-col border-l border-white/10"
            style={{
              background: "linear-gradient(180deg, #0a0e16 0%, #070a10 100%)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-6 w-auto" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.05] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav — closing on click (links stay mounted in the layout). */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" onClick={() => setOpen(false)}>
              {DASHBOARD_NAV.map(({ href, icon: Icon, label, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                        : "text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? "bg-[var(--accent)]/15" : "bg-white/[0.03]"
                      }`}
                    >
                      <Icon size={17} />
                    </span>
                    {label}
                  </Link>
                );
              })}

              {user?.app_metadata?.is_admin === true && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-[#ffd700]/12 text-[#ffd700]"
                      : "text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.03]">
                    <ShieldCheck size={17} />
                  </span>
                  Admin
                </Link>
              )}
            </nav>

            {/* Subscription CTA */}
            <div className="px-3 pb-3 shrink-0">
              <Link
                href="/dashboard/pricing"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 transition-colors ${
                  sub?.access ? "glass-neon" : "bg-[var(--accent)] text-[#06231a]"
                }`}
              >
                {sub?.access ? (
                  <>
                    <Crown size={15} className="text-[var(--accent)] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--accent)] truncate">
                        {sub.label ?? "Abonnement actif"}
                      </div>
                      <div className="text-[10px] text-[#5a6472]">Gérer mon abonnement</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="shrink-0" />
                    <span className="text-xs font-bold flex-1">Débloquer les analyses IA</span>
                  </>
                )}
              </Link>
            </div>

            {/* User + signout */}
            <div
              className="px-3 py-3 border-t border-white/5 flex items-center gap-2.5 shrink-0"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
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
          </div>
        </div>
      )}
    </>
  );
}
