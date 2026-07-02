// Minimal, deploy-safe service worker.
//
// It deliberately does NOT cache HTML navigations. A cached HTML shell embeds
// hashed CSS/JS chunk URLs (/_next/static/chunks/<hash>.css) that 404 after the
// next deploy — which renders the page completely UNSTYLED. So every request
// goes straight to the network and the browser's own HTTP cache handles the
// immutable /_next/static assets. On activation we also purge any cache left by
// older SW versions (which may still hold a stale, style-breaking HTML shell).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// No `fetch` handler → the browser always fetches fresh HTML and current assets.
