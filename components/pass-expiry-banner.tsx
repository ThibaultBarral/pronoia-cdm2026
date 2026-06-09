import { CalendarClock } from "lucide-react";
import type { SubscriptionView } from "@/lib/plans";

const DAY = 86_400_000;

/**
 * Reassurance banner shown when a paid window is approaching its end:
 * - Pass CDM within 14 days of 19 July 2026
 * - a canceled recurring sub before its period end
 * Renders nothing otherwise (lifetime, free, far-off, …).
 */
export default function PassExpiryBanner({
  sub,
  className = "",
}: {
  sub: SubscriptionView;
  className?: string;
}) {
  if (!sub.access || sub.plan === "lifetime" || !sub.currentPeriodEnd) return null;

  const end = Date.parse(sub.currentPeriodEnd);
  const daysLeft = Math.ceil((end - Date.now()) / DAY);
  const soon = sub.plan === "pass_cdm" ? daysLeft <= 14 : sub.cancelAtPeriodEnd;
  if (!soon || daysLeft < 0) return null;

  const date = new Date(end).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const label =
    sub.plan === "pass_cdm"
      ? `Ton Pass CDM expire le ${date}.`
      : `Ton abonnement se termine le ${date}.`;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ${className}`}
      style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", color: "#f59e0b" }}
    >
      <CalendarClock size={16} className="shrink-0" />
      {label}
    </div>
  );
}
