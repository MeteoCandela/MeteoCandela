// app.js — entrypoint únic (ESM)
import { getBase } from "./lib/env.js";
export const V = "2026-02-19-001";

const BASE = getBase();
const p = (x) => `${BASE}${x}`;

async function initPushIfPresent() {
  try {
    const btn = document.getElementById("btnPush");
    if (!btn) return;
    const push = await import(p(`/lib/push.js?v=${V}`));
    push?.initPushBell?.();
  } catch (e) {
    console.warn("push init fail", e);
  }
}

async function boot() {
  const page = document.body?.dataset?.page || "home";

  try {
    const install = await import(p(`/lib/install.js?v=${V}`));
    install?.initInstallFab?.();
  } catch (e) {
    console.warn("install.js no carregat", e);
  }

  try {
    switch (page) {
      case "home": {
        const m = await import(p(`/pages/home.js?v=${V}`));
        m.initHome?.();
        try {
          const b = await import(p(`/lib/meteocat_badge.js?v=${V}`));
          b?.initMeteocatBadge?.();
        } catch (e) {
          console.warn("meteocat badge fail", e);
        }
        break;
      }
      case "previsio": {
        const m = await import(p(`/pages/previsio.js?v=${V}`));
        m.initPrevisio?.();
        break;
      }
      case "avisos": {
        const m = await import(p(`/pages/avisos.js?v=${V}`));
        m.initAvisos?.();
        break;
      }
      case "historic": {
        const m = await import(p(`/pages/historic.js?v=${V}`));
        m.initHistoric?.();
        break;
      }
      case "sobre": {
        const m = await import(p(`/pages/sobre.js?v=${V}`));
        m.initSobre?.();
        break;
      }
      case "agricola": {
        const m = await import(p(`/pages/agricola.js?v=${V}`));
        m.initAgricola?.();
        break;
      }
      case "agricola_historic": {
        const m = await import(p(`/pages/agricola_historic.js?v=${V}`));
        m.initAgricolaHistoric?.();
        break;
      }
        case "calendari": {
        const m = await import(`/calendari.js?v=${V}`);
        m?.initCalendariPage?.();
        break;
        }
      default: {
        const m = await import(p(`/pages/home.js?v=${V}`));
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
      .then((reg) => console.log("SW registrat:", reg.scope))
      .catch((err) => console.error("SW error:", err));
  });
}

boot();
