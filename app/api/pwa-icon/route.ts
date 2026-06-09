export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get("size") ?? "512"), 512);

  // Copafever flame icon — drawn in a 120×120 coordinate space and scaled to `size`.
  // Palette is the emerald brand gradient (#0F9D58 → #16C172 → #3DF08A).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="grn" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F9D58"/>
      <stop offset="50%" stop-color="#16C172"/>
      <stop offset="100%" stop-color="#3DF08A"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="#0A0A0A"/>
  <path d="M60 22 c4 14 -8 20 -4 34 c-3 -3 -6 -8 -6 -14 c-10 8 -16 19 -16 31 c0 17 13 29 29 29 c16 0 29 -12 29 -28 c0 -18 -14 -28 -16 -42 c-3 6 -3 12 -2 17 c-6 -7 -9 -16 -8 -27 z" fill="url(#grn)"/>
  <path d="M60 66 c6 4 9 9 9 15 c0 8 -7 13 -14 13 c-6 0 -11 -5 -11 -12 c0 -6 4 -11 8 -15 c0 4 2 6 5 6 c3 0 5 -3 4 -7 z" fill="#0A0A0A" opacity="0.45"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
