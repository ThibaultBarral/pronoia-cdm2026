import { ImageResponse } from "next/og";
import { isAdmin } from "@/lib/admin";
import { getMyAnalysis } from "@/lib/supabase/analyses-db";
import type { MatchAnalysisData } from "@/lib/analysis-schema";

/**
 * 9:16 shareable image of a match analysis (predicted result + recommended bet).
 * ADMIN ONLY. Reads the analysis already stored in the admin's history (no Claude
 * call). Returned as a PNG the client can share to socials or download.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  if (!(await isAdmin())) {
    return new Response("Not found", { status: 404 });
  }

  const stored = await getMyAnalysis("match", id);
  if (!stored) {
    return new Response("Analyse introuvable — génère-la d'abord.", { status: 404 });
  }

  const data = stored.data as MatchAnalysisData;
  const [homeName, awayName] = stored.title.split(" vs ");
  const homeFlag = stored.homeFlag ?? "🏳️";
  const awayFlag = stored.awayFlag ?? "🏳️";

  const ACCENT = "#16C172";
  const probs = [
    { label: homeName ?? "Domicile", pct: data.probabilities.home, accent: true },
    { label: "Match nul", pct: data.probabilities.draw, accent: false },
    { label: awayName ?? "Extérieur", pct: data.probabilities.away, accent: false },
  ];
  const topProb = Math.max(
    data.probabilities.home,
    data.probabilities.draw,
    data.probabilities.away
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          background: "linear-gradient(160deg, #070a10 0%, #0A0A0A 55%, #0c160f 100%)",
          color: "#F4F5F7",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 900, letterSpacing: -2 }}>
            <span style={{ color: "#F4F5F7" }}>copa</span>
            <span style={{ color: ACCENT }}>fever</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 800,
              color: ACCENT,
              border: `2px solid ${ACCENT}`,
              borderRadius: 999,
              padding: "8px 22px",
            }}
          >
            ANALYSE IA
          </div>
        </div>

        {/* Match */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 90,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 40, fontSize: 150 }}>
            <span>{homeFlag}</span>
            <span style={{ fontSize: 60, fontWeight: 900, color: "#5a6472" }}>VS</span>
            <span>{awayFlag}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 900,
              marginTop: 30,
              textAlign: "center",
            }}
          >
            {homeName} – {awayName}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9BA1A8", marginTop: 12 }}>
            Coupe du Monde 2026
          </div>
        </div>

        {/* Probabilities */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 80, gap: 26 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "#9BA1A8", letterSpacing: 2 }}>
            PROBABILITÉS
          </div>
          {probs.map((p) => (
            <div key={p.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34 }}>
                <span style={{ color: "#d7dbe0", fontWeight: 700 }}>{p.label}</span>
                <span style={{ color: p.pct === topProb ? ACCENT : "#d7dbe0", fontWeight: 900 }}>
                  {p.pct}%
                </span>
              </div>
              <div style={{ display: "flex", width: "100%", height: 22, background: "#171b22", borderRadius: 999 }}>
                <div
                  style={{
                    display: "flex",
                    width: `${p.pct}%`,
                    height: "100%",
                    background: p.pct === topProb ? ACCENT : "#6b7280",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 70,
            padding: 44,
            borderRadius: 36,
            background: "rgba(22,193,114,0.10)",
            border: `2px solid rgba(22,193,114,0.45)`,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: ACCENT, letterSpacing: 2 }}>
            💰 LE PARI CONSEILLÉ
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 900, marginTop: 18, color: "#F4F5F7" }}>
            {data.recommendation.bet}
          </div>
          {data.recommendation.odds && (
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: ACCENT, marginTop: 12 }}>
              Cote {data.recommendation.odds}
              {data.recommendation.bookmaker ? ` · ${data.recommendation.bookmaker}` : ""}
            </div>
          )}
          <div style={{ display: "flex", gap: 20, marginTop: 26 }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                color: ACCENT,
                background: "rgba(22,193,114,0.15)",
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              Confiance : {data.recommendation.confidence}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                color: "#9BA1A8",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              Mise : {data.recommendation.stake}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color: "#F4F5F7" }}>
            copafever.com
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#5a6472", marginTop: 10 }}>
            Analyse fournie à titre informatif uniquement
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, emoji: "twemoji" }
  );
}
