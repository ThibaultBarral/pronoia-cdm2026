/**
 * Monetization model (Whop) — single source of truth.
 *
 * Three offers, no free tier:
 *   Mini (entry, capped, the "appât") < Pro (full toolkit, illimité, the offer we
 *   push everywhere) < Lifetime (Pro forever, one payment).
 * Pro is sold in two durations (month / year, the year is the hero — pre-selected,
 * "-50%" anchor). There is no trial and no free analysis: an account with no
 * active plan is shown the paywall directly.
 *
 * Gating has two axes:
 *   1. Feature gating — Mini gets the AI analysis only (no value bets, no
 *      bankroll toolkit, no AI chat); Pro/Lifetime unlock everything.
 *   2. A monthly analysis quota — only Mini is capped (MONTHLY_ANALYSIS_LIMIT);
 *      Pro/Lifetime are unlimited.
 *
 * Legacy plans (decouverte / monthly / elite / pro_weekly / elite_weekly /
 * essential / weekly / pass_cdm / season) are kept `hidden` for grandfathering
 * only: existing members keep their entitlements via webhooks / restore /
 * hasFeature. Match facts (stats, form, H2H, line-ups) stay public so pages
 * remain indexable for SEO.
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

import type { Locale } from "@/lib/i18n/config";

export type Plan =
  | "free" // sentinel for "no active plan yet" — never sold, never grants access
  // current grid — 3 sellable offers
  | "mini" // entry, monthly, capped
  | "pro" // Pro monthly
  | "pro_yearly" // Pro yearly (the hero offer)
  | "lifetime" // Pro forever, one payment
  // legacy (grandfathered, hidden from sale)
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
 * Monthly analysis quota per paid plan. Absent = unlimited. Only the entry tier
 * (Mini) is capped, to create upgrade pressure while protecting margin.
 * Enforcement lives server-side (ai-guard); this map is the single source.
 */
export const MONTHLY_ANALYSIS_LIMIT: Partial<Record<PaidPlan, number>> = {
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

const PRO_FEATURES = [
  "Analyses IA illimitées",
  "Value bets du jour, cotes & EV",
  "Buteurs probables & joueurs clés",
  "Chat IA contextuel",
  "Bankroll & suivi du ROI",
  "Historique illimité",
];

/**
 * Display order = paywall hierarchy: Mini (entry), Pro yearly (hero), Pro
 * monthly, Lifetime. Legacy plans are `hidden` (retired from sale) but kept in
 * the array so webhooks / restore / hasFeature keep resolving existing
 * memberships.
 */
export const OFFERS: Offer[] = [
  {
    plan: "mini",
    name: "Mini",
    duration: "month",
    priceLabel: "2,99 €",
    unit: "/ mois",
    sublabel: "Pour tester — 5 analyses IA par mois",
    ctaLabel: "Choisir Mini — 2,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: [
      "5 analyses IA par mois",
      "Analyse complète : scénario, probas & xG",
      "Forme, H2H & compositions",
    ],
    lockedFeatures: [
      "Value bets du jour",
      "Bankroll & suivi du ROI",
      "Chat IA contextuel",
      "Historique illimité",
    ],
    envKey: "WHOP_PLAN_MINI",
  },
  {
    plan: "pro_yearly",
    name: "Pro",
    duration: "year",
    priceLabel: "59,99 €",
    anchorPrice: "119,88 €",
    discountLabel: "-50%",
    unit: "/ an",
    sublabel: "Tout illimité — value bets, bankroll, chat IA",
    ctaLabel: "Débloquer Pro — 59,99 €/an",
    note: "soit 5 €/mois · sans engagement, annulable à tout moment",
    badge: "MEILLEURE OFFRE · -50%",
    badgeKind: "green",
    highlight: true,
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PRO_YEARLY",
  },
  {
    plan: "pro",
    name: "Pro",
    duration: "month",
    priceLabel: "9,99 €",
    unit: "/ mois",
    sublabel: "Tout illimité — value bets, bankroll, chat IA",
    ctaLabel: "Débloquer Pro — 9,99 €/mois",
    note: "Sans engagement · résiliable à tout moment",
    features: PRO_FEATURES,
    envKey: "WHOP_PLAN_PRO_MONTHLY",
  },
  {
    plan: "lifetime",
    name: "À vie",
    duration: "lifetime",
    priceLabel: "79 €",
    unit: "une seule fois",
    oneTime: true,
    sublabel: "Tout Pro · un seul paiement, pour toujours",
    ctaLabel: "Accès à vie — 79 €",
    note: "≈ 1 an et demi d'annuel, puis plus jamais",
    badge: "ACCÈS À VIE",
    badgeKind: "life",
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
 * Premium tools gated by tier:
 *  - Mini: none (AI analysis only, capped monthly quota).
 *  - Pro/Lifetime: the full toolkit (value bets, bankroll, AI chat).
 */
export type Feature = "chat_ia" | "value_bets";

const PRO_TOOLKIT: Feature[] = ["chat_ia", "value_bets"];

const PLAN_FEATURES: Record<PaidPlan, Feature[]> = {
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

/** Convenience: active access on a plan that isn't the capped Mini tier. */
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
  /** Temporary full access earned via the daily pack (jackpot). */
  bonusAccessUntil?: string | null;
}

/**
 * Single source of truth for "may this user run an analysis?".
 * - Lifetime: always (while not expired/canceled).
 * - Trialing: until trial_end (legacy plans only — no new plan sells a trial).
 * - Pass CDM / Pass Saison (legacy): until current_period_end (fixed end date).
 * - Recurring (mini/pro/pro_yearly + legacy tiers): while active, or
 *   canceled-but-still-in-period.
 * NB: this checks entitlement, not the monthly analysis quota (see ai-guard).
 */
export function hasAccess(sub: SubscriptionState | null | undefined): boolean {
  if (!sub) return false;
  const now = Date.now();
  const within = (iso: string | null) => !!iso && now <= Date.parse(iso);

  // Temporary bonus access (daily-pack jackpot) — grants full access even to a
  // `free` plan while it lasts.
  if (within(sub.bonusAccessUntil ?? null)) return true;

  if (sub.plan === "free") return false;
  if (sub.status === "expired") return false;
  if (sub.plan === "lifetime") return sub.status !== "canceled";
  if (sub.status === "trialing") return within(sub.trialEnd);
  if (sub.plan === "pass_cdm" || sub.plan === "season") return within(sub.currentPeriodEnd);
  // recurring (mini / pro / pro_yearly / legacy monthly-ish plans)
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
