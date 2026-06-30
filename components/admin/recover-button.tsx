"use client";

import { useState, useTransition } from "react";
import { Mail, Check, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { sendRecoveryEmail } from "@/lib/recovery-actions";

type State = "idle" | "sent" | "error";

function frDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function RecoverButton({
  userId, email, name, offer, amount, sentAt,
}: {
  userId: string;
  email: string;
  name: string | null;
  offer: string;
  amount: number;
  sentAt: string | null;
}) {
  const [state, setState] = useState<State>("idle");
  const [pending, start] = useTransition();

  const onClick = () =>
    start(async () => {
      const r = await sendRecoveryEmail({ userId, email, name, offer, amount });
      setState(r.ok ? "sent" : "error");
    });

  // Vient d'être envoyé dans cette session.
  if (state === "sent") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/15 px-3 py-1.5 text-[12px] font-bold text-[var(--accent)]">
        <Check size={13} /> Envoyé
      </span>
    );
  }

  // Déjà relancé lors d'une session précédente (persisté) → badge + renvoi possible.
  const alreadySent = state === "idle" && sentAt;

  return (
    <div className="shrink-0 flex items-center gap-2">
      {alreadySent && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
          <Check size={12} /> Relancé {frDateTime(sentAt!)}
        </span>
      )}
      <button
        onClick={onClick}
        disabled={pending}
        title={state === "error" ? "Échec de l'envoi — réessaie" : `Relancer ${email}`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-opacity disabled:opacity-60 ${
          state === "error"
            ? "bg-[#ef4444] text-white hover:opacity-90"
            : alreadySent
              ? "bg-white/[0.06] text-[#e8e8e8] hover:bg-white/[0.1]"
              : "bg-[var(--accent)] text-black hover:opacity-90"
        }`}
      >
        {pending ? (
          <><Loader2 size={13} className="animate-spin" /> Envoi…</>
        ) : state === "error" ? (
          <><AlertCircle size={13} /> Réessayer</>
        ) : alreadySent ? (
          <><RotateCcw size={13} /> Renvoyer</>
        ) : (
          <><Mail size={13} /> Relancer</>
        )}
      </button>
    </div>
  );
}
