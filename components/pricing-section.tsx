"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check, Flame, Zap, CalendarDays, Infinity as InfinityIcon, Lock, type LucideIcon,
} from "lucide-react";
import { visibleOffers, freeTier, type PaidPlan, type Duration } from "@/lib/plans";
import LaunchCountdown, { useCountdown, formatRemaining, PRICE_HIKE_DEADLINE } from "@/components/launch-countdown";
import { trackEvent } from "@/lib/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";

const ICONS: Record<PaidPlan, LucideIcon> = {
  decouverte: Zap,
  monthly: CalendarDays,
  elite: Flame,
  pro_weekly: CalendarDays,
  elite_weekly: Flame,
  lifetime: InfinityIcon,
  // legacy
  essential: Zap,
  weekly: Zap,
  pass_cdm: Flame,
  season: CalendarDays,
};

const DURATION_LABEL: Record<Duration, string> = {
  week: "Semaine",
  month: "Mensuel",
  lifetime: "À vie",
};
const DURATION_ORDER: Duration[] = ["week", "month", "lifetime"];

/** Public, informational pricing (no checkout) — CTAs send to signup. */
export default function PricingSection({ id = "tarifs" }: { id?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [duration, setDuration] = useState<Duration>("month");
  const [mountedCd, setMountedCd] = useState(false);
  const [now] = useState(() => Date.now());
  const cd = useCountdown(PRICE_HIKE_DEADLINE);
  useEffect(() => {
    const id = setTimeout(() => setMountedCd(true), 0);
    return () => clearTimeout(id);
  }, []);

  const offers = visibleOffers(now, locale);
  const durations = DURATION_ORDER.filter((d) => offers.some((o) => o.duration === d));
  const shown = offers.filter((o) => o.duration === duration);
  const gridCls =
    shown.length === 1
      ? "grid grid-cols-1 max-w-sm mx-auto"
      : shown.length === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch max-w-3xl mx-auto"
        : "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch max-w-5xl mx-auto";

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
          <p className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 text-[12px] font-medium text-[var(--accent)]">
            <span aria-hidden>🔁</span>
            Après la Coupe du Monde, Copafever continue sur les grands championnats (Ligue 1, Champions League…).
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <LaunchCountdown />
        </div>

        {/* Duration toggle — Semaine / Mensuel / À vie */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 rounded-full glass p-1">
            {durations.map((d) => {
              const active = d === duration;
              return (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`relative px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-[#06231a]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {DURATION_LABEL[d]}
                  {d === "lifetime" && mountedCd && cd.total > 0 && (
                    <span className="absolute -top-2.5 -right-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white tabular-nums whitespace-nowrap leading-none">
                      {formatRemaining(cd)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={gridCls}>
          {shown.map((o, i) => {
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
