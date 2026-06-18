"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { WinItem } from "@/lib/predictions";
import { trackEvent } from "@/lib/analytics";

const MAX_PER_SESSION = 4;

/** Social-proof toasts (desktop) — recent verified wins, bottom-left, rotating. */
export default function ProofToasts({ items }: { items: WinItem[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState<WinItem | null>(null);
  const [tick, setTick] = useState(0);
  const idx = useRef(0);
  const shown = useRef(0);

  useEffect(() => {
    if (!items.length) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const showNext = () => {
      if (shown.current >= MAX_PER_SESSION) return;
      const item = items[idx.current % items.length];
      idx.current++;
      shown.current++;
      setCurrent(item);
      setTick((t) => t + 1);
      trackEvent("proof_toast_view", { id: item.id });
      timers.push(setTimeout(() => setCurrent(null), 7000));
      const gap = 25000 + Math.random() * 15000; // 25–40s
      timers.push(setTimeout(showNext, gap));
    };

    timers.push(setTimeout(showNext, 8000)); // first at 8s
    return () => timers.forEach(clearTimeout);
  }, [items]);

  function onClick() {
    if (current) trackEvent("proof_toast_click", { id: current.id });
    setCurrent(null);
    router.push("/dashboard");
  }

  return (
    <div className="hidden md:block fixed right-4 bottom-4 z-40 w-[300px]">
      <AnimatePresence>
        {current && (
          <motion.button
            key={`${current.id}-${tick}`}
            onClick={onClick}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full text-left rounded-2xl bg-[#0c1018]/95 backdrop-blur-xl border border-[var(--accent)]/20 p-3.5 shadow-2xl"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[var(--accent)]/12 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-[var(--accent)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-[var(--accent)] uppercase tracking-wide">
                  L&apos;IA l&apos;avait prédit
                </div>
                <div className="text-xs font-semibold text-[#e5e5e5] truncate mt-0.5">
                  {current.homeFlag}{current.awayFlag} {current.selection}
                </div>
                <div className="text-[10px] text-[#5a6472]">
                  {current.matchLabel} · @{current.odds.toFixed(2)} ✅
                </div>
              </div>
            </div>
            <div className="text-[9px] text-[#5a6472] mt-2">
              Prédiction vérifiée · 18+ · jouer comporte des risques
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
