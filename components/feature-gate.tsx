"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSubscription } from "@/lib/use-subscription";
import { planHasFeature, type Feature } from "@/lib/plans";

/**
 * Soft client-side gate for Mensuel/Vie-only features (simulator, bracket).
 *
 * The children are always rendered (kept in the DOM/SSR for caching & SEO) but
 * blurred behind a lock + upgrade CTA until the subscription resolves and the
 * active plan is found to include `feature`. Logged-out / Hebdo users stay
 * locked. This is intentionally a soft gate — these are projections, not the
 * core paid analyses (which are hard-gated server-side).
 */
export default function FeatureGate({
  feature,
  label = "Réservé au Mensuel & Accès à vie",
  children,
}: {
  feature: Feature;
  label?: string;
  children: React.ReactNode;
}) {
  const sub = useSubscription();
  const unlocked = !!sub && sub.access && planHasFeature(sub.plan, feature);

  if (unlocked) return <>{children}</>;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center rounded-2xl bg-[#0a0a0a]/40 backdrop-blur-[2px] p-4">
        <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Lock size={18} className="text-[var(--accent)]" />
        </div>
        <p className="text-sm font-bold text-[var(--text)] max-w-xs">{label}</p>
        <Link
          href="/dashboard/pricing"
          className="rounded-xl bg-[var(--accent)] text-[#06231a] font-bold px-5 py-2.5 text-sm glow-neon"
        >
          Voir les offres
        </Link>
      </div>
    </div>
  );
}
