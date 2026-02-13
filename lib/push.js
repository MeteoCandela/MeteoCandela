// lib/push.js
import { getApi } from "./env.js";

function $(id) { return document.getElementById(id); }

function setText(el, txt) {
  if (el) el.textContent = txt || "";
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
  const txt = await res.text();
  if (!res.ok) throw new Error(`public-key HTTP ${res.status}: ${txt.slice(0,120)}`);
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
  if (!res.ok) throw new Error(`API ${res.status}: ${txt.slice(0,160)}`);
  return txt;
}

function canPush() {
  return ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window);
}

export function initPushBell() {
  const btn = $("btnPush");
  const st  = $("pushStatus");
  if (!btn) return;

  const { PUSH_PUBLIC_KEY_URL, PUSH_SUBSCRIBE_URL, PUSH_UNSUBSCRIBE_URL } = getApi();

  if (!canPush()) {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "inline-flex";

  async function refreshUi() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (Notification.permission === "denied") {
        btn.disabled = true;
        btn.textContent = "🔕 Avisos bloquejats";
        setText(st, "Tens les notificacions bloquejades al navegador.");
        return;
      }

      if (sub) {
        btn.disabled = false;
        btn.textContent = "🔔 Desactivar avisos";
        setText(st, "Avisos activats.");
        return;
      }

      btn.disabled = false;
      btn.textContent = "🔔 Activar avisos";
      setText(st, "");
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "🔔 Activar avisos";
      setText(st, `⚠️ Push no disponible: ${e?.message || e}`);
    }
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    setText(st, "Treballant…");

    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();

      // ---- UNSUBSCRIBE ----
      if (existing) {
        const endpoint = existing.endpoint;
        try { await apiPost(PUSH_UNSUBSCRIBE_URL, { endpoint }); } catch {}
        await existing.unsubscribe();
        setText(st, "Avisos desactivats.");
        await refreshUi();
        return;
      }

      // ---- SUBSCRIBE ----
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setText(st, perm === "denied"
          ? "Permís denegat. Cal activar notificacions al navegador."
          : "Permís no concedit.");
        await refreshUi();
        return;
      }

      const publicKey = await readPublicKey(PUSH_PUBLIC_KEY_URL);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiPost(PUSH_SUBSCRIBE_URL, sub);

      setText(st, "Avisos activats ✅");
      await refreshUi();
    } catch (e) {
      console.warn("push fail", e);
      setText(st, `❌ Error: ${e?.message || e}`);
      btn.disabled = false;
      await refreshUi();
    }
  });

  refreshUi();
}
