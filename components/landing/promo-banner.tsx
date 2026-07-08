"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { LocaleLink } from "@/lib/i18n/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";

const KEY = "cf_promo_dismissed_v1";

/**
 * Elofoot-style dismissible promo strip pinned above the navbar. Points to the
 * Pro yearly offer (the hero plan), emerald DA. Remembers dismissal in localStorage.
 */
export default function PromoBanner() {
  const en = useLocale() === "en";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Deferred (setTimeout) to keep the setState out of the synchronous effect
    // body — starts hidden, so a previously-dismissed banner never flashes.
    const id = setTimeout(() => setOpen(localStorage.getItem(KEY) !== "1"), 0);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  const label = en
    ? "⚡ Copafever Pro — unlimited analyses, from 5 €/month"
    : "⚡ Copafever Pro — analyses illimitées, dès 5 €/mois";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-[60] overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, rgba(var(--accent-strong-rgb),0.9), rgba(var(--accent-rgb),0.95), rgba(var(--accent-soft-rgb),0.9))",
          }}
        >
          <LocaleLink
            href="/tarifs"
            className="flex items-center justify-center gap-2.5 px-10 py-2.5 text-center"
          >
            <Trophy size={15} className="text-[#06231a] shrink-0" />
            <span className="text-[13px] sm:text-sm font-bold text-[#06231a] leading-tight">{label}</span>
          </LocaleLink>
          <button
            onClick={dismiss}
            aria-label={en ? "Dismiss" : "Fermer"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#06231a]/70 hover:text-[#06231a] hover:bg-black/10 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
