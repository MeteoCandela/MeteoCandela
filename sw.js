// sw.js — network-only (sense cache). PWA instal·lable i actualització ràpida.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fem respondWith => el navegador va a xarxa normalment.
// (Això evita qualsevol sorpresa de cache del SW.)
self.addEventListener("fetch", () => {});
