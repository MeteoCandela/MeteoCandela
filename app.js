// app.js — entrypoint únic (ESM)
const V = "2026-02-11-99"; // <— PUJA AQUEST NÚMERO CADA COP QUE TOQUIS JS

// Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${V}`).catch(console.error);
  });
}

// imports amb versió (IMPORTANT)
import { initInstallFab } from `./lib/install.js?v=${V}`;
import { initHome } from `./pages/home.js?v=${V}`;
import { initPrevisio } from `./pages/previsio.js?v=${V}`;
import { initHistoric } from `./pages/historic.js?v=${V}`;
import { initSobre } from `./pages/sobre.js?v=${V}`;

function boot() {
  initInstallFab();

  const page = document.body?.dataset?.page || "home";
  switch (page) {
    case "home":      initHome(); break;
    case "previsio":  initPrevisio(); break;
    case "historic":  initHistoric(); break;
    case "sobre":     initSobre(); break;
    default:          initHome();
  }
}

boot();
