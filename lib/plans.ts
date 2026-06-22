/**
 * Monetization model (Whop) — single source of truth.
 *
 * Duration-based grid: the SAME full product for every paid plan, differentiated
 * only by billing period — Hebdo (weekly recurring), Mensuel (monthly recurring)
 * and À vie (one-time lifetime, the only non-recurring offer). No feature gating
 * between plans: paying unlocks everything (unlimited analyses, Chat IA,
 * simulator, bracket, value bets, bankroll).
 *
 * Signing up is free and gives ONE free full analysis ("1er match offert"), then
 * the paywall kicks in. Match facts (stats, form, H2H, line-ups) stay public so
 * pages remain indexable for SEO.
 *
 * Legacy plans (pass_cdm / season) are kept `hidden` for grandfathering only:
 * existing members keep their entitlements via webhooks / restore / hasFeature.
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

import type { Locale } from "@/lib/i18n/config";

export type Plan =
  | "free"
  // current plans (differentiated by billing period, same full product)
  | "weekly"
  | "monthly"
  | "lifetime"
  // legacy (grandfathered, hidden from sale)
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

/** Pass CDM is sold as a tournament pass: access through this instant (incl.). */
export const PASS_CDM_END = "2026-07-19T23:59:59Z";

/** Pass Saison covers the CDM + the whole 2026/27 club season (access through here). */
export const SEASON_END = "2027-07-31T23:59:59Z";

/** Is the World Cup window still open? (drives the "Pass Coupe du Monde" skin) */
export function cdmIntroActive(now: number = Date.now()): boolean {
  return now <= Date.parse(PASS_CDM_END);
}

