"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ACQUISITION_CHANNELS, type AcquisitionChannel } from "@/lib/acquisition";
import { trackEvent } from "@/lib/analytics";

/**
 * One-time "How did you hear about us?" survey. Shows on the first dashboard
 * visit of any account that hasn't answered yet (new signups and, once,
 * existing users). The answer lands in user_metadata → surfaced in /admin.
 */
export default function AcquisitionSurvey() {
  const [show, setShow] = useState(false);
  const [channel, setChannel] = useState<AcquisitionChannel | null>(null);
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      if (!user.user_metadata?.acquisition_channel) setShow(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  function save(value: AcquisitionChannel | "skip") {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          acquisition_channel: value,
          ...(value !== "skip" && detail.trim()
            ? { acquisition_detail: detail.trim() }
            : {}),
        },
      });
      if (value !== "skip") {
        trackEvent("acquisition_channel", { channel: value });
      }
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
              <div className="text-2xl mb-2">👋</div>
              <h2 className="text-lg font-black text-[#f0f0f0]">
                Comment as-tu connu Copafever ?
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Une seule question — ça nous aide énormément. Merci 🙏
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {ACQUISITION_CHANNELS.map((c) => {
                const active = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      active
                        ? "glass-neon glow-neon text-[#f0f0f0]"
                        : "glass text-[#9aa3b2] hover:bg-white/[0.05]"
                    }`}
                    style={
                      active
                        ? { borderColor: "rgba(var(--accent-rgb),0.5)" }
                        : undefined
                    }
                  >
                    <span className="text-lg">{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>

            {channel && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={80}
                placeholder={
                  channel === "other"
                    ? "Précise (facultatif)…"
                    : "Quel compte / quelle vidéo ? (facultatif)"
                }
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-[#c0c0c0] placeholder-[#444] focus:outline-none focus:border-[var(--accent)]/30 transition-colors mb-4"
              />
            )}

            <button
              type="button"
              onClick={() => channel && save(channel)}
              disabled={!channel || pending}
              className="w-full rounded-xl bg-[var(--accent)] text-[#06231a] font-bold py-3.5 text-sm hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-50"
            >
              {pending ? "Merci !" : "Valider"}
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
