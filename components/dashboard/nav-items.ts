import {
  LayoutGrid,
  List,
  Layers,
  Map,
  Trophy,
  Globe,
  TrendingUp,
  History,
  User,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Match the path exactly (used for the Matchs home so sub-routes don't stay active). */
  exact?: boolean;
}

/** Shared dashboard navigation — rendered by both the desktop sidebar and the mobile burger drawer. */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", icon: LayoutGrid, label: "Matchs", exact: true },
  { href: "/dashboard/matchs", icon: List, label: "Tous les matchs" },
  { href: "/dashboard/competitions", icon: Layers, label: "Compétitions" },
  { href: "/dashboard/roadmap", icon: Map, label: "Roadmap" },
  { href: "/dashboard/coupe-du-monde", icon: Trophy, label: "Coupe du monde" },
  { href: "/dashboard/teams", icon: Globe, label: "Équipes" },
  { href: "/dashboard/bankroll", icon: TrendingUp, label: "Bankroll" },
  { href: "/dashboard/historique", icon: History, label: "Historique" },
  { href: "/dashboard/compte", icon: User, label: "Compte" },
  { href: "/dashboard/pricing", icon: Sparkles, label: "Abonnement" },
];
