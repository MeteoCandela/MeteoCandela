// sw.js — MeteoValls (anti-stale ESM + PUSH)

const VERSION = "2026-02-15-006"; // 🔁 PUJA AIXÒ SEMPRE quan modifiquis el SW
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

function isEsmModule(url) {
  if (!url.pathname.endsWith(".js")) return false;
  return url.pathname === "/app.js" || url.pathname.startsWith("/pages/") || url.pathname.startsWith("/lib/");
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
  await Promise.all(keys.map((k) => (k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME ? caches.delete(k) : null)));
}

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

async function staleWhileRevalidate(req, cacheKey, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey || req, { ignoreSearch: true });

  const update = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(cacheKey || req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (cached) {
    if (event) event.waitUntil(update);
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

  if (isApi(url)) {
    event.respondWith(fetch(req));
    return;
  }

  if (isHtml(req)) {
    event.respondWith(networkFirst(req, url.pathname));
    return;
  }

  if (isEsmModule(url)) {
    event.respondWith(networkFirst(req, url.pathname));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(req, url.pathname, event));
    return;
  }

  event.respondWith(networkFirst(req, url.pathname));
});

// =========================
// PUSH notifications (FIXED)
// =========================
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let raw = "";
    let data = null;

    try { raw = event.data ? await event.data.text() : ""; } catch { raw = ""; }
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

    const title = (data && data.title) ? data.title : "MeteoValls";
    const body =
      (data && data.body) ? data.body :
      (raw ? raw.slice(0, 200) : "Alerta Meteorològica");

    const tag = (data && data.tag) ? data.tag : "push";
    const url = (data && data.url) ? data.url : "/";

    // ACK (best-effort) amb info diagnòstica
    try {
      await fetch("/api/push/ack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ts: Date.now(),
          gotPush: true,
          hasData: !!event.data,
          rawLen: raw.length,
          title,
          tag,
        }),
      });
    } catch {}

    await self.registration.showNotification(title, {
      body,
      tag,
      icon: "/android-chrome-192.png",
      badge: "/android-chrome-192.png",
      data: { url },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification?.data?.url || "/", self.location.origin).toString();

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) {
        try {
          const cUrl = new URL(c.url);
          if (cUrl.origin === self.location.origin) {
            await c.focus();
            if ("navigate" in c) await c.navigate(targetUrl);
            return;
          }
        } catch {}
      }
      await clients.openWindow(targetUrl);
    })()
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(Promise.resolve());
});
