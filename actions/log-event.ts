"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Record a funnel event in `app_events` (fire-and-forget). Mirrors the GA event
 * so the same signal is visible inside /admin. Fail-safe: any error is swallowed
 * — analytics must never break the UX.
 *
 * Only a small allow-list of names is accepted to keep the table clean and avoid
 * accidental high-cardinality writes from the client.
 */
const ALLOWED = new Set([
  "welcome_offer_view",
  "welcome_offer_click",
  "contact_open",
  "contact_click",
]);

export async function logAppEvent(
  name: string,
  props: Record<string, string | number | boolean> = {},
): Promise<void> {
  try {
    if (!ALLOWED.has(name)) return;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("app_events").insert({
      user_id: user?.id ?? null,
      name,
      props,
    });
  } catch {
    /* analytics is best-effort */
  }
}
