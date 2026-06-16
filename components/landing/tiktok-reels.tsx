"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Heart, MessageCircle, Play, ArrowUpRight, Sparkles } from "lucide-react";
import { REELS, type Reel } from "@/lib/landing-videos";
import { SocialIcon } from "@/components/social-icons";
import { trackEvent } from "@/lib/analytics";

/**
 * Section "Copafever en vrai" — un feed de vidéos verticales (9:16), feeling
 * TikTok : autoplay muet en boucle quand la carte est visible, clic/tap pour le
 * son, scale + glow au survol. Vidéos auto-hébergées (lib/landing-videos.ts).
 */
function ReelCard({ reel, index }: { reel: Reel; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const hasVideo = Boolean(reel.src);

  // N'autoplay que quand la carte est réellement visible (perf + data).
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function toggleSound(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    setMuted(next);
    el.muted = next;
    if (inView) el.play().catch(() => {});
    if (!next) trackEvent("reel_unmute", { id: reel.id });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ scale: 1.035, y: -6 }}
      className="relative shrink-0 w-[215px] sm:w-[245px] snap-center"
    >
      {/* Mockup téléphone */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#2b2e33] via-[#1a1c1f] to-[#0d0e10] p-[7px] ring-1 ring-white/10 shadow-[0_22px_55px_-14px_rgba(0,0,0,0.75)] transition-shadow duration-300 hover:ring-[var(--accent)]/45 hover:shadow-[0_30px_72px_-14px_rgba(var(--accent-rgb),0.45)]">
        {/* Boutons latéraux */}
        <span className="absolute -left-[2px] top-[88px] h-9 w-[3px] rounded-l bg-[#34373c]" />
        <span className="absolute -left-[2px] top-[134px] h-12 w-[3px] rounded-l bg-[#34373c]" />
        <span className="absolute -right-[2px] top-[112px] h-14 w-[3px] rounded-r bg-[#34373c]" />
        <div className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-[#0f1216] group">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 h-[15px] w-[54px] rounded-full bg-black" />
          {hasVideo ? (
          <video
            ref={videoRef}
            src={reel.src}
            poster={reel.poster}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onClick={toggleSound}
            className="absolute inset-0 h-full w-full object-cover cursor-pointer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[var(--accent)]/12 via-[#0f1216] to-[#0a0a0a]">
            <div className="w-14 h-14 rounded-full glass-neon flex items-center justify-center glow-neon">
              <Play size={20} className="text-[var(--accent)] fill-[var(--accent)] ml-0.5" />
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
              Vidéo bientôt
            </span>
          </div>
        )}

        {/* Dégradés haut + bas pour lisibilité */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Badge "voir en entier" */}
        {reel.href && (
          <a
            href={reel.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackEvent("reel_click", { id: reel.id });
            }}
            className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white hover:bg-black/70 transition-colors"
          >
            <SocialIcon id="tiktok" size={11} />
            En entier
            <ArrowUpRight size={11} />
          </a>
        )}

        {/* Son */}
        {hasVideo && (
          <button
            onClick={toggleSound}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}

        {/* Hint "tap pour le son" au survol */}
        {hasVideo && muted && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white">
              <Volume2 size={13} /> Touche pour le son
            </span>
          </div>
        )}

        {/* Rail engagement (déco TikTok) */}
        <div className="absolute right-2.5 bottom-[88px] z-10 flex flex-col items-center gap-3.5 text-white">
          <div className="flex flex-col items-center gap-0.5">
            <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Heart size={18} className="fill-white text-white" />
            </span>
            <span className="text-[10px] font-bold drop-shadow">{reel.likes ?? "—"}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <MessageCircle size={18} />
            </span>
            <span className="text-[10px] font-bold drop-shadow">{reel.comments ?? "—"}</span>
          </div>
        </div>

        {/* Légende + auteur */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 pr-12">
          <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 mb-2 drop-shadow">
            {reel.caption}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] flex items-center justify-center text-[9px] font-black text-[#0a0a0a]">
              C
            </span>
            <span className="text-[11px] text-white/85 font-semibold">{reel.author}</span>
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TikTokReels() {
  return (
    <section className="relative overflow-hidden py-20 px-4 border-t border-white/5">
      {/* Fond ludique */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 left-[12%] w-72 h-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <div className="absolute bottom-0 right-[10%] w-80 h-80 rounded-full bg-[var(--accent-soft)]/8 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-neon mb-5">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span className="text-[11px] text-[var(--accent)] font-bold tracking-wide uppercase">
              📲 Copafever en vrai
            </span>
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#f0f0f0] leading-[1.05]">
            Pas de blabla.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-soft))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tu regardes.
            </span>
          </h2>
          <p className="text-[#9aa3b2] text-sm md:text-base mt-4 max-w-md mx-auto">
            L&apos;appli, les analyses, les coulisses — en vidéo. Touche une carte pour le son. 🔊
          </p>
        </div>

        {/* Feed horizontal */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 pt-2 -mx-4 px-4">
          {REELS.map((reel, i) => (
            <ReelCard key={reel.id} reel={reel} index={i} />
          ))}
        </div>

        {/* Preuve sociale + CTA follow */}
        <div className="flex flex-col items-center gap-4 mt-10">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {["from-[#ff6b35] to-[#ffd700]", "from-[var(--accent)] to-[var(--accent-soft)]", "from-[#7c3aed] to-[#3DF08A]", "from-[#ffd700] to-[#ff6b35]"].map((g, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#0a0a0a]`}
                />
              ))}
            </div>
            <p className="text-sm text-[#9aa3b2]">
              <span className="text-[#f0f0f0] font-bold">+50 000</span> nous suivent déjà
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.tiktok.com/@0xcopa"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("social_follow_click", { channel: "tiktok", location: "reels" })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent)] text-[#0a0a0a] text-sm font-bold glow-neon hover:bg-[var(--accent-soft)] transition-colors"
            >
              <SocialIcon id="tiktok" size={16} />
              TikTok
              <ArrowUpRight size={15} />
            </a>
            <a
              href="https://www.instagram.com/0xcopa"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("social_follow_click", { channel: "instagram", location: "reels" })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-sm font-bold text-[#dfe4ea] hover:text-white hover:border-white/20 transition-colors"
            >
              <SocialIcon id="instagram" size={16} />
              Instagram
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
