"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAYSTYLES, type Playstyle } from "@/lib/bankroll";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Playstyle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { bettor_profile: selected },
      });
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
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">
            Quel parieur es-tu ?
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
            Ça nous aide à te proposer des paris adaptés à ton style dans chaque analyse.
            Tu pourras changer plus tard.
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
                className={`text-left rounded-2xl p-5 transition-all ${
                  active ? "glass-neon glow-neon" : "glass hover:bg-white/[0.05]"
                }`}
                style={active ? { borderColor: "rgba(var(--accent-rgb),0.5)" } : undefined}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{p.emoji}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      active ? "bg-[var(--accent)]" : "border border-white/15"
                    }`}
                  >
                    {active && <Check size={12} strokeWidth={3} color="#06231a" />}
                  </span>
                </div>
                <div className="text-base font-black text-[var(--text)]">{p.label}</div>
                <div className="text-xs text-[var(--accent-soft)] font-semibold mb-1.5">
                  {p.tagline}
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.description}</p>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-[#ef4444] text-center mt-4">{error}</p>
        )}

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
