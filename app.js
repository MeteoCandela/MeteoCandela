// app.js — entrypoint únic (ESM)
import { getBase } from "./lib/env.js";

const BASE = getBase();
const p = (x) => `${BASE}${x}`;

async function initPushIfPresent() {
  try {
    const btn = document.getElementById("btnPush");
    if (!btn) return;
    const push = await import(p("/lib/push.js"));
    push?.initPushBell?.();
  } catch (e) {
    console.warn("push init fail", e);
  }
}

async function boot() {
  const page = document.body?.dataset?.page || "home";

  try {
    const install = await import(p("/lib/install.js"));
    install?.initInstallFab?.();
  } catch (e) {
    console.warn("install.js no carregat", e);
  }

  try {
    switch (page) {
      case "home": {
        const m = await import(p("/pages/home.js"));
        m.initHome?.();
        try {
          const b = await import(p("/lib/meteocat_badge.js"));
          b?.initMeteocatBadge?.();
        } catch (e) {
          console.warn("meteocat badge fail", e);
        }
        break;
      }
      case "previsio": {
        const m = await import(p("/pages/previsio.js"));
        m.initPrevisio?.();
        break;
      }
      case "avisos": {
        const m = await import(p("/pages/avisos.js"));
        m.initAvisos?.();
        break;
      }
      case "historic": {
        const m = await import(p("/pages/historic.js"));
        m.initHistoric?.();
        break;
      }
      case "sobre": {
        const m = await import(p("/pages/sobre.js"));
        m.initSobre?.();
        break;
      }
      case "agricola": {
        const m = await import(p("/pages/agricola.js"));
        m.initAgricola?.();
        break;
      }
      case "agricola_historic": {
        const m = await import(p("/pages/agricola_historic.js"));
        m.initAgricolaHistoric?.();
        break;
      }
      case "poda": {
        const m = await import(p("/pages/poda.js"));
        m.initPoda?.();
        break;
      }
      case "calendari": {
        const m = await import(p("/pages/calendari.js"));
        m?.initCalendariPage?.();
        break;
      }
      default: {
        const m = await import(p("/pages/home.js"));
        m.initHome?.();
      }
    }
  } catch (e) {
    console.error("BOOT ERROR:", e);
    const s = document.getElementById("fxStatus");
    if (s) s.textContent = `Error JS: ${e?.message || e}`;
  }

  await initPushIfPresent();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(p("/sw.js"))
      .catch((err) => console.error("SW error:", err));
  });
}

boot();
