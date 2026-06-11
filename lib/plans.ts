/**
 * Monetization model (Whop) — single source of truth.
 *
 * Total paywall: signing up is free and grants ONE discovery analysis; every
 * analysis after that requires access (a paid plan or an active trial).
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

export type Plan = "free" | "pass_cdm" | "weekly" | "monthly" | "lifetime";
export type PaidPlan = Exclude<Plan, "free">;

/** Our normalized subscription status (mapped from Whop's MembershipStatus). */
export type SubStatus = "active" | "trialing" | "expired" | "canceled";

/** Number of free discovery analyses a `free` user gets in total (lifetime). */
export const FREE_ANALYSES_LIMIT = 1;

/** Pass CDM is sold as a tournament pass: access through this instant (incl.). */
export const PASS_CDM_END = "2026-07-19T23:59:59Z";

export interface Offer {
  plan: PaidPlan;
  name: string;
  /** Display price only — the real charge is configured on Whop. */
  priceLabel: string;
  /** Higher "anchor" price shown struck-through next to the real one (urgency). */
  anchorPrice?: string;
  /** Small discount pill next to the anchor, e.g. "-50%". */
  discountLabel?: string;
  /** Urgency line under the price, e.g. "Tarif Coupe du Monde · offre limitée". */
  urgencyLabel?: string;
  /** Unit shown under the price: "/ sem." · "une seule fois". */
  unit: string;
  sublabel: string;
  /** Label of the CTA button on the pricing card. */
  ctaLabel: string;
  /** Optional discreet line under the card (e.g. "~27 € sur le tournoi"). */
  note?: string;
  oneTime?: boolean;
  /** Hidden from the pricing/paywall display, but kept for entitlement of
   *  existing subscribers and webhook plan-id resolution (e.g. Monthly during
   *  the World Cup). */
  hidden?: boolean;
  /** Corner tag, e.g. "PASS CDM · LE PLUS POPULAIRE" / "À VIE". */
  badge?: string;
  badgeKind?: "green" | "life";
  /** Emphasised card (green border + glow). */
  highlight?: boolean;
  /** Bullet features listed inside the pricing card. */
  features: string[];
  /** Features explicitly NOT included — shown struck-through under the list
   *  (e.g. Hebdo: the 3 premium tools reserved to Mensuel). */
  lockedFeatures?: string[];
  /** env var holding the Whop plan id for this offer. */
  envKey: string;
}

/**
 * Display order = paywall hierarchy: Hebdo (gauche), Mensuel (centre/hero),
 * Accès à vie (droite). Pass CDM is `hidden` (retired from sale 2026-06-11) but
 * kept in the array so webhooks / restore / hasFeature keep resolving existing
 * memberships with ALL features until 19 July 2026 (grandfathering).
 */
export const OFFERS: Offer[] = [
  {
    plan: "weekly",
    name: "Hebdo",
    priceLabel: "4,99 €",
    unit: "/ semaine",
    sublabel: "Pour tester l'IA sur la CDM",
    ctaLabel: "Choisir l'Hebdo",
    features: [
      "Analyses IA complètes illimitées",
      "Value bets & cotes en direct",
      "Niveau de confiance par pari",
      "Suivi bankroll & ROI",
    ],
    lockedFeatures: ["Chat IA, simulateur & bracket → réservés au Mensuel"],
    envKey: "WHOP_PLAN_WEEKLY",
  },
  {
    plan: "monthly",
    name: "Mensuel",
    priceLabel: "14,99 €",
    unit: "/ mois",
    sublabel:
      "CDM 2026 incluse · puis Ligue 1, PL, Liga, Serie A, Bundesliga, LDC & LDE",
    ctaLabel: "S'abonner — 14,99 €/mois",
    note: "Analyse illimitée — la concurrence facture 19 €/mois",
    badge: "★ MEILLEUR DEAL",
    badgeKind: "green",
    highlight: true,
    features: [
      "Analyses IA complètes illimitées",
      "Value bets & cotes en direct",
      "Niveau de confiance par pari",
      "Suivi bankroll & ROI",
      "Chat IA contextuel",
      "Simulateur de parcours",
      "Bracket interactif",
      "Toutes les compétitions 2026/27",
      "Annulable à tout moment",
    ],
    envKey: "WHOP_PLAN_MONTHLY",
  },
  {
    plan: "lifetime",
    name: "Accès à vie",
    priceLabel: "59 €",
    anchorPrice: "99 €",
    discountLabel: "-40%",
    urgencyLabel: "Tarif CDM · passe à 99 € le 19 juillet",
    unit: "une seule fois",
    sublabel: "Un seul paiement · toutes les compétitions, pour toujours",
    ctaLabel: "Accès à vie — 59 €",
    note: "Le seul paiement unique — zéro abonnement",
    oneTime: true,
    badge: "À VIE",
    badgeKind: "life",
    features: [
      "Tout le Mensuel, à vie :",
      "Chat IA, simulateur & bracket",
      "Ligue 1 🇫🇷 · Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿 · La Liga 🇪🇸 · Serie A 🇮🇹 · Bundesliga 🇩🇪 · LDC & LDE 🇪🇺",
      "Priorité nouvelles fonctionnalités",
      "Plus jamais de paiement",
    ],
    envKey: "WHOP_PLAN_LIFETIME",
  },
  {
    plan: "pass_cdm",
    name: "Pass CDM 2026",
    priceLabel: "14,99 €",
    unit: "une seule fois",
    // Retiré de la vente le 2026-06-11 (remplacé par le Mensuel comme hero).
    // GARDÉ ici (hidden) pour le grandfathering : les memberships Pass CDM
    // existants conservent TOUTES les features jusqu'au 19/07/2026 via les
    // webhooks / restore / hasFeature. Ne pas supprimer avant cette date.
    hidden: true,
    sublabel: "Accès complet jusqu'au 19 juillet",
    ctaLabel: "Pass CDM",
    oneTime: true,
    features: [
      "Analyses IA complètes illimitées",
      "Chat IA contextuel",
      "Simulateur de parcours",
      "Bracket interactif",
    ],
    envKey: "WHOP_PLAN_PASS_CDM",
  },
];

