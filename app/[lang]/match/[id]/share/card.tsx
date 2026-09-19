import type { MatchAnalysisData } from "@/lib/analysis-schema";
import type { Match } from "@/lib/types";
import type { MatchPrediction } from "@/lib/match-model";

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
  tag,
  children,
}: {
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
          <Wordmark size={40} />
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
            justifyContent: "flex-start",
            paddingTop: 48,
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
            Analyse à titre informatif
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

export function ReadCard({
  data,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
  dateLabel,
}: {
  data: MatchAnalysisData;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
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
    <Shell tag="AVANT-MATCH">
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
    <Shell tag="RÉSULTAT">
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
          {correct ? "✅  LECTURE CONFIRMÉE" : "✗  LECTURE MANQUÉE"}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#cdd3db", marginTop: 20, textAlign: "center" }}>
          Notre IA voyait {predLabel} ({predPct}%)
        </div>
      </div>

      {track.total > 0 && (
        <div style={{ display: "flex", width: "100%", marginTop: 40, gap: 20 }}>
          <StatTile label="RÉUSSITE VÉRIFIÉE" value={`${track.winRate} %`} />
          <StatTile label="MATCHS VÉRIFIÉS" value={`${track.total}`} />
          {track.currentStreak > 0 && (
            <StatTile label="SÉRIE EN COURS" value={`${track.currentStreak} ✅`} />
          )}
        </div>
      )}
    </Shell>
  );
}

// ─── Shared pick logic ────────────────────────────────────────────────────────

export interface Pick {
  fav: "home" | "draw" | "away";
  /** Probability of the favourite (or of the draw), in %. */
  top: number;
  /** Likely score, coherent with the favourite (never a draw score for a winner). */
  sh: number;
  sa: number;
}

/** One message per match: the favourite, its probability, the likely score. */
export function pickFromPrediction(pred: MatchPrediction): Pick {
  const p = pred.probabilities;
  const top = Math.max(p.home, p.draw, p.away);
  const fav = p.draw === top ? "draw" : p.home >= p.away ? "home" : "away";
  let sh = Math.max(0, Math.round(pred.expectedGoals.home));
  let sa = Math.max(0, Math.round(pred.expectedGoals.away));
  if (fav === "home" && sh <= sa) sh = sa + 1;
  if (fav === "away" && sa <= sh) sa = sh + 1;
  if (fav === "draw") sa = sh;
  return { fav, top, sh, sa };
}

// ─── Basic card — the TikTok-friendly one ─────────────────────────────────────

/** Copafever palette (globals.css) — the card must look like the app. */
const BLUE = "#4F8CFF";
const BLUE_STRONG = "#2563EB";
const BLUE_SOFT = "#8EC5FF";
const NAVY = "#050A1F";
const NAVY_ELEVATED = "#0B1330";
const TEXT = "#F3F5FC";
const MUTED = "#94A0C2";

/** Club crest (image) or, for nations, the flag emoji, in a big rounded tile. */
function CrestTile({ logo, flag, name }: { logo?: string; flag: string; name: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 250,
        height: 250,
        borderRadius: 56,
        background: "rgba(255,255,255,0.06)",
        border: "3px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        fontSize: 170,
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} width={176} height={176} style={{ objectFit: "contain" }} />
      ) : (
        flag || name.slice(0, 3).toUpperCase()
      )}
    </div>
  );
}

function Label({ children, color = MUTED }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: 7, color }}>{children}</div>
  );
}

/**
 * The basic 9:16 card, TikTok / Reels first: Copafever navy and electric
 * blue, big rounded tiles, huge type, one message — the favourite, its
 * probability, the likely score. Everything sits inside the safe zone
 * (nothing in the top 200 px or the bottom 380 px, nothing hugging the right
 * rail). `wordmark` is the real Copafever logo as a data URI.
 */
