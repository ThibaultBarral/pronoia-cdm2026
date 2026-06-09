import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PLAYSTYLES } from "@/lib/bankroll";

/**
 * Prompt context describing the user's bettor profile (chosen at signup, stored
 * in auth metadata; falls back to the bankroll playstyle). Tailors the bet by
 * TYPE/boldness — never just by stake. Empty string when no profile is set.
 */
export async function getBettorProfileContext(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    let style = (user.user_metadata?.bettor_profile as string | undefined) ?? undefined;
    if (!style) {
      const { data } = await supabase
        .from("bankrolls")
        .select("playstyle")
        .eq("user_id", user.id)
        .maybeSingle();
      style = (data?.playstyle as string | null) ?? undefined;
    }
    if (!style) return "";

    const ps = PLAYSTYLES.find((p) => p.id === style);
    if (!ps) return "";

    return `\n\nPROFIL DU PARIEUR : ${ps.label} ${ps.emoji} — « ${ps.tagline} »
${ps.betGuidance}
→ Propose un pari dont le TYPE et l'AUDACE collent à ce profil (ex. un Audacieux préfère des paris plus osés comme score exact / buteur / combiné — PAS forcément une cote plus haute ni une mise plus grosse). La mise conseillée reste PETITE (1 à 3% de la cagnotte) pour TOUS les profils.`;
  } catch {
    return "";
  }
}
