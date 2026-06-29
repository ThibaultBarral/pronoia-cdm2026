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
