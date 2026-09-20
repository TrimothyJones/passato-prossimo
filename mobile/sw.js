const CACHE_NAME = "passato-prossimo-mobile-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./mobile.css",
  "./manifest.webmanifest",
  "./pwa-register.js",
  "./mobile-library.js",
  "./vendor/fflate-0.8.3.js",
  "./icons/app-icon-180.png",
  "./icons/app-icon-192.png",
  "./icons/app-icon-512.png",
  "../src/books.js",
  "../prototype-0.2-lexical-coverage/lexicon.js",
  "../prototype-0.2-lexical-coverage/core-dictionary.js",
  "../prototype-0.3-assisted-reader/paisa-frequency.js",
  "../prototype-0.3-assisted-reader/learner-enrichment.js",
  "../prototype-0.3-assisted-reader/dictionary-overflow.js",
  "../prototype-0.3-assisted-reader/context-markers.js",
  "../prototype-0.3-assisted-reader/accent-rules.js",
  "../prototype-0.3-assisted-reader/elision-rules.js",
  "../prototype-0.5-media-shell/styles.css",
  "../prototype-0.5-media-shell/platform-adapter.js",
  "../prototype-0.5-media-shell/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (
          await caches.match(request) || await caches.match("./index.html")
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
