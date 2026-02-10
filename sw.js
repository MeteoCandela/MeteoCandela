// sw.js — MeteoValls
// Objectiu: PWA fiable per dades en temps real.
// - Cache només assets estàtics (app shell)
// - Network-first per HTML (sempre última versió)
// - Stale-while-revalidate per CSS/JS/imatges
// - MAI cachejar /api/*
// - Fallback offline a /offline.html (si existeix)

const VERSION = "2026-02-10-01";
const CACHE_NAME = `meteovalls-shell-${VERSION}`;

// Ajusta aquesta llista si canvies noms o afegeixes fitxers.
// Consell: mantén-la curta. Tot el que no hi sigui es servirà igualment per xarxa.
const PRECACHE_URLS = [
  "/",                 // entry
  "/index.html",       // si existeix (si no, no passa res: es capturarà al fetch HTML)
  "/style.css",
  "/app.js",
  "/site.webmanifest",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/android-chrome-192.png",
  "/android-chrome-512.png",
  "/og-image.png",
  "/offline.html",     // crea'l si vols fallback offline real
  // Si tens Chart.js en local:
  "/vendor/chart.umd.js",
];

// No cachejar mai l'API
function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isHtmlRequest(request) {
  return request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");
}

function isStaticAssetRequest(url) {
  // assets típics (css/js/img/font)
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

    // Precache tolerant: si algun asset no existeix (p.ex. /index.html), no trenquem instal·lació.
    await Promise.allSettled(
      PRECACHE_URLS.map(async (u) => {
        try {
          // cache: 'reload' força a saltar caches HTTP del navegador durant install
          const req = new Request(u, { cache: "reload" });
          const res = await fetch(req);
          if (res.ok) await cache.put(u, res);
        } catch {
          // ignorem errors d’asset individual
        }
      })
    );
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Neteja caches antigues
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        if (k.startsWith("meteovalls-shell-") && k !== CACHE_NAME) {
          return caches.delete(k);
        }
      })
    );

    await self.clients.claim();
  })());
});

// Permet forçar update: des de la web pots fer postMessage({type:"SKIP_WAITING"})
self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Només GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Només mateix origen (evitem cachejar CDNs)
  if (url.origin !== self.location.origin) return;

  // MAI cachejar /api/*
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML: Network-first + fallback offline
  if (isHtmlRequest(req)) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // Opcional: guarda la darrera pàgina per obrir offline
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        // Offline: prova cache i després /offline.html
        const cached = await caches.match(req);
        if (cached) return cached;

        const offline = await caches.match("/offline.html");
        if (offline) return offline;

        return new Response("Offline", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  // Assets estàtics: Stale-while-revalidate
  if (isStaticAssetRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);

      // Torna cache si existeix, i en paral·lel actualitza
      if (cached) return cached;

      // Si no hi ha cache, espera xarxa; si falla, retorna el que puguis
      const net = await fetchPromise;
      if (net) return net;

      // fallback (p.ex. icones)
      return new Response("", { status: 504 });
    })());
    return;
  }

  // Resta: per defecte xarxa amb fallback a cache (conservador)
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch {
      const cached = await caches.match(req);
      return cached || new Response("", { status: 504 });
    }
  })());
});
