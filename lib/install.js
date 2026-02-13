// lib/install.js
export function initInstallFab() {
  const fab = () => document.getElementById("btnInstallFab");
  const tip = () => document.getElementById("iosInstallTip");
  const tipClose = () => document.getElementById("btnCloseIosTip");

  if (!fab()) return;

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches
      || window.navigator?.standalone === true;
  }

  function isIOS() {
    const ua = navigator.userAgent || "";
    const iOSUA = /iPad|iPhone|iPod/i.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOSUA || iPadOS;
  }

  function isSafariIOS() {
    const ua = navigator.userAgent || "";
    const isWebKit = /AppleWebKit/i.test(ua);

    const isCriOS = /CriOS/i.test(ua);      // Chrome iOS
    const isFxiOS = /FxiOS/i.test(ua);      // Firefox iOS
    const isEdgiOS = /EdgiOS/i.test(ua);    // Edge iOS
    const isOPRiOS = /OPRiOS/i.test(ua);    // Opera iOS
    const isDuck = /DuckDuckGo/i.test(ua);  // DuckDuckGo iOS
    const isGSA  = /GSA/i.test(ua);         // Google app in-app
    const isYa   = /YaBrowser/i.test(ua);

    return isWebKit && !isCriOS && !isFxiOS && !isEdgiOS && !isOPRiOS && !isDuck && !isGSA && !isYa;
  }

  function isInAppBrowser() {
    const ua = navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|WhatsApp|Telegram/i.test(ua);
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

  // ===== Banner automàtic (iOS no-Safari o in-app) =====
  function maybeShowIOSBanner() {
    if (!isIOS()) return;
    if (isStandalone()) return;

    const safari = isSafariIOS();
    const inApp = isInAppBrowser();

    // Si és Safari “real” i no és in-app, no cal banner
    if (safari && !inApp) return;

    // No el tornis a mostrar si l'han tancat (1 dia)
    try {
      const last = Number(localStorage.getItem("ios_banner_hide_until") || "0");
      if (Date.now() < last) return;
    } catch {}

    // Evita duplicats
    if (document.getElementById("iosInstallBanner")) return;

    const el = document.createElement("div");
    el.id = "iosInstallBanner";
    el.className = "ios-banner";
    el.innerHTML = `
      <div class="ios-banner__txt">
        <strong>📌 Instal·lació a iPhone/iPad:</strong><br>
        Per instal·lar MeteoValls cal obrir amb <strong>Safari</strong>
        (no Chrome, ni dins WhatsApp/Instagram/Telegram).
      </div>
      <div class="ios-banner__actions">
        <button class="ios-banner__btn" type="button" id="iosBannerHow">Com fer-ho</button>
        <button class="ios-banner__close" type="button" aria-label="Tancar" id="iosBannerClose">✕</button>
      </div>
    `;

    document.body.appendChild(el);

    const how = document.getElementById("iosBannerHow");
    const close = document.getElementById("iosBannerClose");

    if (how) {
      how.addEventListener("click", () => openTip());
    }

    if (close) {
      close.addEventListener("click", () => {
        try {
          // amaga 24h
          localStorage.setItem("ios_banner_hide_until", String(Date.now() + 24 * 60 * 60 * 1000));
        } catch {}
        el.remove();
      });
    }
  }

  // Ja instal·lada
  if (isStandalone()) {
    hideFab();
    closeTip();
    return;
  }

  // Sempre prova de mostrar banner a iOS (si toca)
  maybeShowIOSBanner();

  // ===== iOS (sense beforeinstallprompt) =====
  if (isIOS()) {
    const safari = isSafariIOS();
    const inApp = isInAppBrowser();

    if (safari && !inApp) showFab("📌 Afegir a inici");
    else showFab("📌 Obre a Safari per instal·lar");

    const b = fab();
    if (b && !b.__installBound) {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        openTip();
      });
      b.__installBound = true;
    }

    const c = tipClose();
    if (c && !c.__installCloseBound) {
      c.addEventListener("click", closeTip);
      c.__installCloseBound = true;
    }

    const t = tip();
    if (t && !t.__installBgBound) {
      t.addEventListener("click", (e) => { if (e.target === t) closeTip(); });
      t.__installBgBound = true;
    }

    return;
  }

  // ===== Android / Desktop (beforeinstallprompt) =====
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
