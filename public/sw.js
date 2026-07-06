// PWA removed.
//
// This file now exists ONLY to clean up after the previous PWA build. Returning
// visitors still have the old service worker registered; on their next visit the
// browser fetches this updated file, sees it changed, and activates it. On
// activation we purge every cache and unregister the worker, then reload open
// tabs so nobody is left running a stale, offline app shell.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
