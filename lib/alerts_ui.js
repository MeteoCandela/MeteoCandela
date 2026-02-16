import { getApi } from "./env.js";

function fmtLocal(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ca-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(iso);
  }
}

export function initAlertsXL({ pollMs = 60000 } = {}) {
  const box = document.getElementById("alertXL");
  if (!box) return;

  const titleEl = document.getElementById("alertXLTitle");
  const msgEl   = document.getElementById("alertXLMsg");
  const metaEl  = document.getElementById("alertXLMeta");
  const btnClose = document.getElementById("alertXLClose");

  const { API_BASE } = getApi();

  let lastKeyShown = null;

  function hide() { box.style.display = "none"; }
  function show() { box.style.display = ""; }

  btnClose?.addEventListener("click", () => {
    if (lastKeyShown) {
      try { localStorage.setItem("meteovalls_alert_dismissed", lastKeyShown); } catch {}
    }
    hide();
  });

  async function tick() {
    try {
      const res = await fetch(`${API_BASE}/alerts/last`, { cache: "no-store" });
if (!res.ok) { hide(); return; }
const data = await res.json().catch(() => null);
      const last = data?.last || null;

      // sense avís -> amaga
      if (!last?.ts || !last?.type) { hide(); return; }

      const key = `${last.type}:${last.ts}`;
      lastKeyShown = key;

      // si l’usuari l’ha tancat, no el tornis a mostrar
      const dismissed = (() => {
        try { return localStorage.getItem("meteovalls_alert_dismissed"); } catch { return null; }
      })();
      if (dismissed === key) { hide(); return; }

      if (titleEl) titleEl.textContent = last.title || "Avís";
      if (msgEl) msgEl.textContent = last.message || "";
      if (metaEl) metaEl.textContent = `Últim avís: ${fmtLocal(last.iso)} · ${last.type}`;

      show();
    } catch {
      // si falla, NO trenquem la home
      hide();
    }
  }

  tick();
  setInterval(tick, Math.max(15000, Number(pollMs) || 60000));
}
