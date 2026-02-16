// lib/push.js
import { getApi } from "./env.js";

const SW_READY_TIMEOUT_MS = 8000;

function $(id) { return document.getElementById(id); }
function setText(el, txt) { if (el) el.textContent = txt || ""; }

function canPush() {
  return ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window);
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function readPublicKey(url) {
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`public-key HTTP ${res.status}: ${txt.slice(0, 120)}`);
  try {
    const j = JSON.parse(txt);
    const k = j.publicKey || j.public_key || j.key;
    if (!k) throw new Error("public-key JSON sense camp publicKey");
    return String(k).trim();
  } catch {
    const k = String(txt || "").trim();
    if (!k) throw new Error("public-key buit");
    return k;
  }
}

async function apiPost(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const txt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  return txt;
}

function withTimeout(promise, ms, label = "timeout") {
  let t = null;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function getSW() {
  // 1) Si ja hi ha registration, millor (no penja tant)
  const reg0 = await navigator.serviceWorker.getRegistration().catch(() => null);
  if (reg0) return reg0;

  // 2) Espera ready (però amb timeout)
  return await withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT_MS, "SW ready timeout");
}

export function initPushBell() {
  const btnOn  = $("btnPush");     // dalt: només ACTIVAR
  const st     = $("pushStatus");  // baix: missatge
  const btnOff = $("btnPushOff");  // baix: DESACTIVAR

  if (!btnOn) return;

  const { PUSH_PUBLIC_KEY_URL, PUSH_SUBSCRIBE_URL, PUSH_UNSUBSCRIBE_URL } = getApi();

  // Helpers UI
  function showOn()  { if (btnOn)  btnOn.style.display  = "inline-flex"; }
  function hideOn()  { if (btnOn)  btnOn.style.display  = "none"; }
  function showOff() { if (btnOff) btnOff.style.display = "inline-flex"; }
  function hideOff() { if (btnOff) btnOff.style.display = "none"; }

  function setWorking(txt = "Treballant…") {
    if (btnOn)  btnOn.disabled = true;
    if (btnOff) btnOff.disabled = true;
    setText(st, txt);
  }

  function setIdle() {
    if (btnOn)  btnOn.disabled = false;
    if (btnOff) btnOff.disabled = false;
  }

  if (!canPush()) {
    // No suport -> amaga botons, no molestem
    hideOn();
    hideOff();
    setText(st, "");
    return;
  }

  // Text fixe del botó dalt
  btnOn.textContent = "🔔 Activar avisos";

  async function refreshUi({ scrollToStatus = false } = {}) {
    try {
      // Permís denegat: no té sentit mostrar botons d'acció
      if (Notification.permission === "denied") {
        hideOn();
        hideOff();
        setText(st, "🔕 Tens les notificacions bloquejades al navegador. Cal habilitar-les als permisos del lloc.");
        if (scrollToStatus) st?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        return;
      }

      const reg = await getSW();
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // JA subscrit -> dalt ocult, baix visible
        hideOn();
        showOff();
        setText(st, "✅ Avisos activats.");
        if (scrollToStatus) st?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        return;
      }

      // NO subscrit -> dalt visible, baix net
      showOn();
      hideOff();
      setText(st, "");
    } catch (e) {
      // Si falla el SW, deixem com a mínim l’opció d’activar
      showOn();
      hideOff();
      setText(st, `⚠️ Push no disponible: ${e?.message || e}`);
    } finally {
      setIdle();
    }
  }

  // --- ACTIVAR (només des de dalt) ---
  btnOn.addEventListener("click", async () => {
    setWorking("Activant avisos…");

    try {
      const reg = await getSW();
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Si per qualsevol motiu ja hi era, refresquem UI
        await refreshUi({ scrollToStatus: true });
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setText(
          st,
          perm === "denied"
            ? "Permís denegat. Cal activar notificacions al navegador."
            : "Permís no concedit."
        );
        await refreshUi({ scrollToStatus: true });
        return;
      }

      const publicKey = await readPublicKey(PUSH_PUBLIC_KEY_URL);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiPost(PUSH_SUBSCRIBE_URL, sub.toJSON ? sub.toJSON() : sub);

      // IMPORTANT: la UI final la decideix refreshUi (i fa desaparèixer el botó dalt)
      setText(st, "✅ Avisos activats.");
      await refreshUi({ scrollToStatus: true });
    } catch (e) {
      console.warn("push subscribe fail", e);
      setText(st, `❌ Error: ${e?.message || e}`);
      await refreshUi({ scrollToStatus: true });
    }
  });

  // --- DESACTIVAR (només des de baix) ---
  btnOff?.addEventListener("click", async () => {
    setWorking("Desactivant avisos…");

    try {
      const reg = await getSW();
      const existing = await reg.pushManager.getSubscription();

      if (!existing) {
        // ja no hi era
        await refreshUi({ scrollToStatus: false });
        return;
      }

      const endpoint = existing.endpoint;
      try { await apiPost(PUSH_UNSUBSCRIBE_URL, { endpoint }); } catch {}

      await existing.unsubscribe();

      setText(st, "Avisos desactivats.");
      await refreshUi({ scrollToStatus: false });
    } catch (e) {
      console.warn("push unsubscribe fail", e);
      setText(st, `❌ Error: ${e?.message || e}`);
      await refreshUi({ scrollToStatus: false });
    }
  });

  // Estat inicial (important per recàrrega)
  refreshUi();
}
