"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Timer, Layers } from "lucide-react";
import type { DailyCombo } from "@/lib/combo";
import { startCheckout } from "@/lib/checkout-client";
import { trackEvent } from "@/lib/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";
import { localizePath, type Locale } from "@/lib/i18n/config";

function useCountdown(targetIso: string, live: string): string {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now == null) return "—";
  const diff = Date.parse(targetIso) - now;
  if (diff <= 0) return live;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return d > 0 ? `${d}j ${h}h` : `${h}h ${String(m).padStart(2, "0")}min`;
}

export default function ComboTicket({ combo, unlocked }: { combo: DailyCombo; unlocked: boolean; locale?: Locale }) {
  const t = useTranslations();
  const locale = useLocale();
  const cd = useCountdown(combo.firstKickoff, t("combo.live"));
  const [pending, start] = useTransition();

  useEffect(() => {
    trackEvent("combo_view", { unlocked, picks: combo.count });
  }, [unlocked, combo.count]);

  function unlock() {
    trackEvent("combo_unlock_click", { plan: "mensuel" });
    start(async () => {
      const res = await startCheckout("monthly");
      if (res.ok) window.location.href = res.url;
      else window.location.href = localizePath("/login?mode=signup&next=/combine-du-jour", locale);
    });
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#ffd700]/25 bg-gradient-to-b from-[#ffd700]/[0.05] via-[#0d0d0d] to-[#0a0a0a] p-5 sm:p-6 max-w-md mx-auto">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ffd700]/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 text-[var(--accent)]">
            <Layers size={16} />
            <span className="text-sm font-black uppercase tracking-wide">{t("combo.ticketTitle")}</span>
          </div>
          {combo.firstKickoff && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#ff9d5c] font-bold">
              <Timer size={12} /> {cd}
            </span>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/5 divide-y divide-white/5">
          {combo.picks.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3.5 py-3">
              <span className="text-sm shrink-0">{p.homeFlag}{p.awayFlag}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-[#5a6472]">{p.matchLabel} · {p.market}</div>
                {unlocked ? (
                  <div className="text-xs font-semibold text-[#e5e5e5] truncate">{p.selection}</div>
                ) : (
                  <div className="mt-1 h-2.5 w-28 rounded-full bg-[#9aa]/15 blur-[3px]" aria-hidden />
                )}
              </div>
              <span className="text-xs font-bold text-[var(--accent)] tabular-nums shrink-0">
                {unlocked ? `@${p.odd.toFixed(2)}` : <Lock size={13} className="text-[#5a6472]" />}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#ffd700]/[0.06] border border-[#ffd700]/15 px-4 py-3">
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{t("combo.totalOdds")}</div>
            <div className="text-[11px] text-[#9aa3b2]">{t("combo.confidence", { value: combo.confidence })}</div>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-[#ffd700] tabular-nums"
          >
            ×{combo.totalOdds.toFixed(2)}
          </motion.div>
        </div>

        {!unlocked && (
          <>
            <button
              onClick={unlock}
              disabled={pending}
              className="mt-4 w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] glow-neon transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
            >
              {pending ? t("combo.redirecting") : t("combo.unlock")}
            </button>
            <p className="text-[11px] text-[var(--text-muted)] text-center mt-2">
              {t("combo.unlimited")}
            </p>
          </>
        )}

        <p className="text-[10px] text-[#5a6472] text-center mt-3 leading-relaxed">
          {t("combo.legal")}
        </p>
      </div>
    </div>
  );
}
