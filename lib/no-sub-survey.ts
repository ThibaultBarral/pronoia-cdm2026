/**
 * "Why no subscription yet?" survey — shown to non-subscribers who've been
 * around several days. Shared by the client modal (components/no-sub-survey)
 * and the admin dashboard so ids/labels never drift. The answer is stored in
 * the user's Supabase user_metadata (`no_sub_reason`).
 */

export type NoSubReason =
  | "too_expensive"
  | "not_convinced"
  | "dont_bet_much"
  | "just_looking"
  | "free_enough"
  | "later"
  | "other";

export interface NoSubReasonMeta {
  id: NoSubReason;
  label: string;
  emoji: string;
}

export const NO_SUB_REASONS: NoSubReasonMeta[] = [
  { id: "too_expensive", label: "C'est trop cher", emoji: "💸" },
  { id: "not_convinced", label: "Pas convaincu que ça m'aide", emoji: "🤔" },
  { id: "dont_bet_much", label: "Je ne parie pas assez souvent", emoji: "🎲" },
  { id: "just_looking", label: "Je regarde juste, pas intéressé", emoji: "👀" },
  { id: "free_enough", label: "Le gratuit me suffit", emoji: "🆓" },
  { id: "later", label: "Je compte le faire plus tard", emoji: "⏳" },
  { id: "other", label: "Autre raison", emoji: "✨" },
];

/**
 * Min distinct days on the app before we ask. Kept at 1 so we ask as early as
 * possible (more answers). Stacking is still avoided because eligibility waits
 * for the acquisition survey + win-back pop-up to clear first.
 */
export const NO_SUB_MIN_VISIT_DAYS = 1;

const LABELS: Record<string, string> = Object.fromEntries(
  NO_SUB_REASONS.map((r) => [r.id, r.label]),
);

/** Human label for a stored reason id ("skip"/unknown → "Non renseigné"). */
export function noSubReasonLabel(id: string | null | undefined): string {
  if (!id || id === "skip") return "Non renseigné";
  return LABELS[id] ?? id;
}

/** Whether a stored value counts as a real, answered reason. */
export function isRealNoSubReason(id: string | null | undefined): boolean {
  return Boolean(id) && id !== "skip" && (id as string) in LABELS;
}
