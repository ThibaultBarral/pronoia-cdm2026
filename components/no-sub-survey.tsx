"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { NO_SUB_REASONS, type NoSubReason } from "@/lib/no-sub-survey";
import { getNoSubSurvey } from "@/actions/no-sub-survey";
import { trackEvent } from "@/lib/analytics";

/**
 * One-time "Why haven't you subscribed yet?" survey. Shown to non-subscribers
 * after several days on the app (eligibility decided server-side). The answer
 * lands in user_metadata.no_sub_reason → surfaced in /admin. Answering or
 * skipping stops it from reappearing.
 */
export default function NoSubSurvey() {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState<NoSubReason | null>(null);
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getNoSubSurvey().then((res) => {
      if (active && res.eligible) setShow(true);
    });
    return () => {
      active = false;
    };
  }, []);

  function save(value: NoSubReason | "skip") {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          no_sub_reason: value,
          ...(value !== "skip" && detail.trim()
            ? { no_sub_detail: detail.trim() }
            : {}),
        },
      });
      if (value !== "skip") trackEvent("no_sub_reason", { reason: value });
      setShow(false);
    });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="w-full sm:max-w-md bg-[#0d0d0d] border border-[#1a1a1a] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6"
          >
            <div className="text-center mb-5">
              <div className="text-2xl mb-2">🤔</div>
              <h2 className="text-lg font-black text-[#f0f0f0]">
                Pourquoi pas encore d&apos;abonnement ?
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Une seule question, anonyme côté produit — ça nous aide à
                t&apos;offrir mieux. Merci 🙏
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {NO_SUB_REASONS.map((r) => {
                const active = reason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReason(r.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold text-left transition-all ${
                      active
                        ? "glass-neon glow-neon text-[#f0f0f0]"
                        : "glass text-[#9aa3b2] hover:bg-white/[0.05]"
                    }`}
                    style={
                      active ? { borderColor: "rgba(var(--accent-rgb),0.5)" } : undefined
                    }
                  >
                    <span className="text-lg">{r.emoji}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>

            {reason && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={120}
                placeholder={
                  reason === "too_expensive"
                    ? "Quel prix te semblerait juste ? (facultatif)"
                    : reason === "other"
                      ? "Précise ta raison (facultatif)…"
                      : "Dis-nous en plus (facultatif)…"
                }
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-[#c0c0c0] placeholder-[#444] focus:outline-none focus:border-[var(--accent)]/30 transition-colors mb-4"
              />
            )}

            <button
              type="button"
              onClick={() => reason && save(reason)}
              disabled={!reason || pending}
              className="w-full rounded-xl bg-[var(--accent)] text-[#06231a] font-bold py-3.5 text-sm hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-50"
            >
              {pending ? "Merci !" : "Envoyer"}
            </button>

            <button
              type="button"
              onClick={() => save("skip")}
              disabled={pending}
              className="w-full mt-2 text-xs text-[#555] hover:text-[#888] transition-colors py-1.5"
            >
              Passer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
