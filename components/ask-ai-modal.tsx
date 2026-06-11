"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleQuestion, X, Send, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { askMatchQuestion } from "@/actions/ask-ai";
import { AUTH_REQUIRED, PAYWALL_REQUIRED } from "@/lib/plans";

export default function AskAiModal({ match }: { match: Match }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function ask() {
    setAnswer(null);
    setError(null);
    setLocked(false);
    startTransition(async () => {
      const res = await askMatchQuestion(match, q);
      if (res.ok) {
        setAnswer(res.answer);
        return;
      }
      if (res.error === AUTH_REQUIRED) {
        router.push(`/login?next=/match/${match.id}`);
        return;
      }
      if (res.error === PAYWALL_REQUIRED) {
        setLocked(true);
        return;
      }
      setError(res.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20 font-bold px-4 py-2.5 text-sm transition-colors"
      >
        <MessageCircleQuestion size={16} /> Poser une question précise à l&apos;IA
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl glass-strong p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <MessageCircleQuestion size={18} className="text-[var(--accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[var(--text)]">Question à l&apos;IA</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>

            {locked ? (
              <div className="flex flex-col items-center gap-3 text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <Lock size={20} className="text-[var(--accent)]" />
                </div>
                <p className="text-sm text-[var(--text)] font-semibold">Réservé au Mensuel & Accès à vie</p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs">
                  Le chat IA contextuel est inclus dans le Mensuel et l&apos;Accès à vie. Pose
                  des questions illimitées à l&apos;IA sur chaque match.
                </p>
                <Link
                  href="/dashboard/pricing"
                  className="rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-5 py-2.5 text-sm glow-neon"
                >
                  Voir les offres
                </Link>
              </div>
            ) : (
              <>
                <div className="relative">
                  <textarea
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Ex. La France peut-elle gagner sans encaisser ? Quel pari sur le nombre de buts ?"
                    className="w-full rounded-2xl glass px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/40 resize-none"
                  />
                </div>
                <button
                  onClick={ask}
                  disabled={pending || !q.trim()}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-[#06231a] font-bold py-3 text-sm hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-60"
                >
                  {pending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#06231a]/40 border-t-[#06231a] animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {pending ? "L'IA réfléchit…" : "Demander"}
                </button>

                {error && (
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 text-xs text-[#ef4444]">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                  </div>
                )}

                {answer && (
                  <div className="mt-4 rounded-2xl glass-neon p-4">
                    <p className="text-sm text-[#e5e5e5] leading-relaxed whitespace-pre-line">
                      {answer}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-3">
                      Réponse IA à titre informatif uniquement.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
