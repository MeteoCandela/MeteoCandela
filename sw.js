// sw.js — MeteoValls (anti-stale ESM)
// Objectiu:
// - /api/* network-only
// - HTML: network-first (fallback cache)
// - ESM JS (app.js, /pages, /lib): network-first (fallback cache) => evita quedar-se enganxat a versions velles
// - Assets estàtics (icons, vendor, css): stale-while-revalidate

const VERSION = "2026-02-12-502"; // PUJA AIXÒ SEMPRE
const CACHE_PREFIX = "meteovalls-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/previsio.html",
  "/historic.html",
  "/sobre.html",

  "/site.webmanifest",
  "/style.css",

  // Vendor i icones (això sí que ho volem offline)
  "/vendor/chart.umd.min.js",
  "/vendor/suncalc.min.js",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/android-chrome-192.png",
  "/android-chrome-512.png",
];

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isHtml(request) {
  return request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
}

// IMPORTANT: els mòduls ESM que et poden quedar enganxats
function isEsmModule(url) {
  if (!url.pathname.endsWith(".js")) return false;
  return (
    url.pathname === "/app.js" ||
    url.pathname.startsWith("/pages/") ||
    url.pathname.startsWith("/lib/")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.endsWith(".css") ||
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
    url.pathname.endsWith(".webmanifest") ||
    // Vendor sí que el considerem “asset”
    url.pathname.startsWith("/vendor/")
  );
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    PRECACHE_URLS.map(async (path) => {
      try {
        const res = await fetch(path, { cache: "reload" });
        if (res && res.ok) await cache.put(path, res.clone());
      } catch {}
    })
  );
}

async function cleanup() {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((k) => (k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME ? caches.delete(k) : null))
  );
}

// network-first genèric amb fallback cache
async function networkFirst(req, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(cacheKey || req, res.clone()).catch(() => {});
    return res;
  } catch {
    const cached =
      (await cache.match(cacheKey || req)) ||
      (await cache.match(req, { ignoreSearch: true })) ||
      (await caches.match(req, { ignoreSearch: true }));
    return (
      cached ||
      new Response("Offline", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

// stale-while-revalidate per assets
async function staleWhileRevalidate(req, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey || req, { ignoreSearch: true });

  const update = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(cacheKey || req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (cached) {
    // actualitza en background
    update && self.registration && self.waitUntil(update);
    return cached;
  }

  const net = await update;
  return net || new Response("", { status: 504 });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await cleanup();
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1) API: network-only (mai cache)
  if (isApi(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // 2) HTML: network-first
  if (isHtml(req)) {
    event.respondWith(networkFirst(req, url.pathname));
    return;
  }

  // 3) ESM modules (app.js, /pages, /lib): network-first (aquí hi havia el “enganxament”)
  if (isEsmModule(url)) {
    event.respondWith(networkFirst(req, url.pathname));
    return;
  }

  // 4) Assets estàtics: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(req, url.pathname));
    return;
  }

  // 5) Resta: network-first
  event.respondWith(networkFirst(req, url.pathname));
});

// ==========================
// PUSH NOTIFICATIONS
// ==========================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "MeteoValls";
  const body = data.body || "";
  const tag = data.tag || "meteo";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
      renotify: true,
      // opcional però recomanat (usa icones que ja tens al precache)
      icon: "/android-chrome-192.png",
      badge: "/android-chrome-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const url = event.notification?.data?.url || "/";
  event.notification.close();

  event.waitUntil(
    (async () => {
      // Si ja hi ha una pestanya oberta del teu domini, millor enfocar-la i navegar-hi
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) {
        if ("focus" in c) {
          await c.focus();
          try {
            c.navigate(url);
          } catch {}
          return;
        }
      }
      // Si no n’hi ha, n’obrim una de nova
      await clients.openWindow(url);
    })()
  );
});

