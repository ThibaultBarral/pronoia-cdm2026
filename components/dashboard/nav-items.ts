import { Search, Layers, History, User, Sparkles, type LucideIcon } from "lucide-react";

export interface DashboardNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Match the path exactly (used for the home so sub-routes don't stay active). */
  exact?: boolean;
}

/**
 * Shared dashboard navigation — rendered by both the desktop sidebar and the
 * mobile burger drawer. Deliberately short: analyse a match, browse the
 * competitions, your history, your account, your plan.
 */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", icon: Search, label: "Analyser un match", exact: true },
  { href: "/dashboard/competitions", icon: Layers, label: "Compétitions" },
  { href: "/dashboard/historique", icon: History, label: "Mes analyses" },
  { href: "/dashboard/compte", icon: User, label: "Compte" },
  { href: "/dashboard/pricing", icon: Sparkles, label: "Abonnement" },
];
