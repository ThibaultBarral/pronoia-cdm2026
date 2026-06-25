"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { getWinbackOffer, markWinbackSeen } from "@/actions/winback";
import { createCheckout } from "@/actions/create-checkout";
import {
  WINBACK_CODE,
  WINBACK_DISCOUNT_PCT,
  WINBACK_DURATION_MONTHS,
  WINBACK_TARGET_PLAN,
  WINBACK_WINDOW_HOURS,
} from "@/lib/winback";
import LegalFooter from "@/components/legal-footer";

function formatLeft(ms: number): string {
  if (ms <= 0) return "0h";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m}min`;
}

/**
 * Win-back pop-up: shows ONCE to a returning, engaged non-subscriber, offering
 * KICKOFF20 (-20% / 3 months on the Monthly plan). Stamps "seen" on display so
 * it never reappears. Fully fail-safe — if anything errors it simply never shows.
 */
export default function WinbackPopup() {
  const [open, setOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [pending, startCheckout] = useTransition();

  // Evaluate eligibility once on mount (async → setState in a promise callback,
  // which is fine for the set-state-in-effect rule).
  useEffect(() => {
    let cancelled = false;
    getWinbackOffer().then((offer) => {
      if (cancelled || !offer.eligible) return;
      setOpen(true);
      // Stamp as seen → locks it to a single appearance + returns the 72h end.
      markWinbackSeen().then((res) => {
        if (cancelled) return;
        const end = res.expiresAt
          ? Date.parse(res.expiresAt)
          : Date.now() + WINBACK_WINDOW_HOURS * 3_600_000;
        setExpiresAt(end);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick the countdown while open.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [open]);

  function copyCode() {
    navigator.clipboard?.writeText(WINBACK_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function goCheckout() {
    startCheckout(async () => {
      const res = await createCheckout(WINBACK_TARGET_PLAN, WINBACK_CODE);
      if (res.ok) window.location.href = res.url;
    });
  }

  const left = expiresAt ? expiresAt - now : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl glass-strong p-6"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/12 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-[var(--accent)]" />
            </div>

            <h2 className="text-xl font-black text-[var(--text)]">
              On a vu que tu reviens 👀
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Voici <span className="font-bold text-[var(--text)]">-{WINBACK_DISCOUNT_PCT} %</span>{" "}
              sur tes <span className="font-bold text-[var(--text)]">{WINBACK_DURATION_MONTHS} premiers mois</span>{" "}
              du Premium, rien que pour toi.
            </p>

            {/* Code */}
            <button
              onClick={copyCode}
              className="mt-4 w-full flex items-center justify-between gap-3 rounded-2xl glass-neon px-4 py-3 hover:bg-[var(--accent)]/[0.06] transition-colors"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Ton code
                </div>
                <div className="text-lg font-black tracking-wide text-[var(--accent)]">
                  {WINBACK_CODE}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                {copied ? (
                  <>
                    <Check size={14} className="text-[var(--accent)]" /> Copié
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copier
                  </>
                )}
              </span>
            </button>

            {/* Countdown */}
            {left != null && left > 0 && (
              <p className="mt-3 text-center text-xs font-bold text-[#ff9d5c]">
                ⏳ Offre valable encore{" "}
                <span className="tabular-nums">{formatLeft(left)}</span>
              </p>
            )}

            {/* CTA */}
            <button
              onClick={goCheckout}
              disabled={pending}
              className="mt-4 w-full rounded-xl py-3.5 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))",
              }}
            >
              {pending ? "Redirection…" : "J'en profite →"}
            </button>

            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              Code pré-rempli au paiement · annulable à tout moment.
            </p>

            <LegalFooter className="mt-4 text-center" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
