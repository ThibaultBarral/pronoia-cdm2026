"use server";

import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendEmailBatch, listRecentEmails } from "@/lib/email";
import { unsubUrl } from "@/lib/email-token";
import {
  CAMPAIGNS, getCampaign, getUpcomingMatches, renderSubject,
  type CampaignContext,
} from "@/lib/email-campaigns";
import type { Plan } from "@/lib/plans";

interface Recipient {
  id: string;
  email: string;
  firstName: string;
}

function firstNameFrom(meta: Record<string, unknown>): string {
  const n =
    (meta.pseudo as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    "";
  return n.trim().split(/\s+/)[0] ?? "";
}

/**
 * Destinataires d'une campagne : tous les comptes qui ne sont PAS des clients
 * payants actifs et ne sont pas VIP → les Gratuits + les churned (annulés /
 * expirés). Exclut les désinscrits (RGPD) et les comptes sans e-mail.
 */
async function getRecipients(excludeUserIds?: Set<string>): Promise<Recipient[]> {
  const admin = createAdminClient();
  const [{ data: list }, { data: subs }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("subscriptions").select("user_id, plan, status, vip"),
  ]);
  const byId = new Map((subs ?? []).map((s) => [s.user_id as string, s]));

  const out: Recipient[] = [];
  for (const u of list?.users ?? []) {
    if (!u.email) continue;
    if (excludeUserIds?.has(u.id)) continue; // a déjà reçu cette campagne
    const meta = u.user_metadata ?? {};
    if (meta.email_opt_out) continue;

    const s = byId.get(u.id);
    const plan = ((s?.plan as Plan) ?? "free") as Plan;
    const status = (s?.status as string | null) ?? null;
    const vip = Boolean(s?.vip);
    const isActivePaid = plan !== "free" && (status === "active" || status === "trialing");
    if (vip || isActivePaid) continue; // on ne re-démarche pas les clients actifs / VIP

    out.push({ id: u.id, email: u.email, firstName: firstNameFrom(meta) });
  }
  return out;
}

/** Ensemble des userId ayant DÉJÀ reçu cette campagne (pour reprendre sans doublon). */
async function getSentUserIds(campaignKey: string): Promise<Set<string>> {
  const { data } = await createAdminClient()
    .from("app_events")
    .select("user_id, props")
    .eq("name", "campaign_send");
  const set = new Set<string>();
  for (const e of data ?? []) {
    const uid = e.user_id as string | null;
    const key = (e.props as { campaign?: string } | null)?.campaign;
    if (uid && key === campaignKey) set.add(uid);
  }
  return set;
}

/** Signatures stables d'une campagne (sujets A/B sans le prénom) pour matcher Resend. */
function campaignSignatures(campaignKey: string): string[] {
  const c = getCampaign(campaignKey);
  if (!c) return [];
  return c.subjects
    .map((s) => s.replace(/\{firstName\}/g, "").replace(/^[\s,]+/, "").trim().toLowerCase())
    .filter((s) => s.length >= 8);
}

const FAILED_EVENTS = new Set(["bounced", "failed", "canceled", "suppressed"]);

/**
 * Répare le tracking : reconstruit les campaign_send manquants à partir des
 * e-mails réellement envoyés par Resend (couvre un blast coupé par le quota,
 * où l'envoi a partiellement réussi mais n'a pas été tracé). Anti-doublon.
 */
async function reconcileCampaignSends(campaignKey: string): Promise<number> {
  const signatures = campaignSignatures(campaignKey);
  if (signatures.length === 0) return 0;

  const [recent, { data: list }, alreadySent] = await Promise.all([
    listRecentEmails(5),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 }),
    getSentUserIds(campaignKey),
  ]);

  const idByEmail = new Map<string, string>();
  for (const u of list?.users ?? []) {
    if (u.email) idByEmail.set(u.email.toLowerCase(), u.id);
  }

  const toInsert: { user_id: string; name: string; props: Record<string, unknown> }[] = [];
  const seen = new Set<string>();
  for (const e of recent) {
    if (FAILED_EVENTS.has(e.lastEvent)) continue;
    const subj = e.subject.toLowerCase();
    if (!signatures.some((sig) => subj.includes(sig))) continue;
    const uid = idByEmail.get(e.to.toLowerCase());
    if (!uid || alreadySent.has(uid) || seen.has(uid)) continue;
    seen.add(uid);
    toInsert.push({
      user_id: uid,
      name: "campaign_send",
      props: { campaign: campaignKey, variant: "?", reconciled: true },
    });
  }

  if (toInsert.length) {
    try {
      await createAdminClient().from("app_events").insert(toInsert);
    } catch (err) {
      console.warn("[campaign] reconcile insert failed:", err);
      return 0;
    }
  }
  return toInsert.length;
}

/** Traduit une erreur d'envoi technique en message lisible (quota Resend…). */
function friendlyError(error?: string): string | undefined {
  if (!error) return error;
  const low = error.toLowerCase();
  if (low.includes("quota") || low.includes("daily") || low.includes("limit") || low.includes("429")) {
    return "Quota Resend du jour atteint. Passe en plan payant Resend, ou réessaie demain : l'envoi reprendra automatiquement où il s'est arrêté (pas de doublon).";
  }
  return error;
}

