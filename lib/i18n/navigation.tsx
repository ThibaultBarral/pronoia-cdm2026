"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback } from "react";
import { localizePath, type Locale } from "./config";
import { useLocale } from "./locale-provider";

/**
 * Drop-in replacement for next/link that automatically prefixes the current
 * locale. Use it everywhere internal navigation must stay within the active
 * language. String hrefs only (the 99% case in this app).
 */
type LocaleLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(
  function LocaleLink({ href, ...props }, ref) {
    const locale = useLocale();
    return <Link ref={ref} href={localizePath(href, locale)} {...props} />;
  }
);

/** Hook returning a function that localizes an app-absolute path. */
export function useLocalizedHref(): (path: string) => string {
  const locale = useLocale();
  return useCallback((path: string) => localizePath(path, locale), [locale]);
}

/** Locale-aware router for client-side navigation (push/replace). */
export function useLocaleRouter() {
  const router = useRouter();
  const locale = useLocale();
  return {
    ...router,
    push: (path: string) => router.push(localizePath(path, locale)),
    replace: (path: string) => router.replace(localizePath(path, locale)),
  };
}

export function localizeFor(path: string, locale: Locale): string {
  return localizePath(path, locale);
}
