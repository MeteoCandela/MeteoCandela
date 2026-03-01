// sw.js — MeteoValls (scope-safe + anti-stale ESM + PUSH)

const VERSION = "2026-02-18-001"; // 🔁 PUJA AIXÒ SEMPRE
const CACHE_PREFIX = "meteovalls-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

// Scope real ("" a domini root, o "/MeteoCandela" a GitHub Pages)
const SCOPE = new URL(self.registration.scope).pathname.replace(/\/$/, ""); // "" o "/MeteoCandela"

// Helper per prefixar paths dins l'scope
const inScope = (p) => `${SCOPE}${p.startsWith("/") ? p : `/${p}`}`;

// ✅ Robust: comprova si un pathname és dins l'scope
function isInScopePath(pathname) {
  if (!SCOPE) return pathname.startsWith("/"); // root
  return pathname === SCOPE || pathname.startsWith(SCOPE + "/");
}

const PRECACHE_URLS = [
  inScope("/"),
  inScope("/index.html"),
  inScope("/previsio.html"),
  inScope("/historic.html"),
  inScope("/sobre.html"),
  inScope("/agricola.html"),
  inScope("/agricola_historic.html"),
  inScope("/site.webmanifest"),
  inScope("/style.css"),
  inScope("/poda.html"),
  inScope("/poda.css"),
  inScope("/calendari.html"),
  inScope("/vendor/chart.umd.min.js"),
  inScope("/vendor/suncalc.min.js"),
  inScope("/favicon.png"),
  inScope("/apple-touch-icon.png"),
  inScope("/android-chrome-192.png"),
  inScope("/android-chrome-512.png"),
];

function isApi(url) {
  return url.pathname.startsWith(inScope("/api/"));
}

function isHtml(request) {
  return request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
}

function isEsmModule(url) {
  if (!url.pathname.endsWith(".js")) return false;
  return (
    url.pathname === inScope("/app.js") ||
    url.pathname.startsWith(inScope("/pages/")) ||
    url.pathname.startsWith(inScope("/lib/"))
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
    url.pathname.startsWith(inScope("/vendor/"))
  );
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res && res.ok) await cache.put(url, res.clone());
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

async function networkFirst(req, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(cacheKey || req.url, res.clone()).catch(() => {});
    return res;
  } catch {
    const cached =
      (await cache.match(cacheKey || req.url)) ||
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
  const cached = await cache.match(cacheKey || req.url, { ignoreSearch: true });

  const update = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(cacheKey || req.url, res.clone()).catch(() => {});
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

  // ✅ Només interceptem dins l'scope (robust)
  if (!isInScopePath(url.pathname)) return;

  if (isApi(url)) {
    event.respondWith(fetch(req)); // network-only
    return;
  }

  // cacheKey = pathname (inclou SCOPE)
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
// PUSH notifications (ROBUST)
// =========================
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const origin = self.location.origin;

    let raw = "";
    let data = null;

    try { raw = event.data ? await event.data.text() : ""; } catch { raw = ""; }
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

    if (!data && !raw) {
      try {
        const lastUrl = new URL(inScope("/api/push/last"), origin).toString();
        const r = await fetch(lastUrl, { cache: "no-store" });
        if (r.ok) {
          const t = await r.text();
          try { data = JSON.parse(t); } catch { data = { body: t }; }
        }
      } catch {}
    }

    const title = (data && data.title) ? String(data.title) : "MeteoValls";
    const body =
      (data && data.body) ? String(data.body) :
      (raw ? raw.slice(0, 200) : "Alerta Meteorològica");

    const tag = (data && data.tag) ? String(data.tag) : "push";

    // ✅ URL robust: si ve absolut, respecta'l; si ve path, aplica scope.
    const clickVal = (data && data.url) ? String(data.url) : "/";
    const clickUrl = /^https?:\/\//i.test(clickVal)
      ? clickVal
      : new URL(inScope(clickVal), origin).toString();

    try {
      const ackUrl = new URL(inScope("/api/push/ack"), origin).toString();
      await fetch(ackUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ts: Date.now(),
          gotPush: true,
          hasData: !!event.data,
          rawLen: raw.length,
          title,
          tag,
          url: clickUrl,
        }),
      });
    } catch {}

    await self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      icon: inScope("/android-chrome-192.png"),
      badge: inScope("/android-chrome-192.png"),
      data: { url: clickUrl },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const origin = self.location.origin;
  const fallback = new URL(inScope("/"), origin).toString();
  const targetUrl = event.notification?.data?.url || fallback;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const c of allClients) {
      try {
        const cUrl = new URL(c.url);
        if (cUrl.origin === origin) {
          await c.focus();
          if ("navigate" in c) await c.navigate(targetUrl);
          return;
        }
      } catch {}
    }
    await clients.openWindow(targetUrl);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(Promise.resolve());
});
