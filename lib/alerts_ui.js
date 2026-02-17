// lib/alerts_ui.js
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

function cap(str) {
  const s = String(str || "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

// fallback si algun alert ve sense label/category/severity (per compat)
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
  // Prioritats:
  // 1) last.title
  // 2) last.label
  // 3) categoria + severitat
  if (last?.title) return String(last.title);
  if (last?.label) return String(last.label);
  const c = prettyCategory(last?.category, last?.type);
  const s = prettySeverity(last?.severity);
  return s ? `${c} · ${s}` : c || "Avís";
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

  // Aplica classes/data-* perquè CSS pugui pintar segons severitat/categoria
  function applyStyle(last) {
    const sev = String(last?.severity || "").toLowerCase();   // warn | danger
    const cat = String(last?.category || "").toLowerCase();   // wind | rain | temp ...

    box.dataset.severity = sev || "";
    box.dataset.category = cat || "";
    box.dataset.type = String(last?.type || "");

    // Classes “netes”
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
      if (!res.ok) { hide(); return; }

      const data = await res.json().catch(() => null);
      const last = data?.last || null;
      
      // ✅ CADUCITAT (preferim expires_ts; fallback a 6h des de ts)
      const TTL_6H = 6 * 60 * 60 * 1000;
      const ts = Number(last?.ts || 0);
      const exp = Number(last?.expires_ts || 0);

      // Si el backend ja envia expires_ts, usem-ho
      if (exp && Date.now() > exp) { hide(); return; }

      // Fallback pels alerts antics o si l'API no inclou expires_ts
      if (ts && !exp && (Date.now() - ts > TTL_6H)) { hide(); return; }

      if (!last?.ts || (!last?.type && !last?.title && !last?.label)) { hide(); return; }

      // clau per “dismiss”: type+ts (si type no hi és, fem fallback)
      const typeKey = last?.type || last?.tag || "alert";
      const key = `${typeKey}:${last.ts}`;
      lastKeyShown = key;

      let dismissed = null;
      try { dismissed = localStorage.getItem("meteovalls_alert_dismissed"); } catch {}
      if (dismissed === key) { hide(); return; }

      applyStyle(last);

      const ttl = prettyTitle(last);
      const msg = String(last?.message || last?.body || "");
      const when = fmtLocal(last?.iso);

      const cat = prettyCategory(last?.category, last?.type);
      const sevTxt = prettySeverity(last?.severity);
      const metaBits = [
        when ? `Últim avís: ${when}` : "Últim avís",
        cat || null,
        sevTxt || null,
      ].filter(Boolean);

      if (titleEl) titleEl.textContent = ttl;
      if (msgEl) msgEl.textContent = msg;
      if (metaEl) metaEl.textContent = metaBits.join(" · ");

      show();
    } catch {
      hide();
    }
  }

  tick();
  setInterval(tick, Math.max(15000, Number(pollMs) || 60000));
}
