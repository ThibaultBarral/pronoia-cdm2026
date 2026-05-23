"use client";

import { useState, useTransition } from "react";
import { Bot, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import { analyzeMatch } from "@/actions/analyze-match";

interface AIAnalysisProps {
  match: Match;
}


// ─── Markdown renderer ─────────────────────────────────────────────────────

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#f0f0f0] font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#ffd700] not-italic font-medium">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-[#00ff88] font-mono text-xs bg-[#00ff88]/10 px-1 rounded">$1</code>');
}

function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  const sectionColors: Record<string, string> = {
    "⚡": "#ffd700",
    "⚔️": "#ef4444",
    "📊": "#00d4ff",
    "💡": "#00ff88",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      const heading = line.slice(3);
      const emoji = heading.match(/[\u{1F300}-\u{1FFFF}⚡⚔️📊💡]/u)?.[0] ?? "";
      const color = sectionColors[emoji] ?? "#00ff88";
      elements.push(
        <h2
          key={i}
          className="flex items-center gap-2 text-sm font-bold mt-5 mb-2.5 pb-1.5 border-b first:mt-0"
          style={{ color, borderColor: `${color}20` }}
        >
          {heading}
        </h2>
      );

    } else if (line.startsWith("• ") || line.startsWith("- ")) {
      const content = line.slice(2);
      // Detect if line starts with probability data (special formatting)
      const isValueLine = content.startsWith("Prob.") || content.startsWith("Écart:");
      elements.push(
        <div key={i} className="flex gap-2 text-xs text-[#c0c0c0] leading-relaxed py-0.5 group">
          <span
            className="shrink-0 mt-0.5 font-bold"
            style={{ color: isValueLine ? "#00d4ff" : "#00ff88" }}
          >
            ▸
          </span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );

    } else if (line.startsWith("▸ ")) {
      elements.push(
        <div key={i} className="flex gap-2 text-xs text-[#888] leading-relaxed mt-1">
          <span className="text-[#555] shrink-0">▸</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        </div>
      );

    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <div key={i} className="text-sm font-bold text-[#f0f0f0] mt-1">
          {line.slice(2, -2)}
        </div>
      );

    } else if (line.trim() !== "") {
      elements.push(
        <p
          key={i}
          className="text-xs text-[#c0c0c0] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  }

  return <>{elements}</>;
}


// ─── Main component ────────────────────────────────────────────────────────

export default function AIAnalysis({ match }: AIAnalysisProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isStreaming = isPending && content !== "";
  const isLoading = isPending && content === "";

  function handleGenerate() {
    setContent("");

    setError(null);
    setDone(false);

    startTransition(async () => {
      try {
        const result = await analyzeMatch(match);
        if (!result.ok) {
          setError(result.error ?? "Erreur inconnue");
          return;
        }

        const reader = result.stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: doneReading, value } = await reader.read();
          if (doneReading) break;
          buffer += decoder.decode(value, { stream: true });
        }

        // Strip internal usage comment before rendering
        buffer = buffer.replace(/\n<!--PRONOIA_USAGE:.+?-->/, "");

        setContent(buffer);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#1f1f1f] bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f1f1f] bg-gradient-to-r from-[#00ff88]/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
          <Bot size={18} className="text-[#00ff88]" />
        </div>
        <div>
          <div className="font-semibold text-[#f0f0f0] text-sm">Analyse Pronoia IA</div>
          <div className="text-[10px] text-[#555]">Pronoia IA · Format data-driven</div>
        </div>
        {done && (
          <span className="ml-auto text-[10px] text-[#00ff88] border border-[#00ff88]/20 bg-[#00ff88]/5 px-2 py-0.5 rounded-full">
            Analyse complète
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Empty state */}
        {!content && !isLoading && !error && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/5 border border-[#00ff88]/10 flex items-center justify-center animate-pulse-neon">
              <Sparkles size={28} className="text-[#00ff88]" />
            </div>
            <div>
              <p className="text-[#f0f0f0] font-semibold mb-1">Prêt à analyser</p>
              <p className="text-xs text-[#666] max-w-xs leading-relaxed">
                Contexte · Forces & risques · Value bet · Recommandation directe<br/>
                <span className="text-[#444]">Format concis, 100% data-driven</span>
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-[#00ff88] hover:bg-[#00cc6a] text-[#0a0a0a] font-bold px-6 py-2.5 rounded-xl glow-neon transition-all hover:scale-105"
            >
              <Sparkles size={15} className="mr-2" />
              Générer l&apos;analyse IA
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-7 h-7 rounded-full border-2 border-[#00ff88]/20 border-t-[#00ff88] animate-spin-custom" />
            <p className="text-xs text-[#555]">Analyse des données en cours…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 mb-4">
            <AlertCircle size={15} className="text-[#ef4444] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[#ef4444]">Erreur</p>
              <p className="text-[10px] text-[#888] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Streaming content */}
        {(content || isStreaming) && (
          <div className={`${isStreaming ? "streaming-cursor" : ""}`}>
            {content ? (
              <RenderMarkdown text={content} />
            ) : (
              <div className="flex items-center gap-2 py-4">
                <div className="w-5 h-5 rounded-full border-2 border-[#00ff88]/20 border-t-[#00ff88] animate-spin-custom" />
                <span className="text-xs text-[#555]">Analyse en cours…</span>
              </div>
            )}
          </div>
        )}

        {/* Regenerate */}
        {(done || error) && (
          <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex justify-center">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isPending}
              className="border-[#1f1f1f] text-[#666] hover:border-[#00ff88]/30 hover:text-[#00ff88] text-xs"
            >
              <RefreshCw size={12} className="mr-1.5" />
              Regénérer
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
