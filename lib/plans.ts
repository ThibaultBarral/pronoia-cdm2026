/**
 * Monetization model (Whop) — single source of truth.
 *
 * One plan, three durations, no free tier (grid of 2026-09-11):
 *   Semaine 9,99 € · Mois 19,99 € · Saison 169 € (12 months, -30 % vs monthly).
 * Same product in all three — every analysis, the AI chat, the history — only
 * the billing period changes. No anchor price, no countdown, no capped tier.
 * There is no trial and no free analysis: an account with no active plan is
 * shown the paywall directly.
 *
 * Legacy plans (mini / pro / pro_yearly / lifetime, and the older decouverte /
 * monthly / elite / pro_weekly / elite_weekly / essential / weekly / pass_cdm /
 * season) are kept `hidden` for grandfathering only: existing members keep
 * their entitlements via webhooks / restore / hasFeature. Only the legacy Mini
 * / Découverte tiers carry a monthly quota (MONTHLY_ANALYSIS_LIMIT). Match
 * facts (stats, form, H2H, line-ups) stay public so pages remain indexable.
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

import type { Locale } from "@/lib/i18n/config";

export type Plan =
  | "free" // sentinel for "no active plan yet" — never sold, never grants access
  // current grid — one plan, 3 durations
  | "week" // 7 days, 9,99 €
  | "month" // 30 days, 19,99 €
  | "year" // 12 months, 169 € ("Saison")
  // legacy (grandfathered, hidden from sale)
  | "mini" // entry, monthly, capped (grid of July 2026)
  | "pro" // Pro monthly (July 2026)
  | "pro_yearly" // Pro yearly (July 2026)
  | "lifetime" // Pro forever, one payment (July 2026)
  | "decouverte"
  | "monthly"
  | "elite"
  | "pro_weekly"
  | "elite_weekly"
  | "essential"
  | "weekly"
  | "pass_cdm"
  | "season";
export type PaidPlan = Exclude<Plan, "free">;

/** Our normalized subscription status (mapped from Whop's MembershipStatus). */
export type SubStatus = "active" | "trialing" | "expired" | "canceled";

/**
 * Monthly analysis quota per paid plan. Absent = unlimited. The current grid
 * has no capped tier; only legacy entry tiers keep their historical cap.
 * Enforcement lives server-side (ai-guard); this map is the single source.
 */
export const MONTHLY_ANALYSIS_LIMIT: Partial<Record<PaidPlan, number>> = {
  // legacy, kept so grandfathered Mini members keep their historical cap.
  mini: 5,
  // legacy, kept so grandfathered Découverte members keep their historical cap.
  decouverte: 20,
};

/** Billing duration — drives the pricing card layout. */
export type Duration = "month" | "year" | "lifetime" | "week";

export interface Offer {
  plan: PaidPlan;
  name: string;
  /** Which duration this offer belongs to. */
  duration: Duration;
  /** Display price only — the real charge is configured on Whop. */
  priceLabel: string;
  /** Higher "anchor" price shown struck-through next to the real one (urgency). */
  anchorPrice?: string;
  /** Small discount pill next to the anchor, e.g. "-50%". */
  discountLabel?: string;
  /** Urgency line under the price, e.g. "Tarif de lancement". */
  urgencyLabel?: string;
  /** Unit shown under the price: "/ mois" · "/ an" · "une seule fois". */
  unit: string;
  sublabel: string;
  /** Label of the CTA button on the pricing card. */
  ctaLabel: string;
  /** Optional discreet line under the card (e.g. "soit 5 €/mois"). */
  note?: string;
  oneTime?: boolean;
  /** Hidden from the pricing/paywall display, but kept for entitlement of
   *  existing subscribers and webhook plan-id resolution (grandfathering). */
  hidden?: boolean;
  /** Corner tag, e.g. "MEILLEURE OFFRE · -50%" / "ACCÈS À VIE". */
  badge?: string;
  badgeKind?: "green" | "life";
  /** Emphasised card (green border), the offer we push everywhere. */
  highlight?: boolean;
  /** Bullet features listed inside the pricing card. */
  features: string[];
  /** Features explicitly NOT included — shown struck-through under the list. */
  lockedFeatures?: string[];
  /** env var holding the Whop plan id for this offer. */
  envKey: string;
}

