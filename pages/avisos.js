// pages/avisos.js
import { getApi } from "../lib/env.js";

function $(id){ return document.getElementById(id); }

// =========================
// Estils / textos (Meteocat 0-6)
// 0: sense perill
// 1-2: moderat
// 3-4: alt
// 5-6: molt alt
// =========================

function levelToClass(perill){
  const n = Number(perill);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 5) return "is-danger"; // 5-6
  if (n >= 3) return "is-high";   // 3-4
  return "is-warn";               // 1-2
}

function perillText(p){
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return "Sense perill";
  if (n >= 5) return "Molt alt";
  if (n >= 3) return "Alt";
  return "Moderat";
}

function perillBadge(p){
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `(${n}/6)`;
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
  const s = String(dia || "").trim();
  if (!s) return "";
  return s.slice(0, 10); // "YYYY-MM-DD"
}

function prettyDia(dia){
  const ymd = ymdFromDia(dia);
  if (!ymd) return "—";
  try {
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

function safeText(x, fallback="—"){
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

// =========================
// Períodes (franges)
// =========================

function normPeriode(p){
  return String(p || "").trim().replaceAll(" ", "");
}

function fmtPeriodeChip(p){
  const s = normPeriode(p);
  if (!s) return "";
  // "06-12" -> "06-12h" (si ja ve amb h, la respectem)
  return s.endsWith("h") ? s : `${s}h`;
}

// Ordre natural de franges (06-12, 12-18, 18-00, 00-06, etc.)
function periodeSortKey(p){
  const s = normPeriode(p);
  const m = s.match(/^(\d{1,2})/);
  const h = m ? Number(m[1]) : 99;
  return Number.isFinite(h) ? h : 99;
}

// =========================
// Llindar: afegir km/h si ve en m/s
// Ex: "Ratxa màxima > 25m/s" -> "Ratxa màxima > 25m/s (90 km/h)"
// =========================

function msToKmh(ms){ return Math.round(ms * 3.6); }

function addKmhToLlindar(llindar){
  const s = String(llindar || "").trim();
  if (!s) return "";
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*m\/s/i);
  if (!m) return s;

  const ms = Number(String(m[1]).replace(",", "."));
  if (!Number.isFinite(ms)) return s;

  const kmh = msToKmh(ms);
  // Mantinc el text original i hi afegeixo el km/h
  return s.replace(/m\/s/i, `m/s (${kmh} km/h)`);
}

// =========================
// Header (hero)
// =========================

function setHeader({ updated_ts = null, message = "—" } = {}){
  const subEl = $("alertsSub");
  const stEl  = $("alertsStatus");

  if (subEl) subEl.textContent = updated_ts ? `Actualitzat: ${fmtTsMillis(updated_ts)}` : message;

  // ✅ Eliminem "Dada: fa X min" (queda lleig quan és gran)
  if (stEl) stEl.textContent = "";
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
    summaryBox.classList.remove("is-warn","is-high","is-danger");
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
      `Actualitzat: ${fmtTsMillis(j?.updated_ts)} · Perill màxim: ${perillText(j?.max_perill)} ${perillBadge(j?.max_perill)} · Episodis: ${count}`;
  }
  if (emptyBox) emptyBox.style.display = "block";
  if (listEl) listEl.innerHTML = "";
}

// =========================
// Agrupació (1 targeta per avís + múltiples franges)
// IMPORTANT: incloem "perill" a la clau → si canvia per franges, surt separat
// =========================

function groupItems(items){
  const map = new Map();

  for (const it of items){
    const meteor  = safeText(it?.meteor, "Meteor");
    const tipus   = safeText(it?.tipus, "Avís");
    const comarca = safeText(it?.comarca, "");
    const diaYmd  = ymdFromDia(it?.dia);
    const llindar = safeText(it?.llindar, "");
    const coment  = safeText(it?.comentari, "—");
    const perill  = Number(it?.perill ?? 0);

    const inici = String(it?.inici ?? "");
    const fi    = String(it?.fi ?? "");

    const key = [
      meteor, tipus, comarca, diaYmd, perill, llindar, inici, fi, coment
    ].join("|");

    if (!map.has(key)){
      map.set(key, {
        meteor, tipus, comarca,
        dia: String(it?.dia ?? ""),
        perill,
        llindar,
        inici,
        fi,
        coment,
        periodes: []
      });
    }

    const per = normPeriode(it?.periode);
    if (per){
      const agg = map.get(key);
      if (!agg.periodes.includes(per)) agg.periodes.push(per);
    }
  }

  const out = Array.from(map.values());

  for (const g of out){
    g.periodes.sort((a,b) => periodeSortKey(a) - periodeSortKey(b) || String(a).localeCompare(String(b)));
  }

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
  const grouped  = groupItems(itemsRaw);

  if (metaEl) {
    metaEl.textContent =
      `Actualitzat: ${fmtTsMillis(j?.updated_ts)} · Perill màxim: ${perillText(j?.max_perill)} ${perillBadge(j?.max_perill)} · Episodis: ${grouped.length}`;
  }

  // Resum XL
  if (summaryBox && titleEl && msgEl && whenEl) {
    summaryBox.style.display = "block";

    const cls = levelToClass(j?.max_perill);
    summaryBox.classList.toggle("is-warn",   cls === "is-warn");
    summaryBox.classList.toggle("is-high",   cls === "is-high");
    summaryBox.classList.toggle("is-danger", cls === "is-danger");

    titleEl.textContent = `Avisos vigents · Perill ${perillText(j?.max_perill)} ${perillBadge(j?.max_perill)}`;
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

    // Xips de franges amb "h"
    const periodesHtml = (g.periodes || [])
      .map(p => `<span class="mv-chip">${fmtPeriodeChip(p)}</span>`)
      .join("");

    // ✅ Llindar a dalt + km/h al costat si ve en m/s
    const llindarNice = addKmhToLlindar(g.llindar);
    const llindarHtml = llindarNice ? `Llindar: ${llindarNice}` : "";

    // ✅ Inici/Fi fora (confús amb franges)
    card.innerHTML = `
  <div class="mv-alert-item__head">
    <div>
      <div class="mv-alert-item__title">${title}</div>
      <div class="mv-alert-item__meta">Perill: ${perillText(g.perill)} ${perillBadge(g.perill)}</div>
      ${periodesHtml ? `<div class="mv-chips" style="margin-top:10px;">${periodesHtml}</div>` : ""}
    </div>
    <div class="mv-alert-item__meta">${g.comarca || ""}</div>
  </div>

  <div class="mv-alert-item__txt">${g.coment || "—"}</div>

  ${llindarHtml ? `<div class="mv-threshold">
  Llindar: ${threshold}
</div>` : ""}
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
