"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FEATURE } from "@/lib/feature-flags";
import { getCelebrationData } from "@/actions/predictions";
import type { WinItem } from "@/lib/predictions";
import CelebrationModal from "./celebration-modal";
import ProofToasts from "./proof-toasts";

/**
 * Fetches verified wins once and drives the celebration modal (today's wins,
 * once/day) + the social-proof toasts (recent wins). Never shows on checkout /
 * onboarding. Fail-safe (no data → renders nothing).
 */
export default function SocialProofGate() {
  const pathname = usePathname();
  const [data, setData] = useState<{ todayWins: WinItem[]; recentWins: WinItem[] } | null>(null);

  useEffect(() => {
    if (!FEATURE.socialProof) return;
    getCelebrationData().then(setData);
  }, []);

  if (!FEATURE.socialProof || !data) return null;

  const quiet =
    pathname.startsWith("/dashboard/pricing") || pathname.startsWith("/onboarding");

  return (
    <>
      {!quiet && <CelebrationModal wins={data.todayWins} />}
      {!quiet && <ProofToasts items={data.recentWins} />}
    </>
  );
}
