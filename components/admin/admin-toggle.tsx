"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";
import { setAdminAction } from "@/actions/admin";

export default function AdminToggle({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setAdminAction(email, !isAdmin);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 transition-colors disabled:opacity-50 ${
        isAdmin
          ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/25"
          : "border border-white/10 text-[#888] hover:text-[var(--accent)] hover:border-[var(--accent)]/25"
      }`}
      title={isAdmin ? "Retirer admin" : "Rendre admin"}
    >
      {isAdmin ? <Shield size={11} /> : <ShieldOff size={11} />}
      {isAdmin ? "Admin" : "—"}
    </button>
  );
}
