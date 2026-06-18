/**
 * Monetization model (Whop) — single source of truth.
 *
 * Hard paywall on analyses: signing up is free and gives a model-only PREVIEW of
 * each match (favourite, probabilities, expected goals — zero AI cost), but the
 * full AI analysis ALWAYS requires access (a paid plan or an active trial).
 * No free full analyses (FREE_ANALYSES_LIMIT = 0). Match facts (stats, form,
 * H2H, line-ups) stay public so pages remain indexable for SEO.
 *
 * Display fields are safe for client components. Real Whop plan IDs live in
 * server-only env vars (WHOP_PLAN_*), resolved via planIdForPlan / planForPlanId
 * which are only ever called from server code (checkout action + webhook).
 */

export type Plan = "free" | "pass_cdm" | "weekly" | "monthly" | "season" | "lifetime";
export type PaidPlan = Exclude<Plan, "free">;

/** Our normalized subscription status (mapped from Whop's MembershipStatus). */
export type SubStatus = "active" | "trialing" | "expired" | "canceled";

/**
 * Number of free FULL analyses a `free` user gets in total (lifetime).
 * Now 0 — free users only get the model-only preview; the full AI analysis is
 * paid-only. The free-analysis plumbing (RPC + free_analyses_used column) is
 * kept inert so this can be re-enabled by bumping this constant.
 */
export const FREE_ANALYSES_LIMIT: number = 0;

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
    priceLabel: "2,99 €",
    anchorPrice: "4,99 €",
    discountLabel: "-40%",
    unit: "/ semaine",
    sublabel: "Pour tester l'IA sur la CDM",
    ctaLabel: "Choisir l'Hebdo — 2,99 €",
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
    priceLabel: "8,99 €",
    anchorPrice: "14,99 €",
    discountLabel: "-40%",
    unit: "/ mois",
    sublabel:
      "CDM 2026 incluse · puis Ligue 1, PL, Liga, Serie A, Bundesliga, LDC & LDE",
    ctaLabel: "S'abonner — 8,99 €/mois",
    note: "Tout inclus, ~2× moins cher que la concurrence (17,99 €/mois)",
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
    plan: "season",
    name: "Pass Saison",
    priceLabel: "39 €",
    anchorPrice: "59 €",
    discountLabel: "-34%",
    urgencyLabel: "CDM 2026 + saison 2026/27 · tarif de lancement",
    unit: "une seule fois",
    sublabel:
      "Toute la CDM 2026 puis la saison 2026/27 — un seul paiement, zéro abonnement",
    ctaLabel: "Prendre le Pass Saison — 39 €",
    note: "~3,25 €/mois sur la saison — le meilleur rapport",
    oneTime: true,
    // PENDING WHOP : créer le produit "Pass Saison" (39 €, paiement unique) et
    // renseigner WHOP_PLAN_SEASON, puis passer `hidden` à false pour l'afficher.
    hidden: true,
    badge: "SAISON COMPLÈTE",
    badgeKind: "green",
    features: [
      "Tout le Mensuel, toute la saison :",
      "Analyses IA complètes illimitées",
      "Chat IA, simulateur & bracket",
      "Toutes les compétitions 2026/27",
      "Aucun abonnement, aucune reconduction",
    ],
    envKey: "WHOP_PLAN_SEASON",
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

/** Offers shown in the pricing UI — excludes hidden plans. */
export const VISIBLE_OFFERS: Offer[] = OFFERS.filter((o) => !o.hidden);

/**
 * During the World Cup, the Monthly plan is re-skinned as the "Pass Coupe du
 * Monde": same recurring 8,99 €/month, only branded for the tournament with the
 * 14,99 € anchor. The underlying plan/entitlements are unchanged — only the
 * display. After PASS_CDM_END it reverts automatically to the plain Monthly
 * (same 8,99 € price), so nothing goes stale.
 */
const CDM_MONTHLY_SKIN: Partial<Offer> = {
  name: "Pass Coupe du Monde",
  priceLabel: "8,99 €",
  unit: "/ mois",
  anchorPrice: "14,99 €",
  discountLabel: "-40%",
  urgencyLabel: "Tarif Coupe du Monde · jusqu'au 19 juillet",
  badge: "★ COUPE DU MONDE 2026",
  sublabel:
    "Suis toute la CDM 2026, puis Ligue 1, PL, Liga, Serie A, Bundesliga, LDC & LDE",
  note: "Sans engagement · résiliable à tout moment",
  ctaLabel: "Suivre la Coupe du Monde — 8,99 €",
};

/**
 * Date-aware offers for the UI. Applies the World Cup skin to Monthly while the
 * intro window is open. Use this in components instead of VISIBLE_OFFERS.
 */
export function visibleOffers(now: number = Date.now()): Offer[] {
  const wc = cdmIntroActive(now);
  return OFFERS.filter((o) => !o.hidden).map((o) =>
    wc && o.plan === "monthly" ? { ...o, ...CDM_MONTHLY_SKIN } : o,
  );
}

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
  season: ["chat_ia", "simulator", "bracket"],
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
  // weekly / monthly
  if (sub.status === "active") return true;
  // canceled at period end but still inside the paid window
  return within(sub.currentPeriodEnd);
}

// ── Server-only resolvers (read env). Never call from client components. ──────

/**
 * A plan's env var may hold a COMMA-SEPARATED list of Whop plan ids. The FIRST
 * id is the current one (used for new checkouts); any following ids are legacy
 * (e.g. a previous price point) kept only so existing members still map back.
 * Example after a price change: WHOP_PLAN_MONTHLY="plan_NEW8990,plan_OLD1499".
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
