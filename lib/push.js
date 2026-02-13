// lib/push.js
import { getApi } from "./env.js";

function $(id){ return document.getElementById(id); }

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getVapidPublicKey(PUSH_PUBLIC_KEY_URL){
  // Espera resposta: { publicKey: "...." } o text pla "...."
  const res = await fetch(PUSH_PUBLIC_KEY_URL, { cache: "no-store" });
  const txt = await res.text();
  try {
    const j = JSON.parse(txt);
    return j.publicKey || j.public_key || j.key || null;
  } catch {
    return txt?.trim() || null;
  }
}

export function initPushBell() {
  const btn = $("btnPush");
  const st  = $("pushStatus");
  if (!btn) return;

  const { PUSH_SUBSCRIBE_URL, PUSH_PUBLIC_KEY_URL } = getApi();

  function setStatus(msg){ if (st) st.textContent = msg || ""; }
  function show(){ btn.style.display = "inline-flex"; }
  function hide(){ btn.style.display = "none"; }

  // Requisits mínims
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    hide();
    return;
  }

  show();

  async function updateUiFromState() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (Notification.permission === "denied") {
        btn.disabled = true;
        btn.textContent = "🔕 Avisos bloquejats";
        setStatus("Tens les notificacions bloquejades al navegador.");
        return;
      }

      if (sub) {
        btn.disabled = true;
        btn.textContent = "✅ Avisos activats";
        setStatus("Rebràs avisos quan s’activin les regles.");
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

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    setStatus("Activant…");

    try {
      // 1) Permís
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        btn.disabled = false;
        setStatus(perm === "denied"
          ? "Permís denegat. Cal activar notificacions al navegador."
          : "Permís no concedit.");
        await updateUiFromState();
        return;
      }

      // 2) Service Worker ready
      const reg = await navigator.serviceWorker.ready;

      // 3) VAPID public key (del Worker)
      const publicKey = await getVapidPublicKey(PUSH_PUBLIC_KEY_URL);
      if (!publicKey) {
        btn.disabled = false;
        setStatus("Falta la clau pública (VAPID).");
        return;
      }

      // 4) Subscriure
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 5) Enviar al backend
      const resp = await fetch(PUSH_SUBSCRIBE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(`subscribe API ${resp.status} ${t.slice(0,120)}`);
      }

      await updateUiFromState();
    } catch (e) {
      console.warn("push subscribe fail", e);
      btn.disabled = false;
      setStatus("No s’ha pogut activar. Prova de nou.");
      await updateUiFromState();
    }
  });

  // Pintar estat inicial
  updateUiFromState();
}
