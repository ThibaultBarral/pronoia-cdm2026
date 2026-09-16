"use client";

import { SOCIAL_LINKS, CONTACT_EMAIL } from "@/lib/social";
import { SocialIcon } from "@/components/social-icons";
import { LocaleLink } from "@/lib/i18n/navigation";
import { useTranslations } from "@/lib/i18n/locale-provider";

export default function SiteFooter() {
  const t = useTranslations();

  const NAV_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("footer.colProduct"),
      links: [
        { label: t("footer.howItWorks"), href: "/#how-it-works" },
        { label: t("footer.pricing"), href: "/#tarifs" },
        { label: t("navbar.competitions"), href: "/#competitions" },
        { label: t("footer.faq"), href: "/#faq" },
      ],
    },
    {
      title: t("footer.colAccount"),
      links: [
        { label: t("footer.signIn"), href: "/login" },
        { label: t("footer.startFree"), href: "/login?mode=signup" },
        { label: t("footer.myDashboard"), href: "/dashboard" },
      ],
    },
    {
      title: t("footer.colLegal"),
      links: [
        { label: t("footer.terms"), href: "/cgu" },
        { label: t("footer.privacy"), href: "/confidentialite" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 bg-[#03061a]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand + social */}
          <div className="col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/copafever-primary.svg?v=3" alt="Copafever" className="h-7 w-auto mb-3" />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs mb-4">
              {t("footer.tagline")}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {t("footer.contact")}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center glass text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/[0.08] transition-colors"
                >
                  <SocialIcon id={s.id} size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <LocaleLink href={l.href} className="text-xs text-[#c3cbe3] hover:text-[var(--text)] transition-colors">
                      {l.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} Copafever · {t("footer.rights")}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] text-center sm:text-right max-w-md">
            {t("footer.legalLine")}
          </p>
        </div>
      </div>
    </footer>
  );
}
