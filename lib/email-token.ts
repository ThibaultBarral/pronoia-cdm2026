import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/** Secret de signature — réutilise la clé service-role (toujours présente côté serveur). */
function secret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    "copafever-unsub-fallback"
  );
}

/** Jeton court signé pour le lien de désinscription d'un utilisateur. */
export function signUnsub(userId: string): string {
  return createHmac("sha256", secret()).update(`unsub:${userId}`).digest("base64url").slice(0, 24);
}

/** Vérifie un jeton de désinscription en temps constant. */
export function verifyUnsub(userId: string, token: string): boolean {
  const expected = signUnsub(userId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** URL complète de désinscription pour un utilisateur (NEXT_PUBLIC_APP_URL requis). */
export function unsubUrl(base: string, userId: string): string {
  return `${base.replace(/\/$/, "")}/unsubscribe?u=${encodeURIComponent(userId)}&t=${signUnsub(userId)}`;
}
