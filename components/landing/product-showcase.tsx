"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, CheckCircle2, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trackEvent } from "@/lib/analytics";

/** Real product screenshots (cropped from the live app). */
const SCREENS = [
  {
    src: "/screens/match-header.jpg",
    tag: "🇪🇸 ESP · 🇦🇹 AUT",
    fr: "Chaque match, prêt à analyser",
    en: "Every match, ready to analyse",
  },
  {
    src: "/screens/analysis.jpg",
    tag: "Victoire 69% · Confiance IA",
    fr: "Le verdict de l'IA, en gros",
    en: "The AI verdict, big and clear",
  },
  {
    src: "/screens/prediction-gold.jpg",
    tag: "xG · comparaison · marchés",
    fr: "Les stats qui comptent",
    en: "The stats that matter",
  },
  {
    src: "/screens/team-prediction.jpg",
    tag: "🇪🇸 18,4% titre",
    fr: "Le parcours de chaque nation",
    en: "Each nation's run to the title",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function ScreenPhone({
  src,
  tag,
  caption,
  index,
}: {
  src: string;
  tag: string;
  caption: string;
  index: number;
}) {
  // Alternating tilt + vertical offset → playful, reel-like stagger.
  const tilt = index % 2 === 0 ? -3 : 3;
  const offset = index % 2 === 0 ? "md:mt-0" : "md:mt-10";
  return (
    <motion.div
      variants={reveal}
      custom={index}
      className={`relative w-[188px] sm:w-[208px] shrink-0 snap-center ${offset}`}
    >
      <motion.div
        initial={{ rotate: tilt }}
        whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative"
      >
        {/* Glow */}
        <div className="absolute inset-0 -z-10 blur-3xl bg-[var(--accent)]/15 rounded-full scale-90" />
        {/* Device frame */}
        <div className="rounded-[2.2rem] border border-white/10 bg-[#050709] p-2 shadow-2xl">
          <div className="overflow-hidden rounded-[1.7rem] bg-[#0a0a0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={caption}
              loading="lazy"
              className="block w-full h-auto select-none"
              draggable={false}
            />
          </div>
        </div>
      </motion.div>
      {/* Caption */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] font-bold text-[var(--accent)] mb-1.5">
          {tag}
        </div>
        <p className="text-sm font-bold text-[#e8e8e8] px-2 leading-snug">{caption}</p>
      </div>
    </motion.div>
  );
}

export default function ProductShowcase() {
  const en = useLocale() === "en";

  const steps = [
    {
      icon: Search,
      title: en ? "Pick a match" : "Choisis ton match",
      body: en
        ? "48 nations, real flags, real fixtures of the 2026 World Cup."
        : "48 nations, vrais drapeaux, vrais matchs de la Coupe du Monde 2026.",
    },
    {
      icon: Sparkles,
      title: en ? "The AI reads it" : "L'IA décrypte",
      body: en
        ? "Win probability, expected goals, AI confidence & the likely scenario — in seconds."
        : "Probabilité de victoire, buts attendus, confiance IA & scénario probable — en quelques secondes.",
    },
    {
      icon: TrendingUp,
      title: en ? "You follow & share" : "Tu suis & tu partages",
      body: en
        ? "Verified predictions, team runs and shareable cards — the honest edge."
        : "Prédictions vérifiées, parcours des équipes et cartes à partager — l'avantage honnête.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-24 px-4">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-24 left-[6%] w-72 h-72 rounded-full bg-[var(--accent)]/8 blur-3xl"
          animate={{ y: [0, -24, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-[6%] w-64 h-64 rounded-full bg-[var(--accent-soft)]/6 blur-3xl"
          animate={{ y: [0, 22, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={reveal}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-neon mb-5">
            <Zap size={12} className="text-[var(--accent)]" />
            <span className="text-[11px] text-[var(--accent)] font-bold tracking-wide uppercase">
              {en ? "See it in action" : "Copafever en action"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f0f0f0] leading-[1.08] mb-4">
            {en ? (
              <>
                Every match of the Cup,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  decoded by AI
                </span>
              </>
            ) : (
              <>
                Chaque match de la Coupe,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  décrypté par l&apos;IA
                </span>
              </>
            )}
          </h2>
          <p className="text-[#9aa3b2] text-base sm:text-lg leading-relaxed">
            {en
              ? "Probabilities, expected goals, scenarios and team runs — the same screens our members open every day."
              : "Probabilités, buts attendus, scénarios et parcours d'équipe — les écrans que nos membres ouvrent chaque jour."}
          </p>
        </motion.div>

        {/* Phone gallery */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="flex gap-5 sm:gap-6 overflow-x-auto md:justify-center snap-x snap-mandatory pb-6 pt-2 -mx-4 px-4 md:mx-0 md:px-2 no-scrollbar"
        >
          {SCREENS.map((s, i) => (
            <ScreenPhone key={s.src} src={s.src} tag={s.tag} caption={en ? s.en : s.fr} index={i} />
          ))}
        </motion.div>

        {/* How it works — 3 steps */}
        <div className="mt-20">
          <motion.h3
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            variants={reveal}
            className="text-center text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8"
          >
            {en ? "How it works" : "Comment ça marche"}
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={reveal}
                  custom={i}
                  className="relative rounded-2xl glass p-6 text-center sm:text-left"
                >
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/25 shrink-0">
                      <Icon size={20} className="text-[var(--accent)]" />
                    </span>
                    <span className="text-4xl font-black text-white/[0.08] leading-none tabular-nums">
                      {i + 1}
                    </span>
                  </div>
                  <div className="text-base font-black text-[#f0f0f0] mb-1.5">{step.title}</div>
                  <p className="text-sm text-[#9aa3b2] leading-relaxed">{step.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Trust strip + CTA */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={reveal}
          className="mt-14 flex flex-col items-center gap-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <span className="flex items-center gap-2 text-[#cdd3db]">
              <CheckCircle2 size={16} className="text-[var(--accent)]" />
              {en ? "Real, verified predictions" : "Prédictions réelles & vérifiées"}
            </span>
            <span className="text-2xl leading-none tracking-tight">🇫🇷 🇪🇸 🇧🇷 🇩🇪 🇦🇷 🇵🇹</span>
            <span className="flex items-center gap-2 text-[#cdd3db]">
              <Sparkles size={16} className="text-[var(--accent)]" />
              {en ? "48 nations covered" : "48 nations couvertes"}
            </span>
          </div>
          <motion.a
            href="/login?mode=signup"
            onClick={() => trackEvent("signup_click", { location: "product_showcase" })}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(var(--accent-rgb),0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-[#080b12] font-bold text-sm glow-neon transition-colors hover:bg-[var(--accent-soft)]"
          >
            <Zap size={16} />
            {en ? "Create my free account" : "Créer mon compte gratuit"}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
