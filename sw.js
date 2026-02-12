// sw.js — MeteoValls
// Objectiu:
// - Offline shell robust: html + css + app + mòduls (/pages, /lib) disponibles offline
// - /api/*: network-only
// - Assets: stale-while-revalidate
//   ✅ .js/.css: mantenim ?v= (busting real)
// - HTML: network-first, fallback cache, si no home

const VERSION = "2026-02-12-201"; // 🔁 PUJA AIXÒ
const CACHE_PREFIX = "meteovalls-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/previsio.html",
  "/historic.html",
  "/sobre.html",
  "/site.webmanifest",

  // entry + css base (sense query, per existir sempre)
  "/style.css",
  "/app.js",

  // ✅ mòduls ESM (aquí és on et quedava enganxat)
  "/pages/home.js",
  "/pages/previsio.js",
  "/pages/historic.js",
  "/pages/sobre.js",
  "/lib/env.js",
  "/lib/dom.js",
  "/lib/install.js",

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

// Cache key:
// - HTML i la majoria d'assets: ignorem query
// - .js/.css: conservem query (busting)
function cleanKeyRequest(originalRequest, urlObj) {
  const isJsOrCss = urlObj.pathname.endsWith(".js") || urlObj.pathname.endsWith(".css");
  const key = isJsOrCss ? (urlObj.pathname + urlObj.search) : urlObj.pathname;

  return new Request(key, {
    method: "GET",
    headers: originalRequest.headers,
    credentials: originalRequest.credentials,
    redirect: originalRequest.redirect,
    referrer: originalRequest.referrer,
    referrerPolicy: originalRequest.referrerPolicy,
    integrity: originalRequest.integrity,
    cache: "default",
    mode: "same-origin",
  });
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

  // API: network-only
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML: network-first
  if (isHtmlRequest(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cleanReq = cleanKeyRequest(req, url);

      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(cleanReq, res.clone()).catch(() => {});
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        const cached =
          (await cache.match(req)) ||
          (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match(cleanReq));

        if (cached) return cached;

        const home = (await cache.match("/")) || (await cache.match("/index.html"));
        return home || new Response("Offline", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  // Assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cleanReq = cleanKeyRequest(req, url);

      const cached =
        (await cache.match(cleanReq)) ||
        (await cache.match(req)) ||
        (await cache.match(req, { ignoreSearch: true }));

      const update = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(cleanReq, res.clone()).catch(() => {});
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

  // Resta: network-first fallback cache
  event.respondWith((async () => {
    try { return await fetch(req); }
    catch {
      const cached = await caches.match(req);
      return cached || new Response("", { status: 504 });
    }
  })());
});
