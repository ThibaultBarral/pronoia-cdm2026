import { ImageResponse } from "next/og";

export const alt = "Copafever — Analyses IA & paris de la Coupe du Monde 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #070a10 0%, #0A0A0A 60%, #0c160f 100%)",
          color: "#F4F5F7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 130, marginBottom: 8 }}>🔥</div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 900, letterSpacing: -4 }}>
          <span style={{ color: "#F4F5F7" }}>copa</span>
          <span style={{ color: "#16C172" }}>fever</span>
        </div>
        <div style={{ fontSize: 38, color: "#9BA1A8", marginTop: 16 }}>
          Analyses IA · Coupe du Monde 2026
        </div>
        <div style={{ fontSize: 26, color: "#16C172", marginTop: 28, fontWeight: 700 }}>
          Value bets · Cotes en direct · Pour parier malin
        </div>
      </div>
    ),
    { ...size }
  );
}
