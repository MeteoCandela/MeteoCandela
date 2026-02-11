// app.js — entrypoint únic (ESM)

// Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  });
}

import { initInstallFab } from "./lib/install.js";
import { initHome } from "./pages/home.js";
import { initPrevisio } from "./pages/previsio.js";
import { initHistoric } from "./pages/historic.js";
import { initSobre } from "./pages/sobre.js";

function boot() {
  // FAB instal·lació (si el botó existeix en aquesta pàgina)
  initInstallFab();

  // Router per pàgina
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
