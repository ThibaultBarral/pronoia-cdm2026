"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Sparkles, Wallet, Sliders } from "lucide-react";
import { useSubscription } from "@/lib/use-subscription";
import { computeStats, loadBankroll, PLAYSTYLES, type Playstyle } from "@/lib/bankroll";
import { loadUserBankroll } from "@/lib/supabase/bankroll-db";
import { createClient } from "@/lib/supabase/client";
import { recommendStake, parseOdds } from "@/lib/staking";
import { valueBadge, fmtCote } from "@/lib/value";
import { DISCLAIMER, type MatchAnalysisData } from "@/lib/analysis-schema";

const PLAYSTYLE_LABEL = Object.fromEntries(
  PLAYSTYLES.map((p) => [p.id, p.label])
) as Record<Playstyle, string>;

/**
 * Inline upsell shown to Essential members in place of the Premium-only betting
 * recommendation (value bet, odds, personalised € stake).
 */
function PremiumUpsell({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Link
      href="/dashboard/pricing"
      className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.05] p-4 hover:bg-[var(--accent)]/[0.09] transition-colors"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/12 shrink-0">
        <Sparkles size={15} className="text-[var(--accent)]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[#f0f0f0]">{title}</div>
        <div className="text-xs text-[var(--text-muted)]">{subtitle}</div>
      </div>
      <span className="text-[var(--accent)] text-sm font-bold shrink-0">Premium →</span>
    </Link>
  );
}

/**
 * The betting toolkit — deliberately kept OFF the match analysis page and moved
 * here (its own section). Reads the already-generated analysis payload, so no
 * re-generation is needed. Personalises the stake against the user's bankroll.
 */
