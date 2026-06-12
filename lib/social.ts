/**
 * Social links — single source of truth (footer, navbar, JSON-LD sameAs).
 * ⚠️ Replace these with the real handles/URLs when they're live.
 */
export interface SocialLink {
  id: "twitter" | "instagram" | "youtube" | "tiktok";
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { id: "twitter", label: "X (Twitter)", href: "https://x.com/0xCopa" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/0xcopa" },
  { id: "youtube", label: "YouTube", href: "https://youtube.com/@0xcopa" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@0xcopa" },
];
