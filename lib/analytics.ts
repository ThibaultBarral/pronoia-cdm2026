/**
 * Tiny GA4 event helper. `@next/third-parties/google` <GoogleAnalytics /> sets up
 * `window.gtag`; this just forwards events safely (no-op on the server or when GA
 * isn't loaded — e.g. NEXT_PUBLIC_GA_ID unset). Use for key conversion events.
 */
type GtagFn = (
  command: "event",
  action: string,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
