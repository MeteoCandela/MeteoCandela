// app.js — entrypoint únic (ESM)
export const V = "2026-02-12-503"; // 🔁 puja això quan canviïs JS

// Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${V}`).catch(console.error);
  });
}

async function boot() {
  const page = document.body?.dataset?.page || "home";

  // 1) Install FAB (iOS/Android)
  try {
    const install = await import(`./lib/install.js?v=${V}`);
    install?.initInstallFab?.();
  } catch (e) {
    console.warn("install.js no carregat", e);
  }

  // 2) Carrega la pàgina
  try {
    switch (page) {
      case "home": {
        const m = await import(`./pages/home.js?v=${V}`);
        m.initHome?.();
        break;
      }
      case "previsio": {
        const m = await import(`./pages/previsio.js?v=${V}`);
        m.initPrevisio?.();
        break;
      }
      case "historic": {
        const m = await import(`./pages/historic.js?v=${V}`);
        m.initHistoric?.();
        break;
      }
      case "sobre": {
        const m = await import(`./pages/sobre.js?v=${V}`);
        m.initSobre?.();
        break;
      }
      default: {
        const m = await import(`./pages/home.js?v=${V}`);
        m.initHome?.();
        break;
      }
    }
  } catch (e) {
    console.error("BOOT ERROR:", e);
    const s = document.getElementById("fxStatus");
    if (s) s.textContent = `Error JS: ${e?.message || e}`;
  }

  // 3) Push bell (només si hi ha botó a la pàgina)
  try {
    const push = await import(`./lib/push.js?v=${V}`);
    push?.initPushBell?.();
  } catch (e) {
    console.warn("push init fail", e);
  }
}

boot();
