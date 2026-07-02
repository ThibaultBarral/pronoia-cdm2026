import type { MatchAnalysisData } from "@/lib/analysis-schema";
import type { Match } from "@/lib/types";

/**
 * Pure presentational components for the 9:16 shareable match card (Satori/next-og).
 * No server-only imports → renderable both from the route handler and a preview
 * script. Data fetching / auth lives in route.tsx.
 */

export const ACCENT = "#16C172";
export const CARD_SIZE = { width: 1080, height: 1920 } as const;

export interface TrackStats {
  total: number;
  winRate: number;
  currentStreak: number;
}

// ─── Shared chrome ────────────────────────────────────────────────────────────

function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 900, letterSpacing: -2 }}>
      <span style={{ color: "#F4F5F7" }}>copa</span>
      <span style={{ color: ACCENT }}>fever</span>
    </div>
  );
}

/**
 * Card frame: emerald-glow background, a top bar (personalised @handle pill left,
 * section tag right) and the Copafever footer (wordmark + domain + note).
 */
function Shell({
  handle,
  tag,
  children,
}: {
  handle?: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#07090d",
        color: "#F4F5F7",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Diagonal emerald sweep — signature Copafever backdrop */}
      <div
        style={{
          position: "absolute",
          top: -340,
          right: -260,
          width: 1000,
          height: 1000,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(22,193,114,0.22), rgba(22,193,114,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -360,
          left: -300,
          width: 900,
          height: 900,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(61,240,138,0.10), rgba(22,193,114,0) 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {handle ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 28,
                fontWeight: 800,
                color: "#F4F5F7",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "12px 28px",
              }}
            >
              <span style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: ACCENT }} />
              {handle}
            </div>
          ) : (
            <Wordmark size={40} />
          )}
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 2,
              color: ACCENT,
              border: "2px solid rgba(22,193,114,0.4)",
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            {tag}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            width: "100%",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 36,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Wordmark size={40} />
          <div style={{ display: "flex", fontSize: 26, color: "#5a6472" }}>
            Analyse à titre informatif · +18
          </div>
        </div>
      </div>
    </div>
  );
}

function Flags({
  homeFlag,
  awayFlag,
  homeName,
  awayName,
  middle,
}: {
  homeFlag: string;
  awayFlag: string;
  homeName: string;
  awayName: string;
  middle: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 70 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        <Medallion>{homeFlag}</Medallion>
        {middle}
        <Medallion>{awayFlag}</Medallion>
      </div>
      <div
        style={{ display: "flex", fontSize: 56, fontWeight: 900, marginTop: 32, textAlign: "center" }}
      >
        {homeName} – {awayName}
      </div>
    </div>
  );
}

function Medallion({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 220,
        height: 220,
        borderRadius: 999,
        fontSize: 120,
        background: "rgba(255,255,255,0.05)",
        border: "2px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </div>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 28,
        fontWeight: 800,
        color: accent ? ACCENT : "#9BA1A8",
        background: accent ? "rgba(22,193,114,0.15)" : "rgba(255,255,255,0.06)",
        borderRadius: 999,
        padding: "12px 28px",
      }}
    >
      {label}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 28,
        padding: "26px 12px",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, color: "#9BA1A8", letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", fontSize: 40, fontWeight: 900, marginTop: 8 }}>{value}</div>
    </div>
  );
}

// ─── Pré-match: vainqueur prédit ──────────────────────────────────────────────