/** What every current offer includes — identical across the three durations. */
export const ACCESS_FEATURES = [
  "Analyses de match illimitées",
  "Scénario, probabilités & buts attendus",
  "Forces & faiblesses, joueurs à suivre",
  "Chat IA sur chaque match",
  "7 compétitions, toute la saison 2026/27",
  "Historique illimité de tes analyses",
];

/** Monthly price × 12, the honest reference the Saison discount is computed from. */
export const MONTHLY_PRICE_EUR = 19.99;
export const YEAR_LIST_PRICE_EUR = Math.round(MONTHLY_PRICE_EUR * 12 * 100) / 100; // 239.88
export const YEAR_PRICE_EUR = 169;

/** Legacy Pro feature list — kept for the hidden July-2026 offers only. */
const PRO_FEATURES = [
  "Analyses IA illimitées",
  "Buteurs probables & joueurs clés",
  "Chat IA contextuel",
  "Historique illimité",
];

/**
 * Display order = paywall order: Semaine, Mois (the reference, highlighted),
 * Saison. Legacy plans are `hidden` (retired from sale) but kept in the array
 * so webhooks / restore / hasFeature keep resolving existing memberships.
 */
export const OFFERS: Offer[] = [
  {
    plan: "week",
    name: "Semaine",
    duration: "week",
    priceLabel: "9,99 €",
    unit: "/ semaine",
    sublabel: "7 jours, pour un week-end de championnat et une soirée européenne",
    ctaLabel: "Choisir Semaine · 9,99 €",
    note: "Sans engagement · résiliable à tout moment",
    features: ACCESS_FEATURES,
    envKey: "WHOP_PLAN_WEEK",
  },
  {
    plan: "month",
    name: "Mois",
    duration: "month",
    priceLabel: "19,99 €",
    unit: "/ mois",
    sublabel: "Le rythme de référence, toutes les analyses",
    ctaLabel: "Choisir Mois · 19,99 €",
    note: "Sans engagement · résiliable à tout moment",
    badge: "LE PLUS CHOISI",
    badgeKind: "green",
    highlight: true,
    features: ACCESS_FEATURES,
    envKey: "WHOP_PLAN_MONTH",
  },
  {
    plan: "year",
    name: "Saison",
    duration: "year",
    priceLabel: "169 €",
    unit: "/ saison",
    sublabel: "12 mois, soit 14,10 €/mois : -30 % par rapport au mensuel",
    ctaLabel: "Choisir Saison · 169 €",
    note: "soit 14,10 €/mois · 239,88 € au tarif mensuel",
    badge: "-30 % VS MENSUEL",
    badgeKind: "life",
    features: ACCESS_FEATURES,
    envKey: "WHOP_PLAN_YEAR",
  },

  // ── Grid of July 2026 — grandfathering only (hidden from sale) ─────────────
  {
    plan: "mini",
    name: "Mini",
    duration: "month",
    hidden: true,
    priceLabel: "2,99 €",
    unit: "/ mois",
    sublabel: "Ancien plan Mini (juillet 2026, 5 analyses par mois)",
    ctaLabel: "Choisir Mini — 2,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: [
      "5 analyses IA par mois",
      "Analyse complète : scénario, probas & xG",
      "Forme, H2H & compositions",
    ],
    lockedFeatures: ["Chat IA contextuel", "Historique illimité"],
    envKey: "WHOP_PLAN_MINI",
  },
  {
    plan: "pro_yearly",
    name: "Pro",
    duration: "year",
    hidden: true,
    priceLabel: "59,99 €",
    unit: "/ an",
    sublabel: "Ancien plan Pro (juillet 2026)",
    ctaLabel: "Débloquer Pro — 59,99 €/an",
    note: "soit 5 €/mois · sans engagement, annulable à tout moment",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PRO_YEARLY",
  },
  {
    plan: "pro",
    name: "Pro",
    duration: "month",
    hidden: true,
    priceLabel: "9,99 €",
    unit: "/ mois",
    sublabel: "Ancien plan Pro (juillet 2026)",
    ctaLabel: "Débloquer Pro — 9,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PRO_MONTHLY",
  },
  {
    plan: "lifetime",
    name: "À vie",
    duration: "lifetime",
    hidden: true,
    priceLabel: "79 €",
    unit: "une seule fois",
    oneTime: true,
    sublabel: "Tout Pro · un seul paiement, pour toujours",
    ctaLabel: "Accès à vie — 79 €",
    note: "≈ 1 an et demi d'annuel, puis plus jamais",
    features: [...PRO_FEATURES, "Pour toujours, aucun renouvellement"],
    envKey: "WHOP_PLAN_LIFETIME",
  },

  // ── Legacy plans — grandfathering only (hidden from sale) ──────────────────
  {
    plan: "decouverte",
    name: "Découverte",
    duration: "month",
    priceLabel: "3,99 €",
    unit: "/ mois",
    hidden: true,
    sublabel: "Ancien plan Découverte (20 analyses/mois)",
    ctaLabel: "Découverte",
    features: ["20 analyses IA par mois", "Analyse complète : scénario, probas & xG"],
    envKey: "WHOP_PLAN_DECOUVERTE",
  },
  {
    plan: "monthly",
    name: "Pro (ancien tarif)",
    duration: "month",
    priceLabel: "14,99 €",
    unit: "/ mois",
    hidden: true,
    sublabel: "Ancien plan Pro mensuel",
    ctaLabel: "Pro",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_MONTHLY",
  },
  {
    plan: "elite",
    name: "Elite (ancien tarif)",
    duration: "month",
    priceLabel: "24,99 €",
    unit: "/ mois",
    hidden: true,
    sublabel: "Ancien plan Elite mensuel",
    ctaLabel: "Elite",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_ELITE",
  },
  {
    plan: "pro_weekly",
    name: "Pro (hebdo)",
    duration: "week",
    priceLabel: "6,99 €",
    unit: "/ semaine",
    hidden: true,
    sublabel: "Ancien pass hebdo Pro",
    ctaLabel: "Pro hebdo",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PRO_WEEKLY",
  },
  {
    plan: "elite_weekly",
    name: "Elite (hebdo)",
    duration: "week",
    priceLabel: "9,99 €",
    unit: "/ semaine",
    hidden: true,
    sublabel: "Ancien pass hebdo Elite",
    ctaLabel: "Elite hebdo",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_ELITE_WEEKLY",
  },
  {
    plan: "essential",
    name: "Essential",
    duration: "month",
    priceLabel: "9,99 €",
    unit: "/ mois",
    hidden: true,
    sublabel: "Ancien plan Essential (analyses illimitées, sans toolkit)",
    ctaLabel: "Essential",
    features: ["Analyses IA illimitées", "Analyse complète : scénario, probas & xG"],
    envKey: "WHOP_PLAN_ESSENTIAL",
  },
  {
    plan: "weekly",
    name: "Hebdo",
    duration: "week",
    priceLabel: "4,99 €",
    unit: "/ semaine",
    hidden: true,
    sublabel: "Ancien pass hebdo",
    ctaLabel: "Hebdo",
    features: PRO_FEATURES,
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
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_SEASON",
  },
  {
    plan: "pass_cdm",
    name: "Pass CDM 2026",
    duration: "lifetime",
    priceLabel: "14,99 €",
    unit: "une seule fois",
    hidden: true,
    sublabel: "Ancien pass CDM à durée fixe",
    ctaLabel: "Pass CDM",
    oneTime: true,
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PASS_CDM",
  },
];

