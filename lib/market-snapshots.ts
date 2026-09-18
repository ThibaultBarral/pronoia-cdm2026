/**
 * Daily market snapshots (SERVER ONLY) — the memory behind "line movement".
 *
 * One consensus reading per fixture per UTC day, kept 14 days. Stored in the
 * existing `api_cache` table (key `market-snap:<fixture>:<YYYY-MM-DD>`) so it
 * needs no migration and expires on its own. The first reading of a day wins:
 * a snapshot is never overwritten, which keeps the series comparable
 * (morning-ish readings) whatever time the page is built.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeMovement, type MarketSnapshot } from "./market";
import type { MarketConsensus, MarketMovement } from "./types";

const PREFIX = "market-snap";
const KEEP_DAYS = 14;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Record today's reading (no-op when today already has one). */
export async function recordSnapshot(fixtureId: number, c: MarketConsensus): Promise<void> {
  const admin = createAdminClient();
  const day = today();
  const payload: MarketSnapshot = {
    takenOn: day,
    operators: c.operators,
    home: c.implied.home,
    draw: c.implied.draw,
    away: c.implied.away,
  };
  const now = new Date();
  await admin.from("api_cache").upsert(
    {
      key: `${PREFIX}:${fixtureId}:${day}`,
      payload,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + KEEP_DAYS * 86_400_000).toISOString(),
    },
    { onConflict: "key", ignoreDuplicates: true },
  );
}

/** Every stored reading for a fixture, oldest first. */
export async function readSnapshots(fixtureId: number): Promise<MarketSnapshot[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("api_cache")
    .select("payload")
    .like("key", `${PREFIX}:${fixtureId}:%`)
    .gt("expires_at", new Date().toISOString());
  return ((data ?? []).map((r) => r.payload as MarketSnapshot)).sort((a, b) => a.takenOn.localeCompare(b.takenOn));
}

/**
 * Record today's reading and return the movement since the first one. Fails
 * soft: a storage hiccup never blocks a match page.
 */
export async function trackMovement(fixtureId: number, c: MarketConsensus): Promise<MarketMovement | undefined> {
  try {
    await recordSnapshot(fixtureId, c);
    const snaps = await readSnapshots(fixtureId);
    return computeMovement(snaps) ?? undefined;
  } catch (err) {
    console.warn("[market-snapshots] failed for fixture", fixtureId, err);
    return undefined;
  }
}
