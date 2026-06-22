import { TEAM_META } from "@/lib/team-ids";
import type { Locale } from "./config";

/**
 * Team display names are stored in French (`team.name === meta.fr`). The
 * canonical TEAM_META keys are English, so we invert the map to translate a
 * French team name back to English for the `en` locale. Names without a mapping
 * (already identical, e.g. "Canada", "Qatar") are returned unchanged.
 */
const FR_TO_EN: Record<string, string> = {};
for (const [en, meta] of Object.entries(TEAM_META)) {
  FR_TO_EN[meta.fr] = en;
}

/** Host countries shown on match cards (venue country), French → English. */
const COUNTRY_FR_TO_EN: Record<string, string> = {
  "États-Unis": "United States",
  "Etats-Unis": "United States",
  "Canada": "Canada",
  "Mexique": "Mexico",
};

export function teamName(frName: string, locale: Locale): string {
  if (locale !== "en") return frName;
  return FR_TO_EN[frName] ?? frName;
}

export function countryName(frName: string, locale: Locale): string {
  if (locale !== "en") return frName;
  return COUNTRY_FR_TO_EN[frName] ?? frName;
}
