"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, AlertCircle, Check } from "lucide-react";
import { setFreeAccessAction } from "@/actions/admin";

export default function FreeAccessControls() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function grant() {
    if (!email.trim()) return;
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await setFreeAccessAction(email.trim(), true);
      if (res.ok) {
        setOk(`${email.trim()} a maintenant un accès gratuit (VIP).`);
        setEmail("");
        router.refresh();
      } else {
        setError(res.error ?? "Erreur.");
      }
    });
  }

  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={16} className="text-[var(--accent)]" />
        <span className="text-sm font-bold text-[#f0f0f0]">Donner un accès gratuit (VIP)</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          className="flex-1 rounded-xl bg-[#0e0e0e] border border-[#1f1f1f] px-3 py-2 text-sm text-[#e0e0e0] placeholder-[#444] focus:outline-none focus:border-[var(--accent)]/40"
        />
        <button
          onClick={grant}
          disabled={isPending}
          className="rounded-xl bg-[var(--accent)] text-[#06231a] font-bold text-sm px-5 py-2 hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-60"
        >
          {isPending ? "Ajout…" : "Offrir l'accès"}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-2">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      {ok && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--accent-soft)] mt-2">
          <Check size={13} /> {ok}
        </p>
      )}
    </div>
  );
}