export function PronoCard({
  data,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
  handle,
  dateLabel,
}: {
  data: MatchAnalysisData;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  handle?: string;
  dateLabel?: string;
}) {
  const p = data.probabilities;
  const top = Math.max(p.home, p.draw, p.away);
  const drawWins = p.draw === top;
  const homeWins = !drawWins && p.home >= p.away;

  const xgH = data.expectedGoals?.home;
  const xgA = data.expectedGoals?.away;
  const score =
    typeof xgH === "number" && typeof xgA === "number"
      ? `${Math.round(xgH)}-${Math.round(xgA)}`
      : "?-?";

  const verdict = drawWins
    ? "Match nul le plus probable"
    : `${homeWins ? homeName : awayName} vainqueur probable`;

  return (
    <Shell handle={handle} tag="CDM 2026">
      {/* Eyebrow */}
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 56 }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 900, letterSpacing: 4, color: ACCENT }}>
          PRÉDICTION IA
        </div>
        {dateLabel && (
          <div style={{ display: "flex", fontSize: 26, color: "#9BA1A8", marginTop: 10 }}>
            Coupe du Monde 2026 · {dateLabel}
          </div>
        )}
      </div>

      {/* Head-to-head with the predicted scoreline in the middle */}
      <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
        <TeamColumn flag={homeFlag} name={homeName} win={!drawWins && homeWins} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 4, color: "#5a6472" }}>
            SCORE
          </div>
          <div style={{ display: "flex", fontSize: 138, fontWeight: 900, lineHeight: 1, marginTop: 10 }}>
            {score}
          </div>
        </div>
        <TeamColumn flag={awayFlag} name={awayName} win={!drawWins && !homeWins} />
      </div>

      {/* Verdict banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          width: "100%",
          marginTop: 56,
          padding: "30px 40px",
          borderRadius: 32,
          background: "rgba(22,193,114,0.10)",
          border: "2px solid rgba(22,193,114,0.42)",
        }}
      >
        <span style={{ display: "flex", fontSize: 48 }}>{drawWins ? "🤝" : "🏆"}</span>
        <span style={{ display: "flex", fontSize: 44, fontWeight: 900, color: "#F4F5F7" }}>{verdict}</span>
      </div>

      {/* Probability bar */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 48 }}>
        <div style={{ display: "flex", height: 28, borderRadius: 999, overflow: "hidden", background: "#141a20" }}>
          <div style={{ display: "flex", width: `${p.home}%`, background: p.home === top ? ACCENT : "#3a4450" }} />
          <div style={{ display: "flex", width: `${p.draw}%`, background: p.draw === top ? ACCENT : "#2b333d" }} />
          <div style={{ display: "flex", width: `${p.away}%`, background: p.away === top ? ACCENT : "#6b7280" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {[
            { label: homeName, pct: p.home, align: "flex-start" as const },
            { label: "Match nul", pct: p.draw, align: "center" as const },
            { label: awayName, pct: p.away, align: "flex-end" as const },
          ].map((b) => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: b.align, flex: 1 }}>
              <span style={{ display: "flex", fontSize: 34, fontWeight: 900, color: b.pct === top ? ACCENT : "#F4F5F7" }}>
                {b.pct}%
              </span>
              <span style={{ display: "flex", fontSize: 22, color: "#9BA1A8", marginTop: 2 }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence + first scorer */}
      <div style={{ display: "flex", gap: 18, marginTop: 44, flexWrap: "wrap" }}>
        <Chip label={`Confiance : ${data.confidence}`} accent />
        {data.firstScorer && <Chip label={`Buteur probable : ${data.firstScorer}`} />}
      </div>
    </Shell>
  );
}

/** One side of the head-to-head, highlighted when it is the predicted winner. */
function TeamColumn({
  flag,
  name,
  win,
}: {
  flag: string;
  name: string;
  win: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        padding: "44px 20px",
        borderRadius: 40,
        background: win ? "rgba(22,193,114,0.10)" : "transparent",
        border: win ? "2px solid rgba(22,193,114,0.5)" : "2px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 184,
          height: 184,
          borderRadius: 44,
          fontSize: 108,
          background: "rgba(255,255,255,0.05)",
          border: "2px solid rgba(255,255,255,0.12)",
        }}
      >
        {flag}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 40,
          fontWeight: 900,
          marginTop: 28,
          color: win ? ACCENT : "#F4F5F7",
          textAlign: "center",
        }}
      >
        {name}
      </div>
    </div>
  );
}

// ─── Post-match: résultat ─────────────────────────────────────────────────────

export function ResultCard({
  match,
  data,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
  track,
  handle,
}: {
  match: Match;
  data: MatchAnalysisData;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  track: TrackStats;
  handle?: string;
}) {
  const h = match.score?.home ?? 0;
  const a = match.score?.away ?? 0;
  const actual: "home" | "draw" | "away" = h > a ? "home" : a > h ? "away" : "draw";

  const p = data.probabilities;
  const predicted: "home" | "draw" | "away" =
    p.home >= p.draw && p.home >= p.away ? "home" : p.away >= p.draw ? "away" : "draw";
  const predLabel = predicted === "home" ? homeName : predicted === "away" ? awayName : "Match nul";
  const predPct = predicted === "home" ? p.home : predicted === "away" ? p.away : p.draw;
  const correct = predicted === actual;

  return (
    <Shell handle={handle} tag="RÉSULTAT">
      <Flags
        homeFlag={homeFlag}
        awayFlag={awayFlag}
        homeName={homeName}
        awayName={awayName}
        middle={
          <span style={{ display: "flex", fontSize: 110, fontWeight: 900, color: "#F4F5F7" }}>
            {h} – {a}
          </span>
        }
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 70,
          padding: 52,
          borderRadius: 40,
          background: correct ? "rgba(22,193,114,0.10)" : "rgba(255,255,255,0.04)",
          border: `2px solid ${correct ? "rgba(22,193,114,0.45)" : "rgba(255,255,255,0.10)"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: 2,
            color: correct ? ACCENT : "#9BA1A8",
          }}
        >
          {correct ? "✅  PRONOSTIC VALIDÉ" : "✗  PRONOSTIC MANQUÉ"}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#cdd3db", marginTop: 20, textAlign: "center" }}>
          Notre IA voyait {predLabel} ({predPct}%)
        </div>
      </div>

      {track.total > 0 && (
        <div style={{ display: "flex", width: "100%", marginTop: 40, gap: 20 }}>
          <StatTile label="RÉUSSITE VÉRIFIÉE" value={`${track.winRate} %`} />
          <StatTile label="PRONOS RÉGLÉS" value={`${track.total}`} />
          {track.currentStreak > 0 && (
            <StatTile label="SÉRIE EN COURS" value={`${track.currentStreak} ✅`} />
          )}
        </div>
      )}
    </Shell>
  );
}
