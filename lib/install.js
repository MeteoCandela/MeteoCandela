// lib/install.js
export function initInstallFab() {
  const fab = () => document.getElementById("btnInstallFab");
  const tip = () => document.getElementById("iosInstallTip");
  const tipClose = () => document.getElementById("btnCloseIosTip");

  if (!fab()) return; // només a index (o on existeixi)

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches
      || window.navigator?.standalone === true;
  }

  function isIOS() {
    const ua = navigator.userAgent || "";
    const iOSUA = /iPad|iPhone|iPod/.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOSUA || iPadOS;
  }

  function isSafari() {
    const ua = navigator.userAgent || "";
    const isAppleWebKit = /AppleWebKit/.test(ua);
    const isChrome = /CriOS/.test(ua);
    const isFirefox = /FxiOS/.test(ua);
    return isAppleWebKit && !isChrome && !isFirefox;
  }

  function hideFab() { const b = fab(); if (b) b.style.display = "none"; }
  function showFab(labelText) {
    const b = fab(); if (!b) return;
    if (labelText) b.textContent = labelText;
    b.style.display = "inline-flex";
  }
  function openTip() { const t = tip(); if (t) t.style.display = "flex"; }
  function closeTip() { const t = tip(); if (t) t.style.display = "none"; }

  if (isStandalone()) { hideFab(); closeTip(); return; }

  if (isIOS() && isSafari()) {
    showFab("📌 Afegir a inici");
    const b = fab(); if (b) b.addEventListener("click", openTip);

    const c = tipClose(); if (c) c.addEventListener("click", closeTip);
    const t = tip(); if (t) t.addEventListener("click", (e) => { if (e.target === t) closeTip(); });
    return;
  }

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showFab("⬇️ Instal·la l’app");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideFab();
  });

  document.addEventListener("click", async (e) => {
    const b = fab();
    if (!b || e.target !== b) return;
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideFab();
  });
}
