// app.js — entrypoint únic (ESM)
export const V = "2026-02-12-201"; // PUJA AQUEST NÚMERO QUAN TOQUIS JS

// Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${V}`).catch(console.error);
  });
}

// IMPORTANT: imports estàtics normals (NO templates)
import { initInstallFab } from "./lib/install.js";
import { initHome } from "./pages/home.js";
import { initPrevisio } from "./pages/previsio.js";
import { initHistoric } from "./pages/historic.js";
import { initSobre } from "./pages/sobre.js";

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
