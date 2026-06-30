"use server";

import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, type SendEmailResult } from "@/lib/email";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function recoveryHtml({
  first, offer, amount, url,
}: { first: string; offer: string; amount: number; url: string }): string {
  const hi = first ? `Salut ${first},` : "Salut,";
  return `
  <div style="background:#0a0a0a;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;color:#e8e8e8;">
      <div style="font-size:20px;font-weight:800;color:#34d399;margin-bottom:20px;">Copafever ⚽</div>
      <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${hi}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">
        J'ai vu que ton paiement pour <strong>${offer}</strong> (${amount.toFixed(2)} €) n'a pas pu aboutir.
        C'est presque toujours la <strong>vérification 3D Secure</strong> de ta banque qui bloque — rien à voir avec ton compte.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        La solution qui marche à tous les coups : réessaie avec <strong>Apple Pay</strong> ou un <strong>virement SEPA</strong>,
        ça passe sans la galère du 3DS.
      </p>
      <a href="${url}" style="display:inline-block;background:#34d399;color:#000;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:10px;font-size:15px;">
        Réessayer mon accès →
      </a>
      <p style="font-size:13px;line-height:1.6;color:#888;margin:24px 0 0;">
        Un souci ? Réponds simplement à ce mail, je t'aide en direct. À tout de suite !
      </p>
    </div>
  </div>`;
}

/**
 * Relance par e-mail un client dont le paiement a échoué (3DS, carte refusée…).
 * Admin uniquement. Envoie via Resend un lien vers /tarifs (Apple Pay / SEPA).
 */
export async function sendRecoveryEmail(input: {
  userId?: string;
  email: string;
  name: string | null;
  offer: string;
  amount: number;
}): Promise<SendEmailResult> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };

  const email = input.email?.trim();
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Email invalide." };

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, error: "NEXT_PUBLIC_APP_URL manquant." };
  const url = `${base}/tarifs`;

  const first = input.name?.trim().split(/\s+/)[0] ?? "";
  const res = await sendEmail({
    to: email,
    subject: "Ton accès Copafever t'attend ⚽",
    html: recoveryHtml({ first, offer: input.offer || "ton abonnement", amount: input.amount, url }),
  });

  // Trace l'envoi pour que le badge "Relancé" persiste après rechargement.
  if (res.ok) {
    try {
      await createAdminClient().from("app_events").insert({
        user_id: input.userId ?? null,
        name: "recovery_email_sent",
        props: { email, offer: input.offer, amount: input.amount },
      });
    } catch (err) {
      console.warn("[recovery] event log failed:", err);
    }
  }
  return res;
}
