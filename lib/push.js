// lib/push.js
import { getApi } from "./env.js";

function $(id) { return document.getElementById(id); }

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

async function getVapidPublicKey(PUSH_PUBLIC_KEY_URL) {
  const res = await fetch(PUSH_PUBLIC_KEY_URL, { cache: "no-store" });
  const txt = await res.text();
  try {
    const j = JSON.parse(txt);
    return j.publicKey || j.public_key || j.key || null;
  } catch {
    return txt?.trim() || null;
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${t.slice(0, 160)}`);
  }
  return true;
}

export function initPushBell() {
  const btn = $("btnPush");
  const st = $("pushStatus");
  if (!btn) return;

  // Espera que env.js retorni això:
  // PUSH_PUBLIC_KEY_URL, PUSH_SUBSCRIBE_URL, PUSH_UNSUBSCRIBE_URL
  const api = getApi();
  const PUSH_PUBLIC_KEY_URL = api.PUSH_PUBLIC_KEY_URL;
  const PUSH_SUBSCRIBE_URL = api.PUSH_SUBSCRIBE_URL;
  const PUSH_UNSUBSCRIBE_URL = api.PUSH_UNSUBSCRIBE_URL;

  function setStatus(msg) { if (st) st.textContent = msg || ""; }
  function show() { btn.style.display = "inline-flex"; }
  function hide() { btn.style.display = "none"; }

  // Requisits mínims
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    hide();
    return;
  }

  // Si falta backend URLs, amaga botó (evita errors silenciosos)
  if (!PUSH_PUBLIC_KEY_URL || !PUSH_SUBSCRIBE_URL || !PUSH_UNSUBSCRIBE_URL) {
    hide();
    return;
  }

  show();

  let busy = false;

  async function getRegAndSub() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return { reg, sub };
  }

  async function updateUiFromState() {
    try {
      const { sub } = await getRegAndSub();

      if (Notification.permission === "denied") {
        btn.disabled = true;
        btn.textContent = "🔕 Avisos bloquejats";
        setStatus("Tens les notificacions bloquejades al navegador. Activa-les a Configuració del navegador.");
        return;
      }

      if (sub) {
        btn.disabled = false;
        btn.textContent = "🔕 Desactivar avisos";
        setStatus("✅ Avisos activats. Els pots desactivar quan vulguis.");
        return;
      }

      btn.disabled = false;
      btn.textContent = "🔔 Activar avisos";
      setStatus("");
    } catch {
      btn.disabled = false;
      btn.textContent = "🔔 Activar avisos";
      setStatus("");
    }
  }

  async function doSubscribe() {
    // 1) Permís
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus(perm === "denied"
        ? "Permís denegat. Cal activar notificacions al navegador."
        : "Permís no concedit.");
      return;
    }

    // 2) Service Worker ready
    const { reg, sub: existing } = await getRegAndSub();
    if (existing) return; // ja hi és

    // 3) VAPID public key
    const publicKey = await getVapidPublicKey(PUSH_PUBLIC_KEY_URL);
    if (!publicKey) {
      setStatus("Falta la clau pública (VAPID) al backend.");
      return;
    }

    // 4) Subscriure
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5) Guardar al backend (D1)
    try {
      await postJson(PUSH_SUBSCRIBE_URL, sub);
    } catch (e) {
      // Si el backend falla, desfem la subscripció local (important)
      try { await sub.unsubscribe(); } catch {}
      throw e;
    }
  }

  async function doUnsubscribe() {
    const { sub } = await getRegAndSub();
    if (!sub) return;

    // 1) Marca com inactiu / elimina al backend
    // Backend espera: { endpoint: "..." }
    try {
      await postJson(PUSH_UNSUBSCRIBE_URL, { endpoint: sub.endpoint });
    } catch (e) {
      // Encara que falli backend, intentem desubscriure localment igualment
      console.warn("unsubscribe backend fail", e);
    }

    // 2) Desubscriure al navegador
    try { await sub.unsubscribe(); } catch {}
  }

  btn.addEventListener("click", async () => {
    if (busy) return;
    busy = true;

    btn.disabled = true;
    setStatus("Processant…");

    try {
      const { sub } = await getRegAndSub();

      if (sub) {
        // Toggle OFF
        await doUnsubscribe();
      } else {
        // Toggle ON
        await doSubscribe();
      }
    } catch (e) {
      console.warn("push toggle fail", e);
      setStatus("No s’ha pogut completar l’acció. Prova de nou.");
    } finally {
      busy = false;
      await updateUiFromState();
    }
  });

  // Estat inicial
  updateUiFromState();
}
