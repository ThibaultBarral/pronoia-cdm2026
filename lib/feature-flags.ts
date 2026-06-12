/**
 * Funnel feature flags (client-safe, NEXT_PUBLIC inlined at build). Each defaults
 * ON; set the env var to "false" to roll back the feature in one variable.
 */
export const FEATURE = {
  /** Loss-aversion paywall on the match analysis (Feature 1). */
  lossAversion: process.env.NEXT_PUBLIC_FEATURE_LOSS_AVERSION !== "false",
  /** Free-analysis counter + locked nav teasers (Feature 2). */
  lockedNav: process.env.NEXT_PUBLIC_FEATURE_LOCKED_NAV !== "false",
};
