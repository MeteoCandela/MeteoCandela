// sw.js — MeteoValls
// Estratègia:
// - /api/*: sempre xarxa (no cache)
// - HTML (navegació): network-first amb fallback a cache; si no hi ha cache -> home
// - Assets (css/js/png/svg/woff2...): stale-while-revalidate

const VERSION = "2026-02-10-04";
const CACHE_NAME = `meteovalls-${VERSION}`;

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

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Precache tolerant: si algun fitxer no existeix, no trenquem la instal·lació
    await Promise.allSettled(
      PRECACHE_URLS.map(async (path) => {
        try {
          const res = await fetch(new Request(path, { cache: "reload" }));
          if (res.ok) await cache.put(path, res.clone());
        } catch {
          // ignorem errors individuals
        }
      })
    );
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Esborra caches antigues
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) =>
        (k.startsWith("meteovalls-") && k !== CACHE_NAME) ? caches.delete(k) : null
      )
    );

    await self.clients.claim();
  })());
});

// Opcional: forçar update del SW des de la web
self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // només GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // només mateix origen (no cachegem CDNs)
  if (url.origin !== self.location.origin) return;

  // API: sempre xarxa, mai cache
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML: network-first, fallback a cache; si no hi ha cache -> home
  if (isHtmlRequest(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        const cached = await cache.match(req);
        if (cached) return cached;

        // fallback a HOME per evitar pantalla blanca
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

  // Assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const update = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);

      // si tenim cache, retornem-la immediatament i actualitzem en segon pla
      if (cached) {
        event.waitUntil(update);
        return cached;
      }

      // si no hi ha cache, provem xarxa; si falla, 504
      const net = await update;
      return net || new Response("", { status: 504 });
    })());
    return;
  }

  // Resta: xarxa amb fallback a cache
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch {
      const cached = await caches.match(req);
      return cached || new Response("", { status: 504 });
    }
  })());
});
