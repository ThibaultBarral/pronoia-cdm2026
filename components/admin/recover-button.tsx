"use client";

import { useState, useTransition } from "react";
import { Mail, Check, Loader2, AlertCircle } from "lucide-react";
import { sendRecoveryEmail } from "@/lib/recovery-actions";

type State = "idle" | "sent" | "error";

export default function RecoverButton({
  email, name, offer, amount,
}: { email: string; name: string | null; offer: string; amount: number }) {
  const [state, setState] = useState<State>("idle");
  const [pending, start] = useTransition();

  const onClick = () =>
    start(async () => {
      const r = await sendRecoveryEmail({ email, name, offer, amount });
      setState(r.ok ? "sent" : "error");
    });

  if (state === "sent") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/15 px-3 py-1.5 text-[12px] font-bold text-[var(--accent)]">
        <Check size={13} /> Envoyé
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      title={state === "error" ? "Échec de l'envoi — réessaie" : `Relancer ${email}`}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-opacity disabled:opacity-60 ${
        state === "error"
          ? "bg-[#ef4444] text-white hover:opacity-90"
          : "bg-[var(--accent)] text-black hover:opacity-90"
      }`}
    >
      {pending ? (
        <><Loader2 size={13} className="animate-spin" /> Envoi…</>
      ) : state === "error" ? (
        <><AlertCircle size={13} /> Réessayer</>
      ) : (
        <><Mail size={13} /> Relancer</>
      )}
    </button>
  );
}
