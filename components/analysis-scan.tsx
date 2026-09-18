"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Activity } from "lucide-react";
import type { Match, Team } from "@/lib/types";

/**
 * "Analysis in progress" sequence played for non-members when a match page
 * opens: a technical log of what the model is actually reading, built from the
 * REAL data on the Match (form, squads, H2H, table, xG). Purely cosmetic (the
 * numbers are already there), it exists so the short read feels earned rather
 * than instant, and so the visitor sees how much goes into the paid analysis.
 *
 * Runs ~7.5 s (Thibault wants it to feel like it really goes and fetches the
 * data, between 5 and 10 s), then calls `onDone`. It plays once per match per
 * tab.
 */

interface ScanLine {
  /** Left column, the operation. */
  label: string;
  /** Right column, the figure it produced. */
  value: string;
}

function formStats(t: Team) {
  const f = t.recentForm?.slice(0, 5) ?? [];
  const w = f.filter((r) => r.result === "W").length;
  const d = f.filter((r) => r.result === "D").length;
  const l = f.length - w - d;
  const gf = f.reduce((acc, r) => acc + (parseInt(r.score.split("-")[0], 10) || 0), 0);
  const ga = f.reduce((acc, r) => acc + (parseInt(r.score.split("-")[1], 10) || 0), 0);
  return { n: f.length, w, d, l, gf, ga };
}

function buildLines(match: Match): ScanLine[] {
  const h = match.homeTeam;
  const a = match.awayTeam;
  const fh = formStats(h);
  const fa = formStats(a);
  const squad = (h.lineup?.players?.length ?? 0) + (a.lineup?.players?.length ?? 0);
  const h2h = match.h2h?.length ?? 0;
  const lines: ScanLine[] = [];

  lines.push({ label: "Connexion aux données du match", value: `${match.competition?.shortName ?? "—"} · ${match.round}` });
  lines.push({ label: "Matchs de la saison chargés", value: `${(h.recentForm?.length ?? 0) + (a.recentForm?.length ?? 0)} résultats` });
  if (fh.n) lines.push({ label: `Forme ${h.name}`, value: `${fh.w}V ${fh.d}N ${fh.l}D · ${fh.gf} buts / ${fh.ga} encaissés` });
  if (fa.n) lines.push({ label: `Forme ${a.name}`, value: `${fa.w}V ${fa.d}N ${fa.l}D · ${fa.gf} buts / ${fa.ga} encaissés` });
  if (h.leagueRank && a.leagueRank) lines.push({ label: "Classement en championnat", value: `${h.leagueRank}e vs ${a.leagueRank}e` });
  if (h.rating && a.rating) lines.push({ label: "Indice de force (Elo)", value: `${Math.round(h.rating)} vs ${Math.round(a.rating)}` });
  if (h2h) lines.push({ label: "Confrontations directes", value: `${h2h} match${h2h > 1 ? "s" : ""} récent${h2h > 1 ? "s" : ""}` });
  if (squad) lines.push({ label: "Effectifs et compositions", value: `${squad} joueurs · ${h.lineup?.formation ?? "?"} / ${a.lineup?.formation ?? "?"}` });
  const abs = (h.injuries?.length ?? 0) + (h.suspensions?.length ?? 0) + (a.injuries?.length ?? 0) + (a.suspensions?.length ?? 0);
  lines.push({ label: "Absents et suspendus", value: abs ? `${abs} joueur${abs > 1 ? "s" : ""} indisponible${abs > 1 ? "s" : ""}` : "aucun signalé" });
  if (h.stats?.xGFor || a.stats?.xGFor) {
    lines.push({ label: "Buts attendus (xG) par match", value: `${(h.stats.xGFor ?? 0).toFixed(2)} vs ${(a.stats.xGFor ?? 0).toFixed(2)}` });
  }
  const contributors = (h.recentContributors?.length ?? 0) + (a.recentContributors?.length ?? 0);
  lines.push({ label: "Statistiques joueurs", value: `${contributors || squad || "—"} profils` });
  if (match.market) {
    lines.push({
      label: "Consensus du marché",
      value: `${match.market.operators} opérateur${match.market.operators > 1 ? "s" : ""} · accord ${match.market.agreement}`,
    });
  }
  if (match.market?.movement) {
    lines.push({ label: "Mouvement de la ligne", value: `${match.market.movement.days} jour${match.market.movement.days > 1 ? "s" : ""} suivis` });
  }
  if (match.apiPrediction) lines.push({ label: "Second avis (modèle indépendant)", value: "reçu" });
  lines.push({ label: "Simulation du match", value: "10 000 itérations" });
  lines.push({ label: "Probabilités et buts attendus", value: "calculés" });
  lines.push({ label: "Revue de presse", value: "sources croisées" });
  lines.push({ label: "Lecture du modèle", value: "prête" });
  return lines;
}

export default function AnalysisScan({ match, onDone }: { match: Match; onDone: () => void }) {
  const lines = useMemo(() => buildLines(match), [match]);
  const [shown, setShown] = useState(0);
  // Total ≈ 7.5 s regardless of how many lines the match has.
  const stepMs = Math.max(400, Math.min(800, Math.round(7000 / lines.length)));

  useEffect(() => {
    if (shown >= lines.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), stepMs);
    return () => clearTimeout(t);
  }, [shown, lines.length, stepMs, onDone]);

  const pct = Math.round((shown / lines.length) * 100);

  return (
    <div className="rounded-xl glass p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[var(--accent-soft)]">
          <Activity size={13} className="animate-pulse" /> Analyse en cours
        </span>
        <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent-soft)]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <ul className="space-y-1.5 font-mono text-[12px] leading-relaxed">
        <AnimatePresence initial={false}>
          {lines.slice(0, shown + 1).map((l, i) => {
            const done = i < shown;
            return (
              <motion.li
                key={l.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2"
              >
                <span className="mt-[3px] w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                  {done ? (
                    <Check size={12} strokeWidth={3} className="text-[var(--accent)]" />
                  ) : (
                    <Loader2 size={12} className="text-[var(--accent-soft)] animate-spin" />
                  )}
                </span>
                <span className={`min-w-0 flex-1 ${done ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                  {l.label}
                </span>
                <span
                  className={`shrink-0 tabular-nums text-right ${
                    done ? "text-[#c3cbe3]" : "text-[var(--text-muted)]/60"
                  }`}
                >
                  {done ? l.value : "…"}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
