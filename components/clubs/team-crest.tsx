/** Club crest (API-Football CDN) with a monogram fallback. Server- and client-safe. */
export default function TeamCrest({
  logo,
  name,
  size = 40,
  className = "",
}: {
  logo?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const monogram = name
    .replace(/\b(FC|CF|AC|AS|SC|SS|RC|CD|UD|SD|FK|BK|AFC|CFC)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={size * 0.7} height={size * 0.7} className="object-contain" loading="lazy" />
      ) : (
        <span className="text-[11px] font-black text-[#c3cbe3]">{monogram || "?"}</span>
      )}
    </span>
  );
}
