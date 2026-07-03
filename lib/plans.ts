/**
 * Monetization model (Whop) — single source of truth.
 *
 * Tier × duration grid, mirrored on the main competitor:
 *   Découverte (entry, capped) < Pro (full toolkit) < Elite (+ live & perks)
 * offered in Semaine (weekly) / Mensuel (monthly) / À vie (one-time) durations.
 *
 * Gating has two axes:
 *   1. Feature gating — Découverte gets the AI analysis but NOT the betting
 *      toolkit (value bets, scorers, chat, simulator, bracket, bankroll); Pro
 *      unlocks the toolkit; Elite adds live prediction + perks.
 *   2. A monthly analysis quota — only Découverte is capped (MONTHLY_ANALYSIS_LIMIT);
 *      Pro/Elite are unlimited (our edge vs the competitor, who caps every tier).
 *
 * Signing up is free and gives ONE free full analysis ("1er match offert"), then
 * the paywall kicks in. Match facts (stats, form, H2H, line-ups) stay public so
 * pages remain indexable for SEO.
 *
 * Legacy plans (essential / weekly / pass_cdm / season) are kept `hidden` for
 * grandfathering only: existing members keep their entitlements via webhooks /
 * restore / hasFeature.
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

import type { Locale } from "@/lib/i18n/config";

export type Plan =
  | "free"
  // current grid — tier × duration
  | "decouverte" // entry, monthly, capped
  | "monthly" // = Pro monthly (key kept for grandfathering existing Pro/Premium subs)
  | "elite" // Elite monthly
  | "pro_weekly" // Pro weekly
  | "elite_weekly" // Elite weekly
  | "lifetime" // = Elite lifetime (one-time)
  // legacy (grandfathered, hidden from sale)
  | "essential"
  | "weekly"
  | "pass_cdm"
  | "season";
export type PaidPlan = Exclude<Plan, "free">;

/** Our normalized subscription status (mapped from Whop's MembershipStatus). */
export type SubStatus = "active" | "trialing" | "expired" | "canceled";

/**
 * Number of free FULL analyses a `free` user gets in total (lifetime).
 * 1 = "1er match offert" (no card required), then the paywall. The free-analysis
 * plumbing (RPC + free_analyses_used column) enforces it; bump this to change it.
 */
export const FREE_ANALYSES_LIMIT: number = 1;

/**
 * Monthly analysis quota per paid plan. Absent = unlimited. Only the entry tier
 * (Découverte) is capped, to create upgrade pressure while protecting margin.
 * Enforcement lives server-side (ai-guard); this map is the single source.
 */
export const MONTHLY_ANALYSIS_LIMIT: Partial<Record<PaidPlan, number>> = {
  decouverte: 20,
};

/** Pass CDM is sold as a tournament pass: access through this instant (incl.). */
export const PASS_CDM_END = "2026-07-19T23:59:59Z";

/** Pass Saison covers the CDM + the whole 2026/27 club season (access through here). */
export const SEASON_END = "2027-07-31T23:59:59Z";

/** Is the World Cup window still open? (drives the "Pass Coupe du Monde" skin) */
export function cdmIntroActive(now: number = Date.now()): boolean {
  return now <= Date.parse(PASS_CDM_END);
}

/** Billing duration — drives the Semaine / Mensuel / À vie toggle in the UI. */
export type Duration = "week" | "month" | "lifetime";

