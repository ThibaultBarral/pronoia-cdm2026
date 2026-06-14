"use client";

import { useState, useTransition } from "react";
import { Mail, AlertCircle, Check, Users } from "lucide-react";
import { previewReactivation, sendReactivationEmails, sendTestReactivation } from "@/actions/reactivation";

export default function ReactivationCard() {
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function preview() {
    setError(null);
    setOk(null);
    setInfo(null);
    startTransition(async () => {
      const res = await previewReactivation();
      if (res.ok) {
        setInfo(
          res.count === 0
            ? "Personne à relancer (tout le monde a déjà reçu le mail ou n'est pas éligible)."
            : `${res.count} personne(s) ciblée(s). Ex : ${res.sample.join(", ")}`,
        );
        setConfirming(res.count > 0);
      } else setError(res.error);
    });
  }

  function sendTest() {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await sendTestReactivation();
      if (res.ok) setOk(`✅ Email de test envoyé à ${res.to} — va voir ta boîte.`);
      else setError(res.error);
    });
  }

  function send() {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await sendReactivationEmails();
      if (res.ok) {
        setOk(`✅ ${res.sent} email(s) envoyé(s).`);
        setInfo(null);
        setConfirming(false);
      } else {
        setError(`${res.error}${res.sent ? ` (${res.sent} envoyés avant l'erreur)` : ""}`);
      }
    });
  }

  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className="text-[var(--accent)]" />
        <span className="text-sm font-bold text-[#f0f0f0]">Campagne « 2 analyses offertes »</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
        Relance les comptes gratuits ayant déjà testé l&apos;app et à qui il reste des analyses.
        Fais d&apos;abord un aperçu, puis envoie. Chaque personne n&apos;est contactée qu&apos;une fois.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={preview}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl glass border border-[var(--accent)]/25 text-[var(--accent)] font-bold text-sm px-4 py-2 hover:bg-white/[0.05] transition-colors disabled:opacity-60"
        >
          <Users size={14} /> {isPending ? "…" : "Aperçu de l'audience"}
        </button>
        <button
          onClick={sendTest}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl glass border border-white/10 text-[#cdd3db] font-bold text-sm px-4 py-2 hover:bg-white/[0.05] transition-colors disabled:opacity-60"
        >
          <Mail size={14} /> {isPending ? "…" : "Envoyer un test à mon adresse"}
        </button>
        {confirming && (
          <button
            onClick={send}
            disabled={isPending}
            className="rounded-xl bg-[var(--accent)] text-[#06231a] font-bold text-sm px-5 py-2 hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-60"
          >
            {isPending ? "Envoi…" : "Envoyer la campagne"}
          </button>
        )}
      </div>
      {info && (
        <p className="flex items-start gap-1.5 text-xs text-[#cdd3db] mt-2">
          <Users size={13} className="mt-0.5 shrink-0" /> {info}
        </p>
      )}
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
