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

function Shell({ pill, children }: { pill: string; children: React.ReactNode }) {
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
      <div
        style={{
          position: "absolute",
          top: -260,
          right: -220,
          width: 760,
          height: 760,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(22,193,114,0.26), rgba(22,193,114,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -260,
          width: 800,
          height: 800,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(22,193,114,0.10), rgba(22,193,114,0) 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 70,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>
            <span style={{ color: "#F4F5F7" }}>copa</span>
            <span style={{ color: ACCENT }}>fever</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 1,
              color: ACCENT,
              border: `2px solid rgba(22,193,114,0.4)`,
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            {pill}
          </div>
        </div>

        {children}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800 }}>copafever.com</div>
          <div style={{ display: "flex", fontSize: 22, color: "#5a6472", marginTop: 10 }}>
            Analyse à titre informatif · Jouez responsable · +18
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

// ─── Pré-match: pronostic ─────────────────────────────────────────────────────

export function PronoCard({
  data,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
}: {
  data: MatchAnalysisData;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
}) {
  const p = data.probabilities;
  const top = Math.max(p.home, p.draw, p.away);
  const xgH = data.expectedGoals?.home;
  const xgA = data.expectedGoals?.away;
  const score =
    typeof xgH === "number" && typeof xgA === "number"
      ? `${Math.round(xgH)} – ${Math.round(xgA)}`
      : null;
  const rec = data.recommendation;
  const isValue = rec.valueTier === "value";

  const probs = [
    { label: homeName, pct: p.home },
    { label: "Nul", pct: p.draw },
    { label: awayName, pct: p.away },
  ];

  return (
    <Shell pill="ANALYSE IA · CDM 2026">
      <Flags
        homeFlag={homeFlag}
        awayFlag={awayFlag}
        homeName={homeName}
        awayName={awayName}
        middle={
          <span style={{ display: "flex", fontSize: 60, fontWeight: 900, color: "#5a6472" }}>VS</span>
        }
      />

      {score && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginTop: 18,
          }}
        >
          <span style={{ display: "flex", fontSize: 28, color: "#9BA1A8" }}>Score probable</span>
          <span style={{ display: "flex", fontSize: 40, fontWeight: 900, color: ACCENT }}>{score}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", marginTop: 56 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, marginBottom: 18 }}>
          {probs.map((b) => (
            <span
              key={b.label}
              style={{ display: "flex", fontWeight: 800, color: b.pct === top ? ACCENT : "#9BA1A8" }}
            >
              {b.label} {b.pct}%
            </span>
          ))}
        </div>
        <div style={{ display: "flex", height: 26, borderRadius: 999, overflow: "hidden", background: "#141a20" }}>
          <div style={{ display: "flex", width: `${p.home}%`, background: p.home === top ? ACCENT : "#3a4450" }} />
          <div style={{ display: "flex", width: `${p.draw}%`, background: p.draw === top ? ACCENT : "#2b333d" }} />
          <div style={{ display: "flex", width: `${p.away}%`, background: p.away === top ? ACCENT : "#6b7280" }} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 54,
          padding: 48,
          borderRadius: 40,
          background: "rgba(22,193,114,0.09)",
          border: `2px solid rgba(22,193,114,0.42)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", fontSize: 28, fontWeight: 900, letterSpacing: 2, color: ACCENT }}>
            LE PARI CONSEILLÉ
          </span>
          {isValue && (
            <span
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 1,
                color: "#07090d",
                background: ACCENT,
                borderRadius: 999,
                padding: "8px 22px",
              }}
            >
              VALUE DÉTECTÉ
            </span>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 900, marginTop: 22 }}>{rec.bet}</div>
        {rec.odds && (
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: ACCENT, marginTop: 12 }}>
            Cote {rec.odds}
            {rec.bookmaker ? ` · ${rec.bookmaker}` : ""}
          </div>
        )}
        <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
          <Chip label={`Confiance : ${rec.confidence}`} accent />
          <Chip label={`Mise : ${rec.stake}`} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
        <StatTile
          label="xG"
          value={
            typeof xgH === "number" && typeof xgA === "number" ? `${xgH} – ${xgA}` : "—"
          }
        />
        <StatTile label="+2,5 BUTS" value={`${data.markets?.over25 ?? "—"} %`} />
        <StatTile label="BTTS" value={`${data.markets?.bttsYes ?? "—"} %`} />
      </div>
    </Shell>
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
}: {
  match: Match;
  data: MatchAnalysisData;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  track: TrackStats;
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
    <Shell pill="RÉSULTAT · CDM 2026">
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

      {/* Rappel du pari conseillé avant-match */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 36,
          padding: 40,
          borderRadius: 32,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 1, color: "#9BA1A8" }}>
          NOTRE PARI CONSEILLÉ
        </span>
        <span style={{ display: "flex", fontSize: 42, fontWeight: 900, marginTop: 14 }}>{data.recommendation.bet}</span>
        {data.recommendation.odds && (
          <span style={{ display: "flex", fontSize: 32, fontWeight: 800, color: ACCENT, marginTop: 8 }}>
            Cote {data.recommendation.odds}
            {data.recommendation.bookmaker ? ` · ${data.recommendation.bookmaker}` : ""}
          </span>
        )}
      </div>

      {track.total > 0 && (
        <div style={{ display: "flex", marginTop: 36, gap: 20 }}>
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
