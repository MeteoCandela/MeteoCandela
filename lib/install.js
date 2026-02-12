// lib/install.js
export function initInstallFab() {
  const fab = () => document.getElementById("btnInstallFab");
  const tip = () => document.getElementById("iosInstallTip");
  const tipClose = () => document.getElementById("btnCloseIosTip");

  if (!fab()) return; // només a pàgines on existeix

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

  // Safari a iOS: tots són WebKit, així que cal excloure navegadors i “in-app browsers”
  function isSafariIOS() {
    const ua = navigator.userAgent || "";
    const isWebKit = /AppleWebKit/i.test(ua);
    const isCriOS = /CriOS/i.test(ua);      // Chrome iOS
    const isFxiOS = /FxiOS/i.test(ua);      // Firefox iOS
    const isEdgiOS = /EdgiOS/i.test(ua);    // Edge iOS
    const isOPRiOS = /OPRiOS/i.test(ua);    // Opera iOS
    const isDuck = /DuckDuckGo/i.test(ua);  // DuckDuckGo iOS
    // “Safari” també apareix a molts UA, però la clau és excloure els altres
    return isWebKit && !isCriOS && !isFxiOS && !isEdgiOS && !isOPRiOS && !isDuck;
  }

  function hideFab() {
    const b = fab();
    if (b) b.style.display = "none";
  }

  function showFab(labelText) {
    const b = fab();
    if (!b) return;
    if (labelText) b.textContent = labelText;
    b.style.display = "inline-flex";
  }

  function openTip() {
    const t = tip();
    if (t) t.style.display = "flex";
  }

  function closeTip() {
    const t = tip();
    if (t) t.style.display = "none";
  }

  // Ja instal·lada
  if (isStandalone()) {
    hideFab();
    closeTip();
    return;
  }

  // iOS: NO hi ha prompt, només instruccions.
  if (isIOS()) {
    if (isSafariIOS()) {
      showFab("📌 Afegir a inici");
    } else {
      // Estàs a iOS però NO a Safari (Chrome, Instagram, WhatsApp, etc.)
      showFab("📌 Instal·lar (obre a Safari)");
    }

    const b = fab();
    if (b && !b.__installBound) {
      b.addEventListener("click", openTip);
      b.__installBound = true;
    }

    const c = tipClose();
    if (c && !c.__installBound) {
      c.addEventListener("click", closeTip);
      c.__installBound = true;
    }

    const t = tip();
    if (t && !t.__installBound) {
      t.addEventListener("click", (e) => { if (e.target === t) closeTip(); });
      t.__installBound = true;
    }

    return;
  }

  // Android/desktop: beforeinstallprompt
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
