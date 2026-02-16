import { getApi } from "./env.js";

function fmtLocal(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ca-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "short",
      timeStyle: "short"
    }).format(d);
  } catch {
    return iso || "";
  }
}

export function initAlertsXL({ pollMs = 60000 } = {}) {
  const el = document.getElementById("alertXL");
  if (!el) return;

  const titleEl = document.getElementById("alertXLTitle");
  const msgEl   = document.getElementById("alertXLMsg");
  const metaEl  = document.getElementById("alertXLMeta");
  const btnClose = document.getElementById("alertXLClose");

  const { API_BASE } = getApi();

  let lastKeyShown = null;

  function hide() { el.style.display = "none"; }
  function show() { el.style.display = ""; }

  btnClose?.addEventListener("click", () => {
    // recorda “tancat” per aquest avís (per no emprenyar)
    if (lastKeyShown) localStorage.setItem("meteovalls_alert_dismissed", lastKeyShown);
    hide();
  });

  async function tick() {
    try {
      const res = await fetch(`${API_BASE}/alerts/last`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      const last = data?.last || null;
      if (!last?.ts || !last?.type) { hide(); return; }

      const key = `${last.type}:${last.ts}`;
      lastKeyShown = key;

      // Si l’usuari l’ha tancat, no el tornis a mostrar
      const dismissed = localStorage.getItem("meteovalls_alert_dismissed");
      if (dismissed === key) { hide(); return; }

      titleEl.textContent = last.title || "Avís";
      msgEl.textContent = last.message || "";
      metaEl.textContent = `Últim avís: ${fmtLocal(last.iso)} · ${last.type}`;

      show();
    } catch {
      // si falla, no trenquem res
      hide();
    }
  }

  tick();
  setInterval(tick, Math.max(15000, pollMs));
}
