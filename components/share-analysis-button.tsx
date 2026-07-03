"use client";

import { useState } from "react";
import { Share2, Download, AlertCircle, Gift } from "lucide-react";
import { grantShareReward } from "@/actions/daily-pack";

/**
 * Export the match analysis as a 9:16 image and share it. Available to any
 * signed-in user who generated the analysis. On mobile (supported browsers) it
 * opens the native share sheet (Instagram / TikTok / X / Stories). On desktop it
 * downloads the PNG to post manually.
 *
 * `variant` forces the card style; by default the route auto-detects it from the
 * match status (finished → résultat, otherwise → pronostic).
 */
export default function ShareAnalysisButton({
  matchId,
  title,
  variant,
}: {
  matchId: string;
  title: string;
  variant?: "prono" | "resultat";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);

  async function share() {
    setError(null);
    setReward(null);
    setLoading(true);
    try {
      const url = variant ? `/match/${matchId}/share?v=${variant}` : `/match/${matchId}/share`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Image indisponible. Régénère l'analyse puis réessaie.");
      const blob = await res.blob();
      const file = new File([blob], `copafever-${matchId}.png`, { type: "image/png" });

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `Analyse ${title}`,
          text: `Mon analyse ${title} — Copafever`,
        });
      } else {
        // Desktop fallback → download.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `copafever-${matchId}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      // Reward the share with +1 free analysis (server caps it to once/day).
      const r = await grantShareReward();
      if (r.granted) setReward("+1 analyse gratuite débloquée !");
    } catch (err) {
      // AbortError = user dismissed the share sheet → ignore.
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erreur lors du partage.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={share}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20 font-bold px-4 py-2.5 text-sm transition-colors disabled:opacity-60"
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin" />
        ) : (
          <Share2 size={16} />
        )}
        Partager en image (9:16)
      </button>
      {reward && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]">
          <Gift size={12} /> {reward}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-[11px] text-[#ef4444]">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      <span className="hidden md:flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <Download size={10} /> Sur ordinateur, l&apos;image se télécharge.
      </span>
    </div>
  );
}
