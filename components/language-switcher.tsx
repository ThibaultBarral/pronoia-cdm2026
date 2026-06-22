"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeMeta, splitLocale, localizePath } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * FR / EN switcher. Keeps the user on the same page in the other language by
 * stripping the current locale prefix and re-localizing the logical path.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  const rawPath = usePathname();
  const { pathname } = splitLocale(rawPath);

  return (
    <div className={`inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-0.5 ${className}`}>
      <Globe size={13} className="ml-1.5 text-[#7a8290]" aria-hidden />
      {locales.map((loc) => {
        const active = loc === current;
        return (
          <Link
            key={loc}
            href={localizePath(pathname, loc)}
            hrefLang={loc}
            aria-current={active ? "true" : undefined}
            className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase transition-colors ${
              active
                ? "bg-[var(--accent)] text-[#080b12]"
                : "text-[#7a8290] hover:text-[#f0f0f0]"
            }`}
            title={localeMeta[loc].label}
          >
            {loc}
          </Link>
        );
      })}
    </div>
  );
}
