"use client";

import { motion } from "framer-motion";
import {
  Check, Flame, Zap, CalendarDays, Infinity as InfinityIcon, Lock, type LucideIcon,
} from "lucide-react";
import { visibleOffers, freeTier, type PaidPlan } from "@/lib/plans";
import LaunchCountdown from "@/components/launch-countdown";
import { trackEvent } from "@/lib/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";

const ICONS: Record<PaidPlan, LucideIcon> = {
  essential: Zap,
  monthly: CalendarDays,
  lifetime: InfinityIcon,
  weekly: Zap,
  pass_cdm: Flame,
  season: CalendarDays,
};

/** Public, informational pricing (no checkout) — CTAs send to signup. */
export default function PricingSection({ id = "tarifs" }: { id?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <section id={id} className="border-t border-white/5 bg-[#060910]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-4">
          <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">
            {t("pricing.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0]">
            {t("pricing.titlePre")}{" "}
            <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("pricing.titleAccent")}
            </span>
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-3 max-w-lg mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <LaunchCountdown />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch max-w-5xl mx-auto">
          {visibleOffers(Date.now(), locale).map((o, i) => {
            const Icon = ICONS[o.plan];
            const gold = o.plan === "lifetime";
            const highlight = o.highlight;
            const accentColor = gold ? "#ffd700" : "var(--accent)";
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
                    : gold
                      ? { borderColor: "rgba(255,215,0,0.30)" }
                      : undefined
                }
              >
                {o.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap"
                    style={gold ? { background: "#ffd700", color: "#1a1300" } : { background: "var(--accent)", color: "#06231a" }}
                  >
                    {gold && <InfinityIcon size={12} />}
                    {o.badge}
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: gold ? "rgba(255,215,0,0.12)" : "rgba(var(--accent-rgb),0.12)" }}>
                    <Icon size={18} style={{ color: accentColor }} />
                  </span>
                  <h3 className="text-xl font-black text-[var(--text)]">{o.name}</h3>
                </div>

                {(o.discountLabel || o.anchorPrice) && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {o.discountLabel && (
                      <span className="inline-flex items-center text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#ef4444]/15 text-[#ff6b6b] border border-[#ef4444]/30">
                        {o.discountLabel}
                      </span>
                    )}
                    {o.anchorPrice && (
                      <span className="text-lg font-bold text-[var(--text-muted)] line-through decoration-[#ef4444]/60 decoration-2">
                        {o.anchorPrice}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  <span className="text-[40px] leading-none font-black" style={{ color: gold ? "#ffd700" : "var(--text)" }}>
                    {o.priceLabel}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] mb-1.5">{o.unit}</span>
                </div>
                {o.urgencyLabel && (
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#ff9d5c] mt-2">
                    <Flame size={13} className="shrink-0" />
                    {o.urgencyLabel}
                  </p>
                )}
                <p className="text-sm text-[var(--text-muted)] mt-2 mb-5">{o.sublabel}</p>

                <ul className="space-y-3 mb-7 flex-1">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#d0d0d0]">
                      <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                      <span>{f}</span>
                    </li>
                  ))}
                  {o.lockedFeatures?.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                      <Lock size={15} className="mt-0.5 shrink-0" />
                      <span className="line-through decoration-[var(--text-muted)]/50">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/login?mode=signup"
                  onClick={() => trackEvent("signup_click", { location: "pricing", plan: o.plan })}
                  className="w-full text-center rounded-xl py-3.5 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02]"
                  style={{
                    background: gold
                      ? "linear-gradient(135deg, #f5b800, #ffd700)"
                      : highlight
                        ? "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))"
                        : "linear-gradient(135deg, #0fb5a0, var(--accent))",
                  }}
                >
                  {t("pricing.cta")}
                </a>
                {o.note && (
                  <p className="text-[11px] text-[var(--text-muted)] text-center mt-3">{o.note}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Free baseline — what you keep without paying (and what stays locked). */}
        {(() => {
          const free = freeTier(locale);
          return (
            <a
              href="/login?mode=signup"
              onClick={() => trackEvent("signup_click", { location: "pricing", plan: "free" })}
              className="mt-5 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 text-center rounded-2xl glass px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-xs text-[var(--text-muted)]">
                <span className="font-bold text-[#cdd3db]">{free.name} · {free.priceLabel}</span> —{" "}
                {locale === "en"
                  ? "1 full analysis included, the rest stays locked"
                  : "1 analyse complète offerte, le reste reste verrouillé"}
              </span>
              <span className="text-xs font-bold text-[var(--accent)] shrink-0">
                {locale === "en" ? "Start free →" : "Commencer gratuitement →"}
              </span>
            </a>
          );
        })()}

        <p className="text-center text-xs text-[var(--text-muted)] mt-8 max-w-2xl mx-auto leading-relaxed">
          {t("pricing.legal")}
          <br />
          {t("pricing.legal2")}
        </p>
      </div>
    </section>
  );
}
