"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useSubscription } from "@/lib/use-subscription";
import { FREE_ANALYSES_LIMIT } from "@/lib/plans";
import { FEATURE } from "@/lib/feature-flags";

/**
 * Mobile-only persistent free-quota nudge for non-members (the sidebar counter
 * is desktop-only). Sits above the bottom nav. Hidden for members / signed-out.
 */
export default function PremiumNudge() {
  const sub = useSubscription();
  if (!FEATURE.lockedNav || !sub || sub.access) return null;

  const remaining = Math.max(0, FREE_ANALYSES_LIMIT - sub.freeAnalysesUsed);

  return (
    <Link
      href="/dashboard/pricing"
      className="md:hidden fixed inset-x-3 z-30 flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-2xl"
      style={{
        bottom: "calc(4rem + env(safe-area-inset-bottom))",
        background: "linear-gradient(135deg, var(--accent-strong), var(--accent-soft))",
      }}
    >
      <Gift size={15} className="text-[#06231a] shrink-0" />
      <span className="text-xs font-bold text-[#06231a] flex-1 min-w-0 truncate">
        Plan gratuit ·{" "}
        {remaining > 0 ? `${remaining} analyse découverte restante` : "analyse utilisée"}
      </span>
      <span className="text-xs font-black text-[#06231a] shrink-0">Voir les plans →</span>
    </Link>
  );
}
