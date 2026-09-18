import TeamCrest from "@/components/clubs/team-crest";
import Link from "next/link";
import { Gauge, Sparkles, TrendingUp, Goal, Users, Star, Flag, UserX, LayoutGrid, Swords, GitCompare, Shuffle, Newspaper, ExternalLink } from "lucide-react";
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

/** Section heading shared by the Gold v2 blocks. */
function H3({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
      <span className="text-[var(--accent)]">{icon}</span> {children}
      <span className="gold-tag ml-auto">Gold</span>
    </h3>
  );
}

const ABSENCE_KIND: Record<string, string> = { injury: "blessé", suspension: "suspendu", doubt: "incertain", other: "absent" };

const VERDICT_STYLE = {
  convergent: { color: "var(--accent)", label: "converge" },
  divergent: { color: "#ef4444", label: "diverge" },
  neutre: { color: "#9aa3af", label: "neutre" },
} as const;

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
 * Inline upsell shown to Mini members in place of a Pro-only block
 * (probable scorers, key players).
 */
function ProUpsell({ title, subtitle }: { title: string; subtitle: string }) {
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
      <span className="text-[var(--accent)] text-sm font-bold shrink-0">Pro →</span>
    </Link>
  );
}

/** A team's identity as used by the analysis result (name + short name + flag). */
interface TeamLite {
  name: string;
  shortName: string;
  flag: string;
  logo?: string;
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
    { flag: h.flag, logo: h.logo, label: `Victoire ${h.shortName}`, pct: data.probabilities.home },
    { flag: `${h.flag} ${a.flag}`.trim() || "🤝", logo: undefined, label: "Match nul", pct: data.probabilities.draw },
    { flag: a.flag, logo: a.logo, label: `Victoire ${a.shortName}`, pct: data.probabilities.away },
  ];
  const fav = probs.reduce((m, p) => (p.pct > m.pct ? p : m), probs[0]);
  const conf = CONFIDENCE_FILL[data.confidence] ?? 55;

  return (
    <>
      {/* Matchup — big flags, TikTok/Insta vibe */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex flex-col items-center gap-1">
          {h.logo ? <TeamCrest logo={h.logo} name={h.name} size={48} /> : <span className="text-4xl leading-none drop-shadow">{h.flag}</span>}
          <span className="text-[11px] font-black uppercase tracking-wide text-[var(--accent)]">{h.shortName}</span>
        </div>
        <span className="text-xs font-black text-[var(--text-muted)]">VS</span>
        <div className="flex flex-col items-center gap-1">
          {a.logo ? <TeamCrest logo={a.logo} name={a.name} size={48} /> : <span className="text-4xl leading-none drop-shadow">{a.flag}</span>}
          <span className="text-[11px] font-black uppercase tracking-wide text-[#ef4444]">{a.shortName}</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.summary}</p>

      {/* Hero — big headline numbers (favorite win % + AI confidence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl gold-card p-5 text-center">
          {fav.logo ? (
            <div className="flex justify-center mb-1.5"><TeamCrest logo={fav.logo} name={fav.label} size={36} /></div>
          ) : (
            <div className="text-3xl leading-none mb-1.5">{fav.flag}</div>
          )}
          <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1.5 truncate">
            {fav.label}
          </div>
          <div className="text-6xl font-black text-[var(--accent)] tabular-nums leading-none">
            {fav.pct}
            <span className="text-3xl align-top">%</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-2.5">Scénario le plus probable</div>
        </div>
        <div className="rounded-2xl gold-card p-5 text-center">
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
        <h3 className="flex items-center text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Probabilités exactes<span className="gold-tag ml-auto">Gold</span>
        </h3>
        <div className="space-y-2.5">
          <ProbRow label={`${h.flag} Victoire ${h.name}`} pct={data.probabilities.home} accent />
          <ProbRow label={`${h.flag} ${a.flag} Match nul`} pct={data.probabilities.draw} />
          <ProbRow label={`${a.flag} Victoire ${a.name}`} pct={data.probabilities.away} />
        </div>
      </div>

      {/* Scenario */}
      <div>
        <h3 className="flex items-center text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Scénario probable<span className="gold-tag ml-auto">Gold</span>
        </h3>
        <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.scenario}</p>
      </div>

      {/* Gold v2 — stakes */}
      {data.stakes && (
        <div>
          <H3 icon={<Flag size={13} />}>L&apos;enjeu</H3>
          <p className="text-sm text-[#d0d0d0] leading-relaxed">{data.stakes}</p>
        </div>
      )}

      {/* Gold v2 — absences & impact (real data + what it changes) */}
      {(data.absenceImpact?.length || data.absences?.length) ? (
        <div>
          <H3 icon={<UserX size={13} />}>Absents et impact</H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["home", "away"] as const).map((side) => {
              const t = side === "home" ? h : a;
              const list = (data.absences ?? []).filter((x) => x.team === side);
              const impact = data.absenceImpact?.find((x) => x.team === side)?.text;
              return (
                <div key={side} className="rounded-xl gold-card p-3.5">
                  <div className={`text-xs font-black mb-1.5 ${side === "home" ? "text-[var(--accent)]" : "text-[#ef4444]"}`}>
                    {t.flag} {t.name}
                  </div>
                  {list.length > 0 ? (
                    <ul className="space-y-1 mb-2">
                      {list.map((x, i) => (
                        <li key={i} className="text-xs text-[#c0c0c0] flex gap-1.5">
                          <span className="text-[#ef4444]">•</span>
                          <span>
                            <span className="font-semibold text-[#f0f0f0]">{x.name}</span>{" "}
                            <span className="text-[var(--text-muted)]">· {ABSENCE_KIND[x.kind] ?? x.kind}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-[var(--text-muted)] mb-2">Aucune absence connue</div>
                  )}
                  {impact && <p className="text-xs text-[#999] leading-relaxed">{impact}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Gold v2 — probable line-ups */}
      {data.probableLineups && data.probableLineups.length > 0 && (
        <div>
          <H3 icon={<LayoutGrid size={13} />}>Compos probables</H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.probableLineups.map((l, i) => {
              const t = l.team === "home" ? h : a;
              return (
                <div key={i} className="rounded-xl gold-card p-3.5">
                  <div className={`text-xs font-black mb-1 ${l.team === "home" ? "text-[var(--accent)]" : "text-[#ef4444]"}`}>
                    {t.flag} {t.name}
                  </div>
                  <p className="text-xs text-[#c0c0c0] leading-relaxed">{l.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gold v2 — key duels */}
      {data.keyDuels && data.keyDuels.length > 0 && (
        <div>
          <H3 icon={<Swords size={13} />}>Les duels qui décident</H3>
          <div className="space-y-2">
            {data.keyDuels.map((d, i) => (
              <div key={i} className="rounded-xl gold-card p-3.5">
                <div className="text-sm font-bold text-[#f0f0f0]">{d.title}</div>
                <p className="text-xs text-[#999] mt-1 leading-relaxed">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary scenarios */}
      {data.secondaryScenarios.length > 0 && (
        <div className="space-y-2">
          {data.secondaryScenarios.map((s, i) => (
            <div key={i} className="rounded-xl gold-card p-3.5">
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
            <div key={i} className="rounded-xl gold-card p-3.5">
              <div className="text-xs font-black text-[var(--accent)] mb-1.5">
                {ks.team === "home" ? `${h.flag} ${h.name}` : `${a.flag} ${a.name}`}
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

      {/* Gold v2 — cross-check between sources */}
      {data.signals && data.signals.length > 0 && (
        <div>
          <H3 icon={<GitCompare size={13} />}>Sources croisées</H3>
          <div className="space-y-2">
            {data.signals.map((sg, i) => {
              const v = VERDICT_STYLE[sg.verdict] ?? VERDICT_STYLE.neutre;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl gold-card p-3.5">
                  <span
                    className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border"
                    style={{ color: v.color, borderColor: v.color, opacity: 0.9 }}
                  >
                    {v.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#f0f0f0]">{sg.label}</div>
                    <p className="text-xs text-[#999] mt-0.5 leading-relaxed">{sg.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {data.market && (
            <p className="text-[11px] text-[var(--text-muted)] mt-2.5 leading-relaxed">
              Consensus du marché sur {data.market.operators} opérateur{data.market.operators > 1 ? "s" : ""} (accord {data.market.agreement}) :{" "}
              {h.shortName} {Math.round(data.market.implied.home)} % · nul {Math.round(data.market.implied.draw)} % · {a.shortName}{" "}
              {Math.round(data.market.implied.away)} %
              {data.market.movement && (
                <>
                  {" "}· sur {data.market.movement.days} jour{data.market.movement.days > 1 ? "s" : ""} : {h.shortName}{" "}
                  {data.market.movement.home > 0 ? "+" : ""}{data.market.movement.home} pt, {a.shortName}{" "}
                  {data.market.movement.away > 0 ? "+" : ""}{data.market.movement.away} pt
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Gold v2 — what would flip the read */}
      {data.swingFactors && data.swingFactors.length > 0 && (
        <div>
          <H3 icon={<Shuffle size={13} />}>Ce qui ferait basculer le match</H3>
          <ul className="space-y-1.5">
            {data.swingFactors.map((f, i) => (
              <li key={i} className="text-sm text-[#d0d0d0] flex gap-2 leading-relaxed">
                <span className="text-[var(--accent)] shrink-0">→</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gold v2 — press digest with sources (J-2 only) */}
      {data.press && (data.press.summary || data.press.items.length > 0) && (
        <div>
          <H3 icon={<Newspaper size={13} />}>Ce que dit la presse</H3>
          {data.press.summary && <p className="text-sm text-[#d0d0d0] leading-relaxed mb-2.5">{data.press.summary}</p>}
          {data.press.items.length > 0 && (
            <div className="space-y-2">
              {data.press.items.map((it, i) => (
                <a
                  key={i}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl gold-card p-3.5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      {it.source}{it.date ? ` · ${it.date}` : ""}
                    </div>
                    <div className="text-sm font-bold text-[#f0f0f0] mt-0.5">{it.title}</div>
                    <p className="text-xs text-[#999] mt-0.5 leading-relaxed">{it.takeaway}</p>
                  </div>
                  <ExternalLink size={13} className="shrink-0 mt-1 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                </a>
              ))}
            </div>
          )}
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Revue de presse du {new Date(data.press.searchedAt).toLocaleDateString("fr-FR")}, sources ouvertes dans un nouvel onglet.
          </p>
        </div>
      )}

      {/* Mini : buteurs/joueurs réservés à Pro */}
      {!canPlayers && (
        <ProUpsell
          title="Buteurs probables & joueurs clés"
          subtitle="Le 1er buteur, les buteurs probables et les joueurs à suivre"
        />
      )}

      {/* Buteurs probables & 1er buteur — depuis l'effectif réel */}
      {canPlayers && data.probableScorers && data.probableScorers.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <Goal size={13} className="text-[var(--accent)]" /> Buteurs probables
            <span className="gold-tag ml-auto">Gold</span>
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
              <div key={i} className="flex items-start gap-3 rounded-xl gold-card p-3.5">
                <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--accent)]/12 shrink-0">
                  <Goal size={12} className="text-[var(--accent)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#f0f0f0]">
                    {s.name}{" "}
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      · {s.team === "home" ? `${h.flag} ${h.shortName}` : `${a.flag} ${a.shortName}`}
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
            <span className="gold-tag ml-auto">Gold</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.keyPlayers.map((p, i) => (
              <div key={i} className="rounded-xl gold-card p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#f0f0f0]">{p.name}</span>
                  <span className="ml-auto text-[10px] font-semibold text-[var(--text-muted)]">
                    {p.team === "home" ? `${h.flag} ${h.shortName}` : `${a.flag} ${a.shortName}`}
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

      {/* Model figures — xG, goals, strength comparison. The whole analysis is
          the Gold prediction (badge in the header); this block is just its numbers. */}
      <div className="rounded-2xl p-4 space-y-5 glass">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--accent)]/12 shrink-0">
            <TrendingUp size={13} className="text-[var(--accent)]" />
          </span>
          <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">Les chiffres du modèle</span>
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">xG · buts · forces</span>
        </div>

        {/* Comparison */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-[var(--accent)]">{h.flag} {h.name}</span>
            <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
              <TrendingUp size={12} className="inline mr-1" />Comparaison
            </span>
            <span className="text-xs font-black text-[#ef4444]">{a.name} {a.flag}</span>
          </div>
          <div className="space-y-2.5">
            {data.comparison.map((c) => (
              <CompareRow key={c.label} label={c.label} home={c.home} away={c.away} />
            ))}
          </div>
        </div>

        {/* Expected goals & markets — big headline numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl gold-card p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">{data.expectedGoals.home}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-2">Buts {h.flag} {h.shortName}</div>
          </div>
          <div className="rounded-xl gold-card p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">{data.expectedGoals.away}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-2">Buts {a.flag} {a.shortName}</div>
          </div>
          <div className="rounded-xl gold-card p-4 text-center">
            <div className="text-4xl font-black text-[var(--text)] tabular-nums leading-none">
              {data.markets.over25}<span className="text-xl align-top">%</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2">+2.5 buts</div>
          </div>
          <div className="rounded-xl gold-card p-4 text-center">
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