/** Offers shown in the pricing UI — excludes hidden (legacy) plans. */
export const VISIBLE_OFFERS: Offer[] = OFFERS.filter((o) => !o.hidden);

/**
 * Pass CDM (legacy) was sold as a tournament pass with a fixed end date, kept
 * only so existing grandfathered members' access still expires correctly.
 */
export const PASS_CDM_END = "2026-07-19T23:59:59Z";
/** Pass Saison (legacy) fixed end date — same reason. */
export const SEASON_END = "2027-07-31T23:59:59Z";

/**
 * English overlay for the offer text fields (prices stay in EUR). Only the
 * user-visible strings are translated; keys absent here keep the French value.
 * (The site is FR-only now — kept as a no-op safety net.)
 */
const EN_OFFER_TEXT: Partial<Record<PaidPlan, Partial<Offer>>> = {};

/** Date-aware, locale-aware offers for the UI. Use this instead of VISIBLE_OFFERS. */
export function visibleOffers(_now: number = Date.now(), locale: Locale = "fr"): Offer[] {
  const en = locale === "en";
  return OFFERS.filter((o) => !o.hidden).map((o) => {
    if (en && EN_OFFER_TEXT[o.plan]) return { ...o, ...EN_OFFER_TEXT[o.plan] };
    return o;
  });
}

