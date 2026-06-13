"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X as Close, Gift } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import { logAppEvent } from "@/actions/log-event";
import { trackEvent } from "@/lib/analytics";

/**
 * Discreet floating contact widget (bottom-right). Collapsed it's a small accent
 * bubble; tapped it reveals two direct-DM buttons (X + Instagram) so a visitor
 * can reach the founder in one click — promo code, questions, or to subscribe.
 *
 * DM deep links: Instagram supports ig.me/m/<user> (opens the DM thread); X has
 * no public username-DM URL, so we open the profile where the user can message.
 */
const CHANNELS = [
  { id: "twitter" as const, label: "M'écrire sur X", href: "https://x.com/0xCopa" },
  { id: "instagram" as const, label: "M'écrire sur Insta", href: "https://ig.me/m/0xcopa" },
];

export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    setOpen((v) => {
      if (!v) {
        trackEvent("contact_open");
        logAppEvent("contact_open");
      }
      return !v;
    });
  }

  return (
    <div
      ref={ref}
      className="fixed right-4 z-[60] flex flex-col items-end gap-2"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      {/* Expanded panel */}
      {open && (
        <div className="w-60 rounded-2xl glass-strong p-3 shadow-2xl animate-fade-in-up">
          <div className="flex items-center gap-1.5 mb-1 text-[var(--accent)]">
            <Gift size={14} />
            <span className="text-xs font-black uppercase tracking-wide">Un code promo&nbsp;?</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2.5">
            Une question ou tu veux t&apos;abonner&nbsp;? Écris-moi en direct, je réponds vite.
          </p>
          <div className="flex flex-col gap-1.5">
            {CHANNELS.map((c) => (
              <a
                key={c.id}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("contact_click", { channel: c.id });
                  logAppEvent("contact_click", { channel: c.id });
                }}
                className="flex items-center gap-2.5 rounded-xl glass px-3 py-2.5 text-sm font-bold text-[#e6e9ee] hover:bg-white/[0.07] hover:text-[var(--accent)] transition-colors"
              >
                <SocialIcon id={c.id} size={17} />
                {c.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Toggle bubble */}
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Fermer le contact" : "Me contacter"}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[#0a0a0a] shadow-lg shadow-[var(--accent)]/25 transition-transform hover:scale-105 active:scale-95"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-40 animate-ping" />
        )}
        <span className="relative">
          {open ? <Close size={20} /> : <MessageCircle size={22} />}
        </span>
      </button>
    </div>
  );
}
