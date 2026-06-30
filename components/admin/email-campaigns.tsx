"use client";

import { useState, useTransition } from "react";
import { Mail, Send, FlaskConical, Loader2, Check, AlertCircle, RefreshCw, Users, ShieldCheck } from "lucide-react";
import { sendCampaign, syncWhopMembershipsAction, reconcileAllAction } from "@/lib/campaign-actions";

export interface CampaignMeta {
  key: string;
  label: string;
  description: string;
  subjects: [string, string];
}

type Flash = { kind: "ok" | "err"; msg: string } | null;

function CampaignCard({
  c, audience, sentCount,
}: { c: CampaignMeta; audience: number; sentCount: number }) {
  const [flash, setFlash] = useState<Flash>(null);
  const [pending, start] = useTransition();
  const [busyMode, setBusyMode] = useState<"test" | "live" | null>(null);

  const run = (mode: "test" | "live") => {
    if (mode === "live") {
      const ok = window.confirm(
        `Envoyer « ${c.label} » à ${audience} destinataire(s) ?\n\nIls sont répartis 50/50 entre les 2 objets A/B. Action irréversible.`,
      );
      if (!ok) return;
    }
    setBusyMode(mode);
    setFlash(null);
    start(async () => {
      const r = await sendCampaign({ campaignKey: c.key, mode });
      setBusyMode(null);
      setFlash(
        r.ok
          ? { kind: "ok", msg: mode === "test" ? "Test envoyé sur ton email (A + B)" : `Envoyé à ${r.sent} personne(s)` }
          : { kind: "err", msg: r.error ?? "Échec de l'envoi" },
      );
    });
  };

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#f0f0f0]">{c.label}</div>
          <div className="text-[11px] text-[#5a6472] mt-0.5">{c.description}</div>
        </div>
        {sentCount > 0 && (
          <span className="shrink-0 text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
            envoyé {sentCount}×
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-baseline gap-2 text-[11px]">
          <span className="shrink-0 font-bold text-[#9aa3b2]">A</span>
          <span className="text-[#c8c8c8] truncate">{c.subjects[0]}</span>
        </div>
        <div className="flex items-baseline gap-2 text-[11px]">
          <span className="shrink-0 font-bold text-[#9aa3b2]">B</span>
          <span className="text-[#c8c8c8] truncate">{c.subjects[1]}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => run("test")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-bold text-[#e8e8e8] hover:bg-white/[0.1] disabled:opacity-60 transition-colors"
        >
          {pending && busyMode === "test" ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
          Test
        </button>
        <button
          onClick={() => run("live")}
          disabled={pending || audience === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-bold text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending && busyMode === "live" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Envoyer ({audience})
        </button>

        {flash && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${flash.kind === "ok" ? "text-[var(--accent)]" : "text-[#ef4444]"}`}>
            {flash.kind === "ok" ? <Check size={12} /> : <AlertCircle size={12} />}
            {flash.msg}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EmailCampaigns({
  campaigns, audience, sentByCampaign,
}: {
  campaigns: CampaignMeta[];
  audience: number;
  sentByCampaign: Record<string, number>;
}) {
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();
  const [fixMsg, setFixMsg] = useState<string | null>(null);
  const [fixing, startFix] = useTransition();

  const resync = () =>
    startSync(async () => {
      setSyncMsg(null);
      const r = await syncWhopMembershipsAction();
      setSyncMsg(
        r.ok
          ? `Sync OK · ${r.synced} abos vérifiés · ${r.canceled} annulés/expirés`
          : `Erreur : ${r.error ?? "inconnue"}`,
      );
    });

  const repair = () =>
    startFix(async () => {
      setFixMsg(null);
      const r = await reconcileAllAction();
      setFixMsg(
        r.ok
          ? `${r.healed} envoi(s) déjà faits protégés du doublon`
          : `Erreur : ${r.error ?? "inconnue"}`,
      );
    });

  return (
    <div className="rounded-2xl glass px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#9aa3b2]">
          <Mail size={14} /> Campagnes e-mail
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#5a6472]">
          <Users size={12} /> {audience} destinataires (gratuits + annulés)
        </span>
      </div>
      <p className="text-[11px] text-[#9aa3b2] mb-4">
        Envoie un <strong>Test</strong> sur ton email d&apos;abord (tu reçois les variantes A et B),
        puis <strong>Envoyer</strong> blaste toute l&apos;audience en split 50/50. Lien de
        désinscription inclus automatiquement.
      </p>

      <div className="space-y-2.5">
        {campaigns.map((c) => (
          <CampaignCard key={c.key} c={c} audience={audience} sentCount={sentByCampaign[c.key] ?? 0} />
        ))}
      </div>

      <div className="mt-4 border-t border-white/5 pt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          onClick={repair}
          disabled={fixing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[#9aa3b2] hover:bg-white/[0.08] disabled:opacity-60 transition-colors"
        >
          {fixing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
          Réparer le tracking (anti-doublon)
        </button>
        {fixMsg && <span className="text-[11px] text-[var(--accent)]">{fixMsg}</span>}
        <button
          onClick={resync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[#9aa3b2] hover:bg-white/[0.08] disabled:opacity-60 transition-colors"
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Resync Whop (détecter les annulations)
        </button>
        {syncMsg && <span className="text-[11px] text-[#9aa3b2]">{syncMsg}</span>}
      </div>
    </div>
  );
}
