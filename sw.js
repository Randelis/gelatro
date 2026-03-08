const CACHE_VERSION = "neon-riot-v1.0.2";
const APP_SHELL = [
  "./",
  "./index.html?v=1.0.2",
  "./style.css?v=1.0.2",
  "./data.js?v=1.0.2",
  "./effects.js?v=1.0.2",
  "./game.js?v=1.0.2",
  "./manifest.json?v=1.0.2",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_VERSION);

      if (request.url.startsWith(self.location.origin)) {
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      if (request.mode === "navigate") {
        return caches.match("./index.html?v=1.0.2") || caches.match("./");
      }

      throw error;
    }
  })());
});
