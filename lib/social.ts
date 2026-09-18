/** Public contact e-mail — single source of truth (FAQ, support, legal pages). */
export const CONTACT_EMAIL = "copafever@gmail.com";

/**
 * Social networks are no longer surfaced anywhere on the site (2026-09-18):
 * no footer icons, no DM widget, no JSON-LD sameAs. Only the e-mail remains.
 * The id union is kept for the (unused) SocialIcon component.
 */
export interface SocialLink {
  id: "twitter" | "instagram" | "youtube" | "tiktok";
  label: string;
  href: string;
}
