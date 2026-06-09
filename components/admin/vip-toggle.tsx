"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { setFreeAccessAction } from "@/actions/admin";

export default function VipToggle({ email, vip }: { email: string; vip: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setFreeAccessAction(email, !vip);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 transition-colors disabled:opacity-50 ${
        vip
          ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/25"
          : "border border-white/10 text-[#888] hover:text-[var(--accent)] hover:border-[var(--accent)]/25"
      }`}
      title={vip ? "Retirer l'accès gratuit" : "Offrir un accès gratuit"}
    >
      <Gift size={11} />
      {vip ? "VIP" : "—"}
    </button>
  );
}
