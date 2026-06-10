/**
 * Acquisition-channel survey ("Comment nous as-tu connus ?"). Shared by the
 * client modal (components/acquisition-survey) and the admin dashboard so the
 * channel ids/labels never drift. Stored in the user's Supabase user_metadata
 * (`acquisition_channel` + optional `acquisition_detail`).
 */

export type AcquisitionChannel =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "twitter"
  | "google"
  | "friend"
  | "other";

export interface ChannelMeta {
  id: AcquisitionChannel;
  label: string;
  emoji: string;
}

export const ACQUISITION_CHANNELS: ChannelMeta[] = [
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
  { id: "twitter", label: "X (Twitter)", emoji: "🐦" },
  { id: "google", label: "Google", emoji: "🔎" },
  { id: "friend", label: "Un ami", emoji: "👥" },
  { id: "other", label: "Autre", emoji: "✨" },
];

const LABELS: Record<string, string> = Object.fromEntries(
  ACQUISITION_CHANNELS.map((c) => [c.id, c.label])
);

/** Human label for a stored channel id ("skip"/unknown → "Non renseigné"). */
export function channelLabel(id: string | null | undefined): string {
  if (!id || id === "skip") return "Non renseigné";
  return LABELS[id] ?? id;
}

/** Whether a stored value counts as a real, answered channel. */
export function isRealChannel(id: string | null | undefined): boolean {
  return Boolean(id) && id !== "skip" && id! in LABELS;
}
