"use client";

import { motion } from "framer-motion";
import { Check, CalendarDays, CalendarRange, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { visibleOffers, type Offer } from "@/lib/plans";
import { trackEvent } from "@/lib/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";

const ICONS: Partial<Record<Offer["duration"], LucideIcon>> = {
  week: CalendarDays,
  month: CalendarRange,
  year: Trophy,
};

/**
 * Public, informational pricing (no checkout) — CTAs send to signup. One plan,
 * three durations, same content in each: only the billing period changes. No
 * struck-through anchor price, no countdown, no capped entry tier.
 */
export default function PricingSection({ id = "tarifs" }: { id?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const offers = visibleOffers(undefined, locale);

  return (
    <section id={id} className="border-t border-white/5 bg-[#03061a]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-medium">
            {t("pricing.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
            {t("pricing.titlePre")}{" "}
            <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("pricing.titleAccent")}
            </span>
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-3 max-w-lg mx-auto">
            {t("pricing.subtitle")}
          </p>
          <p className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/8 text-[12px] font-medium text-[var(--accent-soft)]">
            <span aria-hidden>🏟️</span>
            Saison 2026/27 : Ligue 1, Premier League, Liga, Serie A, Bundesliga, Ligue des Champions, Ligue Europa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch max-w-5xl mx-auto">
          {offers.map((o, i) => {
            const Icon = ICONS[o.duration] ?? CalendarDays;
            const silver = o.badgeKind === "life";
            const highlight = o.highlight;
            const accentColor = silver ? "var(--star)" : "var(--accent-soft)";
            return (
              <motion.div
                key={o.plan}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className={`relative flex flex-col rounded-3xl p-6 ${highlight ? "glass-neon glow-neon" : "glass"}`}
                style={
                  highlight
                    ? { borderColor: "rgba(var(--accent-rgb),0.55)" }
                    : silver
                      ? { borderColor: "rgba(var(--star-rgb),0.30)" }
                      : undefined
                }
              >
                {o.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap"
                    style={silver ? { background: "var(--star)", color: "#0B1330" } : { background: "var(--accent)", color: "#ffffff" }}
                  >
                    {o.badge}
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: silver ? "rgba(var(--star-rgb),0.12)" : "rgba(var(--accent-rgb),0.14)" }}>
                    <Icon size={18} style={{ color: accentColor }} />
                  </span>
                  <h3 className="text-xl font-black text-[var(--text)]">{o.name}</h3>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="text-[40px] leading-none font-black" style={{ color: silver ? "var(--star)" : "var(--text)" }}>
                    {o.priceLabel}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] mb-1.5">{o.unit}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2 mb-5">{o.sublabel}</p>

                <ul className="space-y-3 mb-7 flex-1">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#c3cbe3]">
                      <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login?mode=signup"
                  onClick={() => trackEvent("signup_click", { location: "pricing", plan: o.plan })}
                  className={`w-full text-center rounded-xl py-3.5 text-sm font-black transition-transform hover:scale-[1.02] ${silver ? "text-[#0B1330]" : "text-white"}`}
                  style={{
                    background: silver
                      ? "linear-gradient(135deg, #C9D3F0, var(--star))"
                      : highlight
                        ? "linear-gradient(135deg, var(--accent-strong), var(--accent))"
                        : "linear-gradient(135deg, #1E4FBF, var(--accent))",
                  }}
                >
                  {t("pricing.cta")}
                </Link>
                {o.note && (
                  <p className="text-[11px] text-[var(--text-muted)] text-center mt-3">{o.note}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8 max-w-2xl mx-auto leading-relaxed">
          {t("pricing.legal")}
          <br />
          {t("pricing.legal2")}
        </p>
      </div>
    </section>
  );
}
