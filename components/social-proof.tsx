"use client";

import { motion, type Variants } from "framer-motion";
import { Star, TrendingUp, Users, Zap } from "lucide-react";
import { useTranslations } from "@/lib/i18n/locale-provider";

const STATS = [
  { value: "3 200+", labelKey: "socialProof.stat1", icon: Zap, color: "var(--accent)" },
  { value: "72", labelKey: "socialProof.stat2", icon: TrendingUp, color: "#ffd700" },
  { value: "4.8/5", labelKey: "socialProof.stat3", icon: Star, color: "var(--accent-soft)" },
  { value: "18 k+", labelKey: "socialProof.stat4", icon: Users, color: "#ff6b35" },
];

const TESTIMONIALS = [
  { name: "Antoine B.", location: "Paris", avatar: "AB", avatarBg: "var(--accent)", stars: 5, quoteKey: "socialProof.quote1", tagKey: "socialProof.tag1" },
  { name: "Clara M.", location: "Lyon", avatar: "CM", avatarBg: "#ffd700", stars: 5, quoteKey: "socialProof.quote2", tagKey: "socialProof.tag2" },
  { name: "Romain D.", location: "Bordeaux", avatar: "RD", avatarBg: "var(--accent-soft)", stars: 5, quoteKey: "socialProof.quote3", tagKey: "socialProof.tag3" },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-[#ffd700] fill-[#ffd700]" />
      ))}
    </div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function SocialProof() {
  const t = useTranslations();
  const AI_SNIPPET = t("socialProof.snippet");
  return (
    <section className="border-t border-white/5 bg-[#060910]">
      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {STATS.map(({ value, labelKey, icon: Icon, color }) => (
            <motion.div
              key={labelKey} variants={item}
              whileHover={{ y: -4, boxShadow: `0 16px 32px color-mix(in srgb, ${color} 9%, transparent)` }}
              className="glass rounded-2xl text-center py-7 px-4 transition-all duration-300"
            >
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3"
                style={{ background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 14%, transparent)` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs text-[#4a5568]">{t(labelKey)}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Testimonials */}
      <div className="max-w-5xl mx-auto px-4 pb-14">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <p className="text-xs text-[#3a4560] uppercase tracking-widest mb-2 font-medium">{t("socialProof.trustLabel")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0]">
            {t("socialProof.titlePre")}{" "}
            <span className="text-[#ffd700]">{t("socialProof.titleAccent")}</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {TESTIMONIALS.map(({ name, location, avatar, avatarBg, stars, quoteKey, tagKey }) => (
            <motion.div
              key={name} variants={item}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              className="glass rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
            >
              <StarRating count={stars} />
              <p className="text-[#9aa5b8] text-sm leading-relaxed flex-1">&ldquo;{t(quoteKey)}&rdquo;</p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-[#080b12] shrink-0"
                  style={{ background: avatarBg }}
                >
                  {avatar}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#f0f0f0]">{name}</div>
                  <div className="text-[10px] text-[#4a5568]">{location} · {t(tagKey)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI snippet */}
        <motion.div
          className="glass-neon rounded-2xl p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <motion.div
              className="w-2 h-2 rounded-full bg-[var(--accent)]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-widest">
              {t("socialProof.snippetLabel")}
            </span>
            <span className="ml-auto text-[10px] text-[#4a5568] glass px-2 py-0.5 rounded-full">
              Copafever IA
            </span>
          </div>
          <div className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-[#9aa5b8] ai-response">
            {AI_SNIPPET.split("\n").map((line, i) => {
              if (line.startsWith("## "))
                return <div key={i} className="text-[var(--accent)] font-bold text-sm mb-2">{line.slice(3)}</div>;
              if (line.startsWith("**") && line.endsWith("**"))
                return <div key={i} className="text-[#f0f0f0] font-semibold mt-2 mb-1">{line.slice(2, -2)}</div>;
              if (line.startsWith("**") && line.includes("**"))
                return (
                  <p key={i} className="text-[#9aa5b8] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic">$1</em>') }}
                  />
                );
              if (!line.trim()) return <div key={i} className="h-2" />;
              return (
                <p key={i} className="text-[#9aa5b8] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic">$1</em>') }}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
