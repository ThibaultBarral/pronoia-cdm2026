"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Infinity as InfinityIcon, RotateCcw, AlertCircle, Settings } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout-client";
import { restoreSubscription } from "@/actions/restore-subscription";
import { planName, type Plan, type PaidPlan } from "@/lib/plans";

const MINI_INCLUDED = ["5 analyses IA par mois", "Analyse complète : scénario, probas & xG", "Forme, H2H & compositions"];
const MINI_EXCLUDED = ["Value bets du jour", "Bankroll & suivi du ROI", "Chat IA contextuel", "Historique illimité"];

/**
 * Sober, no-trial pricing page — inspired by mobile-app paywalls that push a
 * single "hero" offer: Pro yearly gets the highlighted card (pre-selected
 * visual weight, "-50%" anchor), Pro monthly and Lifetime sit below, and Mini
 * (the capped entry offer) is deliberately understated at the bottom — but
 * expands to its own explicit included/excluded list on click, so no plan is
 * ever a mystery.
 */
export default function PaywallContent({
  currentPlan,
  hasAccess = false,
  manageUrl = null,
}: {
  currentPlan?: Plan | null;
  hasAccess?: boolean;
  manageUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [restoring, startRestore] = useTransition();
  const [miniOpen, setMiniOpen] = useState(false);

  useEffect(() => {
    if (!hasAccess) trackEvent("paywall_view", { source: "pricing_page" });
  }, [hasAccess]);

  function checkout(plan: PaidPlan) {
    setError(null);
    setInfo(null);
    setPending(plan);
    startTransition(async () => {
      const res = await startCheckout(plan);
      if (res.ok) window.location.href = res.url;
      else {
        setError(res.error);
        setPending(null);
      }
    });
  }

  function restore() {
    setError(null);
    setInfo(null);
    startRestore(async () => {
      const res = await restoreSubscription();
      if (res.ok) {
        setInfo("Accès restauré ✓");
        router.refresh();
      } else setError(res.error);
    });
  }

  const isCurrent = (plan: PaidPlan) => currentPlan === plan;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">
          Passe à Copafever <span className="text-[var(--accent)]">Pro</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2.5">
          Analyses illimitées. Value bets du jour. Bankroll & suivi du ROI.
        </p>
      </div>

      {/* Active subscriber — manage / cancel */}
      {hasAccess && (
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl glass-neon px-5 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text)] font-semibold">
              Abonnement actif{currentPlan ? ` · ${planName(currentPlan)}` : ""}
            </span>
          </div>
          <a
            href={manageUrl ?? "#"}
            target={manageUrl ? "_blank" : undefined}
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              manageUrl
                ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/20"
                : "glass text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            <Settings size={15} /> Gérer / Résilier
          </a>
        </div>
      )}

      {/* Benefit checklist — what Pro (any duration) and Lifetime unlock */}
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
        Inclus avec Pro et l&apos;Accès à vie
      </p>
      <ul className="space-y-2.5 mb-6">
        {[
          "Analyses IA illimitées",
          "Value bets du jour",
          "Bankroll et suivi du ROI",
          "Historique illimité",
        ].map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-[#d0d0d0]">
            <Check size={16} strokeWidth={3} className="shrink-0 text-[var(--accent)]" />
            {f}
          </li>
        ))}
      </ul>

      {/* Pro yearly — the hero offer */}
      <button
        onClick={() => checkout("pro_yearly")}
        disabled={pending === "pro_yearly" || isCurrent("pro_yearly")}
        className="relative w-full text-left rounded-2xl p-4 mb-3 glass-neon glow-neon disabled:opacity-70"
        style={{ borderColor: "rgba(var(--accent-rgb),0.6)", borderWidth: 2 }}
      >
        <span className="absolute -top-3 left-4 inline-flex items-center text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--accent)] text-[#06231a]">
          Meilleure offre · -50%
        </span>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div>
            <div className="text-base font-black text-[var(--text)]">Annuel</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">soit 5 €/mois</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-[var(--text)]">59,99 €</div>
            <div className="text-[11px] text-[var(--text-muted)]">/ an</div>
          </div>
        </div>
        {isCurrent("pro_yearly") && (
          <div className="mt-2 text-xs font-bold text-[var(--accent)]">✓ Offre actuelle</div>
        )}
      </button>

      {/* Pro monthly */}
      <button
        onClick={() => checkout("pro")}
        disabled={pending === "pro" || isCurrent("pro")}
        className="w-full text-left rounded-2xl p-4 mb-3 glass disabled:opacity-70"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-bold text-[var(--text)]">Mensuel</div>
          <div className="text-right">
            <div className="text-lg font-black text-[var(--text)]">9,99 €</div>
            <div className="text-[11px] text-[var(--text-muted)]">/ mois</div>
          </div>
        </div>
        {isCurrent("pro") && <div className="mt-2 text-xs font-bold text-[var(--accent)]">✓ Offre actuelle</div>}
      </button>

      {/* Lifetime */}
      <button
        onClick={() => checkout("lifetime")}
        disabled={pending === "lifetime" || isCurrent("lifetime")}
        className="w-full text-left rounded-2xl p-4 mb-6 glass disabled:opacity-70"
      >
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 bg-[#ffd700]/15 text-[#ffd700]">
          <InfinityIcon size={11} /> Accès à vie
        </span>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-bold text-[var(--text)]">À vie</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              ≈ 1 an et demi d&apos;annuel, sans abonnement
            </div>
          </div>
          <div className="text-lg font-black text-[var(--text)]">79 €</div>
        </div>
        {isCurrent("lifetime") && <div className="mt-2 text-xs font-bold text-[var(--accent)]">✓ Offre actuelle</div>}
      </button>

      {/* Main CTA */}
      <button
        onClick={() => checkout("pro_yearly")}
        disabled={pending === "pro_yearly" || isCurrent("pro_yearly")}
        className="w-full rounded-2xl py-4 text-base font-black text-[#06231a] transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #0fb5a0, var(--accent))" }}
      >
        {pending === "pro_yearly" ? "Redirection…" : "Débloquer Copafever Pro"}
      </button>
      <p className="text-center text-[11px] text-[var(--text-muted)] mt-2.5">
        59,99 €/an · sans engagement, annulable à tout moment
      </p>

      {(error || info) && (
        <div
          className={`flex items-center justify-center gap-2 text-sm mt-5 rounded-xl px-3 py-2.5 ${
            error
              ? "text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/25"
              : "text-[var(--accent-soft)] bg-[var(--accent)]/10 border border-[var(--accent)]/25"
          }`}
        >
          {error && <AlertCircle size={15} />} {error ?? info}
        </div>
      )}

      {/* Mini — deliberately understated, entry offer, but fully detailed on click */}
      <div className="mt-6 pt-5 border-t border-white/5">
        <button
          onClick={() => setMiniOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left opacity-75 hover:opacity-100 transition-opacity"
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Offre Mini</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Pour tester, à petit prix</div>
          </div>
          <div className="text-sm text-[var(--text-muted)] shrink-0">2,99 € / mois</div>
        </button>

        {miniOpen && (
          <div className="mt-3 space-y-2">
            {MINI_INCLUDED.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[#d0d0d0]">
                <Check size={15} strokeWidth={3} className="shrink-0 text-[var(--accent)]" />
                {f}
              </div>
            ))}
            {MINI_EXCLUDED.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                <X size={15} strokeWidth={3} className="shrink-0" />
                <span className="line-through decoration-[var(--text-muted)]/50">{f}</span>
              </div>
            ))}
            <button
              onClick={() => checkout("mini")}
              disabled={pending === "mini" || isCurrent("mini")}
              className="w-full rounded-xl py-3 mt-2 text-sm font-bold text-[var(--text)] glass hover:bg-white/[0.06] transition-colors disabled:opacity-60"
            >
              {pending === "mini" ? "Redirection…" : "Choisir Mini — 2,99 €/mois"}
            </button>
          </div>
        )}
        {isCurrent("mini") && <div className="mt-2 text-xs font-bold text-[var(--text-muted)]">✓ Offre actuelle</div>}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-3">
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
          Mini et Pro : abonnements annulables à tout moment, sans engagement.
          Accès à vie : un seul paiement, pour toujours.
          <br />
          Les analyses sont fournies à titre informatif. Les paris sportifs comportent des risques ·
          Réservé aux 18 ans et plus · Jouez responsable.
        </p>
        <button
          onClick={restore}
          disabled={restoring}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RotateCcw size={12} /> {restoring ? "Restauration…" : "Déjà payé ? Restaurer"}
        </button>
      </div>
    </div>
  );
}
