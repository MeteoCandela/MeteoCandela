// sw.js — MeteoValls
// Objectiu:
// - PWA "shell offline" robusta: totes les pàgines (index/previsio/historic/sobre) amb CSS/JS offline
// - /api/* sempre xarxa (no cache) per evitar dades velles
// - Assets: stale-while-revalidate amb clau neta (ignora ?v=)
// - Navegació HTML: network-first; offline -> cache; si no -> home (evita blanc)

const VERSION = "2026-02-11-01";
const CACHE_PREFIX = "meteovalls-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

// Precache: pàgines + assets essencials
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/previsio.html",
  "/historic.html",
  "/sobre.html",

  "/site.webmanifest",
  "/style.css",
  "/app.js",

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

// Clau neta: guardem al cache per pathname (ignorem ?v=)
function cleanKeyRequest(originalRequest, urlObj) {
  return new Request(urlObj.pathname, {
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
      } catch {
        // ignorem errors individuals
      }
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

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Només GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Només same-origin (no cachegem CDNs)
  if (url.origin !== self.location.origin) return;

  // 1) API: network-only
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // 2) HTML: network-first -> cache; offline -> cache; si no -> home
  if (isHtmlRequest(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cleanReq = cleanKeyRequest(req, url);

      try {
        const res = await fetch(req);
        if (res && res.ok) {
          // Guardem amb clau neta i també amb la request real (per si hi ha query)
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

        // Fallback explícit per /sobre o /sobre/
        if (url.pathname === "/sobre" || url.pathname === "/sobre/") {
          const about = await cache.match("/sobre.html");
          if (about) return about;
        }

        const home =
          (await cache.match("/")) ||
          (await cache.match("/index.html"));

        return home || new Response("Offline", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  // 3) Assets: stale-while-revalidate amb clau neta (ignorem ?v=)
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

  // 4) Resta: network-first amb fallback cache
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch {
      const cached = await caches.match(req);
      return cached || new Response("", { status: 504 });
    }
  })());
});
