// sw.js — MeteoValls
// - /api/* network-only
// - HTML network-first fallback cache
// - Assets stale-while-revalidate
// - ✅ precache mòduls versionats (?v=) perquè no quedi enganxat amb JS vell

const VERSION = "2026-02-12-301"; // 🔁 HA DE COINCIDIR AMB app.js V
const CACHE_PREFIX = "meteovalls-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/previsio.html",
  "/historic.html",
  "/sobre.html",
  "/site.webmanifest",

  // css/js versionats
  `/style.css?v=${VERSION}`,
  `/app.js?v=${VERSION}`,

  // ✅ mòduls versionats
  `/lib/install.js?v=${VERSION}`,
  `/pages/home.js?v=${VERSION}`,
  `/pages/previsio.js?v=${VERSION}`,
  `/pages/historic.js?v=${VERSION}`,
  `/pages/sobre.js?v=${VERSION}`,

  // vendor (si no els versionaves, deixa'ls així)
  "/vendor/chart.umd.min.js",
  "/vendor/suncalc.min.js",

  "/favicon.png",
  "/apple-touch-icon.png",
  "/android-chrome-192.png",
  "/android-chrome-512.png",
];

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isHtmlRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".otf") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".webmanifest")
  );
}

// ✅ Per .js/.css: mantenim query (busting real)
// Per la resta: ignorem query
function cacheKeyFor(urlObj) {
  const isJsOrCss = urlObj.pathname.endsWith(".js") || urlObj.pathname.endsWith(".css");
  return isJsOrCss ? (urlObj.pathname + urlObj.search) : urlObj.pathname;
}

async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    PRECACHE_URLS.map(async (path) => {
      try {
        const res = await fetch(new Request(path, { cache: "reload" }));
        if (res && res.ok) await cache.put(path, res.clone());
      } catch {}
    })
  );
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((k) => (k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME ? caches.delete(k) : null))
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precacheAll());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await cleanupOldCaches();
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1) API: network-only
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // 2) HTML: network-first -> cache fallback
  if (isHtmlRequest(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const key = cacheKeyFor(url);

      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(key, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        const cached =
          (await cache.match(req)) ||
          (await cache.match(key)) ||
          (await cache.match(url.pathname)) ||
          (await cache.match("/index.html"));

        return cached || new Response("Offline", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  // 3) Assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const key = cacheKeyFor(url);

      const cached = await cache.match(key);

      const update = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(key, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(update);
        return cached;
      }

      const net = await update;
      return net || new Response("", { status: 504 });
    })());
    return;
  }

  // 4) default
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
