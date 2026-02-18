// pages/avisos.js
import { getApi } from "../lib/env.js";

function $(id){ return document.getElementById(id); }

// =========================
// Estils / textos
// =========================

function levelToClass(perill){
  const p = Number(perill);
  if (p >= 2) return "is-danger";
  if (p >= 1) return "is-warn";
  return "";
}

function perillText(p){
  const n = Number(p);
  if (n >= 3) return "Molt alt";
  if (n >= 2) return "Alt";
  if (n >= 1) return "Moderat";
  return "—";
}

// =========================
// Format dates (local)
// =========================

function fmtTsMillis(ts){
  const n = Number(ts);
  if (!Number.isFinite(n)) return "—";
  return new Intl.DateTimeFormat("ca-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(n));
}

function fmtIsoLocal(iso){
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ca-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function ymdFromDia(dia){
  // Meteocat sovint ve: "2026-02-19T00:00Z" → agafem YYYY-MM-DD
  const s = String(dia || "").trim();
  if (!s) return "";
  return s.slice(0, 10);
}

function prettyDia(dia){
  const ymd = ymdFromDia(dia);
  if (!ymd) return "—";
  try {
    // data “naïve” a midnight local
    const d = new Date(`${ymd}T00:00:00`);
    return new Intl.DateTimeFormat("ca-ES", {
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return ymd;
  }
}

function normPeriode(p){
  return String(p || "").trim().replaceAll(" ", "");
}

function safeText(x, fallback="—"){
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

// =========================
// Header (hero)
// =========================

function setHeader({ updated_ts = null, message = "—" } = {}){
  const subEl = $("alertsSub");
  const stEl  = $("alertsStatus");

  if (subEl) subEl.textContent = updated_ts ? `Actualitzat: ${fmtTsMillis(updated_ts)}` : message;

  if (stEl) {
    if (!updated_ts) stEl.textContent = "—";
    else {
      const ageMin = Math.max(0, Math.round((Date.now() - Number(updated_ts)) / 60000));
      stEl.textContent = `Dada: fa ${ageMin} min`;
    }
  }
}

// =========================
// Fetch
// =========================

async function fetchJson(url, opts){
  const res = await fetch(url, opts);
  let j = null;
  try { j = await res.json(); } catch {}
  if (!res.ok) {
    const msg = j?.error || j?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return j;
}

// =========================
// UI reset / empty / error
// =========================

function resetUI(){
  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const listEl = $("mvAlertsList");
  const emptyBox = $("mvAlertsEmpty");
  const hintEl = $("mvAlertsHint");

  if (metaEl) metaEl.textContent = "—";
  if (listEl) listEl.innerHTML = "";

  if (summaryBox) {
    summaryBox.style.display = "none";
    summaryBox.classList.remove("is-warn","is-danger");
  }
  if (emptyBox) emptyBox.style.display = "none";
  if (hintEl) {
    hintEl.style.display = "none";
    hintEl.textContent = "";
  }

  setHeader({ updated_ts: null, message: "Carregant avisos…" });
}

function renderError(msg){
  const metaEl = $("mvAlertsMeta");
  const hintEl = $("mvAlertsHint");
  if (metaEl) metaEl.textContent = safeText(msg, "Error carregant avisos.");
  if (hintEl) {
    hintEl.style.display = "block";
    hintEl.textContent = "Prova de refrescar o torna-ho a intentar més tard.";
  }
}

function renderNoAlerts(j){
  const metaEl = $("mvAlertsMeta");
  const emptyBox = $("mvAlertsEmpty");
  const listEl = $("mvAlertsList");

  const items = Array.isArray(j?.items) ? j.items : [];
  const count = items.length;

  if (metaEl) {
    metaEl.textContent =
      `Actualitzat: ${fmtTsMillis(j?.updated_ts)} · Perill màxim: ${perillText(j?.max_perill)} · Episodis: ${count}`;
  }
  if (emptyBox) emptyBox.style.display = "block";
  if (listEl) listEl.innerHTML = "";
}

// =========================
// Agrupació (per evitar duplicats per franges)
// =========================

function groupItems(items){
  const map = new Map();

  for (const it of items){
    const g = {
      meteor: safeText(it?.meteor, "Meteor"),
      tipus:  safeText(it?.tipus, "Avís"),
      comarca: safeText(it?.comarca, ""),
      perill: Number(it?.perill ?? 0),
      dia: String(it?.dia ?? ""),
      llindar: safeText(it?.llindar, ""),
      inici: String(it?.inici ?? ""),
      fi: String(it?.fi ?? ""),
      coment: safeText(it?.comentari, "—"),
      periodes: [],
    };

    // Clau d'agrupació: mateix avís però múltiples franges
    const key = [
      g.meteor,
      g.tipus,
      g.comarca,
      ymdFromDia(g.dia),
      g.perill,
      g.llindar,
      g.inici,
      g.fi,
      g.coment
    ].join("|");

    if (!map.has(key)) map.set(key, g);

    const per = normPeriode(it?.periode);
    if (per) {
      const agg = map.get(key);
      if (!agg.periodes.includes(per)) agg.periodes.push(per);
    }
  }

  const out = Array.from(map.values());
  for (const g of out) g.periodes.sort();

  // Ordre: dia (asc) + perill (desc) + meteor (asc)
  out.sort((a,b) => {
    const da = ymdFromDia(a.dia);
    const db = ymdFromDia(b.dia);
    const c1 = String(da).localeCompare(String(db));
    if (c1) return c1;
    const c2 = (Number(b.perill) - Number(a.perill));
    if (c2) return c2;
    return String(a.meteor).localeCompare(String(b.meteor));
  });

  return out;
}

// =========================
// Render avisos
// =========================

function renderAlerts(j){
  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const titleEl = $("mvAlertsTitle");
  const msgEl = $("mvAlertsMsg");
  const whenEl = $("mvAlertsWhen");
  const listEl = $("mvAlertsList");
  const emptyBox = $("mvAlertsEmpty");

  if (emptyBox) emptyBox.style.display = "none";

  const itemsRaw = Array.isArray(j?.items) ? j.items : [];
  const grouped = groupItems(itemsRaw);

  if (metaEl) {
    metaEl.textContent =
      `Actualitzat: ${fmtTsMillis(j?.updated_ts)} · Perill màxim: ${perillText(j?.max_perill)} · Episodis: ${grouped.length}`;
  }

  // Resum
  if (summaryBox && titleEl && msgEl && whenEl) {
    summaryBox.style.display = "block";
    const cls = levelToClass(j?.max_perill);
    summaryBox.classList.toggle("is-warn", cls === "is-warn");
    summaryBox.classList.toggle("is-danger", cls === "is-danger");

    titleEl.textContent = `Avisos vigents · Perill ${perillText(j?.max_perill)}`;
    msgEl.textContent = "Consulta el detall a continuació.";
    whenEl.textContent = `Actualització: ${fmtTsMillis(j?.updated_ts)}`;
  }

  if (!listEl) return;
  listEl.innerHTML = "";

  let lastDayKey = null;

  for (const g of grouped){
    const dayKey = ymdFromDia(g.dia);

    // Separador per dia
    if (dayKey && dayKey !== lastDayKey){
      lastDayKey = dayKey;
      const day = document.createElement("div");
      day.className = "mv-alert-day";
      day.innerHTML = `<div class="mv-alert-day__title">${prettyDia(g.dia)}</div>`;
      listEl.appendChild(day);
    }

    const card = document.createElement("div");
    const c = levelToClass(g.perill);
    card.className = `mv-alert-item ${c}`;

    const title = `${g.meteor} · ${g.tipus}`;
    const periodes = (g.periodes || []).map(p => `<span class="mv-chip">${p}</span>`).join("");

    const extraBits = [];
    if (g.llindar) extraBits.push(`Llindar: ${g.llindar}`);
    if (g.inici)   extraBits.push(`Inici: ${fmtIsoLocal(g.inici)}`);
    if (g.fi)      extraBits.push(`Fi: ${fmtIsoLocal(g.fi)}`);

    const extra = extraBits.join(" · ");

    card.innerHTML = `
      <div class="mv-alert-item__head">
        <div>
          <div class="mv-alert-item__title">${title}</div>
          <div class="mv-alert-item__meta">Perill: ${perillText(g.perill)}</div>
          ${periodes ? `<div class="mv-chips" style="margin-top:8px;">${periodes}</div>` : ""}
        </div>
        <div class="mv-alert-item__meta">${g.comarca || ""}</div>
      </div>
      <div class="mv-alert-item__txt">${g.coment || "—"}</div>
      ${extra ? `<div class="mv-alert-item__meta" style="margin-top:10px;">${extra}</div>` : ""}
    `;

    listEl.appendChild(card);
  }
}

// =========================
// Load
// =========================

async function loadAlerts(){
  const { API_BASE } = getApi();

  resetUI();

  try {
    const j = await fetchJson(`${API_BASE}/meteocat/alerts`, { cache: "no-store" });

    // capçalera hero
    setHeader({ updated_ts: j?.updated_ts, message: "—" });

    if (!j?.ok) return renderError("No s’han pogut carregar els avisos.");

    const items = Array.isArray(j.items) ? j.items : [];
    const hasAlerts = (j.has_alerts === true) && items.length > 0;

    if (!hasAlerts) return renderNoAlerts({ ...j, items });

    renderAlerts({ ...j, items });

  } catch (e) {
    setHeader({ updated_ts: null, message: "Error carregant avisos" });
    renderError(`Error carregant avisos: ${e?.message || e}`);
  }
}

// =========================
// Public init
// =========================

export function initAvisos(){
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());
  loadAlerts();
}
```0
