import "server-only";
import type { Locale } from "./config";
import { deepMerge, makeT, type Dictionary, type TFunction } from "./resolve";
import { fr } from "./dictionaries/fr";
import { en } from "./dictionaries/en";

// English inherits French for any key it hasn't translated yet, so the app is
// always renderable in both locales and never shows a raw key.
const dictionaries: Record<Locale, Dictionary> = {
  fr,
  en: deepMerge(fr, en),
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Convenience for server components: returns a ready-to-use `t` function. */
export function getT(locale: Locale): TFunction {
  return makeT(dictionaries[locale]);
}
