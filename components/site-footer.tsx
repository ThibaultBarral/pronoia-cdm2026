import Link from "next/link";
import { SOCIAL_LINKS, CONTACT_EMAIL } from "@/lib/social";
import { SocialIcon } from "@/components/social-icons";

const NAV_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produit",
    links: [
      { label: "Comment ça marche", href: "/#how-it-works" },
      { label: "Tarifs", href: "/#tarifs" },
      { label: "Combiné du jour", href: "/combine-du-jour" },
      { label: "Track record", href: "/track-record" },
      { label: "Matchs", href: "/#matches" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "Commencer gratuitement", href: "/login?mode=signup" },
      { label: "Mon tableau de bord", href: "/dashboard" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", href: "/cgu" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#060910]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand + social */}
          <div className="col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-7 w-auto mb-3" />
            <p className="text-xs text-[#5a6472] leading-relaxed max-w-xs mb-4">
              L&apos;assistant de paris propulsé par l&apos;IA : analyses, value bets et suivi de
              bankroll pour la Coupe du Monde 2026 et toutes les compétitions à venir.
            </p>
            <p className="text-xs text-[#5a6472] mb-4">
              Contact :{" "}
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center glass text-[#7a8290] hover:text-[var(--accent)] hover:bg-[var(--accent)]/[0.08] transition-colors"
                >
                  <SocialIcon id={s.id} size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#5a6472] mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-xs text-[#9aa3b2] hover:text-[#f0f0f0] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#5a6472]">
            © {new Date().getFullYear()} Copafever · Analyse IA Football
          </p>
          <p className="text-[11px] text-[#5a6472] text-center sm:text-right max-w-md">
            Analyses à titre informatif uniquement · Les paris comportent des risques ·
            Réservé aux 18 ans et plus · Jouez responsable.
          </p>
        </div>
      </div>
    </footer>
  );
}
