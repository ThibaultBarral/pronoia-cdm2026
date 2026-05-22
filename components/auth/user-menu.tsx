"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#111] transition-colors"
      >
        {avatar ? (
          <img src={avatar} alt={pseudo} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#00ff88]">{initials}</span>
          </div>
        )}
        <span className="text-xs text-[#888] hidden sm:block max-w-[80px] truncate">{pseudo}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-[#141414]">
            <p className="text-xs font-semibold text-[#f0f0f0] truncate">{pseudo}</p>
            <p className="text-[10px] text-[#444] truncate">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            <LogOut size={13} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
