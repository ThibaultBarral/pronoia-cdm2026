"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { FAQ } from "@/lib/faq";

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">
          Questions fréquentes
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0]">
          Tout ce qu&apos;il faut savoir{" "}
          <span className="text-[var(--accent)]">avant de commencer</span>
        </h2>
      </div>

      <div className="space-y-2.5">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={`rounded-2xl border transition-colors ${
                isOpen ? "glass-neon border-[var(--accent)]/20" : "glass border-white/5"
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-3 text-left px-5 py-4"
                aria-expanded={isOpen}
              >
                <span className="flex-1 text-sm md:text-base font-bold text-[#f0f0f0]">
                  {item.q}
                </span>
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-white/[0.04] text-[#7a8290]"
                  }`}
                >
                  {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-[#9aa5b8] leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-8">
        Une autre question ?{" "}
        <a href="mailto:support@copafever.com" className="text-[var(--accent)] hover:underline">
          Écris-nous
        </a>
        .
      </p>
    </section>
  );
}
