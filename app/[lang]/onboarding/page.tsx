"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, Search, Trophy, CalendarDays, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAYSTYLES, type Playstyle } from "@/lib/bankroll";
import { getOnboardingMatches, type OnboardMatch } from "@/actions/get-matches";
import { FEATURE } from "@/lib/feature-flags";
import { trackEvent } from "@/lib/analytics";

export default function OnboardingPage() {
  return FEATURE.onboardingV2 ? <OnboardingV2 /> : <OnboardingLegacy />;
}

// ─── Nation → Match onboarding ────────────────────────────────────────────────

interface Nation {
  name: string;
  flag: string;
  rank: number;
}

function OnboardingV2() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [matches, setMatches] = useState<OnboardMatch[] | null>(null);
  const [nation, setNation] = useState<Nation | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entering, startEnter] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("onboarding_nation_view");
    getOnboardingMatches()
      .then(setMatches)
      .catch(() => setMatches([]));
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

  // Matches involving the chosen nation (soonest first). Falls back to the top
  // marquee fixtures if that nation has no upcoming match.
  const nationMatches = useMemo<OnboardMatch[]>(() => {
    if (!matches || !nation) return [];
    const own = matches.filter((m) => m.home.name === nation.name || m.away.name === nation.name);
    if (own.length) return own;
    return [...matches]
      .sort((a, b) => a.home.rank + a.away.rank - (b.home.rank + b.away.rank))
      .slice(0, 6);
  }, [matches, nation]);

  function pickNation(n: Nation) {
    setNation(n);
    setError(null);
    trackEvent("onboarding_nation_select", { nation: n.name });
    setStep(2);
  }

  // Persist the supported nation + a sensible default playstyle (clears the
  // middleware bettor_profile gate), then land on the match analysis. The first
  // full analysis is free; the paywall takes over from the second.
  function analyze(matchId: string) {
    setError(null);
    setPendingId(matchId);
    trackEvent("onboarding_match_select", { nation: nation?.name, matchId });
    startEnter(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { supported_nation: nation?.name ?? null, bettor_profile: "balanced" as Playstyle },
      });
      if (error) {
        setError("Impossible d'enregistrer. Réessaie.");
        setPendingId(null);
        return;
      }
      router.refresh();
      router.push(`/match/${matchId}`);
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-3xl mb-8">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
          <span className={step === 1 ? "text-[var(--accent)] font-bold" : ""}>1 · Ta nation</span>
          <span className={step === 2 ? "text-[var(--accent)] font-bold" : ""}>2 · Ton match</span>
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
          <div className="text-center mb-7">
            <div className="text-3xl mb-3">⚽️</div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
              Quelle nation tu <span className="text-[var(--accent)]">supportes</span> ?
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
              On te met ses matchs en premier et on prépare ta première analyse offerte.
            </p>
          </div>

          <div className="relative max-w-md mx-auto mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cherche une nation (France, Brésil, Argentine…)"
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
                  Aucune nation trouvée pour « {query} ».
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Changer de nation
          </button>

          <div className="text-center mb-6">
            <div className="text-3xl mb-2">{nation?.flag}</div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
              Quel match veux-tu <span className="text-[var(--accent)]">analyser</span> ?
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {nationMatches.some((m) => m.home.name === nation?.name || m.away.name === nation?.name)
                ? `Les prochains matchs de ${nation?.name}. Ta première analyse est offerte.`
                : `Pas de match à venir pour ${nation?.name} — voici les affiches du moment.`}
            </p>
          </div>

          <div className="space-y-2.5">
            {nationMatches.map((m, i) => {
              const loading = pendingId === m.id;
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => analyze(m.id)}
                  disabled={entering}
                  className="group w-full flex items-center gap-3 rounded-2xl glass hover:glass-neon hover:glow-neon transition-all p-4 disabled:opacity-60"
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
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {error && <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-6">
            <Trophy size={12} className="text-[var(--accent)]" /> 1ʳᵉ analyse offerte · sans carte bancaire
          </p>
          <p className="text-[10px] text-[#5a6472] text-center mt-3">
            18+ · Jouer comporte des risques · joueurs-info-service.fr · 09 74 75 13 13
          </p>
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
