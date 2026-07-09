"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, Search, Trophy, CalendarDays, Loader2,
  Sparkles, Lock, Mail, X, Activity, Users, Target, ListChecks,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getOnboardingMatches, getOnboardingPrediction, getOnboardingStats,
  type OnboardMatch, type OnboardPrediction,
} from "@/actions/get-matches";
import { trackEvent } from "@/lib/analytics";

export default function OnboardingPage() {
  return <OnboardingV2 />;
}

// ─── Nation → Match → Reveal onboarding funnel ────────────────────────────────

interface Nation {
  name: string;
  flag: string;
  rank: number;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL_STEPS = 6;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function OnboardingV2() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [matches, setMatches] = useState<OnboardMatch[] | null>(null);
  const [stats, setStats] = useState<{ verified: number; winRate: number }>({ verified: 0, winRate: 0 });
  const [nation, setNation] = useState<Nation | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OnboardMatch | null>(null);
  const [prediction, setPrediction] = useState<OnboardPrediction | null>(null);
  const [finishing, startFinish] = useTransition();
  const busyRef = useRef(false);

  useEffect(() => {
    trackEvent("onboarding_nation_view");
    getOnboardingMatches().then(setMatches).catch(() => setMatches([]));
    getOnboardingStats().then(setStats).catch(() => {});
  }, []);

  // Distinct nations from every fixture (home + away), strongest first.
  const nations = useMemo<Nation[]>(() => {
    if (!matches) return [];
    const byName = new Map<string, Nation>();
    for (const m of matches) {
      for (const t of [m.home, m.away]) {
        if (!byName.has(t.name)) byName.set(t.name, { name: t.name, flag: t.flag, rank: t.rank });
      }
    }
    return [...byName.values()].sort((a, b) => a.rank - b.rank);
  }, [matches]);

