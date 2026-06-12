import type { SocialLink } from "@/lib/social";

/** Compact brand glyphs (currentColor) — lucide has no X/TikTok marks. */
export function SocialIcon({ id, size = 18 }: { id: SocialLink["id"]; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true };
  switch (id) {
    case "twitter":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.6 10.6 20.9 2h-1.7l-6.3 7.3L7.8 2H2l7.7 11.2L2 22h1.7l6.7-7.8L15.7 22H21.5L13.6 10.6Zm-2.4 2.8-.8-1.1L4.3 3.3h2.6l5 7.1.8 1.1 6.5 9.3h-2.6l-5.4-7.5Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.5 2h-3v13.2a2.6 2.6 0 1 1-2-2.5V9.6a5.6 5.6 0 1 0 5 5.6V8.7a6.9 6.9 0 0 0 4 1.3V7a3.9 3.9 0 0 1-4-4Z" />
        </svg>
      );
  }
}
