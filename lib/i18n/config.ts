/**
 * i18n configuration — shared between server, client and middleware.
 *
 * Routing strategy: French is the DEFAULT locale and is served at the root
 * with NO URL prefix (so every historical URL like `/match/123` is preserved
 * and keeps its SEO). English lives under the `/en` prefix and is indexable
 * separately. The middleware rewrites unprefixed requests to the internal
 * `/[lang]` segment (lang=fr) so the visible URL never changes.
 */

export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/** BCP-47 tag for `<html lang>`, OpenGraph and JSON-LD. */
export const localeMeta: Record<Locale, { htmlLang: string; ogLocale: string; label: string }> = {
  fr: { htmlLang: "fr-FR", ogLocale: "fr_FR", label: "Français" },
  en: { htmlLang: "en-US", ogLocale: "en_US", label: "English" },
};

/**
 * Prefix a path with the locale segment when needed. French (default) gets no
 * prefix; other locales are prefixed. Always pass an app-absolute path
 * (starting with `/`). External URLs and hashes are returned untouched.
 */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path; // hash links, external, mailto…
  if (locale === defaultLocale) return path;
  // Avoid double-prefixing if a path already carries the locale.
  if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return path;
  return `/${locale}${path}`;
}

/** Strip the leading locale segment from a pathname, returning [locale, rest]. */
export function splitLocale(pathname: string): { locale: Locale; pathname: string } {
  const segments = pathname.split("/");
  const maybe = segments[1];
  if (isLocale(maybe) && maybe !== defaultLocale) {
    const rest = "/" + segments.slice(2).join("/");
    return { locale: maybe, pathname: rest === "/" ? "/" : rest.replace(/\/$/, "") || "/" };
  }
  return { locale: defaultLocale, pathname };
}
