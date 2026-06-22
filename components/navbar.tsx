"use client";

import { Zap } from "lucide-react";
import { LocaleLink } from "@/lib/i18n/navigation";
import { useTranslations } from "@/lib/i18n/locale-provider";
import LanguageSwitcher from "@/components/language-switcher";

export default function Navbar() {
  const t = useTranslations();
  return (
    <header className="safe-header sticky top-0 z-50 border-b border-white/5 bg-[#080b12]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <LocaleLink href="/" className="flex items-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-7 w-auto" />
        </LocaleLink>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#7a8290]">
          <LocaleLink href="/#how-it-works" className="hover:text-[#cdd3db] transition-colors">{t("navbar.howItWorks")}</LocaleLink>
          <LocaleLink href="/#tarifs" className="hover:text-[#cdd3db] transition-colors">{t("navbar.pricing")}</LocaleLink>
          <LocaleLink href="/#faq" className="hover:text-[#cdd3db] transition-colors">{t("navbar.faq")}</LocaleLink>
          <LocaleLink href="/#matches" className="hover:text-[#cdd3db] transition-colors">{t("navbar.matches")}</LocaleLink>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <LocaleLink href="/login" className="hidden sm:inline-flex text-sm text-[#7a8290] hover:text-[#f0f0f0] transition-colors px-2">
            {t("navbar.signIn")}
          </LocaleLink>
          <LocaleLink
            href="/login?mode=signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#080b12] text-sm font-bold hover:bg-[var(--accent-soft)] transition-all hover:scale-105 glow-neon"
          >
            <Zap size={13} />
            {t("navbar.cta")}
          </LocaleLink>
        </div>
      </div>
    </header>
  );
}