export interface CampaignStats {
  audience: number;
  sentByCampaign: Record<string, number>;
}

/** Taille de l'audience + nombre d'envois déjà faits par campagne. Admin only. */
export async function getCampaignStats(): Promise<CampaignStats> {
  if (!(await isAdmin())) return { audience: 0, sentByCampaign: {} };
  const [recipients, { data: events }] = await Promise.all([
    getRecipients(),
    createAdminClient().from("app_events").select("props").eq("name", "campaign_blast"),
  ]);
  const sentByCampaign: Record<string, number> = {};
  for (const e of events ?? []) {
    const key = (e.props as { campaign?: string } | null)?.campaign;
    if (key) sentByCampaign[key] = (sentByCampaign[key] ?? 0) + 1;
  }
  return { audience: recipients.length, sentByCampaign };
}

export interface SendResult {
  ok: boolean;
  sent: number;
  error?: string;
}

/**
 * Envoie une campagne. mode="test" → uniquement vers l'admin connecté (les 2
 * variantes A/B pour preview). mode="live" → toute l'audience, split A/B 50/50.
 * Admin only. Trace l'envoi dans app_events.
 */
export async function sendCampaign(input: {
  campaignKey: string;
  mode: "test" | "live";
}): Promise<SendResult> {
  if (!(await isAdmin())) return { ok: false, sent: 0, error: "Non autorisé." };

  const campaign = getCampaign(input.campaignKey);
  if (!campaign) return { ok: false, sent: 0, error: "Campagne inconnue." };

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, sent: 0, error: "NEXT_PUBLIC_APP_URL manquant." };
  const url = `${base}/tarifs`;

  const matches = await getUpcomingMatches(3);

  const ctxFor = (userId: string, firstName: string): CampaignContext => ({
    firstName,
    url,
    unsubUrl: unsubUrl(base, userId),
    matches,
  });

  // ── TEST : envoi des 2 variantes à l'admin connecté ──────────────────────
  if (input.mode === "test") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, sent: 0, error: "Email admin introuvable." };

    const ctx = ctxFor(user.id, firstNameFrom(user.user_metadata ?? {}));
    const html = campaign.build(ctx);
    let sent = 0;
    for (let v = 0; v < 2; v++) {
      const subject = `[TEST ${v === 0 ? "A" : "B"}] ` + renderSubject(campaign.subjects[v], ctx.firstName);
      const r = await sendEmail({ to: user.email, subject, html });
      if (!r.ok) return { ok: false, sent, error: friendlyError(r.error) };
      sent++;
    }
    return { ok: true, sent };
  }

  // ── LIVE : audience restante (exclut ceux déjà touchés), A/B 50/50 ───────
  // Auto-répare d'abord le tracking depuis Resend (blast coupé par le quota…).
  await reconcileCampaignSends(campaign.key);
  const alreadySent = await getSentUserIds(campaign.key);
  const recipients = await getRecipients(alreadySent);
  if (recipients.length === 0) {
    return { ok: true, sent: 0, error: "Tous les destinataires ont déjà reçu cette campagne." };
  }

  const messages = recipients.map((r, i) => {
    const variant = i % 2; // 0 = A, 1 = B
    const ctx = ctxFor(r.id, r.firstName);
    return {
      to: r.email,
      subject: renderSubject(campaign.subjects[variant], r.firstName),
      html: campaign.build(ctx),
      _userId: r.id,
      _variant: variant === 0 ? "A" : "B",
    };
  });

  const res = await sendEmailBatch(messages.map((m) => ({ to: m.to, subject: m.subject, html: m.html })));

  // Trace : une ligne par destinataire + un récap "campaign_blast".
  try {
    const admin = createAdminClient();
    const sentSlice = messages.slice(0, res.sent);
    if (sentSlice.length) {
      await admin.from("app_events").insert(
        sentSlice.map((m) => ({
          user_id: m._userId,
          name: "campaign_send",
          props: { campaign: campaign.key, variant: m._variant },
        })),
      );
    }
    await admin.from("app_events").insert({
      user_id: null,
      name: "campaign_blast",
      props: { campaign: campaign.key, sent: res.sent, audience: recipients.length },
    });
  } catch (err) {
    console.warn("[campaign] tracking failed:", err);
  }

  return { ...res, error: friendlyError(res.error) };
}

/**
 * Répare le tracking de TOUTES les campagnes depuis Resend. À lancer après un
 * blast coupé par le quota pour garantir qu'aucun destinataire déjà touché ne
 * sera re-contacté. Admin only.
 */
export async function reconcileAllAction(): Promise<{ ok: boolean; healed: number; error?: string }> {
  if (!(await isAdmin())) return { ok: false, healed: 0, error: "Non autorisé." };
  let healed = 0;
  for (const c of CAMPAIGNS) healed += await reconcileCampaignSends(c.key);
  return { ok: true, healed };
}

/** Re-synchronise les statuts d'abonnement depuis Whop (détecte les annulations). */
export async function syncWhopMembershipsAction(): Promise<{
  ok: boolean;
  synced: number;
  canceled: number;
  error?: string;
}> {
  if (!(await isAdmin())) return { ok: false, synced: 0, canceled: 0, error: "Non autorisé." };
  const { syncAllWhopMemberships } = await import("@/lib/whop-sync");
  return syncAllWhopMemberships();
}
