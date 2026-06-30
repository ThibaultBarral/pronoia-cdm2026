import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsub } from "@/lib/email-token";

export const metadata: Metadata = { title: "Désinscription — Copafever", robots: { index: false } };
export const dynamic = "force-dynamic";

async function optOut(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) return false;
    const meta = data.user.user_metadata ?? {};
    const { error: upErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, email_opt_out: true, email_opt_out_at: new Date().toISOString() },
    });
    return !upErr;
  } catch {
    return false;
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string }>;
}) {
  const { u, t } = await searchParams;
  const valid = Boolean(u && t && verifyUnsub(u, t));
  const ok = valid ? await optOut(u!) : false;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: "24px", fontFamily: "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 32, color: "#e8e8e8", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", marginBottom: 16 }}>Copafever ⚽</div>
        {ok ? (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>C&apos;est noté ✅</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#b5b5b5", margin: 0 }}>
              Tu ne recevras plus nos e-mails marketing. Tu continueras à recevoir les e-mails
              importants liés à ton compte (paiement, connexion).
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>Lien invalide</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#b5b5b5", margin: 0 }}>
              Ce lien de désinscription n&apos;est pas valide ou a expiré. Réponds simplement au
              dernier e-mail reçu et on te retire de la liste manuellement.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
