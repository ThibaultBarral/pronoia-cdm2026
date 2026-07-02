import Link from "next/link";
import { Gauge, Sparkles, TrendingUp, Goal, Users, Star } from "lucide-react";
import { type Confidence, type MatchAnalysisData } from "@/lib/analysis-schema";

export const CONFIDENCE_FILL: Record<Confidence, number> = {
  "Faible": 35,
  "Moyen": 55,
  "Élevé": 78,
  "Très élevé": 92,
};

export function ProbRow({ label, pct, accent }: { label: string; pct: number; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#c0c0c0]">{label}</span>
        <span className={`font-black tabular-nums ${accent ? "text-[var(--accent)]" : "text-[#c0c0c0]"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: accent ? "var(--accent)" : "#6b7280" }}
        />
      </div>
    </div>
  );
}

function CompareRow({ label, home, away }: { label: string; home: number; away: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-[var(--accent)] font-bold tabular-nums">{home}%</span>
        <span className="text-[var(--text-muted)] uppercase tracking-wide font-bold">{label}</span>
        <span className="text-[#ef4444] font-bold tabular-nums">{away}%</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06]">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${home}%` }} />
        <div className="h-full bg-[#ef4444]" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

/**
 * Inline upsell shown to Essential members in place of a Premium-only block
 * (probable scorers, key players).
 */
function PremiumUpsell({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Link
      href="/dashboard/pricing"
      className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.05] p-4 hover:bg-[var(--accent)]/[0.09] transition-colors"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/12 shrink-0">
        <Sparkles size={15} className="text-[var(--accent)]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[#f0f0f0]">{title}</div>
        <div className="text-xs text-[var(--text-muted)]">{subtitle}</div>
      </div>
      <span className="text-[var(--accent)] text-sm font-bold shrink-0">Premium →</span>
    </Link>
  );
}

/** A team's identity as used by the analysis result (name + short name). */
interface TeamLite {
  name: string;
  shortName: string;
}

/**
 * The full match-analysis result UI (predictions only — no betting).
 * Shared between the live analysis (ai-analysis.tsx) and the demo preview so
 * the design stays in one place.
 */
