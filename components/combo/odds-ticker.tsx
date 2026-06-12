import Link from "next/link";
import type { TickerItem } from "@/lib/combo";

/** Thin scrolling odds bar (CSS marquee, no JS lib). Server component. */
export default function OddsTicker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-white/5 bg-[#060910] overflow-hidden">
      <div className="flex w-max gap-6 py-2 animate-ticker whitespace-nowrap">
        {doubled.map((it, i) => (
          <Link
            key={i}
            href={`/match/${it.matchId}`}
            className="inline-flex items-center gap-2 text-xs shrink-0 hover:opacity-80 transition-opacity"
          >
            <span>{it.homeFlag}{it.awayFlag}</span>
            <span className="text-[#9aa3b2] font-semibold">{it.label}</span>
            <span className="text-[#3a4250]">{it.time}</span>
            <span className="text-[var(--accent)] tabular-nums">{it.home.toFixed(2)}</span>
            <span className="text-[#5a6472] tabular-nums">{it.draw.toFixed(2)}</span>
            <span className="text-[var(--accent)] tabular-nums">{it.away.toFixed(2)}</span>
            <span className="text-white/10 ml-2">•</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
