import "server-only";
import type { Locale } from "./config";
import { makeT, type Dictionary, type TFunction } from "./resolve";
import { fr } from "./dictionaries/fr";

// French-only site — the legacy "en" locale falls back to the French dictionary
// (it is never actually served; see lib/i18n/config.ts).
const dictionaries: Record<Locale, Dictionary> = {
  fr,
  en: fr,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Convenience for server components: returns a ready-to-use `t` function. */
export function getT(locale: Locale): TFunction {
  return makeT(dictionaries[locale]);
}