export interface Offer {
  plan: PaidPlan;
  name: string;
  /** Which duration tab this offer belongs to. */
  duration: Duration;
  /** Display price only — the real charge is configured on Whop. */
  priceLabel: string;
  /** Higher "anchor" price shown struck-through next to the real one (urgency). */
  anchorPrice?: string;
  /** Small discount pill next to the anchor, e.g. "-50%". */
  discountLabel?: string;
  /** Urgency line under the price, e.g. "Tarif Coupe du Monde · offre limitée". */
  urgencyLabel?: string;
  /** Unit shown under the price: "/ semaine" · "/ mois" · "une seule fois". */
  unit: string;
  sublabel: string;
  /** Label of the CTA button on the pricing card. */
  ctaLabel: string;
  /** Optional discreet line under the card (e.g. "~3,46 €/semaine"). */
  note?: string;
  oneTime?: boolean;
  /** Hidden from the pricing/paywall display, but kept for entitlement of
   *  existing subscribers and webhook plan-id resolution (grandfathering). */
  hidden?: boolean;
  /** Corner tag, e.g. "★ MEILLEUR DEAL" / "À VIE". */
  badge?: string;
  badgeKind?: "green" | "life";
  /** Emphasised card (green border + glow). */
  highlight?: boolean;
  /** Bullet features listed inside the pricing card. */
  features: string[];
  /** Features explicitly NOT included — shown struck-through under the list. */
  lockedFeatures?: string[];
  /** env var holding the Whop plan id for this offer. */
  envKey: string;
}

// Reusable feature bullet lists (kept DRY across the weekly/monthly variants).
const PRO_FEATURES = [
  "Analyses IA illimitées",
  "Value bets & cotes + niveau de confiance",
  "Buteurs probables & joueurs clés",
  "Chat IA contextuel",
  "Simulateur & bracket interactif",
  "Suivi bankroll & ROI",
  "Toutes les compétitions, aussi après la Coupe du Monde",
];
const PRO_LOCKED = [
  "Prédiction en direct pendant le match",
  "Support prioritaire & badge fondateur",
];
const ELITE_FEATURES = [
  "Tout Pro, et en plus :",
  "Prédiction en direct pendant le match (score + minute)",
  "Support prioritaire",
  "Badge membre fondateur",
  "Accès anticipé aux futures fonctions",
];

/**
 * Display order = paywall hierarchy. The UI groups by `duration` (Semaine /
 * Mensuel / À vie tabs); within a tab, order = Découverte, Pro (hero), Elite.
 * Legacy plans are `hidden` (retired from sale) but kept in the array so
 * webhooks / restore / hasFeature keep resolving existing memberships.
 */
