"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail, Calendar, CreditCard, LifeBuoy, ShieldCheck, LogOut,
  Check, AlertCircle, Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  memberSince: string;
  planLabel: string | null;
  statusLabel: string;
  hasAccess: boolean;
  supportEmail: string;
}

export default function AccountClient({
  email,
  memberSince,
  planLabel,
  statusLabel,
  hasAccess,
  supportEmail,
}: Props) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, startSave] = useTransition();

  function saveEmail() {
    setMsg(null);
    if (!newEmail.includes("@")) {
      setMsg({ kind: "err", text: "Adresse email invalide." });
      return;
    }
    startSave(async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setMsg({ kind: "err", text: error.message });
        return;
      }
      setEditing(false);
      setMsg({
        kind: "ok",
        text: "Un email de confirmation t'a été envoyé pour valider le changement.",
      });
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const card = "rounded-2xl glass p-5 md:p-6";
  const cardTitle = "flex items-center gap-2 text-base font-black text-[var(--text)] mb-4";

  return (
    <div className="space-y-5">
      {/* Personal info */}
      <section className={card}>
        <h2 className={cardTitle}>
          <Mail size={17} className="text-[var(--accent)]" /> Informations personnelles
        </h2>

        <label className="text-xs text-[var(--text-muted)]">Adresse email</label>
        <div className="flex gap-2 mt-1.5">
          <input
            value={newEmail}
            disabled={!editing || saving}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-xl glass px-4 py-2.5 text-sm text-[var(--text)] disabled:opacity-70 focus:outline-none focus:border-[var(--accent)]/40"
          />
          {editing ? (
            <button
              onClick={saveEmail}
              disabled={saving}
              className="rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-4 text-sm hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {saving ? "…" : "Enregistrer"}
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl glass px-4 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5"
            >
              <Pencil size={13} /> Modifier
            </button>
          )}
        </div>

        {msg && (
          <div
            className={`flex items-start gap-2 mt-3 text-xs ${
              msg.kind === "ok" ? "text-[var(--accent)]" : "text-[#ef4444]"
            }`}
          >
            {msg.kind === "ok" ? <Check size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <label className="text-xs text-[var(--text-muted)] block mt-4">Membre depuis</label>
        <div className="flex items-center gap-2 mt-1.5 rounded-xl glass px-4 py-2.5 text-sm text-[var(--text)]">
          <Calendar size={14} className="text-[var(--text-muted)]" /> {memberSince}
        </div>
      </section>

      {/* Subscription */}
      <section className={card}>
        <h2 className={cardTitle}>
          <CreditCard size={17} className="text-[var(--accent)]" /> Abonnement
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Plan actuel</div>
            <div className="text-lg font-black text-[var(--text)]">{planLabel ?? "Gratuit"}</div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                hasAccess ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              {statusLabel}
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/pricing"
          className="mt-4 block text-center rounded-xl glass-neon py-3 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          Voir tous les plans
        </Link>
      </section>

      {/* Support */}
      <section className={card}>
        <h2 className={cardTitle}>
          <LifeBuoy size={17} className="text-[var(--accent)]" /> Support
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Besoin d&apos;aide ? Une question sur ton compte ou ton abonnement ?
        </p>
        <a
          href={`mailto:${supportEmail}`}
          className="block text-center rounded-xl glass py-3 text-sm font-bold text-[var(--accent)] hover:bg-white/[0.05] transition-colors"
        >
          Contacter le support
        </a>
      </section>

      {/* Security / sign out */}
      <section className={card}>
        <h2 className={cardTitle}>
          <ShieldCheck size={17} className="text-[var(--accent)]" /> Sécurité
        </h2>
        <button
          onClick={signOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/5 text-[#ef4444] font-bold py-3 text-sm hover:bg-[#ef4444]/10 transition-colors"
        >
          <LogOut size={15} /> Déconnexion
        </button>
      </section>
    </div>
  );
}
