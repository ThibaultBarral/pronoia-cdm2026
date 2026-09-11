import { ImageResponse } from "next/og";

export const alt = "Copafever : l'analyse de matchs de foot par la data";
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
          background: "linear-gradient(135deg, #03061a 0%, #050A1F 60%, #0B1330 100%)",
          color: "#F4F5F7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 130, marginBottom: 8 }}>⚽</div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 900, letterSpacing: -4 }}>
          <span style={{ color: "#F4F5F7" }}>copa</span>
          <span style={{ color: "#4F8CFF" }}>fever</span>
        </div>
        <div style={{ fontSize: 38, color: "#94A0C2", marginTop: 16 }}>
          L&apos;analyse de matchs de foot par la data
        </div>
        <div style={{ fontSize: 26, color: "#8EC5FF", marginTop: 28, fontWeight: 700 }}>
          Forme réelle · Effectifs · Confrontations · Saison 2026/27
        </div>
      </div>
    ),
    { ...size }
  );
}
