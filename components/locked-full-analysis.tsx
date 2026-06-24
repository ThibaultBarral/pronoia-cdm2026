"use client";

import { useTransition } from "react";
import {
  Lock,
  FileText,
  Target,
  Goal,
  Users,
  Dumbbell,
  Flame,
  BarChart3,
  Coins,
} from "lucide-react";
import type { Match } from "@/lib/types";
import LossAversionPaywall from "@/components/loss-aversion-paywall";
import { startCheckout as beginCheckout } from "@/lib/checkout-client";
import { trackEvent } from "@/lib/analytics";

/** A blurred placeholder bar — an honest "there's content here, locked" shape. */
function Ghost({ w = "100%", h = 10 }: { w?: string; h?: number }) {
  return (
    <div
      className="rounded-full bg-white/[0.07]"
      style={{ width: w, height: h, filter: "blur(3px)" }}
      aria-hidden
    />
  );
}

/** One teased analysis section: real title + locked, blurred body. */
function TeaserSection({
  icon: Icon,
  title,
  tag,
  children,
}: {
  icon: typeof Lock;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl glass border border-white/5 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-[var(--accent)]/80 shrink-0" />
        <span className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
          {title}
        </span>
        {tag && (
          <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/20">
            {tag}
          </span>
        )}
        <Lock size={13} className="ml-auto text-[#5a6472] shrink-0" />
      </div>
      <div className="select-none pointer-events-none">{children}</div>
    </div>
  );
}

/** A two-column player-style block (key players / probable scorers). */
function GhostPlayers() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full bg-white/[0.07] shrink-0"
            style={{ filter: "blur(2px)" }}
            aria-hidden
          />
          <div className="flex-1 space-y-1.5">
            <Ghost w={`${55 + ((i * 13) % 35)}%`} h={9} />
            <Ghost w={`${30 + ((i * 7) % 25)}%`} h={7} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Rich, section-by-section locked preview for non-members. Shows the real depth
 * of the full AI analysis (every section titled, content blurred) so the visitor
 * understands what's inside — then converts on the paywall. Sober emerald DA,
 * no fake countdown.
 */
export default function LockedFullAnalysis({ match }: { match: Match }) {
  const [pending, startCheckout] = useTransition();

  function unlock() {
    trackEvent("unlock_ticket_click", { plan: "mensuel", match_id: match.id, source: "locked_mid" });
    startCheckout(async () => {
      const res = await beginCheckout("monthly");
      if (res.ok) window.location.href = res.url;
      else window.location.href = `/login?mode=signup&next=/match/${match.id}`;
    });
  }

  return (
    <div className="space-y-4">
      {/* En-tête de section verrouillée */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)]">
        <Lock size={14} /> Analyse complète IA — réservée aux abonnés
      </div>

      {/* Résumé IA */}
      <TeaserSection icon={FileText} title="Résumé IA approfondi">
        <div className="space-y-2">
          <Ghost w="92%" />
          <Ghost w="100%" />
          <Ghost w="78%" />
        </div>
      </TeaserSection>

      {/* Scénario probable */}
      <TeaserSection icon={Target} title="Scénario le plus probable">
        <div className="space-y-2">
          <Ghost w="85%" />
          <Ghost w="96%" />
        </div>
      </TeaserSection>

      {/* Buteurs probables */}
      <TeaserSection icon={Goal} title="Buteurs probables & 1er buteur" tag="Exclusif">
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Ghost w={`${45 + i * 8}%`} h={10} />
              <div className="ml-auto">
                <Ghost w="48px" h={10} />
              </div>
            </div>
          ))}
        </div>
      </TeaserSection>

      {/* CTA intermédiaire */}
      <button
        onClick={unlock}
        disabled={pending}
        className="w-full rounded-xl py-3 text-sm font-black text-[#06231a] glow-neon transition-transform hover:scale-[1.01] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))" }}
      >
        {pending ? "Redirection…" : "Débloquer l'analyse complète →"}
      </button>

      {/* Joueurs clés */}
      <TeaserSection icon={Users} title="Joueurs clés à suivre">
        <GhostPlayers />
      </TeaserSection>

      {/* Forces & faiblesses */}
      <TeaserSection icon={Dumbbell} title="Forces & faiblesses des 2 équipes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2">
              <Ghost w="40%" h={9} />
              <Ghost w="90%" />
              <Ghost w="75%" />
              <Ghost w="82%" />
            </div>
          ))}
        </div>
      </TeaserSection>

      {/* Prédictions sur les buts */}
      <TeaserSection icon={Flame} title="Prédictions sur les buts" tag="Exclusif">
        <div className="flex items-end gap-1.5 h-20" style={{ filter: "blur(3px)" }} aria-hidden>
          {[40, 65, 90, 75, 55, 80, 45, 60, 35, 50].map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-[var(--accent)]/30 to-[var(--accent)]/10"
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
      </TeaserSection>

      {/* Comparaison statistique avancée */}
      <TeaserSection icon={BarChart3} title="Comparaison statistique avancée">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Ghost w="40px" h={9} />
              <div className="flex-1">
                <Ghost w="100%" h={8} />
              </div>
              <Ghost w="40px" h={9} />
            </div>
          ))}
        </div>
      </TeaserSection>

      {/* Recommandation & value bet */}
      <TeaserSection icon={Coins} title="Recommandation & value bet">
        <div className="space-y-2">
          <Ghost w="60%" h={14} />
          <Ghost w="90%" />
          <div className="flex gap-2 pt-1">
            <Ghost w="80px" h={20} />
            <Ghost w="70px" h={20} />
          </div>
        </div>
      </TeaserSection>

      {/* Paywall final — le hook "tu ne vois qu'une partie" */}
      <div className="pt-1">
        <p className="text-center text-sm text-[#cdd3db] font-semibold mb-1">
          Tu vois l&apos;aperçu gratuit — soit{" "}
          <span className="text-[var(--accent)]">~10%</span> de l&apos;analyse.
        </p>
        <p className="text-center text-xs text-[#7a8290] mb-4">
          Tout ce qui aide vraiment à décider est encore verrouillé.
        </p>
        <LossAversionPaywall match={match} compact />
      </div>
    </div>
  );
}
