/**
 * i18n configuration — shared between server, client and middleware.
 *
 * The site is French-only. French is served at the root with NO URL prefix and
 * the middleware rewrites unprefixed requests to the internal `/[lang]` segment
 * (lang=fr) so the visible URL never changes. Any legacy `/en/*` URL is
 * redirected back to its French equivalent by the proxy.
 */

/** The only locale actually served/routed. The site is French-only. */
export const locales = ["fr"] as const;

/**
 * `"en"` is kept in the TYPE only as a legacy no-op: the codebase still has many
 * `locale === "en"` guards, and keeping the union lets them compile as dead
 * branches that never execute (routing only ever yields "fr"; any `/en/*` URL is
 * redirected to French by the proxy). It is intentionally NOT in `locales`.
 */
export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/** BCP-47 tag for `<html lang>`, OpenGraph and JSON-LD. */
export const localeMeta: Record<Locale, { htmlLang: string; ogLocale: string; label: string }> = {
  fr: { htmlLang: "fr-FR", ogLocale: "fr_FR", label: "Français" },
  en: { htmlLang: "fr-FR", ogLocale: "fr_FR", label: "Français" },
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