  const filteredNations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nations;
    return nations.filter((n) => n.name.toLowerCase().includes(q));
  }, [nations, query]);

  // Matches involving the chosen nation (soonest first); falls back to the top
  // marquee fixtures if that nation has no upcoming match.
  const ownMatches = useMemo<OnboardMatch[]>(() => {
    if (!matches || !nation) return [];
    return matches.filter((m) => m.home.name === nation.name || m.away.name === nation.name);
  }, [matches, nation]);
  const otherMatches = useMemo<OnboardMatch[]>(() => {
    if (!matches) return [];
    return [...matches]
      .filter((m) => m.home.name !== nation?.name && m.away.name !== nation?.name)
      .sort((a, b) => a.home.rank + a.away.rank - (b.home.rank + b.away.rank))
      .slice(0, 8);
  }, [matches, nation]);

  function pickNation(n: Nation) {
    setNation(n);
    setError(null);
    trackEvent("onboarding_nation_select", { nation: n.name });
    setStep(2);
  }

  // Persist the supported nation + a default playstyle (clears the middleware
  // bettor_profile gate), then run the free model prediction while the loader
  // plays. No LLM tokens spent here — the deep analysis runs on the match page.
  async function selectMatch(m: OnboardMatch) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setSelected(m);
    setStep(3);
    trackEvent("onboarding_match_select", { nation: nation?.name, matchId: m.id });

    const supabase = createClient();
    supabase.auth.updateUser({
      data: { supported_nation: nation?.name ?? null },
    });

    const [pred] = await Promise.all([
      getOnboardingPrediction(m.id).catch(() => null),
      sleep(2800), // let the "analysis" play out
    ]);
    busyRef.current = false;
    if (!pred) {
      finish(m.id, false);
      return;
    }
    setPrediction(pred);
    setStep(4);
  }

  // Save newsletter consent (optional) and land on the free full analysis.
  function finish(matchId: string, consent: boolean) {
    startFinish(async () => {
      if (consent) {
        const supabase = createClient();
        await supabase.auth
          .updateUser({ data: { marketing_consent: true, marketing_consent_at: new Date().toISOString() } })
          .catch(() => {});
        trackEvent("onboarding_newsletter_optin");
      }
      trackEvent("onboarding_complete", { matchId });
      router.refresh();
      router.push(`/match/${matchId}`);
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Progress dots */}
      <div className="w-full max-w-3xl mb-8 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={false}
              animate={{ width: i < step ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1 · Nation ─────────────────────────────────────────── */}
        {step === 1 && (
          <StepShell key="s1">
            <div className="text-center mb-7">
              <div className="text-3xl mb-3">⚽️</div>
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
                Quelle équipe tu <span className="text-[var(--accent)]">supportes</span> ?
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
                On te met ses matchs en premier — et l&apos;IA prépare ton analyse.
              </p>
            </div>

            <div className="relative max-w-md mx-auto mb-6">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cherche un pays (France, Brésil, Argentine…)"
                className="w-full rounded-xl glass pl-10 pr-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[rgba(var(--accent-rgb),0.5)]"
              />
            </div>

            {matches === null ? (
              <div className="flex justify-center py-12 text-[var(--text-muted)]">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredNations.map((n, i) => (
                  <motion.button
                    key={n.name}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    onClick={() => pickNation(n)}
                    className="flex items-center gap-2.5 rounded-xl glass hover:bg-white/[0.06] hover:border-[rgba(var(--accent-rgb),0.4)] transition-all px-3 py-3 text-left"
                  >
                    <span className="text-2xl leading-none shrink-0">{n.flag}</span>
                    <span className="text-sm font-bold text-[var(--text)] truncate">{n.name}</span>
                  </motion.button>
                ))}
                {filteredNations.length === 0 && (
                  <p className="col-span-full text-center text-sm text-[var(--text-muted)] py-8">
                    Aucun pays trouvé pour « {query} ».
                  </p>
                )}
              </div>
            )}
          </StepShell>
        )}

        {/* ── Step 2 · Match ──────────────────────────────────────────── */}
        {step === 2 && (
          <StepShell key="s2" width="max-w-2xl">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
            >
              <ArrowLeft size={14} /> Changer d&apos;équipe
            </button>

            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
                Quel match on <span className="text-[var(--accent)]">décortique</span> ?
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                Les matchs de {nation?.name} passent en premier.
              </p>
            </div>

            {ownMatches.length > 0 && (
              <MatchGroup
                label={`Les matchs de ${nation?.name}`}
                matches={ownMatches}
                onPick={selectMatch}
                highlight
              />
            )}
            {otherMatches.length > 0 && (
              <MatchGroup label="Autres affiches" matches={otherMatches} onPick={selectMatch} />
            )}

            {error && <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>}

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-6">
              <Trophy size={12} className="text-[var(--accent)]" /> Probabilités calculées sur données réelles
            </p>
          </StepShell>
        )}

        {/* ── Step 3 · Analysing ──────────────────────────────────────── */}
        {step === 3 && selected && (
          <AnalyzingStep key="s3" match={selected} verified={stats.verified} />
        )}

        {/* ── Step 4 · Winner reveal ──────────────────────────────────── */}
        {step === 4 && prediction && (
          <RevealStep key="s4" pred={prediction} onContinue={() => setStep(5)} />
        )}

        {/* ── Step 5 · What Premium unlocks ───────────────────────────── */}
        {step === 5 && prediction && (
          <PremiumStep
            key="s5"
            pred={prediction}
            onContinue={() => setStep(6)}
            onPricing={() => {
              trackEvent("onboarding_pricing_click");
              router.push("/tarifs");
            }}
          />
        )}

        {/* ── Step 6 · Newsletter ─────────────────────────────────────── */}
        {step === 6 && selected && (
          <NewsletterStep
            key="s6"
            busy={finishing}
            onYes={() => finish(selected.id, true)}
            onNo={() => finish(selected.id, false)}
          />
        )}
      </AnimatePresence>

      <p className="text-[10px] text-[#5a6472] text-center mt-8 max-w-md">
        18+ · Jouer comporte des risques · joueurs-info-service.fr · 09 74 75 13 13
      </p>
    </main>
  );
}

// ─── Step building blocks ─────────────────────────────────────────────────────

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function StepShell({
  children,
  width = "max-w-3xl",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <motion.div {...stepMotion} className={`w-full ${width}`}>
      {children}
    </motion.div>
  );
}

