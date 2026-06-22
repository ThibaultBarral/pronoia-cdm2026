import ComboTicket from "@/components/combo/combo-ticket";
import { getDailyCombo } from "@/lib/combo";
import { getSubscription } from "@/lib/ai-guard";
import { FEATURE } from "@/lib/feature-flags";
import { getT } from "@/lib/i18n/dictionaries";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

/** Home/landing combo section (server) — gated: free sees blurred selections. */
export default async function ComboSection({ locale = defaultLocale }: { locale?: Locale }) {
  if (!FEATURE.combo) return null;
  const [combo, sub] = await Promise.all([getDailyCombo(), getSubscription()]);
  if (!combo) return null;
  const t = getT(locale);

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-7">
        <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">
          {t("combo.label")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0]">
          {t("combo.titlePre")}{" "}
          <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t("combo.titleAccent")}
          </span>
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {t("combo.subtitle", { count: combo.count })}
        </p>
      </div>
      <ComboTicket combo={combo} unlocked={sub?.access ?? false} locale={locale} />
    </section>
  );
}
