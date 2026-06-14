"use server";

import { Resend } from "resend";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FREE_ANALYSES_LIMIT } from "@/lib/plans";

/**
 * One-off reactivation campaign: email free users who already used ≥1 discovery
 * analysis and still have free ones left (after we bumped the limit 1 → 3), to
 * tell them their remaining analyses are waiting.
 *
 * Admin-only. Idempotent: each send is recorded in `app_events`
 * (name="reactivation_email_sent") and those users are skipped on re-runs.
 *
 * Requires env: RESEND_API_KEY and RESEND_FROM (e.g. "Copafever <hello@copafever.com>").
 * RESEND_FROM must be on a domain verified in Resend, otherwise Resend only
 * delivers to your own account email.
 */

const EVENT = "reactivation_email_sent";

type Target = { id: string; email: string; remaining: number };

async function getTargets(): Promise<Target[]> {
  const admin = createAdminClient();
  const [{ data: list }, { data: subs }, { data: sent }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("subscriptions").select("user_id, plan, free_analyses_used, vip"),
    admin.from("app_events").select("user_id").eq("name", EVENT),
  ]);

  const emailById = new Map((list?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const alreadySent = new Set((sent ?? []).map((e) => e.user_id as string));

  const targets: Target[] = [];
  for (const s of subs ?? []) {
    const userId = s.user_id as string;
    const used = (s.free_analyses_used as number | null) ?? 0;
    if (s.plan !== "free") continue; // skip paying subscribers
    if (s.vip) continue; // skip comped accounts
    if (used < 1 || used >= FREE_ANALYSES_LIMIT) continue; // engaged AND has free left
    if (alreadySent.has(userId)) continue; // already emailed
    const email = emailById.get(userId);
    if (!email) continue;
    targets.push({ id: userId, email, remaining: FREE_ANALYSES_LIMIT - used });
  }
  return targets;
}

function emailHtml(remaining: number): string {
  const n = remaining > 1 ? `${remaining} analyses gratuites` : "1 analyse gratuite";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 12px">🎁 ${n} t'attendent sur Copafever</h1>
    <p style="font-size:15px;line-height:1.55;margin:0 0 14px">
      Salut ! Bonne nouvelle : on vient de passer l'offre de découverte à
      <strong>3 analyses gratuites</strong>. Comme tu en avais déjà utilisé,
      il te reste <strong>${n}</strong> — prêtes à l'emploi.
    </p>
    <p style="font-size:15px;line-height:1.55;margin:0 0 20px">
      La Coupe du Monde bat son plein : analyse tes matchs (probabilités, value bets,
      facteurs clés) avant de parier.
    </p>
    <a href="https://copafever.com" style="display:inline-block;background:#10b981;color:#06231a;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:15px">
      Lancer une analyse →
    </a>
    <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:24px 0 0">
      Tu reçois cet email car tu as un compte Copafever. Pour ne plus en recevoir,
      réponds simplement « STOP » à ce message.
    </p>
  </div>`;
}

/** Preview the audience size without sending. Admin-only. */
export async function previewReactivation(): Promise<
  | { ok: true; count: number; sample: string[] }
  | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };
  const targets = await getTargets();
  return { ok: true, count: targets.length, sample: targets.slice(0, 5).map((t) => t.email) };
}

/** Send ONE test email (the exact campaign template) to the logged-in admin's
 *  own address, so they can preview it before the real blast. Doesn't touch the
 *  audience and isn't logged in app_events. */
export async function sendTestReactivation(): Promise<
  { ok: true; to: string } | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const replyTo = process.env.RESEND_REPLY_TO || "copafever@gmail.com";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY manquante (à ajouter sur Vercel)." };
  if (!from) return { ok: false, error: "RESEND_FROM manquante." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const to = user?.email;
  if (!to) return { ok: false, error: "Aucune adresse email sur ton compte admin." };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: "[TEST] 🎁 2 analyses offertes t'attendent sur Copafever",
    html: emailHtml(2),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, to };
}

/** Send the reactivation email to all remaining targets. Admin-only, idempotent. */
export async function sendReactivationEmails(): Promise<
  { ok: true; sent: number } | { ok: false; error: string; sent?: number }
> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  // Replies (and "STOP" requests) land here — no mailbox needed on the domain.
  const replyTo = process.env.RESEND_REPLY_TO || "copafever@gmail.com";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY manquante (à ajouter sur Vercel)." };
  if (!from) return { ok: false, error: "RESEND_FROM manquante (ex: \"Copafever <hello@copafever.com>\")." };

  const targets = await getTargets();
  if (targets.length === 0) return { ok: true, sent: 0 };

  const resend = new Resend(apiKey);
  const admin = createAdminClient();
  let sent = 0;

  // Resend batch send: up to 100 emails per call.
  for (let i = 0; i < targets.length; i += 100) {
    const chunk = targets.slice(i, i + 100);
    const { error } = await resend.batch.send(
      chunk.map((t) => ({
        from,
        to: t.email,
        replyTo,
        subject:
          t.remaining > 1
            ? `🎁 ${t.remaining} analyses offertes t'attendent sur Copafever`
            : "🎁 Une analyse offerte t'attend sur Copafever",
        html: emailHtml(t.remaining),
        headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=STOP>` },
      })),
    );
    if (error) return { ok: false, error: error.message, sent };

    // Mark this chunk as emailed so re-runs skip them.
    await admin
      .from("app_events")
      .insert(chunk.map((t) => ({ user_id: t.id, name: EVENT, props: {} })));
    sent += chunk.length;
  }

  return { ok: true, sent };
}
