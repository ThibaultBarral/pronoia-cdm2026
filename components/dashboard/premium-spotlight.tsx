"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Lock, Sparkles, Timer, ArrowRight } from "lucide-react";
import type { Match, Odds } from "@/lib/types";
import { useSubscription } from "@/lib/use-subscription";

function datetime(m: Match): number {
  return new Date(`${m.date}T${m.time || "00:00"}`).getTime();
}

/**
 * Fair (margin-adjusted) implied probabilities from real bookmaker odds.
 * Removing the over-round gives the closest estimate to the true probabilities.
 */
function fairProbs(o: Odds): { home: number; draw: number; away: number } {
  const ih = 1 / o.home, id = 1 / o.draw, ia = 1 / o.away;
  const s = ih + id + ia;
  return { home: ih / s, draw: id / s, away: ia / s };
}

/** Real favourite-to-win pick from odds. Null when odds are missing. */
function favourite(m: Match): { team: string; prob: number } | null {
  const o = m.odds?.[0];
  if (!o || !o.home || !o.draw || !o.away) return null;
  const p = fairProbs(o);
  return p.home >= p.away
    ? { team: m.homeTeam.shortName, prob: Math.round(p.home * 100) }
    : { team: m.awayTeam.shortName, prob: Math.round(p.away * 100) };
}

function useCountdown(target: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return "—";
  const ms = target - now;
  if (ms <= 0) return "En cours";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function PremiumSpotlight({ matches }: { matches: Match[] }) {
  const sub = useSubscription();
  const access = sub?.access ?? false;

  // World Cup opening = earliest scheduled match in the real dataset.
  const opening = matches.length
    ? matches.reduce((a, b) => (datetime(a) <= datetime(b) ? a : b))
    : null;
  const countdown = useCountdown(opening ? datetime(opening) : null);

  // Next matches to follow.
  const top3 = matches
    .filter((m) => (m.status ?? "NS") === "NS" && datetime(m) > Date.now() - 2 * 3600_000)
    .sort((a, b) => datetime(a) - datetime(b))
    .slice(0, 3);

  if (!opening) return null;

  return (
    <section className="space-y-3">
      {/* Hero — World Cup opening countdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-neon p-5 md:p-6"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
              <Timer size={12} /> Ouverture de la Coupe du Monde 2026
            </span>
            <div className="mt-1.5 flex items-center gap-2 text-[#f0f0f0]">
              <span className="text-lg">{opening.homeTeam.flag}</span>
              <span className="font-bold text-sm">{opening.homeTeam.shortName}</span>
              <span className="text-[#555] text-xs">vs</span>
              <span className="font-bold text-sm">{opening.awayTeam.shortName}</span>
              <span className="text-lg">{opening.awayTeam.flag}</span>
              <span className="text-[10px] text-[#555] ml-1">
                {new Date(`${opening.date}T${opening.time || "00:00"}`).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long",
                })}
              </span>
            </div>
            <div className="mt-2 text-3xl md:text-4xl font-black tabular-nums text-[var(--accent)] text-glow-neon">
              {countdown}
            </div>
          </div>

          {!access ? (
            <Link
              href="/dashboard/pricing"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-5 py-3 text-sm glow-neon hover:bg-[var(--accent-strong)] transition-all hover:scale-105"
            >
              <Sparkles size={15} /> Passer Premium
            </Link>
          ) : (
            <Link
              href={`/match/${opening.id}`}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 font-bold px-5 py-3 text-sm hover:bg-[var(--accent)]/20 transition-all"
            >
              Voir l&apos;analyse <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </motion.div>

      {top3.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-0.5">
            <Flame size={14} className="text-[var(--accent)]" />
            <h3 className="text-xs font-black uppercase tracking-wide text-[#888]">
              Prochains matchs à suivre
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((m, i) => {
              const fav = favourite(m);
              const o = m.odds?.[0];
              const d = new Date(`${m.date}T${m.time || "00:00"}`);
              const when =
                d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
                (m.time ? ` · ${m.time}` : "");

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  className="rounded-2xl glass p-4 flex flex-col"
                >
                  {/* Teams */}
                  <div className="flex items-center gap-1.5 min-w-0 mb-1">
                    <span>{m.homeTeam.flag}</span>
                    <span className="text-sm font-bold text-[#f0f0f0] truncate">{m.homeTeam.shortName}</span>
                    <span className="text-[#555] text-[10px]">vs</span>
                    <span className="text-sm font-bold text-[#f0f0f0] truncate">{m.awayTeam.shortName}</span>
                    <span>{m.awayTeam.flag}</span>
                  </div>
                  <div className="text-[10px] text-[#555] mb-3">{when} · Groupe {m.group}</div>

                  {/* Real odds-based favourite probability */}
                  {fav ? (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#666]">
                          Favori : {fav.team}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--accent)]">{fav.prob}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${fav.prob}%`, background: "linear-gradient(90deg, var(--accent-strong), var(--accent-soft))" }}
                        />
                      </div>
                      <div className="text-[9px] text-[#444] mt-1">Probabilité implicite (cotes, marge ajustée)</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#555] mb-3">Cotes bientôt disponibles</div>
                  )}

                  {/* Real bookmaker odds 1·N·2 */}
                  {o && (
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {([["1", o.home], ["N", o.draw], ["2", o.away]] as const).map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-white/[0.03] border border-white/5 py-1.5 text-center">
                          <div className="text-[9px] text-[#555]">{k}</div>
                          <div className="text-xs font-bold text-[#d0d0d0] tabular-nums">{v.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Locked AI analysis teaser */}
                  <div className="relative mb-3">
                    <div className={`text-xs text-[#c0c0c0] ${access ? "" : "blur-[5px] select-none"}`}>
                      Value bets & recommandation de pari par l&apos;IA
                    </div>
                    {!access && <Lock size={12} className="absolute right-0 top-0.5 text-[#666]" />}
                  </div>

                  {/* CTA */}
                  {access ? (
                    <Link
                      href={`/match/${m.id}`}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25 text-xs font-bold py-2 hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      Voir l&apos;analyse <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/pricing"
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] text-[#06231a] text-xs font-bold py-2 hover:bg-[var(--accent-strong)] transition-colors"
                    >
                      <Lock size={12} /> Débloquer l&apos;analyse
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
