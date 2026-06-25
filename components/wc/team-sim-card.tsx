import { Trophy, Target, Goal } from "lucide-react";
import type { Team } from "@/lib/types";
import type { TeamSimResult } from "@/lib/simulation";
import FeatureGate from "@/components/feature-gate";

const RESULT_STYLE: Record<string, { bg: string; fg: string }> = {
  W: { bg: "var(--accent)", fg: "#06231a" },
  D: { bg: "#9aa3af", fg: "#0a0a0a" },
  L: { bg: "#ef4444", fg: "#fff" },
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl glass p-3 text-center">
      <div className="text-lg font-black text-[var(--text)] tabular-nums">{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

function StageBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-[var(--text-muted)] uppercase tracking-wide font-bold">{label}</span>
        <span className="text-[var(--accent)] font-black tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function TeamSimCard({
  team,
  sim,
}: {
  team: Team;
  sim: TeamSimResult | null;
}) {
  // Form stats derived from real recent results (up to 10).
  const form = team.recentForm.slice(0, 10);
  const played = form.length;
  const wins = form.filter((f) => f.result === "W").length;
  const draws = form.filter((f) => f.result === "D").length;
  const losses = form.filter((f) => f.result === "L").length;
  let gf = 0;
  let ga = 0;
  let cs = 0;
  for (const f of form) {
    const [a, b] = f.score.split("-").map((n) => parseInt(n, 10) || 0);
    gf += a;
    ga += b;
    if (b === 0) cs += 1;
  }
  const last5 = form.slice(0, 5).reverse();

  return (
    <section className="rounded-2xl glass overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <div className="font-semibold text-[#f0f0f0] text-sm">Nos prédictions</div>
        <div className="text-[10px] text-[#555]">Selon notre simulation · à titre informatif</div>
      </div>

      <div className="p-5 space-y-5">
        <FeatureGate
          feature="simulator"
          label="Le scénario de parcours est réservé à Premium & Accès à vie"
        >
          {sim ? (
          <div className="space-y-5">
            {/* Headline predictions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl glass-neon p-3 text-center col-span-2 sm:col-span-1">
                <Trophy size={14} className="text-[var(--accent)] mx-auto mb-1" />
                <div className="text-lg font-black text-[var(--accent)]">{sim.title.toFixed(1)}%</div>
                <div className="text-[10px] text-[var(--text-muted)]">Victoire finale</div>
                <div className="text-[9px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                  simu {sim.modelTitle.toFixed(1)}% · marché {sim.marketTitle.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl glass p-3 text-center">
                <Target size={14} className="text-[var(--text-muted)] mx-auto mb-1" />
                <div className="text-sm font-black text-[var(--text)]">{sim.probableStage}</div>
                <div className="text-[10px] text-[var(--text-muted)]">Étape probable</div>
              </div>
              <div className="rounded-xl glass p-3 text-center">
                <Goal size={14} className="text-[var(--text-muted)] mx-auto mb-1" />
                <div className="text-lg font-black text-[var(--text)] tabular-nums">{sim.projGoals}</div>
                <div className="text-[10px] text-[var(--text-muted)]">Buts projetés</div>
              </div>
              {sim.probableScorer && (
                <div className="rounded-xl glass p-3 text-center">
                  <div className="text-sm font-black text-[var(--text)] truncate">
                    {sim.probableScorer.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    buteur probable · ~{sim.probableScorer.expectedGoals} buts
                  </div>
                </div>
              )}
            </div>

            {/* Run gauges */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                Scénario de parcours
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                <StageBar label="16es" pct={sim.reachR32} />
                <StageBar label="8es" pct={sim.reachR16} />
                <StageBar label="1/4" pct={sim.reachQF} />
                <StageBar label="1/2" pct={sim.reachSF} />
                <StageBar label="Finale" pct={sim.reachFinal} />
                <StageBar label="Titre" pct={sim.title} />
              </div>
            </div>
          </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Simulation non disponible pour cette équipe.</p>
          )}
        </FeatureGate>

        {/* Form stats */}
        {played > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                Statistiques de forme
              </span>
              <div className="flex items-center gap-1">
                {last5.map((f, i) => {
                  const s = RESULT_STYLE[f.result] ?? RESULT_STYLE.D;
                  return (
                    <span
                      key={i}
                      className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {f.result}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Stat label="Joués" value={played} />
              <Stat label="V-N-D" value={`${wins}-${draws}-${losses}`} />
              <Stat label="Marqués" value={gf} />
              <Stat label="Encaissés" value={ga} />
              <Stat label="Clean sheets" value={cs} />
              <Stat label="#FIFA" value={team.fifaRanking || "—"} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