function MatchGroup({
  label,
  matches,
  onPick,
  highlight,
}: {
  label: string;
  matches: OnboardMatch[];
  onPick: (m: OnboardMatch) => void;
  highlight?: boolean;
}) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2.5">{label}</p>
      <div className="space-y-2.5">
        {matches.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.3) }}
            onClick={() => onPick(m)}
            className={`group w-full flex items-center gap-3 rounded-2xl p-4 transition-all ${
              highlight ? "glass-neon hover:glow-neon" : "glass hover:bg-white/[0.06]"
            }`}
            style={highlight ? { borderColor: "rgba(var(--accent-rgb),0.4)" } : undefined}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-2xl shrink-0">{m.home.flag}</span>
              <span className="text-sm font-bold text-[var(--text)] truncate">{m.home.name}</span>
              <span className="text-xs text-[var(--text-muted)] px-1.5 shrink-0">vs</span>
              <span className="text-sm font-bold text-[var(--text)] truncate">{m.away.name}</span>
              <span className="text-2xl shrink-0">{m.away.flag}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] shrink-0">
              <CalendarDays size={12} /> {m.date}
            </div>
            <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[#06231a] transition-colors">
              <ArrowRight size={16} />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const CHECKLIST = [
  { icon: Activity, label: "Récupération des stats en temps réel" },
  { icon: Users, label: "Lecture de la forme et des compositions" },
  { icon: Target, label: "Calcul des probabilités" },
  { icon: Sparkles, label: "Génération de la prédiction" },
];

function AnalyzingStep({ match, verified }: { match: OnboardMatch; verified: number }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDone((d) => Math.min(d + 1, CHECKLIST.length)), 650);
    return () => clearInterval(id);
  }, []);
  return (
    <StepShell width="max-w-md">
      <div className="text-center">
        {verified > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full glass-neon px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-xs font-bold text-[var(--accent)] tabular-nums">
              {verified.toLocaleString("fr-FR")} analyses déjà générées
            </span>
          </div>
        )}
        <h1 className="text-2xl font-black text-[var(--text)]">L&apos;IA bosse sur ton match</h1>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm font-bold text-[var(--text)]">
          <span className="text-xl">{match.home.flag}</span>
          {match.home.name} <span className="text-[var(--text-muted)]">–</span> {match.away.name}
          <span className="text-xl">{match.away.flag}</span>
        </div>

        <div className="my-10 flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-2xl" />
            <Loader2 size={96} className="relative animate-spin text-[var(--accent)]" strokeWidth={1.4} />
          </div>
        </div>

        <div className="rounded-2xl glass p-4 text-left space-y-3">
          {CHECKLIST.map((c, i) => {
            const complete = i < done;
            const active = i === done;
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    complete ? "bg-[var(--accent)] text-[#06231a]" : "bg-white/[0.05] text-[var(--text-muted)]"
                  }`}
                >
                  {complete ? <Check size={14} strokeWidth={3} /> : active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                </span>
                <span className={`text-sm ${complete || active ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}

function RevealStep({ pred, onContinue }: { pred: OnboardPrediction; onContinue: () => void }) {
  const draw = pred.favorite === "draw";
  const home = pred.favorite === "home";
  const favName = draw ? "Match nul" : home ? pred.home.name : pred.away.name;
  const favFlag = home ? pred.home.flag : pred.away.flag;
  const favPct = draw ? pred.probabilities.draw : home ? pred.probabilities.home : pred.probabilities.away;

  return (
    <StepShell width="max-w-md">
      <div className="text-center flex flex-col items-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
          {draw ? "Le scénario le plus probable" : "Le favori selon l'IA"}
        </p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="w-28 h-28 rounded-3xl glass-strong flex items-center justify-center text-6xl mb-6"
        >
          {draw ? "🤝" : favFlag}
        </motion.div>
        <h1 className="text-4xl font-black text-[var(--text)]">{favName}</h1>
        <div className="text-5xl font-black text-[var(--accent)] tabular-nums mt-3">{favPct}%</div>
        <p className="text-sm text-[var(--text-muted)] mt-5 leading-relaxed max-w-sm">
          Calculé à partir de vraies données — forme, buts attendus (xG) et confrontations. Pas de hype,
          juste le vrai pourcentage du modèle.
        </p>

        {/* Honest 1X2 mini-bar */}
        <div className="w-full mt-7">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div style={{ width: `${pred.probabilities.home}%` }} className={home && !draw ? "bg-[var(--accent)]" : "bg-[#3a4450]"} />
            <div style={{ width: `${pred.probabilities.draw}%` }} className={draw ? "bg-[var(--accent)]" : "bg-[#2b333d]"} />
            <div style={{ width: `${pred.probabilities.away}%` }} className={!home && !draw ? "bg-[var(--accent)]" : "bg-[#6b7280]"} />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-[var(--text-muted)]">
            <span>{pred.home.name} {pred.probabilities.home}%</span>
            <span>Nul {pred.probabilities.draw}%</span>
            <span>{pred.away.name} {pred.probabilities.away}%</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-9 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-[#06231a] font-bold py-4 text-sm glow-neon hover:bg-[var(--accent-soft)] transition-colors"
        >
          Continuer <ArrowRight size={16} />
        </button>
      </div>
    </StepShell>
  );
}

const LOCKED_FEATURES = [
  "Buteurs & passeurs probables",
  "Score exact & score à la mi-temps",
  "Scénario détaillé du match",
  "Comparaison des forces",
];

function PremiumStep({
  pred,
  onContinue,
  onPricing,
}: {
  pred: OnboardPrediction;
  onContinue: () => void;
  onPricing: () => void;
}) {
  const xgTotal = Math.round((pred.expectedGoals.home + pred.expectedGoals.away) * 10) / 10;
  return (
    <StepShell width="max-w-md">
      <div className="text-center flex flex-col items-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(var(--accent-rgb),0.14)] border border-[rgba(var(--accent-rgb),0.3)] mb-5">
          <Sparkles size={24} className="text-[var(--accent)]" />
        </span>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">Le détail qui change tout</p>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">Passe en Pro</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm">
          L&apos;aperçu, tu l&apos;as déjà. Le <span className="text-[var(--text)] font-semibold">détail</span> — buteurs,
          score exact, scénario — c&apos;est Pro.
        </p>

        {/* Real xG teaser */}
        <div className="w-full mt-6 rounded-2xl glass p-5 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">Buts attendus (xG)</p>
            <p className="text-2xl font-black text-[var(--text)] tabular-nums mt-1">
              {pred.expectedGoals.home} <span className="text-[var(--text-muted)]">–</span> {pred.expectedGoals.away}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">Total</p>
            <p className="text-2xl font-black text-[var(--accent)] tabular-nums mt-1">{xgTotal}</p>
          </div>
        </div>

        {/* Locked list */}
        <div className="w-full mt-3 rounded-2xl glass p-4 space-y-2.5">
          {LOCKED_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3 text-left">
              <Lock size={15} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-sm text-[#c2c8d0]">{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-[#06231a] font-bold py-4 text-sm glow-neon hover:bg-[var(--accent-soft)] transition-colors"
        >
          Voir mon analyse <ArrowRight size={16} />
        </button>
        <button
          onClick={onPricing}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ListChecks size={14} /> Voir les offres
        </button>
      </div>
    </StepShell>
  );
}

function NewsletterStep({
  onYes,
  onNo,
  busy,
}: {
  onYes: () => void;
  onNo: () => void;
  busy: boolean;
}) {
  return (
    <StepShell width="max-w-md">
      <div className="rounded-3xl glass-strong p-8 text-center flex flex-col items-center relative">
        <button
          onClick={onNo}
          aria-label="Fermer"
          className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <X size={20} />
        </button>
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(var(--accent-rgb),0.14)] border border-[rgba(var(--accent-rgb),0.3)] mb-5">
          <Mail size={24} className="text-[var(--accent)]" />
        </span>
        <h1 className="text-2xl font-black text-[var(--text)]">On te tient au courant ?</h1>
        <p className="text-sm text-[var(--text-muted)] mt-3 max-w-xs leading-relaxed">
          Les gros matchs à venir, les analyses qui ont tapé juste et nos offres — direct dans ta boîte mail.
          Désinscription en un clic.
        </p>
        <button
          onClick={onYes}
          disabled={busy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-[#06231a] font-bold py-4 text-sm glow-neon hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Oui, je m'inscris"}
        </button>
        <button
          onClick={onNo}
          disabled={busy}
          className="mt-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-60"
        >
          Non merci
        </button>
      </div>
    </StepShell>
  );
}

