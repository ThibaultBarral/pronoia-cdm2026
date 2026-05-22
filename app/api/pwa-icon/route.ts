export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get("size") ?? "512"), 512);
  const r = Math.round(size * 0.22);
  const barW = Math.round(size * 0.07);
  const gap = Math.round(size * 0.035);
  const baseX = Math.round(size * 0.2);
  const baseY = Math.round(size * 0.68);
  const heights = [0.22, 0.36, 0.5, 0.3, 0.42];

  const bars = heights
    .map((h, i) => {
      const bh = Math.round(size * h);
      const x = baseX + i * (barW + gap);
      const y = baseY - bh;
      const fill = i === 2 ? "#00ff88" : "#1e3a2e";
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="${Math.round(barW * 0.25)}" fill="${fill}"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a" rx="${r}"/>
  ${bars}
  <text x="${size / 2}" y="${Math.round(size * 0.85)}" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.12)}" font-weight="900" fill="#00ff88" text-anchor="middle" letter-spacing="-1">PRONOIA</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
