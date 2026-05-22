"use server";

import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 20;

/**
 * Vérifie l'auth + consomme 1 crédit IA atomiquement.
 * Retourne { userId } si autorisé, { error } sinon.
 */
export async function requireAuthAndCredit(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié — veuillez vous connecter." };

  const { data: allowed, error } = await supabase.rpc("use_ai_credit", {
    p_limit: DAILY_LIMIT,
  });

  if (error) {
    // En cas d'erreur DB on laisse passer (fail open plutôt que bloquer)
    console.error("[ai-guard] rate limit error:", error.message);
    return { userId: user.id };
  }

  if (!allowed) {
    return {
      error: `Limite journalière atteinte (${DAILY_LIMIT} analyses/jour). Revenez demain !`,
    };
  }

  return { userId: user.id };
}
