// app.js — entrypoint únic (ESM)
export const V = "2026-02-17-003";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`./sw.js?v=${V}`).catch(console.error);
  });
}

async function initPushIfPresent() {
  try {
    const btn = document.getElementById("btnPush");
    if (!btn) return;
    const push = await import(`./lib/push.js?v=${V}`);
    push?.initPushBell?.();
  } catch (e) {
    console.warn("push init fail", e);
  }
}

async function boot() {
  const page = document.body?.dataset?.page || "home";

  // Install FAB
  try {
    const install = await import(`./lib/install.js?v=${V}`);
    install?.initInstallFab?.();
  } catch (e) {
    console.warn("install.js no carregat", e);
  }

  // Pages
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
      }
    }
  } catch (e) {
    console.error("BOOT ERROR:", e);
    const s = document.getElementById("fxStatus");
    if (s) s.textContent = `Error JS: ${e?.message || e}`;
  }

  // Push (després de la pàgina)
  await initPushIfPresent();
}

boot();