export default function AnalysisResult({
  data,
  home: h,
  away: a,
  canPlayers,
}: {
  data: MatchAnalysisData;
  home: TeamLite;
  away: TeamLite;
  canPlayers: boolean;
}) {
  const probs = [
    { label: `Victoire ${h.shortName}`, pct: data.probabilities.home },
    { label: "Match nul", pct: data.probabilities.draw },
    { label: `Victoire ${a.shortName}`, pct: data.probabilities.away },
  ];
  const fav = probs.reduce((m, p) => (p.pct > m.pct ? p : m), probs[0]);
  const conf = CONFIDENCE_FILL[data.confidence] ?? 55;

  return (
    <>
      {/* Summary */}
      <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.summary}</p>

      {/* Hero — big headline numbers (favorite win % + AI confidence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl glass p-5 text-center">
          <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1.5 truncate">
            {fav.label}
          </div>
          <div className="text-6xl font-black text-[var(--accent)] tabular-nums leading-none">
            {fav.pct}
            <span className="text-3xl align-top">%</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-2.5">Scénario le plus probable</div>
        </div>
        <div className="rounded-2xl glass p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            <Gauge size={12} /> Confiance IA
          </div>
          <div className="text-6xl font-black text-[#f0f0f0] tabular-nums leading-none">
            {conf}
            <span className="text-3xl align-top">%</span>
          </div>
          <div className="text-[10px] text-[var(--accent)] font-bold mt-2.5">{data.confidence}</div>
        </div>
      </div>

      {/* Probabilities */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Probabilités exactes
        </h3>
        <div className="space-y-2.5">
          <ProbRow label={`Victoire ${h.name}`} pct={data.probabilities.home} accent />
          <ProbRow label="Match nul" pct={data.probabilities.draw} />
          <ProbRow label={`Victoire ${a.name}`} pct={data.probabilities.away} />
        </div>
      </div>

      {/* Scenario */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Scénario probable
        </h3>
        <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.scenario}</p>
      </div>

      {/* Secondary scenarios */}
      {data.secondaryScenarios.length > 0 && (
        <div className="space-y-2">
          {data.secondaryScenarios.map((s, i) => (
            <div key={i} className="rounded-xl glass p-3.5">
              <div className="text-sm font-bold text-[#f0f0f0]">{s.title}</div>
              <p className="text-xs text-[#999] mt-1 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Key strengths */}
      {data.keyStrengths.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.keyStrengths.map((ks, i) => (
            <div key={i} className="rounded-xl glass p-3.5">
              <div className="text-xs font-black text-[var(--accent)] mb-1.5">
                {ks.team === "home" ? h.name : a.name}
              </div>
              <ul className="space-y-1">
                {ks.points.map((p, j) => (
                  <li key={j} className="text-xs text-[#c0c0c0] flex gap-1.5">
                    <span className="text-[var(--accent)]">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Factors */}
      {data.factors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.factors.map((f, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              style={
                f.kind === "pos"
                  ? { color: "var(--accent)", borderColor: "rgba(22,193,114,0.3)", background: "rgba(22,193,114,0.08)" }
                  : f.kind === "neg"
                    ? { color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }
                    : { color: "#9aa3af", borderColor: "rgba(154,163,175,0.25)", background: "rgba(154,163,175,0.06)" }
              }
            >
              {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Essential : buteurs/joueurs réservés à Premium */}
      {!canPlayers && (
        <PremiumUpsell
          title="Buteurs probables & joueurs clés"
          subtitle="Le 1er buteur, les buteurs probables et les joueurs à suivre"
        />
      )}

      {/* Buteurs probables & 1er buteur — depuis l'effectif réel */}
      {canPlayers && data.probableScorers && data.probableScorers.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <Goal size={13} className="text-[var(--accent)]" /> Buteurs probables
          </h3>
          {data.firstScorer && (
            <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.06] px-3.5 py-2.5">
              <Star size={14} className="text-[var(--accent)] shrink-0" />
              <span className="text-xs text-[#c0c0c0]">
                1<sup>er</sup> buteur le plus probable&nbsp;:{" "}
                <span className="font-black text-[#f0f0f0]">{data.firstScorer}</span>
              </span>
            </div>
          )}
          <div className="space-y-2">
            {data.probableScorers.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl glass p-3.5">
                <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--accent)]/12 shrink-0">
                  <Goal size={12} className="text-[var(--accent)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#f0f0f0]">
                    {s.name}{" "}
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      · {s.team === "home" ? h.shortName : a.shortName}
                    </span>
                  </div>
                  <p className="text-xs text-[#999] mt-0.5 leading-relaxed">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joueurs clés à suivre — depuis l'effectif réel */}
      {canPlayers && data.keyPlayers && data.keyPlayers.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <Users size={13} className="text-[var(--accent)]" /> Joueurs clés à suivre
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.keyPlayers.map((p, i) => (
              <div key={i} className="rounded-xl glass p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#f0f0f0]">{p.name}</span>
                  <span className="ml-auto text-[10px] font-semibold text-[var(--text-muted)]">
                    {p.team === "home" ? h.shortName : a.shortName}
                  </span>
                </div>
                {p.role && (
                  <div className="text-[10px] font-semibold text-[var(--accent)] mt-0.5">{p.role}</div>
                )}
                <p className="text-xs text-[#999] mt-1 leading-relaxed">{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prédiction Gold — xG, marchés, comparaison des forces */}
      <div className="rounded-2xl p-4 space-y-5 border border-[#ffd700]/25 bg-gradient-to-b from-[#ffd700]/[0.06] to-transparent">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#ffd700]/15 shrink-0">
            <Sparkles size={13} className="text-[#ffd700]" />
          </span>
          <span className="text-xs font-black uppercase tracking-wide text-[#ffd700]">Prédiction Gold</span>
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">xG · marchés · forces</span>
        </div>

        {/* Comparison */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-[var(--accent)]">{h.name}</span>
            <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
              <TrendingUp size={12} className="inline mr-1" />Comparaison
            </span>
            <span className="text-xs font-black text-[#ef4444]">{a.name}</span>
          </div>
          <div className="space-y-2.5">
            {data.comparison.map((c) => (
              <CompareRow key={c.label} label={c.label} home={c.home} away={c.away} />
            ))}
          </div>
        </div>

        {/* Expected goals & markets — big headline numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl glass p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">{data.expectedGoals.home}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-2">Buts {h.shortName}</div>
          </div>
          <div className="rounded-xl glass p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">{data.expectedGoals.away}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-2">Buts {a.shortName}</div>
          </div>
          <div className="rounded-xl glass p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">
              {data.markets.over25}<span className="text-xl align-top">%</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2">+2.5 buts</div>
          </div>
          <div className="rounded-xl glass p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">
              {data.markets.bttsYes}<span className="text-xl align-top">%</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2">Les 2 marquent</div>
          </div>
        </div>
      </div>
    </>
  );
}
