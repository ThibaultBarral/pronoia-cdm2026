import "server-only";
import { Resend } from "resend";

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Thin Resend wrapper. Reads RESEND_API_KEY + RESEND_FROM from the env
 * (configurés sur Vercel). Fail-safe: renvoie {ok:false} plutôt que de jeter.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    return { ok: false, error: "Email non configuré (RESEND_API_KEY / RESEND_FROM)." };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    console.warn("[email] send failed:", err);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Envoi en masse via l'API batch de Resend (≤100 par appel). Personnalisé :
 * chaque destinataire a son propre sujet + HTML. Renvoie le nombre envoyé.
 */
export async function sendEmailBatch(
  messages: { to: string; subject: string; html: string }[],
): Promise<{ ok: boolean; sent: number; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return { ok: false, sent: 0, error: "Email non configuré." };
  if (messages.length === 0) return { ok: true, sent: 0 };

  const resend = new Resend(key);
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from, to: m.to, subject: m.subject, html: m.html }));
    try {
      const { error } = await resend.batch.send(chunk);
      if (error) return { ok: false, sent, error: error.message };
      sent += chunk.length;
    } catch (err) {
      return { ok: false, sent, error: (err as Error).message };
    }
    // Respecte le rate-limit Resend entre deux lots.
    if (i + 100 < messages.length) await new Promise((r) => setTimeout(r, 700));
  }
  return { ok: true, sent };
}

export interface SentEmail {
  to: string;
  subject: string;
  lastEvent: string;
  createdAt: string;
}

/** Liste les e-mails récemment envoyés via Resend (pour réconcilier le tracking). */
export async function listRecentEmails(maxPages = 5): Promise<SentEmail[]> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return [];
  const resend = new Resend(key);
  const out: SentEmail[] = [];
  let after: string | undefined;
  try {
    for (let p = 0; p < maxPages; p++) {
      const { data, error } = await resend.emails.list(
        after ? { limit: 100, after } : { limit: 100 },
      );
      if (error || !data) break;
      const items = data.data ?? [];
      for (const e of items) {
        out.push({
          to: Array.isArray(e.to) ? e.to[0] ?? "" : String(e.to ?? ""),
          subject: e.subject ?? "",
          lastEvent: e.last_event ?? "",
          createdAt: e.created_at ?? "",
        });
      }
      if (!data.has_more || items.length === 0) break;
      after = items[items.length - 1]?.id;
      if (!after) break;
    }
  } catch (err) {
    console.warn("[email] list failed:", err);
  }
  return out;
}