export default function MatchBetting({
  analysis,
}: {
  analysis: MatchAnalysisData;
}) {
  const sub = useSubscription();
  // Feature-tiered gating: Essential has analysis access but not the betting
  // toolkit (value bets + personalised stake). Every other paid plan + VIP do.
  const hasToolkit = sub?.access === true && sub.plan !== "essential";
  const canValueBets = hasToolkit;

  // Live bankroll + bettor profile → personalised € stake on the recommendation.
  const [bankroll, setBankroll] = useState<{ amount: number; playstyle?: Playstyle } | null>(null);
  const [bankrollReady, setBankrollReady] = useState(false);
  // Which profile's recommendation is being previewed (null → follow the user's
  // saved profile). Lets users compare play styles without changing their default.
  const [activeProfile, setActiveProfile] = useState<Playstyle | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: { user } }, br] = await Promise.all([
          supabase.auth.getUser(),
          loadUserBankroll(),
        ]);
        if (!active) return;
        const profile =
          (user?.user_metadata?.bettor_profile as Playstyle | undefined) ??
          br?.playstyle;
        const source = br ?? loadBankroll();
        if (source) {
          setBankroll({ amount: computeStats(source).currentAmount, playstyle: profile });
        } else if (profile) {
          setBankroll({ amount: 0, playstyle: profile });
        }
      } catch {
        /* no bankroll → the block shows a setup CTA */
      } finally {
        if (active) setBankrollReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The profile being previewed defaults to the user's saved profile, then to
  // the canonical value pick. Per-profile recs are absent on older analyses.
  const profileRecs = analysis.recommendationsByProfile;
  const effectiveProfile: Playstyle = activeProfile ?? bankroll?.playstyle ?? "opportunist";
  const rec = profileRecs?.[effectiveProfile] ?? analysis.recommendation;
  // "Banker" = the Prudent pick: the most likely outcome, proposed even without
  // value → shown as a probability-based pick, never as "no value / don't bet".
  const isBanker = rec?.basis === "probability";
  const stakeAdvice =
    rec && bankroll && bankroll.amount > 0
      ? recommendStake(bankroll.amount, effectiveProfile, rec.confidence, parseOdds(rec.odds))
      : null;

  return (
    <div className="space-y-4">
      {/* Essential : la reco value bet est réservée à Premium */}
      {!canValueBets && (
        <PremiumUpsell
          title="Value bets & recommandation de pari"
          subtitle="Le pari à miser, la cote, la value détectée et la mise conseillée"
        />
      )}

      {/* Recommendation — with a per-profile toggle (preview only, never
          changes the user's saved profile). */}
      {canValueBets && rec && (
        <div>
          {profileRecs && (
            <div className="mb-2.5">
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">
                <Sliders size={12} className="text-[var(--accent)]" /> Voir selon ton style de pari
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLAYSTYLES.map((ps) => {
                  const isActive = ps.id === effectiveProfile;
                  return (
                    <button
                      key={ps.id}
                      onClick={() => setActiveProfile(ps.id)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        isActive
                          ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40"
                          : "glass text-[var(--text-muted)] border border-transparent hover:text-[#cdd3db] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{ps.emoji}</span> {ps.label}
                    </button>
                  );
                })}
              </div>
              {bankroll?.playstyle && effectiveProfile !== bankroll.playstyle && (
                <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                  Aperçu — ton profil reste «&nbsp;{PLAYSTYLE_LABEL[bankroll.playstyle]}&nbsp;».
                </p>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl p-4 ${
              isBanker
                ? "glass border border-[var(--accent)]/25"
                : rec.valueTier === "none"
                  ? "glass border border-[#ef4444]/20"
                  : rec.valueTier === "marginal"
                    ? "glass border border-[#ffd700]/25"
                    : "glass-neon glow-neon"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[var(--accent)] mb-2">
              <Coins size={15} />
              <span className="text-xs font-black uppercase tracking-wide">Notre recommandation</span>
            </div>

            {isBanker ? (
              <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-full mb-2 bg-[var(--accent)]/12 text-[var(--accent)]">
                🛡️ Le pari le plus probable
              </span>
            ) : (() => {
              const tier = rec.valueTier;
              if (!tier) return null;
              const b = valueBadge(tier);
              const cls =
                b.tone === "ok"
                  ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                  : b.tone === "warn"
                    ? "bg-[#ffd700]/12 text-[#ffd700]"
                    : "bg-[#ef4444]/12 text-[#ef4444]";
              return (
                <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full mb-2 ${cls}`}>
                  {b.label}
                </span>
              );
            })()}

            <div className="text-base font-black text-[#f0f0f0]">
              {rec.bet}
              {rec.odds && (
                <span className="text-[var(--accent)]">
                  {" "}— cote {rec.odds}
                  {rec.bookmaker ? ` (${rec.bookmaker})` : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-[#aaa] mt-1.5 leading-relaxed">{rec.rationale}</p>

            {/* Banker → on montre la probabilité ; value → cote mini vs actuelle */}
            {isBanker ? (
              rec.probaModele != null && (
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Probabilité estimée :{" "}
                  <span className="font-bold text-[#cdd3db]">{rec.probaModele}%</span>
                  {rec.odds ? <> · Cote : <span className="font-bold text-[#cdd3db]">{rec.odds}</span></> : null}
                </p>
              )
            ) : (
              rec.coteMin != null && rec.odds && (
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Cote min. pour value :{" "}
                  <span className="font-bold text-[#cdd3db]">{fmtCote(rec.coteMin)}</span>{" "}
                  · Cote actuelle : <span className="font-bold text-[#cdd3db]">{rec.odds}</span>
                </p>
              )
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] font-bold">
                Confiance : {rec.confidence}
              </span>
              {(!stakeAdvice || (rec.valueTier === "none" && !isBanker)) && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--text-muted)] font-bold">
                  Mise indicative : {rec.stake}
                </span>
              )}
            </div>

            {/* Personalised € stake — for value bets AND the Prudent banker
                (never for a no-value bet in a value profile). */}
            {stakeAdvice && (rec.valueTier !== "none" || isBanker) ? (
              <div className="mt-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--accent)] mb-1.5">
                  <Wallet size={12} /> Mise conseillée pour toi
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-[#f0f0f0] tabular-nums">
                    {stakeAdvice.amount} €
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {stakeAdvice.pct.toLocaleString("fr-FR")}% de ta bankroll ({stakeAdvice.bankroll.toLocaleString("fr-FR")} €)
                  </span>
                </div>
                {stakeAdvice.potentialGain != null && (
                  <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    Si ça passe : <span className="text-[var(--accent)] font-bold">+{stakeAdvice.potentialGain.toLocaleString("fr-FR")} €</span>
                    {" "}· retour {stakeAdvice.potentialReturn?.toLocaleString("fr-FR")} €
                  </div>
                )}
                <p className="mt-2 text-[10px] text-[#5a6472] leading-relaxed">
                  Calculé sur ta bankroll actuelle, le profil «&nbsp;{PLAYSTYLE_LABEL[effectiveProfile]}&nbsp;» et la confiance du pari · plafonné à 5% pour ta sécurité.
                </p>
              </div>
            ) : bankrollReady && (!bankroll || bankroll.amount <= 0) ? (
              <Link
                href="/dashboard/bankroll"
                className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.04] p-3 text-xs text-[var(--text-muted)] hover:bg-[var(--accent)]/[0.08] transition-colors"
              >
                <Wallet size={14} className="text-[var(--accent)] shrink-0" />
                <span>
                  <span className="text-[var(--accent)] font-bold">Configure ta bankroll</span> pour voir le montant exact à miser sur ce pari.
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--text-muted)] text-center">{DISCLAIMER}</p>
    </div>
  );
}
