import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared Supabase-backed cache for external API responses.
 *
 * - Fresh hit (now < expires_at) → returns cached payload, ZERO API call.
 * - Miss/expired → calls `fetcher`, stores result with a TTL, returns it.
 * - Fetch error with a stale copy present → serves the stale copy (so a quota
 *   hit or API blip never breaks the page).
 *
 * Server-only (uses the service-role client). Never import from client code.
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const admin = createAdminClient();
  let stale: { value: T } | null = null;

  try {
    const { data } = await admin
      .from("api_cache")
      .select("payload, expires_at")
      .eq("key", key)
      .maybeSingle();

    if (data) {
      stale = { value: data.payload as T };
      if (new Date(data.expires_at as string).getTime() > Date.now()) {
        return data.payload as T;
      }
    }
  } catch (err) {
    console.warn("[api-cache] read error", key, err);
  }

  try {
    const fresh = await fetcher();
    const now = new Date();
    const expires_at = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    try {
      await admin.from("api_cache").upsert(
        { key, payload: (fresh ?? null) as unknown, fetched_at: now.toISOString(), expires_at },
        { onConflict: "key" }
      );
    } catch (err) {
      console.warn("[api-cache] write error", key, err);
    }
    return fresh;
  } catch (err) {
    if (stale) {
      console.warn("[api-cache] serving stale after fetch error", key, err);
      return stale.value;
    }
    throw err;
  }
}
