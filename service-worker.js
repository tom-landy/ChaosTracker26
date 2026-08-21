/* ChaosTracker26 service worker — offline-first cache so the app works at the table. */
const CACHE = "chaostracker26-v47";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/data.js",
  "./js/data-empire.js",
  "./js/data-highelves.js",
  "./js/parser.js",
  "./js/app.js",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  // Note: no skipWaiting() here — the new version waits until the user taps the
  // in-app "Update available" bar, which posts SKIP_WAITING (below).
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

// Activate the waiting worker on demand (from the in-app update bar).
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Cache-first for our own assets, falling back to network (and caching new GETs).
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res && res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
