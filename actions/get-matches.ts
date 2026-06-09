"use server";

import { getMatches } from "@/lib/data-service";
import type { Match } from "@/lib/types";

/** Server action so the (client) dashboard never bundles server-only data code. */
export async function getMatchesAction(): Promise<Match[]> {
  return getMatches();
}
