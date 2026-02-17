import { getApi } from "./env.js";

const TTL_6H = 6 * 60 * 60 * 1000;

// =========================
// Utils
// =========================

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

function cap(str) {
  const s = String(str || "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

function prettyCategory(cat, type) {
  const c = String(cat || "").toLowerCase();
  if (c) return cap(c);
  const t = String(type || "").toLowerCase();
  if (t.startsWith("wind") || t.includes("gust")) return "Vent";
  if (t.startsWith("rain")) return "Pluja";
  if (t.startsWith("temp")) return "Temperatura";
  return "Avís";
}

function prettySeverity(sev) {
  const s = String(sev || "").toLowerCase();
  if (s === "danger") return "Perill";
  if (s === "warn") return "Avís";
  return "";
}

function prettyTitle(last) {
  if (last?.title) return String(last.title);
  if (last?.label) return String(last.label);
  const c = prettyCategory(last?.category, last?.type);
  const s = prettySeverity(last?.severity);
  return s ? `${c} · ${s}` : c || "Avís";
}

// =========================
// Main
// =========================

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

  function applyStyle(last) {
    const sev = String(last?.severity || "").toLowerCase();
    const cat = String(last?.category || "").toLowerCase();

    box.dataset.severity = sev || "";
    box.dataset.category = cat || "";
    box.dataset.type = String(last?.type || "");

    box.classList.remove("is-warn", "is-danger", "cat-wind", "cat-rain", "cat-temp");

    if (sev === "danger") box.classList.add("is-danger");
    else if (sev === "warn") box.classList.add("is-warn");

    if (cat) box.classList.add(`cat-${cat}`);
  }

  btnClose?.addEventListener("click", () => {
    if (lastKeyShown) {
      try { localStorage.setItem("meteovalls_alert_dismissed", lastKeyShown); } catch {}
    }
    hide();
  });

  async function tick() {
    try {
      const res = await fetch(`${API_BASE}/alerts/last`, { cache: "no-store" });
      if (!res.ok) return hide();

      const data = await res.json().catch(() => null);
      const last = data?.last || null;
      if (!last) return hide();

      const now = Date.now();
      const ts  = Number(last?.ts || 0);
      const exp = Number(last?.expires_ts || 0);

      // Caducitat (preferim expires_ts; fallback ts + 6h)
      if (exp && now > exp) return hide();
      if (ts && !exp && (now - ts > TTL_6H)) return hide();

      if (!last?.ts || (!last?.type && !last?.title && !last?.label)) return hide();

      const typeKey = last?.type || last?.tag || "alert";
      const key = `${typeKey}:${last.ts}`;
      lastKeyShown = key;

      try {
        const dismissed = localStorage.getItem("meteovalls_alert_dismissed");
        if (dismissed === key) return hide();
      } catch {}

      applyStyle(last);

      if (titleEl) titleEl.textContent = prettyTitle(last);
      if (msgEl) msgEl.textContent = String(last?.message || last?.body || "");

      const metaBits = [
        last?.iso ? `Últim avís: ${fmtLocal(last.iso)}` : "Últim avís",
        prettyCategory(last?.category, last?.type),
        prettySeverity(last?.severity),
      ].filter(Boolean);

      if (metaEl) metaEl.textContent = metaBits.join(" · ");

      show();
    } catch {
      hide();
    }
  }

  tick();
  setInterval(tick, Math.max(15000, Number(pollMs) || 60000));
}
