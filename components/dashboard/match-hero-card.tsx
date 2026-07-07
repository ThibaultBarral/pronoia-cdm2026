"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Match } from "@/lib/types";
import { getMatchPreview, type MatchPreview } from "@/actions/match-preview";
import Countdown from "./countdown";
import FlagTile from "./flag-tile";

interface MatchHeroCardProps {
  match: Match;
  isFavorite: boolean;
}

export default function MatchHeroCard({ match, isFavorite }: MatchHeroCardProps) {
  const [preview, setPreview] = useState<MatchPreview | null>(null);

  useEffect(() => {
    let active = true;
    getMatchPreview(match).then((p) => {
      if (active) setPreview(p);
    });
    return () => {
      active = false;
    };
  }, [match]);

  const d = new Date(match.date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const live = match.status === "1H" || match.status === "2H" || match.status === "HT";
  const kickoffMs = new Date(match.date + "T" + match.time + ":00").getTime();
  const started = kickoffMs <= Date.now();

  const favoritePct =
    preview &&
    (preview.favorite === "home"
      ? preview.probabilities.home
      : preview.favorite === "away"
        ? preview.probabilities.away
        : preview.probabilities.draw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl glass border border-[var(--accent)]/15 p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
          {isFavorite ? "Ton équipe joue" : "Prochain match"}
        </span>
        {isFavorite && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ff5c8a]">
            <Heart size={13} className="fill-current" />
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 md:gap-12 mb-5">
        <div className="flex flex-col items-center gap-2.5 flex-1">
          <FlagTile flag={match.homeTeam.flag} size="lg" />
          <span className="text-sm md:text-base font-bold text-[#e8e8e8] text-center">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-xs font-bold text-[#666]">VS</span>
          {live ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-black text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Live
            </span>
          ) : !started ? (
            <Countdown
              date={match.date}
              time={match.time}
              className="text-lg font-black text-[var(--accent)] tabular-nums text-glow-neon"
            />
          ) : (
            <span className="text-sm font-bold text-[#888]">{match.time}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2.5 flex-1">
          <FlagTile flag={match.awayTeam.flag} size="lg" />
          <span className="text-sm md:text-base font-bold text-[#e8e8e8] text-center">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-[#777] mb-5 capitalize">
        {dateLabel} · {match.time}
      </p>

      {preview && favoritePct != null && (
        <div className="mb-5">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${favoritePct}%` }}
            />
          </div>
          <p className="text-center text-[11px] text-[#666] mt-2">
            Notre modèle donne{" "}
            <span className="text-[var(--accent)] font-semibold">
              {favoritePct}% à{" "}
              {preview.favorite === "home"
                ? match.homeTeam.shortName
                : preview.favorite === "away"
                  ? match.awayTeam.shortName
                  : "un nul"}
            </span>
          </p>
        </div>
      )}

      <Link
        href={`/match/${match.id}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[var(--accent)] text-[#06231a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all hover:scale-[1.01]"
      >
        <Sparkles size={16} />
        Analyser le match
      </Link>
    </motion.div>
  );
}
