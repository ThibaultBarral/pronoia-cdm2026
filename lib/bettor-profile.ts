import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PLAYSTYLES, type Playstyle } from "@/lib/bankroll";

/**
 * The current user's bettor profile id — chosen at signup / changed from the
 * bankroll page (auth metadata is authoritative), falling back to the bankroll
 * playstyle. Null when none is set.
 */
export async function getBettorProfile(): Promise<Playstyle | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let style = (user.user_metadata?.bettor_profile as Playstyle | undefined) ?? undefined;
    if (!style) {
      const { data } = await supabase
        .from("bankrolls")
        .select("playstyle")
        .eq("user_id", user.id)
        .maybeSingle();
      style = (data?.playstyle as Playstyle | null) ?? undefined;
    }
    return style ?? null;
  } catch {
    return null;
  }
}

/**
 * Prompt context that tailors the bet RECOMMENDATION by TYPE/boldness to the
 * profile (never just by stake). Empty string when no profile is set.
 */
export function bettorProfilePromptContext(style: Playstyle | null): string {
  if (!style) return "";
  const ps = PLAYSTYLES.find((p) => p.id === style);
  if (!ps) return "";

  return `\n\nPROFIL DU PARIEUR : ${ps.label} ${ps.emoji} — « ${ps.tagline} »
${ps.betGuidance}
→ Adapte la RECOMMANDATION (champ "recommendation") au TYPE et à l'AUDACE de ce profil (ex. un Audacieux préfère des paris plus osés comme score exact / buteur / combiné ; un Prudent vise le plus sûr comme double chance / 1X). La mise conseillée reste PETITE (1 à 3% de la cagnotte) pour TOUS les profils.`;
}
