const SIZES = {
  sm: "w-11 h-11 text-2xl rounded-xl",
  lg: "w-20 h-20 text-5xl md:w-24 md:h-24 md:text-6xl rounded-2xl",
} as const;

interface FlagTileProps {
  flag: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Flag emoji framed in a soft rounded tile — shared "app-like" identity for
 * team flags across the hero card and match tiles (instead of raw emoji). */
export default function FlagTile({ flag, size = "sm", className = "" }: FlagTileProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.06] ${SIZES[size]} ${className}`}
    >
      {flag}
    </span>
  );
}
