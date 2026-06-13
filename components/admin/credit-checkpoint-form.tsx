"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCreditCheckpointAction } from "@/actions/admin";

/**
 * Re-anchor the credit estimate: the admin reads the real balance on
 * console.anthropic.com and enters it here. Remaining is then computed as
 * (this balance − cost logged since), which self-corrects any drift.
 */
export default function CreditCheckpointForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const balance = Number(value.replace(",", "."));
    if (!Number.isFinite(balance) || balance < 0) {
      setMsg({ ok: false, text: "Entre un montant valide en $." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await recordCreditCheckpointAction(balance);
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Solde enregistré ✓" });
      setValue("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error ?? "Erreur." });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <label className="text-xs font-semibold text-[var(--text-muted)]">
        Solde réel relevé sur console.anthropic.com ($)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ex. 18,50"
          className="flex-1 min-w-0 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#5a6472] focus:outline-none focus:border-[var(--accent)]/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {busy ? "…" : "Enregistrer"}
        </button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.ok ? "text-[var(--accent)]" : "text-red-400"}`}>{msg.text}</p>
      )}
    </form>
  );
}