/** Offers shown in the pricing UI — excludes hidden plans (e.g. Monthly during the WC). */
export const VISIBLE_OFFERS: Offer[] = OFFERS.filter((o) => !o.hidden);

// ── Per-feature entitlements ─────────────────────────────────────────────────

/**
 * Premium features gated above the shared base. Everyone with access (Hebdo /
 * Mensuel / Vie) gets the core product — full unlimited AI analyses, value bets,
 * odds, confidence, bankroll/ROI. These three tools are reserved to Mensuel +
 * Vie (and Pass CDM legacy, grandfathered until 19 July 2026).
 */
export type Feature = "chat_ia" | "simulator" | "bracket";

const PLAN_FEATURES: Record<PaidPlan, Feature[]> = {
  weekly: [],
  pass_cdm: ["chat_ia", "simulator", "bracket"],
  monthly: ["chat_ia", "simulator", "bracket"],
  lifetime: ["chat_ia", "simulator", "bracket"],
};

/**
 * Does this plan include a given premium feature? Free/unknown → false.
 * Note: this is a plan-capability check; the caller must also confirm the
 * subscription is actually active (hasAccess) before granting the feature.
 */
export function planHasFeature(plan: Plan | null | undefined, feature: Feature): boolean {
  if (!plan || plan === "free") return false;
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/** Convenience: active access AND the plan includes the feature. */
export function hasFeature(
  sub: (SubscriptionState & { vip?: boolean }) | null | undefined,
  feature: Feature
): boolean {
  if (!sub) return false;
  // VIP (admin comp) unlocks everything, like full access.
  if (sub.vip) return true;
  return hasAccess(sub) && planHasFeature(sub.plan, feature);
}

export function offerByPlan(plan: Plan): Offer | undefined {
  return OFFERS.find((o) => o.plan === plan);
}

/** Human label for a plan (used in the user menu / banners). */
export function planName(plan: Plan | null | undefined): string | null {
  if (!plan || plan === "free") return null;
  return offerByPlan(plan)?.name ?? null;
}

// ── Access logic (the core gate) ─────────────────────────────────────────────

/** Minimal shape needed to decide access — safe to build client- or server-side. */
export interface SubscriptionState {
  plan: Plan;
  status: SubStatus | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
}

/**
 * Single source of truth for "may this user run an analysis?".
 * - Lifetime: always (while not expired/canceled).
 * - Trialing: until trial_end.
 * - Pass CDM: until current_period_end (forced to 19 July 2026).
 * - Recurring (weekly/monthly): while active, or canceled-but-still-in-period.
 */
export function hasAccess(sub: SubscriptionState | null | undefined): boolean {
  if (!sub || sub.plan === "free") return false;
  const now = Date.now();
  const within = (iso: string | null) => !!iso && now <= Date.parse(iso);

  if (sub.status === "expired") return false;
  if (sub.plan === "lifetime") return sub.status !== "canceled";
  if (sub.status === "trialing") return within(sub.trialEnd);
  if (sub.plan === "pass_cdm") return within(sub.currentPeriodEnd);
  // weekly / monthly
  if (sub.status === "active") return true;
  // canceled at period end but still inside the paid window
  return within(sub.currentPeriodEnd);
}

// ── Server-only resolvers (read env). Never call from client components. ──────

export function planIdForPlan(plan: PaidPlan): string | undefined {
  const offer = offerByPlan(plan);
  return offer ? process.env[offer.envKey] : undefined;
}

export function planForPlanId(planId: string): PaidPlan | null {
  for (const offer of OFFERS) {
    if (process.env[offer.envKey] === planId) return offer.plan;
  }
  return null;
}

// ── Shared, recognizable codes the UI keys off of ────────────────────────────

export const AUTH_REQUIRED = "Connexion requise pour lancer une analyse.";
/** Server returns this when access is denied → client opens <Paywall/>. */
export const PAYWALL_REQUIRED = "PAYWALL_REQUIRED";

/** Subscription view model shared between server (getSubscription) and UI. */
export interface SubscriptionView extends SubscriptionState {
  /** Computed server-side: vip OR hasAccess(). */
  access: boolean;
  /** Free, admin-granted access (comp) — independent from paid plans & admin role. */
  vip: boolean;
  cancelAtPeriodEnd: boolean;
  manageUrl: string | null;
  freeAnalysesUsed: number;
}
