"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, ShieldCheck, Zap, CalendarDays,
  Infinity as InfinityIcon, Lock, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAYSTYLES, type Playstyle } from "@/lib/bankroll";
import { SEGMENTS, type Segment } from "@/lib/onboarding";
import { visibleOffers, type PaidPlan } from "@/lib/plans";
import { startCheckout as beginCheckout } from "@/lib/checkout-client";
import { getFeaturedMatchId } from "@/actions/get-matches";
import { useSubscription } from "@/lib/use-subscription";
import { FEATURE } from "@/lib/feature-flags";
import { trackEvent } from "@/lib/analytics";

const PLAN_ICONS: Record<PaidPlan, LucideIcon> = {
  weekly: Zap,
  monthly: CalendarDays,
  season: CalendarDays,
  lifetime: InfinityIcon,
  pass_cdm: Zap,
};

export default function OnboardingPage() {
  return FEATURE.onboardingV2 ? <OnboardingV2 /> : <OnboardingLegacy />;
}

// ─── Feature 3 — Segmentation → Pricing ───────────────────────────────────────

function OnboardingV2() {
  const router = useRouter();
  const sub = useSubscription();
  const [step, setStep] = useState<1 | 2>(1);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [pending, setPending] = useState<PaidPlan | null>(null);
  const [checkingOut, startCheckout] = useTransition();
  const [entering, startEnter] = useTransition();

  useEffect(() => {
    if (step === 2) trackEvent("onboarding_pricing_view", { segment: segment?.id });
  }, [step, segment]);

  function pickSegment(s: Segment) {
    setSegment(s);
    setError(null);
    startSave(async () => {
      const supabase = createClient();
      // Store the experience segment AND derive a default playstyle so analyses
      // are personalised immediately (and the middleware bettor_profile gate clears).
      const { error } = await supabase.auth.updateUser({
        data: { experience_segment: s.id, bettor_profile: s.playstyle },
      });
      if (error) {
        setError("Impossible d'enregistrer. Réessaie.");
        return;
      }
      trackEvent("onboarding_profile_select", { segment: s.id });
      setStep(2);
    });
  }

  function checkout(plan: PaidPlan) {
    setError(null);
    setPending(plan);
    startCheckout(async () => {
      const res = await beginCheckout(plan);
      if (res.ok) window.location.href = res.url;
      else {
        setError(res.error);
        setPending(null);
      }
    });
  }

  // Land the new user straight inside a match analysis (auto-generated) rather
  // than the dashboard → they hit the "aha moment" in seconds. Falls back to the
  // dashboard if no featured match is available.
  function continueFree() {
    trackEvent("onboarding_free_continue", { segment: segment?.id });
    startEnter(async () => {
      const id = await getFeaturedMatchId().catch(() => null);
      router.refresh();
      router.push(id ? `/match/${id}?welcome=1` : "/dashboard");
    });
  }

  const isMember = sub?.access ?? false;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-3xl mb-8">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
          <span className={step === 1 ? "text-[var(--accent)] font-bold" : ""}>1 · Ton profil</span>
          <span className={step === 2 ? "text-[var(--accent)] font-bold" : ""}>2 · Ton offre</span>
        </div>
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="text-3xl mb-3">👋</div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
              Quel type de parieur es-tu ?
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
              Ça nous aide à adapter les analyses et les conseils à ton profil. Tu pourras
              changer plus tard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SEGMENTS.map((s, i) => {
              const active = segment?.id === s.id;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => pickSegment(s)}
                  disabled={saving}
                  className={`text-left rounded-2xl p-5 transition-all disabled:opacity-60 ${
                    active ? "glass-neon glow-neon" : "glass hover:bg-white/[0.05]"
                  }`}
                  style={active ? { borderColor: "rgba(var(--accent-rgb),0.5)" } : undefined}
                >
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <div className="text-base font-black text-[var(--text)]">{s.label}</div>
                  <div className="text-xs text-[var(--accent-soft)] font-semibold mb-3">{s.tagline}</div>
                  <ul className="space-y-1.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)] leading-snug">
                        <Check size={12} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
          {error && <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>}
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Retour
          </button>

          {isMember ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🎉</div>
              <h1 className="text-2xl font-black text-[var(--text)]">Tu es déjà membre</h1>
              <p className="text-sm text-[var(--text-muted)] mt-2">Profite de tes analyses illimitées.</p>
              <button
                onClick={continueFree}
                disabled={entering}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-6 py-3 text-sm glow-neon disabled:opacity-60"
              >
                {entering ? "Chargement…" : <>Voir une analyse <ArrowRight size={15} /></>}
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
                  Débloque tes analyses
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Commence gratuitement, ou passe en illimité. Sans engagement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
                {visibleOffers().map((o) => {
                  const Icon = PLAN_ICONS[o.plan];
                  const gold = o.plan === "lifetime";
                  const highlight = o.highlight;
                  const accentColor = gold ? "#ffd700" : "var(--accent)";
                  const loading = pending === o.plan;
                  return (
                    <div
                      key={o.plan}
                      className={`relative flex flex-col rounded-3xl p-5 ${highlight ? "glass-neon glow-neon" : "glass"}`}
                      style={
                        highlight
                          ? { borderColor: "rgba(var(--accent-rgb),0.55)" }
                          : gold
                            ? { borderColor: "rgba(255,215,0,0.30)" }
                            : undefined
                      }
                    >
                      {o.badge && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap"
                          style={gold ? { background: "#ffd700", color: "#1a1300" } : { background: "var(--accent)", color: "#06231a" }}
                        >
                          {gold && <InfinityIcon size={11} />} {o.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: gold ? "rgba(255,215,0,0.12)" : "rgba(var(--accent-rgb),0.12)" }}>
                          <Icon size={16} style={{ color: accentColor }} />
                        </span>
                        <h3 className="text-lg font-black text-[var(--text)]">{o.name}</h3>
                      </div>
                      <div className="flex items-end gap-1.5 mb-1">
                        <span className="text-3xl leading-none font-black" style={{ color: gold ? "#ffd700" : "var(--text)" }}>{o.priceLabel}</span>
                        <span className="text-xs text-[var(--text-muted)] mb-1">{o.unit}</span>
                      </div>
                      {o.plan === "monthly" && (
                        <p className="text-[11px] font-bold text-[var(--accent)] mb-2">
                          Analyses illimitées — pas de système de crédits
                        </p>
                      )}
                      <ul className="space-y-2 my-3 flex-1">
                        {o.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-[#d0d0d0]">
                            <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => checkout(o.plan)}
                        disabled={loading}
                        className="w-full rounded-xl py-3 text-sm font-black text-[#06231a] transition-transform hover:scale-[1.02] disabled:opacity-60"
                        style={{
                          background: gold
                            ? "linear-gradient(135deg, #f5b800, #ffd700)"
                            : highlight
                              ? "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))"
                              : "linear-gradient(135deg, #0fb5a0, var(--accent))",
                        }}
                      >
                        {loading ? "Redirection…" : o.ctaLabel}
                      </button>
                    </div>
                  );
                })}
              </div>

              {error && <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>}

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-5 text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1"><ShieldCheck size={12} className="text-[var(--accent)]" /> Paiement sécurisé</span>
                <span className="inline-flex items-center gap-1"><Zap size={12} className="text-[var(--accent)]" /> Accès immédiat</span>
                <span className="inline-flex items-center gap-1"><Lock size={12} className="text-[var(--accent)]" /> Résiliable à tout moment</span>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={continueFree}
                  disabled={entering}
                  className="text-xs text-[#5a6472] hover:text-[#9aa3b2] transition-colors underline disabled:opacity-60"
                >
                  {entering ? "Chargement…" : "Essayer gratuitement"}
                </button>
              </div>

              <p className="text-[10px] text-[#5a6472] text-center mt-6">
                18+ · Jouer comporte des risques · joueurs-info-service.fr · 09 74 75 13 13
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Legacy onboarding (flag off) — playstyle picker, unchanged behaviour ─────

function OnboardingLegacy() {
  const router = useRouter();
  const [selected, setSelected] = useState<Playstyle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { bettor_profile: selected } });
      if (error) {
        setError("Impossible d'enregistrer ton profil. Réessaie.");
        return;
      }
      router.refresh();
      router.push("/dashboard");
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">👋</div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">Quel parieur es-tu ?</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
            Ça nous aide à te proposer des paris adaptés à ton style dans chaque analyse. Tu pourras changer plus tard.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLAYSTYLES.map((p, i) => {
            const active = selected === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(p.id)}
                className={`text-left rounded-2xl p-5 transition-all ${active ? "glass-neon glow-neon" : "glass hover:bg-white/[0.05]"}`}
                style={active ? { borderColor: "rgba(var(--accent-rgb),0.5)" } : undefined}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? "bg-[var(--accent)]" : "border border-white/15"}`}>
                    {active && <Check size={12} strokeWidth={3} color="#06231a" />}
                  </span>
                </div>
                <div className="text-base font-black text-[var(--text)]">{p.label}</div>
                <div className="text-xs text-[var(--accent-soft)] font-semibold mb-1.5">{p.tagline}</div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.description}</p>
              </motion.button>
            );
          })}
        </div>
        {error && <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>}
        <button
          onClick={confirm}
          disabled={!selected || isPending}
          className="mt-6 w-full max-w-sm mx-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-[#06231a] font-bold py-3.5 text-sm hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-50"
        >
          {isPending ? "Enregistrement…" : "C'est parti"}
          {!isPending && <ArrowRight size={16} />}
        </button>
      </div>
    </main>
  );
}