export function BasicCard({
  match,
  pred,
  dateLabel,
  wordmark,
}: {
  match: Match;
  pred: MatchPrediction;
  dateLabel: string;
  wordmark?: string;
}) {
  const h = match.homeTeam;
  const a = match.awayTeam;
  const p = pred.probabilities;
  const { fav, top, sh, sa } = pickFromPrediction(pred);
  const favName = fav === "home" ? h.name : fav === "away" ? a.name : "Match nul";
  const comp = match.competition?.name ?? "Coupe du Monde 2026";
  const favSize = favName.length > 16 ? 72 : favName.length > 11 ? 92 : 112;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: NAVY,
        color: TEXT,
        fontFamily: "Geist",
        padding: "150px 110px 300px 96px",
        overflow: "hidden",
      }}
    >
      {/* Electric-blue glows, like the app's hero */}
      <div
        style={{
          position: "absolute",
          top: -420,
          right: -380,
          width: 1200,
          height: 1200,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(79,140,255,0.34), rgba(79,140,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -520,
          left: -420,
          width: 1200,
          height: 1200,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(142,197,255,0.16), rgba(79,140,255,0) 64%)",
        }}
      />

      {/* Wordmark + competition pill */}
      {wordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wordmark} alt="Copafever" width={380} height={78} />
      ) : (
        <Wordmark size={56} />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 30,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 4,
          lineHeight: 1,
          color: BLUE_SOFT,
          background: "rgba(79,140,255,0.12)",
          border: "2px solid rgba(79,140,255,0.35)",
          borderRadius: 9999,
          padding: "18px 34px 16px",
        }}
      >
        {comp.toUpperCase()} · {dateLabel.toUpperCase()}
      </div>

      {/* Matchup tile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginTop: 50,
          padding: "36px 40px",
          borderRadius: 64,
          background: "rgba(255,255,255,0.045)",
          border: "2px solid rgba(255,255,255,0.09)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
          <CrestTile logo={h.logo} flag={h.flag} name={h.name} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 900, marginTop: 26, textAlign: "center", lineHeight: 1.1 }}>
            {h.name}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 110,
            height: 110,
            borderRadius: 9999,
            background: NAVY_ELEVATED,
            border: "2px solid rgba(255,255,255,0.10)",
            fontSize: 34,
            fontWeight: 900,
            color: MUTED,
          }}
        >
          VS
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
          <CrestTile logo={a.logo} flag={a.flag} name={a.name} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 900, marginTop: 26, textAlign: "center", lineHeight: 1.1 }}>
            {a.name}
          </div>
        </div>
      </div>

      {/* Favourite — the blue hero tile */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          marginTop: 32,
          padding: "40px 40px 32px",
          borderRadius: 64,
          background: `linear-gradient(160deg, ${BLUE_STRONG} 0%, ${BLUE} 100%)`,
          boxShadow: "0 40px 120px rgba(37,99,235,0.45)",
        }}
      >
        <Label color="rgba(255,255,255,0.75)">{fav === "draw" ? "LE PLUS PROBABLE" : "FAVORI"}</Label>
        <div style={{ display: "flex", fontSize: favSize, fontWeight: 900, marginTop: 10, textAlign: "center", lineHeight: 1.05 }}>
          {favName}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 6 }}>
          <span style={{ display: "flex", fontSize: 200, fontWeight: 900, lineHeight: 1, letterSpacing: -8 }}>{top}</span>
          <span style={{ display: "flex", fontSize: 80, fontWeight: 900, marginTop: 24, marginLeft: 6 }}>%</span>
        </div>
      </div>

      {/* Score + bar in one tile */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          marginTop: 32,
          padding: "34px 48px 36px",
          borderRadius: 64,
          background: "rgba(255,255,255,0.045)",
          border: "2px solid rgba(255,255,255,0.09)",
        }}
      >
        <Label>SCORE PROBABLE</Label>
        <div style={{ display: "flex", fontSize: 130, fontWeight: 900, lineHeight: 1, marginTop: 8, letterSpacing: -4 }}>
          {sh} - {sa}
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 30 }}>
          <div style={{ display: "flex", height: 28, borderRadius: 9999, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", width: `${p.home}%`, background: p.home === top ? BLUE : "rgba(255,255,255,0.22)" }} />
            <div style={{ display: "flex", width: `${p.draw}%`, background: p.draw === top ? BLUE : "rgba(255,255,255,0.14)", marginLeft: 4, marginRight: 4 }} />
            <div style={{ display: "flex", width: `${p.away}%`, background: p.away === top ? BLUE : "rgba(255,255,255,0.22)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            {[
              { label: h.shortName || h.name, pct: p.home },
              { label: "NUL", pct: p.draw },
              { label: a.shortName || a.name, pct: p.away },
            ].map((b) => (
              <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <span style={{ display: "flex", fontSize: 48, fontWeight: 900, color: b.pct === top ? BLUE_SOFT : TEXT }}>
                  {b.pct}%
                </span>
                <span style={{ display: "flex", fontSize: 26, fontWeight: 600, letterSpacing: 3, color: MUTED, marginTop: 4 }}>
                  {b.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 34,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 2,
          color: MUTED,
        }}
      >
        copafever.com
      </div>
    </div>
  );
}

// ─── Notebook slides — the day's picks, handwritten, one page per slide ───────

/** Seyès ruling (French school notebook): a major line every 56 px, 3 minor lines between. */
const RULE = 56;
const RULE_TOP = 96;
const MARGIN_X = 150;
/** First / last major line usable for content (the header lives above). */
const FIRST_ROW = 6;
const LAST_ROW = 25;
/** Lines available under the header of a picks slide. */
const SLIDE_ROWS = LAST_ROW - FIRST_ROW + 1;

/** Ballpoint blue, red correction pen, pencil grey. */
const INK = "#2447A6";
const RED = "#C62828";
const PENCIL = "#6B7280";
const PAPER = "#FCFBF6";

export interface NotebookRow {
  home: { name: string; logo?: string };
  away: { name: string; logo?: string };
  time: string;
  pick: Pick;
}

export interface NotebookSection {
  flag: string;
  name: string;
  rows: NotebookRow[];
  /** Set when a competition spans several slides. */
  part?: { i: number; n: number };
}

export type NotebookSlide =
  | { kind: "cover"; comps: { flag: string; name: string; count: number }[]; matchCount: number }
  | { kind: "picks"; sections: NotebookSection[] }
  | { kind: "outro" };

/** Lines a section takes on the page: a heading, two per match, a blank line before it when it is not first. */
function sectionRows(matches: number, first: boolean): number {
  return (first ? 0 : 1) + 1 + 2 * matches;
}

/**
 * Build the carousel: a cover, then the picks packed onto as few notebook
 * pages as possible (small competitions share a page, a big one is split
 * across pages), then an outro.
 */
export function buildNotebookSlides(groups: { flag: string; name: string; rows: NotebookRow[] }[]): NotebookSlide[] {
  const withRows = groups.filter((g) => g.rows.length > 0);
  const matchCount = withRows.reduce((n, g) => n + g.rows.length, 0);
  const slides: NotebookSlide[] = [
    { kind: "cover", comps: withRows.map((g) => ({ flag: g.flag, name: g.name, count: g.rows.length })), matchCount },
  ];

  const maxPerSection = Math.floor((SLIDE_ROWS - 1) / 2);
  const pages: NotebookSection[][] = [];
  let page: NotebookSection[] = [];
  let used = 0;
  for (const g of withRows) {
    const n = Math.ceil(g.rows.length / maxPerSection);
    for (let i = 0; i < n; i++) {
      const rows = g.rows.slice(i * maxPerSection, (i + 1) * maxPerSection);
      let needed = sectionRows(rows.length, page.length === 0);
      if (used + needed > SLIDE_ROWS && page.length) {
        pages.push(page);
        page = [];
        used = 0;
        needed = sectionRows(rows.length, true);
      }
      page.push({ flag: g.flag, name: g.name, rows, part: n > 1 ? { i: i + 1, n } : undefined });
      used += needed;
    }
  }
  if (page.length) pages.push(page);
  for (const sections of pages) slides.push({ kind: "picks", sections });

  if (matchCount > 0) slides.push({ kind: "outro" });
  return slides;
}

/** The ruled paper as an SVG data URI: Seyès grid, red margin, punched holes. */
function seyesPaper(width: number, height: number): string {
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${PAPER}"/>`];
  for (let y = RULE_TOP, i = 0; y < height; y += RULE / 4, i++) {
    const major = i % 4 === 0;
    parts.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${major ? "#9DB6DC" : "#D9E4F2"}" stroke-width="${major ? 2 : 1.4}"/>`,
    );
  }
  for (let x = MARGIN_X + RULE; x < width; x += RULE) {
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#C7D7EC" stroke-width="1.4"/>`);
  }
  parts.push(`<line x1="${MARGIN_X}" y1="0" x2="${MARGIN_X}" y2="${height}" stroke="#E8888F" stroke-width="3"/>`);
  for (const cy of [420, 960, 1500]) {
    parts.push(`<circle cx="52" cy="${cy}" r="22" fill="#ECEAE3" stroke="#D8D5CC" stroke-width="2"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Width available for the two names once the stickers are drawn. */
const NAMES_WIDTH = CARD_SIZE.width - 130 - (MARGIN_X + 24) - 124;
/** Room kept for the kick-off time at the end of the line. */
const TIME_WIDTH = 120;

/**
 * Handwriting shrinks when the two names are long, so a line stays a line
 * (Caveat ≈ 0.42 em per glyph). Past a point the kick-off time is dropped
 * rather than the names becoming illegible.
 */
function namesSize(home: string, away: string): { size: number; withTime: boolean } {
  const glyphs = home.length + away.length + 3;
  const fit = (w: number) => Math.min(46, Math.floor(w / (0.42 * glyphs)));
  const withTime = fit(NAMES_WIDTH - TIME_WIDTH);
  if (withTime >= 34) return { size: withTime, withTime: true };
  return { size: Math.max(28, fit(NAMES_WIDTH)), withTime: false };
}

function Sticker({ logo, name, size = 44 }: { logo?: string; name: string; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 8,
        background: "#FFFFFF",
        border: "1.5px solid #E2DFD6",
        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} width={size - 10} height={size - 10} style={{ objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: 16, color: PENCIL }}>{name.slice(0, 3).toUpperCase()}</span>
      )}
    </div>
  );
}

/** A line of handwriting sitting on one Seyès major line. */
function Line({ children, tilt = 0, justify = "flex-start" }: { children: React.ReactNode; tilt?: number; justify?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: justify,
        width: "100%",
        height: RULE,
        paddingBottom: 6,
        ...(tilt ? { transform: `rotate(${tilt}deg)` } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** Hand-drawn box, like a name written on the cover. */
function NameBox({ children, size = 36 }: { children: React.ReactNode; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        color: INK,
        border: `3px solid ${INK}`,
        borderRadius: "18px 12px 22px 10px",
        padding: "14px 22px 10px",
        transform: "rotate(1.5deg)",
      }}
    >
      {children}
    </div>
  );
}

function Title({ text, size = 104, underline = 420 }: { text: string; size?: number; underline?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", transform: "rotate(-1.5deg)" }}>
      <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1, color: INK }}>{text}</div>
      <div style={{ display: "flex", height: 7, width: underline, borderRadius: 4, background: INK, marginTop: 4, marginLeft: 6 }} />
    </div>
  );
}

function MatchBlock({ row, index }: { row: NotebookRow; index: number }) {
  const { fav, top, sh, sa } = row.pick;
  const { size, withTime } = namesSize(row.home.name, row.away.name);
  const tilt = index % 3 === 0 ? -0.35 : index % 3 === 1 ? 0.3 : 0;
  const verdict = fav === "draw" ? "match nul" : `${fav === "home" ? row.home.name : row.away.name} gagne`;
  return (
    <div style={{ display: "flex", flexDirection: "column", transform: `rotate(${tilt}deg)` }}>
      <Line justify="space-between">
        <div style={{ display: "flex", alignItems: "center" }}>
          <Sticker logo={row.home.logo} name={row.home.name} />
          <div style={{ display: "flex", marginLeft: 10 }}>
            <Sticker logo={row.away.logo} name={row.away.name} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginLeft: 18, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", color: INK }}>
            <span style={{ display: "flex", fontWeight: fav === "home" ? 700 : 400 }}>{row.home.name}</span>
            <span style={{ display: "flex", color: PENCIL, fontSize: size - 10 }}>–</span>
            <span style={{ display: "flex", fontWeight: fav === "away" ? 700 : 400 }}>{row.away.name}</span>
          </div>
        </div>
        {withTime && <span style={{ display: "flex", fontSize: 32, lineHeight: 1, color: PENCIL, flexShrink: 0 }}>{row.time}</span>}
      </Line>
      <Line>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginLeft: 110 }}>
          <span style={{ display: "flex", fontSize: 40, lineHeight: 1, color: RED }}>→</span>
          <span style={{ display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1, color: RED, letterSpacing: 2 }}>
            {sh}-{sa}
          </span>
          <span style={{ display: "flex", fontSize: 40, lineHeight: 1, color: RED, whiteSpace: "nowrap" }}>{verdict}</span>
          <span style={{ display: "flex", fontSize: 36, lineHeight: 1, color: INK }}>({top}%)</span>
        </div>
      </Line>
    </div>
  );
}

function CoverSlide({ slide, dateLabel }: { slide: Extract<NotebookSlide, { kind: "cover" }>; dateLabel: string }) {
  return (
    <>
      <div style={{ position: "absolute", top: RULE_TOP + RULE * 3, left: MARGIN_X + 24, right: 120, display: "flex", flexDirection: "column" }}>
        <Title text="Pronos" size={150} underline={330} />
        <div style={{ display: "flex", marginTop: 6 }}>
          <Title text="du jour" size={150} underline={420} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 50, fontSize: 58, lineHeight: 1, color: INK }}>
          <span style={{ display: "flex" }}>{dateLabel}</span>
        </div>
        <div style={{ display: "flex", fontSize: 42, lineHeight: 1, color: PENCIL, marginTop: 22 }}>
          {slide.matchCount} match{slide.matchCount > 1 ? "s" : ""} · {slide.comps.length} championnat{slide.comps.length > 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ position: "absolute", top: RULE_TOP + RULE * 14, left: MARGIN_X + 24, right: 130, display: "flex", flexDirection: "column" }}>
        {slide.comps.map((c, i) => (
          <Line key={c.name} justify="space-between" tilt={i % 2 ? 0.3 : -0.3}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, fontSize: 46, lineHeight: 1, color: INK }}>
              <span style={{ display: "flex", fontSize: 36 }}>{c.flag}</span>
              <span style={{ display: "flex" }}>{c.name}</span>
            </div>
            <span style={{ display: "flex", fontSize: 40, lineHeight: 1, color: RED, fontWeight: 700 }}>
              {c.count} match{c.count > 1 ? "s" : ""}
            </span>
          </Line>
        ))}
        {slide.matchCount === 0 && (
          <Line>
            <span style={{ display: "flex", fontSize: 48, color: PENCIL }}>Pas de match aujourd&apos;hui, on se repose.</span>
          </Line>
        )}
      </div>

      <div style={{ position: "absolute", top: RULE_TOP + RULE * 24, left: MARGIN_X + 24, right: 130, display: "flex" }}>
        <Line>
          <span style={{ display: "flex", fontSize: 44, lineHeight: 1, color: PENCIL, transform: "rotate(-1deg)" }}>
            swipe pour les pronos →
          </span>
        </Line>
      </div>
    </>
  );
}

function SectionHead({ section, first }: { section: NotebookSection; first: boolean }) {
  const label = section.part ? `${section.name} (${section.part.i}/${section.part.n})` : section.name;
  // A blank line before every section but the first (a fragment would lay the two lines side by side in Satori).
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {!first && <Line>{null}</Line>}
      <Line tilt={-0.5}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontSize: 56, fontWeight: 700, lineHeight: 1, color: INK }}>
          <span style={{ display: "flex", fontSize: 44 }}>{section.flag}</span>
          <span style={{ display: "flex", borderBottom: `4px solid ${INK}`, paddingBottom: 2 }}>{label}</span>
        </div>
      </Line>
    </div>
  );
}

function PicksSlide({ slide, dateLabel }: { slide: Extract<NotebookSlide, { kind: "picks" }>; dateLabel: string }) {
  return (
    <>
      <div style={{ position: "absolute", top: RULE_TOP + RULE * 2 - 6, left: MARGIN_X + 24, right: 120, display: "flex", flexDirection: "column" }}>
        <Title text="Pronos du jour" size={88} underline={520} />
        <div style={{ display: "flex", fontSize: 42, lineHeight: 1, color: PENCIL, marginTop: 18 }}>{dateLabel}</div>
      </div>

      <div style={{ position: "absolute", top: RULE_TOP + RULE * FIRST_ROW, left: MARGIN_X + 24, right: 130, display: "flex", flexDirection: "column" }}>
        {slide.sections.map((sec, si) => (
          <div key={`${sec.name}-${si}`} style={{ display: "flex", flexDirection: "column" }}>
            <SectionHead section={sec} first={si === 0} />
            {sec.rows.map((r, i) => (
              <MatchBlock key={`${r.home.name}-${r.away.name}`} row={r} index={i} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function OutroSlide() {
  const bullets = ["absences réelles du jour", "forme et stats des joueurs", "score le plus probable", "pourquoi ce prono, en clair"];
  return (
    <>
      <div style={{ position: "absolute", top: RULE_TOP + RULE * 3, left: MARGIN_X + 24, right: 120, display: "flex", flexDirection: "column" }}>
        <Title text="Le détail de" size={120} underline={0} />
        <div style={{ display: "flex", marginTop: 6 }}>
          <Title text="chaque prono" size={120} underline={620} />
        </div>
      </div>
      <div style={{ position: "absolute", top: RULE_TOP + RULE * 9, left: MARGIN_X + 24, right: 130, display: "flex", flexDirection: "column" }}>
        {bullets.map((b, i) => (
          <Line key={b} tilt={i % 2 ? 0.3 : -0.3}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontSize: 50, lineHeight: 1, color: INK }}>
              <span style={{ display: "flex", color: RED }}>-</span>
              <span style={{ display: "flex" }}>{b}</span>
            </div>
          </Line>
        ))}
      </div>
      <div style={{ position: "absolute", top: RULE_TOP + RULE * 16, left: MARGIN_X + 24, right: 130, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <NameBox size={64}>copafever.com</NameBox>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <Line>
            <span style={{ display: "flex", fontSize: 52, lineHeight: 1, color: RED, fontWeight: 700, transform: "rotate(-1deg)" }}>
              1 analyse offerte à l&apos;inscription
            </span>
          </Line>
          <Line>
            <span style={{ display: "flex", fontSize: 44, lineHeight: 1, color: PENCIL }}>lien en bio →</span>
          </Line>
        </div>
      </div>
    </>
  );
}

/**
 * One slide of the "cahier" carousel : the day's picks as if scribbled in a
 * French school notebook. Blue ballpoint for the writing, red pen for the
 * verdicts, crests as little stickers. Text stays clear of TikTok's top bar
 * and bottom overlay; every line sits on a Seyès major line.
 */
export function NotebookCard({
  slide,
  dateLabel,
  index,
  total,
}: {
  slide: NotebookSlide;
  dateLabel: string;
  index: number;
  total: number;
}) {
  const paper = seyesPaper(CARD_SIZE.width, CARD_SIZE.height);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PAPER,
        fontFamily: "Caveat",
        color: INK,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={paper} alt="" width={CARD_SIZE.width} height={CARD_SIZE.height} style={{ position: "absolute", top: 0, left: 0 }} />

      {/* Name on the cover, top right, on every page but the outro */}
      {slide.kind !== "outro" && (
        <div style={{ position: "absolute", top: RULE_TOP + RULE * 1 - 20, right: 130, display: "flex" }}>
          <NameBox>copafever.com</NameBox>
        </div>
      )}

      {slide.kind === "cover" && <CoverSlide slide={slide} dateLabel={dateLabel} />}
      {slide.kind === "picks" && <PicksSlide slide={slide} dateLabel={dateLabel} />}
      {slide.kind === "outro" && <OutroSlide />}

      {/* Footnote + page number, on the line below the last usable row */}
      <div
        style={{
          position: "absolute",
          top: RULE_TOP + RULE * (LAST_ROW + 1),
          left: MARGIN_X + 24,
          right: 130,
          display: "flex",
        }}
      >
        <Line justify="space-between">
          <span style={{ display: "flex", fontSize: 30, lineHeight: 1, color: PENCIL }}>
            Prédictions IA · à titre informatif
          </span>
          <span style={{ display: "flex", fontSize: 34, lineHeight: 1, color: PENCIL }}>
            {index}/{total}
          </span>
        </Line>
      </div>
    </div>
  );
}
