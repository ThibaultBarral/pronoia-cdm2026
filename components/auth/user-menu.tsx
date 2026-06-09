"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Sparkles, Crown } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { hasAccess, planName, type Plan, type SubStatus } from "@/lib/plans";

export default function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, trial_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const plan = (data?.plan as Plan) ?? "free";
        const access = hasAccess({
          plan,
          status: (data?.status as SubStatus | null) ?? null,
          currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
          trialEnd: (data?.trial_end as string | null) ?? null,
        });
        setLabel(access ? planName(plan) : null);
      });
  }, [user]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) return null;

  const pseudo =
    user.user_metadata?.pseudo ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";

  const avatar = user.user_metadata?.avatar_url;
  const initials = pseudo.slice(0, 2).toUpperCase();
  const planLabel = label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#111] transition-colors"
      >
        {avatar ? (
          <img src={avatar} alt={pseudo} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--accent)]">{initials}</span>
          </div>
        )}
        <span className="text-xs text-[#888] hidden sm:block max-w-[80px] truncate">{pseudo}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-[#141414]">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[#f0f0f0] truncate">{pseudo}</p>
              {planLabel && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-[9px] font-bold">
                  <Crown size={9} /> {planLabel}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#444] truncate">{user.email}</p>
          </div>
          <Link
            href="/dashboard/pricing"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <Sparkles size={13} />
            {planLabel ? "Mon abonnement" : "S'abonner"}
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors border-t border-[#141414]"
          >
            <LogOut size={13} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
