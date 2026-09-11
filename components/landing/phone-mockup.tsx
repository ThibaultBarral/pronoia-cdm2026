"use client";

import { motion } from "framer-motion";
import { Activity, Sparkles, Users } from "lucide-react";

export interface PhoneMockupProps {
  homeFlag?: string;
  homeName?: string;
  awayFlag?: string;
  awayName?: string;
  /** Competition label shown in the top bar ("Ligue 1", "Ligue des Champions"…). */
  competition?: string;
  /** Illustrative 1X2 probabilities (sum ~100). */
  probHome?: number;
  probDraw?: number;
  probAway?: number;
  /** Expected goals shown in the stat row. */
  xgHome?: number;
  xgAway?: number;
  /** Recent form, most recent last (W/D/L). */
  formHome?: string;
  formAway?: string;
  /** True when the numbers are an illustration, not a live fixture. */
  illustrative?: boolean;
}

const FORM_COLOR: Record<string, string> = {
  W: "var(--accent)",
  D: "rgba(var(--star-rgb),0.35)",
  L: "#ef4444",
};

function FormDots({ form }: { form: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {form.split("").map((r, i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: FORM_COLOR[r] ?? FORM_COLOR.D }}
        />
      ))}
    </span>
  );
}

/**
 * A pure-CSS iPhone frame showing a faithful, lightweight replica of the app's
 * match read (form, 1X2 probabilities, expected goals, players to watch).
 * No screenshot → never goes stale, themes with the brand tokens, fully
 * responsive. Nothing about odds, stakes or money.
 */
export default function PhoneMockup({
  homeFlag = "🔵",
  homeName = "Paris",
  awayFlag = "🔴",
  awayName = "Marseille",
  competition = "Ligue 1",
  probHome = 58,
  probDraw = 23,
  probAway = 19,
  xgHome = 2.1,
  xgAway = 0.9,
  formHome = "WWDWW",
  formAway = "LWDLW",
  illustrative = true,
}: PhoneMockupProps) {
  const probs = [
    { label: homeName, pct: probHome, accent: probHome >= probAway && probHome >= probDraw },
    { label: "Match nul", pct: probDraw, accent: probDraw > probHome && probDraw > probAway },
    { label: awayName, pct: probAway, accent: probAway > probHome && probAway >= probDraw },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Floating crests */}
      <motion.div
        aria-hidden
        className="absolute -left-6 top-16 z-20 w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-lg"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {homeFlag}
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute -right-5 bottom-28 z-20 w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-lg"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {awayFlag}
      </motion.div>

      {/* Glow behind the device */}
      <div className="absolute inset-0 -z-10 blur-3xl bg-[var(--accent)]/20 rounded-full scale-90" />

      {/* Device frame */}
      <div className="relative rounded-[2.8rem] border border-white/10 bg-[#03061a] p-2.5 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-[var(--bg)] aspect-[9/19.3]">
          {/* Dynamic island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-20 h-5 rounded-full bg-black" />

          {/* App content */}
          <div className="absolute inset-0 flex flex-col px-3.5 pt-9 pb-4 text-left">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] text-[var(--text-muted)]">‹ Retour</span>
              <span className="text-[10px] font-bold text-[var(--text)]">
                {homeFlag} vs {awayFlag}
              </span>
              <span className="text-[8px] text-[var(--accent-soft)] border border-[var(--accent)]/40 rounded px-1 py-0.5 truncate max-w-[70px]">
                {competition}
              </span>
            </div>

            {/* Form row */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-[var(--accent-soft)] mb-2">
                <Activity size={9} /> Forme · 5 derniers
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#c3cbe3] truncate">{homeName}</span>
                  <FormDots form={formHome} />
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#c3cbe3] truncate">{awayName}</span>
                  <FormDots form={formAway} />
                </div>
              </div>
            </div>

            {/* Read card */}
            <div className="mt-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-[var(--accent-soft)]">
                  <Sparkles size={9} /> Lecture du match
                </span>
                {illustrative && (
                  <span className="text-[7px] text-[var(--text-muted)] border border-white/10 rounded-full px-1.5 py-0.5">
                    Exemple
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {probs.map((p) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className="text-[#c3cbe3] truncate">{p.label}</span>
                      <span
                        className={`font-black tabular-nums ${
                          p.accent ? "text-[var(--accent-soft)]" : "text-[#c3cbe3]"
                        }`}
                      >
                        {p.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pct}%`,
                          background: p.accent ? "var(--accent)" : "rgba(var(--star-rgb),0.25)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Expected goals */}
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {[
                  { v: xgHome.toFixed(1), l: `Buts attendus ${homeName.slice(0, 3).toUpperCase()}` },
                  { v: xgAway.toFixed(1), l: `Buts attendus ${awayName.slice(0, 3).toUpperCase()}` },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.04] py-1.5 text-center">
                    <div className="text-[12px] font-black text-[var(--text)] tabular-nums">{s.v}</div>
                    <div className="text-[7px] text-[var(--text-muted)] truncate px-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Players to watch */}
            <div className="mt-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-[var(--accent-soft)] mb-2">
                <Users size={9} /> À suivre
              </div>
              <div className="space-y-1.5">
                {[
                  "Le buteur en forme côté domicile",
                  "L'absent qui pèse sur la défense",
                  "Le milieu qui fait tourner l'équipe",
                ].map((label) => (
                  <div key={label} className="flex items-center gap-2 text-[9px] text-[#aab1c8]">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-auto">
              <div
                className="w-full rounded-xl py-2.5 text-center text-[10px] font-black text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent))" }}
              >
                Lire l&apos;analyse complète →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