export interface Offer {
  plan: PaidPlan;
  name: string;
  /** Display price only — the real charge is configured on Whop. */
  priceLabel: string;
  /** Higher "anchor" price shown struck-through next to the real one (urgency). */
  anchorPrice?: string;
  /** Small discount pill next to the anchor, e.g. "-40%". */
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

/**
 * Display order = paywall hierarchy: Hebdo (gauche), Mensuel (centre/hero),
 * À vie (droite). Legacy plans are `hidden` (retired from sale) but kept in the
 * array so webhooks / restore / hasFeature keep resolving existing memberships.
 */
export const OFFERS: Offer[] = [
  {
    plan: "weekly",
    name: "Hebdo",
    priceLabel: "4,99 €",
    anchorPrice: "7,99 €",
    discountLabel: "-38%",
    unit: "/ semaine",
    sublabel: "Pour tester l'IA, ou couvrir un gros week-end",
    ctaLabel: "Choisir l'Hebdo — 4,99 €",
    note: "Sans engagement · résiliable à tout moment",
    features: [
      "Analyses IA illimitées",
      "Value bets & cotes en direct",
      "Chat IA, simulateur & bracket",
      "Suivi bankroll & ROI",
    ],
    envKey: "WHOP_PLAN_WEEKLY",
  },
  {
    plan: "monthly",
    name: "Mensuel",
    priceLabel: "14,99 €",
    anchorPrice: "24,99 €",
    discountLabel: "-40%",
    unit: "/ mois",
    sublabel:
      "Toute la CDM 2026, puis Ligue 1, PL, Liga, Serie A, Bundesliga, LDC & LDE",
    ctaLabel: "S'abonner — 14,99 €/mois",
    note: "Le meilleur rapport — résiliable à tout moment",
    badge: "★ MEILLEUR DEAL",
    badgeKind: "green",
    highlight: true,
    features: [
      "Analyses IA illimitées",
      "Value bets & cotes en direct",
      "Niveau de confiance par pari",
      "Chat IA contextuel",
      "Simulateur & bracket interactif",
      "Suivi bankroll & ROI",
      "CDM 2026 + toutes les compétitions 2026/27",
      "Annulable à tout moment",
    ],
    envKey: "WHOP_PLAN_MONTHLY",
  },
  {
    plan: "lifetime",
    name: "À vie",
    priceLabel: "89 €",
    anchorPrice: "129 €",
    discountLabel: "-31%",
    urgencyLabel: "Tarif de lancement · passe à 129 € le 19 juillet",
    unit: "une seule fois",
    oneTime: true,
    sublabel: "Un seul paiement · le produit complet, pour toujours",
    ctaLabel: "Accès à vie — 89 €",
    note: "Le seul paiement unique — zéro abonnement, à vie",
    badge: "À VIE",
    badgeKind: "life",
    features: [
      "Tout le Mensuel, à vie",
      "Analyses IA illimitées pour toujours",
      "Toutes les compétitions 2026/27 et au-delà",
      "Badge membre fondateur",
      "Un seul paiement, plus jamais d'abonnement",
    ],
    envKey: "WHOP_PLAN_LIFETIME",
  },

  // ── Legacy plans — grandfathering only (hidden from sale) ──────────────────
  {
    plan: "season",
    name: "Pass Saison",
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
 * During the World Cup, the Monthly plan is re-skinned as the "Pass Coupe du
 * Monde": same recurring 14,99 €/month, only branded for the tournament. The
 * underlying plan/entitlements are unchanged — only the display. After
 * PASS_CDM_END it reverts automatically to the plain Monthly.
 */
const CDM_MONTHLY_SKIN: Partial<Offer> = {
  name: "Pass Coupe du Monde",
  priceLabel: "14,99 €",
  unit: "/ mois",
  anchorPrice: "24,99 €",
  discountLabel: "-40%",
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
 */
const EN_OFFER_TEXT: Partial<Record<PaidPlan, Partial<Offer>>> = {
  weekly: {
    name: "Weekly",
    unit: "/ week",
    sublabel: "To try the AI, or cover a big weekend",
    ctaLabel: "Choose Weekly — €4.99",
    note: "No commitment · cancel anytime",
    features: [
      "Unlimited AI analyses",
      "Value bets & live odds",
      "AI chat, simulator & bracket",
      "Bankroll & ROI tracking",
    ],
  },
  monthly: {
    name: "Monthly",
    unit: "/ month",
    sublabel:
      "The whole 2026 World Cup, then Ligue 1, PL, La Liga, Serie A, Bundesliga, UCL & UEL",
    ctaLabel: "Subscribe — €14.99/month",
    note: "Best value — cancel anytime",
    badge: "★ BEST DEAL",
    features: [
      "Unlimited AI analyses",
      "Value bets & live odds",
      "Confidence level per bet",
      "Contextual AI chat",
      "Simulator & interactive bracket",
      "Bankroll & ROI tracking",
      "2026 World Cup + all 2026/27 competitions",
      "Cancel anytime",
    ],
  },
  lifetime: {
    name: "Lifetime",
    unit: "one-time",
    urgencyLabel: "Launch price · rises to €129 on July 19",
    sublabel: "A single payment · the full product, forever",
    ctaLabel: "Lifetime access — €89",
    note: "The only one-time payment — zero subscription, for life",
    badge: "LIFETIME",
    features: [
      "Everything in Monthly, for life",
      "Unlimited AI analyses forever",
      "All 2026/27 competitions and beyond",
      "Founder member badge",
      "A single payment, never pay again",
    ],
  },
};

const CDM_MONTHLY_SKIN_EN: Partial<Offer> = {
  name: "World Cup Pass",
  unit: "/ month",
  urgencyLabel: "World Cup price · until July 19",
  badge: "★ 2026 WORLD CUP",
  sublabel:
    "Follow the whole 2026 World Cup, then Ligue 1, PL, La Liga, Serie A, Bundesliga, UCL & UEL",
  note: "No commitment · cancel anytime",
  ctaLabel: "Follow the World Cup — €14.99",
};

/**
 * Date-aware offers for the UI. Applies the World Cup skin to Monthly while the
 * intro window is open, and the English overlay when locale is "en". Use this in
 * components instead of VISIBLE_OFFERS.
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

// ── Per-feature entitlements ─────────────────────────────────────────────────

/**
 * Premium tools. With the duration-based grid, EVERY paid plan unlocks all of
 * them (paying = the full product). Kept as a capability map so callers can
 * still gate a tool behind "is this an active paid plan?".
 */
export type Feature = "chat_ia" | "simulator" | "bracket";

const ALL_FEATURES: Feature[] = ["chat_ia", "simulator", "bracket"];

const PLAN_FEATURES: Record<PaidPlan, Feature[]> = {
  weekly: ALL_FEATURES,
  monthly: ALL_FEATURES,
  lifetime: ALL_FEATURES,
  // legacy
  pass_cdm: ALL_FEATURES,
  season: ALL_FEATURES,
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
 * - Recurring (weekly/monthly): while active, or canceled-but-still-in-period.
 */
export function hasAccess(sub: SubscriptionState | null | undefined): boolean {
  if (!sub || sub.plan === "free") return false;
  const now = Date.now();
  const within = (iso: string | null) => !!iso && now <= Date.parse(iso);

  if (sub.status === "expired") return false;
  if (sub.plan === "lifetime") return sub.status !== "canceled";
  if (sub.status === "trialing") return within(sub.trialEnd);
  if (sub.plan === "pass_cdm" || sub.plan === "season") return within(sub.currentPeriodEnd);
  // recurring (weekly / monthly)
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
