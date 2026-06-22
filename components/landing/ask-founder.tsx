"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import { logAppEvent } from "@/actions/log-event";
import { trackEvent } from "@/lib/analytics";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Section humanisée "On répond en vrai" :
 *  - une carte créateur "en ligne" (comme la bulle Mathis CEO du moodboard) ;
 *  - deux bandeaux de questions qui défilent en boucle (sens opposés) ;
 *  - chaque question est cliquable et ouvre un DM (X / Instagram).
 *
 * But : capter le visiteur qui a une question et le pousser à écrire en DM
 * (lead gen + humanisation) plutôt que de le laisser repartir.
 */

// DM deep links : Instagram ouvre directement le fil (ig.me/m), X ouvre le profil.
const DM_X = "https://x.com/0xCopa";
const DM_INSTA = "https://ig.me/m/0xcopa";

// Questions réelles que se posent les parieurs. Une issue (X ou Insta) par chip.
const QUESTIONS: { qKey: string; to: "twitter" | "instagram" }[] = [
  { qKey: "askFounder.q1", to: "instagram" },
  { qKey: "askFounder.q2", to: "twitter" },
  { qKey: "askFounder.q3", to: "instagram" },
  { qKey: "askFounder.q4", to: "twitter" },
  { qKey: "askFounder.q5", to: "instagram" },
  { qKey: "askFounder.q6", to: "twitter" },
  { qKey: "askFounder.q7", to: "instagram" },
  { qKey: "askFounder.q8", to: "twitter" },
  { qKey: "askFounder.q9", to: "instagram" },
  { qKey: "askFounder.q10", to: "twitter" },
  { qKey: "askFounder.q11", to: "instagram" },
  { qKey: "askFounder.q12", to: "twitter" },
];

function hrefFor(to: "twitter" | "instagram") {
  return to === "instagram" ? DM_INSTA : DM_X;
}

function QuestionChip({ qKey, to, accent }: { qKey: string; to: "twitter" | "instagram"; accent: boolean }) {
  const t = useTranslations();
  return (
    <a
      href={hrefFor(to)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent("question_chip_click", { channel: to });
        logAppEvent("contact_click", { channel: to });
      }}
      className={`group inline-flex items-center gap-2 shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 ${
        accent
          ? "bg-[var(--accent)] text-[#0a0a0a]"
          : "glass text-[#dfe4ea] hover:text-white border border-white/10"
      }`}
    >
      <MessageCircle size={15} className={accent ? "text-[#0a0a0a]" : "text-[var(--accent)]"} />
      {t(qKey)}
    </a>
  );
}

/** Une rangée qui défile en boucle (contenu dupliqué pour un loop sans coupure). */
function MarqueeRow({
  items,
  direction,
  duration,
  startAccent,
}: {
  items: { qKey: string; to: "twitter" | "instagram" }[];
  direction: "left" | "right";
  duration: number;
  startAccent: boolean;
}) {
  return (
    <div className="marquee-row relative overflow-hidden py-1.5">
      {/* fondus latéraux */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      <div
        className={`flex w-max gap-3 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[...items, ...items].map((item, i) => (
          <QuestionChip key={i} qKey={item.qKey} to={item.to} accent={(i + (startAccent ? 0 : 1)) % 3 === 0} />
        ))}
      </div>
    </div>
  );
}

export default function AskFounder() {
  const t = useTranslations();
  const row1 = QUESTIONS.slice(0, 6);
  const row2 = QUESTIONS.slice(6);

  return (
    <section className="relative overflow-hidden py-16 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        {/* Carte créateur "en ligne" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full bg-[#0f1216] ring-2 ring-[var(--accent)]/40 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/copafever-icon.svg" alt="Copafever" className="w-9 h-9" />
            </div>
            <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-[var(--accent)] border-2 border-[#0a0a0a]" />
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f0f0]">{t("askFounder.title")}</h2>
          </div>
          <p className="text-[#7a8599] text-sm max-w-md">
            {t("askFounder.subtitlePre")}{" "}
            <span className="text-[var(--accent)] font-semibold">{t("askFounder.subtitleAccent")}</span>{t("askFounder.subtitlePost")}
          </p>
        </motion.div>

        {/* Questions qui défilent → DM */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-1 mb-10"
        >
          <MarqueeRow items={row1} direction="left" duration={38} startAccent />
          <MarqueeRow items={row2} direction="right" duration={46} startAccent={false} />
        </motion.div>

        {/* CTA DM */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={DM_INSTA}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("contact_click", { channel: "instagram", location: "ask_founder" });
              logAppEvent("contact_click", { channel: "instagram" });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm glow-neon hover:bg-[var(--accent-soft)] transition-colors"
          >
            <SocialIcon id="instagram" size={17} />
            {t("askFounder.writeInstagram")}
          </a>
          <a
            href={DM_X}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("contact_click", { channel: "twitter", location: "ask_founder" });
              logAppEvent("contact_click", { channel: "twitter" });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-sm font-bold text-[#dfe4ea] hover:text-white hover:border-white/20 transition-colors"
          >
            <SocialIcon id="twitter" size={16} />
            {t("askFounder.writeX")}
          </a>
        </div>
      </div>
    </section>
  );
}