// ── Per-feature entitlements ─────────────────────────────────────────────────

/**
 * Premium tools gated by tier. The current grid (week/month/year) includes
 * everything; only the legacy capped tiers (Mini, Découverte, Essential) miss
 * the toolkit.
 */
export type Feature = "chat_ia" | "value_bets";

const PRO_TOOLKIT: Feature[] = ["chat_ia", "value_bets"];

const PLAN_FEATURES: Record<PaidPlan, Feature[]> = {
  week: PRO_TOOLKIT,
  month: PRO_TOOLKIT,
  year: PRO_TOOLKIT,
  mini: [],
  pro: PRO_TOOLKIT,
  pro_yearly: PRO_TOOLKIT,
  lifetime: PRO_TOOLKIT,
  // legacy (grandfathered) — keep their historical access.
  decouverte: [],
  monthly: PRO_TOOLKIT,
  elite: PRO_TOOLKIT,
  pro_weekly: PRO_TOOLKIT,
  elite_weekly: PRO_TOOLKIT,
  essential: [],
  weekly: PRO_TOOLKIT,
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

/** Convenience: active access on a plan that isn't a capped legacy tier. */
export function hasProAccess(
  sub: (SubscriptionState & { vip?: boolean }) | null | undefined
): boolean {
  if (!sub) return false;
  if (sub.vip) return true;
  return hasAccess(sub) && sub.plan !== "mini" && sub.plan !== "decouverte" && sub.plan !== "essential";
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
  /** Temporary full access earned via the legacy daily pack. */
  bonusAccessUntil?: string | null;
}

/**
 * Single source of truth for "may this user run an analysis?".
 * - Lifetime: always (while not expired/canceled).
 * - Trialing: until trial_end (legacy plans only — no new plan sells a trial).
 * - Pass CDM / Pass Saison (legacy): until current_period_end (fixed end date).
 * - Recurring (week/month/year + legacy tiers): while active, or
 *   canceled-but-still-in-period.
 * NB: this checks entitlement, not the monthly analysis quota (see ai-guard).
 */
export function hasAccess(sub: SubscriptionState | null | undefined): boolean {
  if (!sub) return false;
  const now = Date.now();
  const within = (iso: string | null) => !!iso && now <= Date.parse(iso);

  // Temporary bonus access (legacy daily pack) — grants full access even to a
  // `free` plan while it lasts.
  if (within(sub.bonusAccessUntil ?? null)) return true;

  if (sub.plan === "free") return false;
  if (sub.status === "expired") return false;
  if (sub.plan === "lifetime") return sub.status !== "canceled";
  if (sub.status === "trialing") return within(sub.trialEnd);
  if (sub.plan === "pass_cdm" || sub.plan === "season") return within(sub.currentPeriodEnd);
  // recurring (week / month / year / legacy plans)
  if (sub.status === "active") return true;
  // canceled at period end but still inside the paid window
  return within(sub.currentPeriodEnd);
}

// ── Server-only resolvers (read env). Never call from client components. ──────

/**
 * A plan's env var may hold a COMMA-SEPARATED list of Whop plan ids. The FIRST
 * id is the current one (used for new checkouts); any following ids are legacy
 * (e.g. a previous price point) kept only so existing members still map back.
 * Example after a price change: WHOP_PLAN_PRO_MONTHLY="plan_NEW999,plan_OLD1499".
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
  /** Earned bonus free analyses (daily pack + share). */
  bonusCredits: number;
}
