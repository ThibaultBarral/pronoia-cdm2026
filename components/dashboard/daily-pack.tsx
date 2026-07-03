"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Crown, Target, Moon, ChevronDown } from "lucide-react";
import { openDailyPack, getDailyStatus, type PackReward } from "@/actions/daily-pack";

type Phase = "loading" | "ready" | "opening" | "revealed" | "done";

// Published odds — must match the REWARDS weights in actions/daily-pack.ts.
const ODDS_FREE: { label: string; pct: string }[] = [
  { label: "Rien (reviens demain)", pct: "55 %" },
  { label: "+1 analyse gratuite", pct: "32 %" },
  { label: "+2 analyses gratuites", pct: "10 %" },
  { label: "24h Pro offert", pct: "2 %" },
  { label: "Jackpot — 1 semaine Pro", pct: "1 %" },
];
const ODDS_PAID: { label: string; pct: string }[] = [
  { label: "Rien (reviens demain)", pct: "45 %" },
  { label: "+3 jours d'abonnement offerts", pct: "35 %" },
  { label: "+7 jours d'abonnement offerts", pct: "15 %" },
  { label: "Jackpot — 1 mois offert", pct: "5 %" },
];

function rewardVisual(r: PackReward) {
  if (r.accessDays > 0) return { Icon: Crown, color: "#ffd700", big: r.label };
  if (r.credits > 0) return { Icon: Target, color: "var(--accent)", big: r.label };
  return { Icon: Moon, color: "var(--text-muted)", big: "Pas de gain aujourd'hui" };
}

export default function DailyPack() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [reward, setReward] = useState<PackReward | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const odds = isPaid ? ODDS_PAID : ODDS_FREE;

  useEffect(() => {
    getDailyStatus()
      .then((s) => {
        setCredits(s.bonusCredits);
        setIsPaid(s.isPaid);
        setPhase(s.packOpenedToday ? "done" : "ready");
      })
      .catch(() => setPhase("ready"));
  }, []);

  async function open() {
    setPhase("opening");
    const res = await openDailyPack();
    if (!res.ok) {
      setPhase("ready");
      return;
    }
    if (res.alreadyOpened) {
      setPhase("done");
      return;
    }
    // Small suspense before the reveal.
    setTimeout(() => {
      setReward(res.reward);
      setCredits((c) => c + res.reward.credits);
      setPhase("revealed");
      // Propagate a jackpot's temporary Pro access to the rest of the app.
      if (res.reward.accessDays > 0) router.refresh();
    }, 700);
  }

  if (phase === "loading") return null;

  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-[var(--accent)]" />
          <h3 className="text-base font-black text-[var(--text)]">Ta pochette du jour</h3>
        </div>
        {!isPaid && credits > 0 && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            {credits} analyse{credits > 1 ? "s" : ""} bonus
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center py-3">
        <AnimatePresence mode="wait">
          {(phase === "ready" || phase === "opening") && (
            <motion.div
              key="pack"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                phase === "opening"
                  ? { opacity: 1, scale: [1, 1.05, 0.96, 1.05], rotate: [0, -3, 3, -2, 0] }
                  : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 0.8 }}
              transition={phase === "opening" ? { duration: 0.7 } : { duration: 0.3 }}
              className="w-28 h-36 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(150deg, var(--accent-strong), #0b3d33)",
                border: "1px solid rgba(var(--accent-rgb),0.5)",
              }}
            >
              <Sparkles size={34} className="text-white/90" />
            </motion.div>
          )}

          {phase === "revealed" && reward && (
            <motion.div
              key="reward"
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex flex-col items-center mb-4"
            >
              {(() => {
                const v = rewardVisual(reward);
                return (
                  <>
                    <span
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <v.Icon size={30} style={{ color: v.color }} />
                    </span>
                    <p className="text-lg font-black" style={{ color: v.color }}>{v.big}</p>
                  </>
                );
              })()}
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-28 h-36 rounded-2xl flex items-center justify-center mb-4 opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
            >
              <Moon size={30} className="text-[var(--text-muted)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "ready" && (
          <button
            onClick={open}
            className="w-full max-w-xs rounded-xl py-3.5 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02] active:scale-100"
            style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
          >
            Ouvre ta pochette
          </button>
        )}
        {phase === "opening" && (
          <p className="text-sm text-[var(--text-muted)]">Ouverture…</p>
        )}
        {(phase === "revealed" || phase === "done") && (
          <p className="text-xs text-[var(--text-muted)]">Reviens demain pour ta prochaine pochette.</p>
        )}
      </div>

      {/* Disclosed odds — honesty, and legally clean (free credits, not money). */}
      <button
        onClick={() => setShowOdds((s) => !s)}
        className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mx-auto"
      >
        Voir les probabilités
        <ChevronDown size={12} className={showOdds ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {showOdds && (
        <ul className="mt-2 space-y-1 max-w-xs mx-auto">
          {odds.map((o) => (
            <li key={o.label} className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>{o.label}</span>
              <span className="tabular-nums font-medium text-[#cdd3db]">{o.pct}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