export const OFFERS: Offer[] = [
  // ── Mensuel ────────────────────────────────────────────────────────────────
  {
    plan: "decouverte",
    name: "Découverte",
    duration: "month",
    priceLabel: "3,99 €",
    unit: "/ mois",
    sublabel: "Pour démarrer — l'analyse IA complète, 20 matchs par mois",
    ctaLabel: "Choisir Découverte — 3,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: [
      "20 analyses IA par mois",
      "Analyse complète : scénario, probas & xG",
      "Forces & faiblesses, forme, H2H & compos",
    ],
    lockedFeatures: [
      "Value bets & cotes",
      "Buteurs probables & joueurs clés",
      "Chat IA, simulateur & bracket",
      "Suivi bankroll & ROI",
    ],
    envKey: "WHOP_PLAN_DECOUVERTE",
  },
  {
    plan: "monthly",
    name: "Pro",
    duration: "month",
    priceLabel: "14,99 €",
    anchorPrice: "29,98 €",
    discountLabel: "-50%",
    unit: "/ mois",
    sublabel:
      "Toute la boîte à outils paris — value bets, buteurs, Chat IA, simulateur",
    ctaLabel: "Choisir Pro — 14,99 €/mois",
    note: "Le meilleur rapport — résiliable à tout moment",
    badge: "★ LE PLUS CHOISI",
    badgeKind: "green",
    highlight: true,
    features: PRO_FEATURES,
    lockedFeatures: PRO_LOCKED,
    envKey: "WHOP_PLAN_MONTHLY",
  },
  {
    plan: "elite",
    name: "Elite",
    duration: "month",
    priceLabel: "24,99 €",
    anchorPrice: "49,98 €",
    discountLabel: "-50%",
    unit: "/ mois",
    sublabel: "Le maximum — prédiction en direct, support prioritaire, badge",
    ctaLabel: "Choisir Elite — 24,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: ELITE_FEATURES,
    envKey: "WHOP_PLAN_ELITE",
  },

  // ── Semaine ────────────────────────────────────────────────────────────────
  {
    plan: "pro_weekly",
    name: "Pro",
    duration: "week",
    priceLabel: "6,99 €",
    anchorPrice: "13,98 €",
    discountLabel: "-50%",
    unit: "/ semaine",
    sublabel: "Toute la boîte à outils paris, juste pour cette semaine",
    ctaLabel: "Choisir Pro — 6,99 €/semaine",
    note: "Sans engagement · résiliable à tout moment",
    highlight: true,
    features: PRO_FEATURES,
    lockedFeatures: PRO_LOCKED,
    envKey: "WHOP_PLAN_PRO_WEEKLY",
  },
  {
    plan: "elite_weekly",
    name: "Elite",
    duration: "week",
    priceLabel: "9,99 €",
    anchorPrice: "19,98 €",
    discountLabel: "-50%",
    unit: "/ semaine",
    sublabel: "Le maximum — prédiction en direct & support prioritaire",
    ctaLabel: "Choisir Elite — 9,99 €/semaine",
    note: "Sans engagement · résiliable à tout moment",
    features: ELITE_FEATURES,
    envKey: "WHOP_PLAN_ELITE_WEEKLY",
  },

  // ── À vie ──────────────────────────────────────────────────────────────────
  {
    plan: "lifetime",
    name: "Elite à vie",
    duration: "lifetime",
    priceLabel: "89 €",
    anchorPrice: "129 €",
    discountLabel: "-31%",
    urgencyLabel: "Tarif de lancement · passe à 129 € le 19 juillet",
    unit: "une seule fois",
    oneTime: true,
    sublabel: "Tout Elite · un seul paiement, pour toujours",
    ctaLabel: "Accès à vie — 89 €",
    note: "Le seul paiement unique — zéro abonnement, à vie",
    badge: "À VIE",
    badgeKind: "life",
    features: [
      "Tout Elite, à vie",
      "Analyses IA illimitées pour toujours",
      "Prédiction en direct pendant le match",
      "Toutes les compétitions 2026/27 et au-delà",
      "Badge membre fondateur",
      "Support prioritaire",
      "Accès à toutes les futures fonctions",
    ],
    envKey: "WHOP_PLAN_LIFETIME",
  },

  // ── Legacy plans — grandfathering only (hidden from sale) ──────────────────
  {
    plan: "essential",
    name: "Essential",
    duration: "month",
    priceLabel: "9,99 €",
    unit: "/ mois",
    hidden: true,
    sublabel: "Ancien plan Essential (récurrent, analyses illimitées)",
    ctaLabel: "Essential",
    features: [
      "Analyses IA illimitées",
      "Analyse complète : scénario, probas & xG",
      "Forces & faiblesses des équipes",
      "Forme, H2H & compositions",
    ],
    envKey: "WHOP_PLAN_ESSENTIAL",
  },
  {
    plan: "weekly",
    name: "Hebdo",
    duration: "week",
    priceLabel: "4,99 €",
    unit: "/ semaine",
    hidden: true,
    sublabel: "Ancien pass hebdo (récurrent)",
    ctaLabel: "Hebdo",
    features: [
      "Analyses IA illimitées",
      "Value bets, buteurs & joueurs clés",
      "Chat IA, simulateur & bracket",
      "Suivi bankroll & ROI",
    ],
    envKey: "WHOP_PLAN_WEEKLY",
  },
  {
    plan: "season",
    name: "Pass Saison",
    duration: "lifetime",
    priceLabel: "39 €",
    unit: "une seule fois",
    oneTime: true,
    hidden: true,
    sublabel: "Ancien pass saison (paiement unique)",
    ctaLabel: "Pass Saison",
    features: [
      "Analyses IA complètes illimitées",
      "Chat IA, simulateur & bracket",
      "Toutes les compétitions 2026/27",
    ],
    envKey: "WHOP_PLAN_SEASON",
  },
  {
    plan: "pass_cdm",
    name: "Pass CDM 2026",
    duration: "lifetime",
    priceLabel: "14,99 €",
    unit: "une seule fois",
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

/** Offers shown in the pricing UI — excludes hidden plans. */
export const VISIBLE_OFFERS: Offer[] = OFFERS.filter((o) => !o.hidden);

/**
 * During the World Cup, the Pro monthly plan is re-skinned as the "Pass Coupe du
 * Monde": same recurring 14,99 €/month, only branded for the tournament. The
 * underlying plan/entitlements are unchanged — only the display. After
 * PASS_CDM_END it reverts automatically to the plain Pro.
 */
const CDM_MONTHLY_SKIN: Partial<Offer> = {
  name: "Pass Coupe du Monde",
  priceLabel: "14,99 €",
  unit: "/ mois",
  anchorPrice: "29,98 €",
  discountLabel: "-50%",
  urgencyLabel: "Tarif Coupe du Monde · jusqu'au 19 juillet",
  badge: "★ COUPE DU MONDE 2026",
  sublabel:
    "Suis toute la CDM 2026, puis Ligue 1, PL, Liga, Serie A, Bundesliga, LDC & LDE",
  note: "Sans engagement · résiliable à tout moment",
  ctaLabel: "Suivre la Coupe du Monde — 14,99 €",
};

/**
 * English overlay for the offer text fields (prices stay in EUR). Only the
 * user-visible strings are translated; keys absent here keep the French value.
 * (The site is FR-only now — kept as a no-op safety net.)
 */
const EN_OFFER_TEXT: Partial<Record<PaidPlan, Partial<Offer>>> = {};

const CDM_MONTHLY_SKIN_EN: Partial<Offer> = CDM_MONTHLY_SKIN;

/**
 * Date-aware offers for the UI. Applies the World Cup skin to Pro monthly while
 * the intro window is open, and the English overlay when locale is "en". Use
 * this in components instead of VISIBLE_OFFERS.
 */
export function visibleOffers(now: number = Date.now(), locale: Locale = "fr"): Offer[] {
  const wc = cdmIntroActive(now);
  const en = locale === "en";
  return OFFERS.filter((o) => !o.hidden).map((o) => {
    let offer: Offer = o;
    if (en && EN_OFFER_TEXT[o.plan]) offer = { ...offer, ...EN_OFFER_TEXT[o.plan] };
    if (wc && o.plan === "monthly") offer = { ...offer, ...(en ? CDM_MONTHLY_SKIN_EN : CDM_MONTHLY_SKIN) };
    return offer;
  });
}

/**
 * The FREE tier — display-only (not a checkout offer). Its `lockedFeatures` are
 * the whole point of the pricing page: they spell out, in ✗, exactly what a
 * non-paying visitor is missing, so the value of paying is obvious.
 */
export interface FreeTier {
  name: string;
  priceLabel: string;
  unit: string;
  sublabel: string;
  features: string[];
  lockedFeatures: string[];
}

const FREE_TIER_FR: FreeTier = {
  name: "Gratuit",
  priceLabel: "0 €",
  unit: "pour toujours",
  sublabel: "Pour découvrir — 1 analyse complète offerte",
  features: [
    "1 analyse IA complète offerte",
    "Aperçu : probabilités & buts attendus",
    "Forme, H2H & compositions des équipes",
  ],
  lockedFeatures: [
    "Analyses IA illimitées",
    "Analyse complète : scénario, forces & faiblesses",
    "Buteurs probables & joueurs clés",
    "Value bets & cotes en direct",
    "Chat IA contextuel",
    "Simulateur & bracket",
    "Suivi bankroll & ROI",
  ],
};

const FREE_TIER_EN: FreeTier = FREE_TIER_FR;

export function freeTier(locale: Locale = "fr"): FreeTier {
  return locale === "en" ? FREE_TIER_EN : FREE_TIER_FR;
}

// ── Per-feature entitlements ─────────────────────────────────────────────────

/**
 * Premium tools gated by tier:
 *  - Découverte: none (AI analysis only, no betting toolkit).
 *  - Pro: the full betting toolkit.
 *  - Elite: the toolkit + live in-match prediction.
 */
export type Feature =
  | "chat_ia"
  | "simulator"
  | "bracket"
  | "value_bets"
  | "advanced_players"
  | "live";

/** The Pro toolkit (everything except live in-match prediction). */
const PRO_TOOLKIT: Feature[] = [
  "chat_ia",
  "simulator",
  "bracket",
  "value_bets",
  "advanced_players",
];
/** Elite = Pro toolkit + live. */
const ELITE_KIT: Feature[] = [...PRO_TOOLKIT, "live"];

const PLAN_FEATURES: Record<PaidPlan, Feature[]> = {
  // Découverte = capped base analysis only (no betting toolkit).
  decouverte: [],
  // Pro (monthly key kept) = full toolkit, no live.
  monthly: PRO_TOOLKIT,
  pro_weekly: PRO_TOOLKIT,
  // Elite = toolkit + live.
  elite: ELITE_KIT,
  elite_weekly: ELITE_KIT,
  lifetime: ELITE_KIT,
  // legacy (grandfathered) — keep their historical access.
  essential: [], // old Essential: unlimited base analysis, no toolkit.
  weekly: PRO_TOOLKIT, // old Hebdo: full toolkit.
  pass_cdm: PRO_TOOLKIT,
  season: PRO_TOOLKIT,
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
 * - Pass CDM / Pass Saison: until current_period_end (one-time passes with a
 *   fixed end — 19 July 2026 / 31 July 2027).
 * - Recurring (weekly/monthly tiers): while active, or canceled-but-still-in-period.
 * NB: this checks entitlement, not the monthly analysis quota (see ai-guard).
 */
export function hasAccess(sub: SubscriptionState | null | undefined): boolean {
  if (!sub || sub.plan === "free") return false;
  const now = Date.now();
  const within = (iso: string | null) => !!iso && now <= Date.parse(iso);

  if (sub.status === "expired") return false;
  if (sub.plan === "lifetime") return sub.status !== "canceled";
  if (sub.status === "trialing") return within(sub.trialEnd);
  if (sub.plan === "pass_cdm" || sub.plan === "season") return within(sub.currentPeriodEnd);
  // recurring (decouverte / monthly / elite / pro_weekly / elite_weekly / weekly)
  if (sub.status === "active") return true;
  // canceled at period end but still inside the paid window
  return within(sub.currentPeriodEnd);
}

// ── Server-only resolvers (read env). Never call from client components. ──────

/**
 * A plan's env var may hold a COMMA-SEPARATED list of Whop plan ids. The FIRST
 * id is the current one (used for new checkouts); any following ids are legacy
 * (e.g. a previous price point) kept only so existing members still map back.
 * Example after a price change: WHOP_PLAN_MONTHLY="plan_NEW1499,plan_OLD0899".
 */
function planIds(envKey: string): string[] {
  return (process.env[envKey] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function planIdForPlan(plan: PaidPlan): string | undefined {
  const offer = offerByPlan(plan);
  // New checkouts always use the first (current) id.
  return offer ? planIds(offer.envKey)[0] : undefined;
}

export function planForPlanId(planId: string): PaidPlan | null {
  for (const offer of OFFERS) {
    if (planIds(offer.envKey).includes(planId)) return offer.plan;
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
