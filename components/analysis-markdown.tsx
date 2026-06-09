import React from "react";

/** Minimal inline markdown → styled HTML (bold / italic-accent / code). */
function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#f0f0f0] font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic font-medium">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-[var(--accent)] font-mono text-xs bg-[var(--accent)]/10 px-1 rounded">$1</code>');
}

function sectionColor(heading: string): string {
  const h = heading.toLowerCase();
  if (h.includes("piège") || heading.includes("⚠")) return "var(--amber)";
  if (h.includes("conseil") || h.includes("idées") || heading.includes("💰") || heading.includes("💡"))
    return "var(--accent-soft)";
  if (h.includes("force") || h.includes("savoir") || h.includes("joueur") || heading.includes("🔑") || heading.includes("⭐"))
    return "#ffd700";
  return "var(--accent)";
}

/** Renders the AI analysis markdown (match or team) in the Copafever style. */
export default function AnalysisMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let color = "var(--accent)";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      const heading = line.slice(3);
      const emoji = heading.match(/^\s*(\p{Extended_Pictographic})/u)?.[1] ?? "";
      const title = heading.replace(/^\s*\p{Extended_Pictographic}\s*/u, "");
      color = sectionColor(heading);
      elements.push(
        <div key={i} className="flex items-center gap-2.5 mt-6 mb-3 first:mt-0">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
          >
            {emoji}
          </span>
          <h2 className="text-[15px] font-extrabold tracking-tight" style={{ color }}>
            {title}
          </h2>
        </div>
      );
    } else if (line.startsWith("• ") || line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2.5 text-sm text-[#d0d0d0] leading-relaxed py-1">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        </div>
      );
    } else if (/^confiance\s*:/i.test(line.trim())) {
      elements.push(
        <div
          key={i}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-soft)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-2.5 py-1 mt-2"
          dangerouslySetInnerHTML={{ __html: formatInline(line.trim()) }}
        />
      );
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <div
          key={i}
          className="rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/25 px-4 py-3 mt-1 text-[15px] font-extrabold text-[#f0f0f0]"
        >
          {line.slice(2, -2)}
        </div>
      );
    } else if (line.trim() !== "") {
      elements.push(
        <p
          key={i}
          className="text-sm text-[#c8c8c8] leading-relaxed mt-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  }

  return <>{elements}</>;
}
