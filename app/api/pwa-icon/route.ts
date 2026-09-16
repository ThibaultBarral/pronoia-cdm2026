export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get("size") ?? "512"), 512);

  // Copafever ball icon (logo of 2026-09-16): navy tile, electric-blue ball,
  // white pentagons. Drawn in a 100×100 space and scaled to `size`.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="23" fill="#050A1F"/>
  <g transform="translate(14.8 14.8) scale(0.704)">
    <clipPath id="c"><circle cx="50" cy="50" r="46"/></clipPath>
    <circle cx="50" cy="50" r="46" fill="#4F8CFF"/>
    <g clip-path="url(#c)">
      <polygon points="50.00,34.00 65.22,45.06 59.40,62.94 40.60,62.94 34.78,45.06" fill="#FFFFFF"/>
      <path d="M50.00 35.00 L50.00 4.00 M64.27 45.36 L93.75 35.79 M58.82 62.14 L77.04 87.21 M41.18 62.14 L22.96 87.21 M35.73 45.36 L6.25 35.79" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <polygon points="50.00,17.50 39.06,9.55 43.24,-3.30 56.76,-3.30 60.94,9.55" fill="#FFFFFF"/><polygon points="80.91,39.96 85.09,27.10 98.61,27.10 102.78,39.96 91.85,47.90" fill="#FFFFFF"/><polygon points="69.10,76.29 82.62,76.29 86.80,89.15 75.86,97.10 64.93,89.15" fill="#FFFFFF"/><polygon points="30.90,76.29 35.07,89.15 24.14,97.10 13.20,89.15 17.38,76.29" fill="#FFFFFF"/><polygon points="19.09,39.96 8.15,47.90 -2.78,39.96 1.39,27.10 14.91,27.10" fill="#FFFFFF"/>
    </g>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
