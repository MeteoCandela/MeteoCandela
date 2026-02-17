// pages/avisos.js
import { getApi } from "../lib/env.js";

function $(id){ return document.getElementById(id); }

function levelToClass(perill){
  if (Number(perill) >= 2) return "is-danger";
  if (Number(perill) >= 1) return "is-warn";
  return "";
}

function perillText(p){
  const n = Number(p);
  if (n >= 3) return "Molt alt";
  if (n >= 2) return "Alt";
  if (n >= 1) return "Moderat";
  return "—";
}

function fmtTs(ts){
  const n = Number(ts);
  if (!Number.isFinite(n)) return "—";
  return new Date(n).toLocaleString("ca-ES", { hour12:false });
}

function setHeader({ updated_ts = null, message = "—" } = {}){
  const subEl = $("alertsSub");
  const stEl  = $("alertsStatus");

  if (subEl) subEl.textContent = updated_ts ? `Actualitzat: ${fmtTs(updated_ts)}` : message;

  if (stEl) {
    if (!updated_ts) stEl.textContent = "—";
    else {
      const ageMin = Math.max(0, Math.round((Date.now() - Number(updated_ts)) / 60000));
      stEl.textContent = `Dada: fa ${ageMin} min`;
    }
  }
}

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

function resetUI(){
  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const listEl = $("mvAlertsList");
  const emptyBox = $("mvAlertsEmpty");
  const hintEl = $("mvAlertsHint");

  if (metaEl) metaEl.textContent = "Carregant…";
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

function renderNoAlerts(j){
  const metaEl = $("mvAlertsMeta");
  const emptyBox = $("mvAlertsEmpty");
  const listEl = $("mvAlertsList");

  const count = Array.isArray(j?.items) ? j.items.length : 0;
  if (metaEl) {
    metaEl.textContent =
      `Actualitzat: ${fmtTs(j?.updated_ts)} · Perill màxim: ${perillText(j?.max_perill)} · Episodis: ${count}`;
  }
  if (emptyBox) emptyBox.style.display = "block";
  if (listEl) listEl.innerHTML = "";
}

function renderAlerts(j){
  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const titleEl = $("mvAlertsTitle");
  const msgEl = $("mvAlertsMsg");
  const whenEl = $("mvAlertsWhen");
  const listEl = $("mvAlertsList");

  const items = Array.isArray(j.items) ? j.items : [];
  const count = items.length;

  if (metaEl) {
    metaEl.textContent =
      `Actualitzat: ${fmtTs(j.updated_ts)} · Perill màxim: ${perillText(j.max_perill)} · Episodis: ${count}`;
  }

  // Resum
  if (summaryBox && titleEl && msgEl && whenEl) {
    summaryBox.style.display = "block";
    const cls = levelToClass(j.max_perill);
    summaryBox.classList.toggle("is-warn", cls === "is-warn");
    summaryBox.classList.toggle("is-danger", cls === "is-danger");
    titleEl.textContent = `Avisos vigents · Perill ${perillText(j.max_perill)}`;
    msgEl.textContent = "Consulta el detall a continuació.";
    whenEl.textContent = `Actualització: ${fmtTs(j.updated_ts)}`;
  }

  // Llista
  if (!listEl) return;
  listEl.innerHTML = "";

  for (const it of items){
    const card = document.createElement("div");
    const c = levelToClass(it.perill);
    card.className = `mv-alert-item ${c}`;

    const t = `${it.meteor || "Meteor"} · ${it.tipus || "Avís"}`;
    const peri = it.periode ? ` · ${it.periode}` : "";
    const dia = it.dia ? `Dia: ${it.dia}` : "";
    const ll = it.llindar ? `Llindar: ${it.llindar}` : "";
    const ini = it.inici ? `Inici: ${it.inici}` : "";
    const fi = it.fi ? `Fi: ${it.fi}` : "";

    const coment = (it.comentari || "").trim() || "—";
    const extra = [dia, ll, ini, fi].filter(Boolean).join(" · ");

    card.innerHTML = `
      <div class="mv-alert-item__head">
        <div>
          <div class="mv-alert-item__title">${t}</div>
          <div class="mv-alert-item__meta">Perill: ${perillText(it.perill)}${peri}</div>
        </div>
        <div class="mv-alert-item__meta">${it.comarca || ""}</div>
      </div>
      <div class="mv-alert-item__txt">${coment}</div>
      ${extra ? `<div class="mv-alert-item__meta" style="margin-top:10px;">${extra}</div>` : ""}
    `;

    listEl.appendChild(card);
  }
}

async function loadAlerts({ forceRefresh = false } = {}){
  const { API_BASE } = getApi();

  resetUI();

  try {
    // Refresh manual real
    if (forceRefresh) {
      const hintEl = $("mvAlertsHint");
      if (hintEl) {
        hintEl.textContent = "Actualitzant…";
        hintEl.style.display = "block";
      }
      await fetchJson(`${API_BASE}/meteocat/alerts/refresh`, { method: "POST" });
      if (hintEl) hintEl.textContent = "Actualització demanada (cache renovada).";
    }

    const j = await fetchJson(`${API_BASE}/meteocat/alerts`, { cache: "no-store" });

    // capçalera
    setHeader({ updated_ts: j?.updated_ts, message: "—" });

    if (!j?.ok) {
      const metaEl = $("mvAlertsMeta");
      if (metaEl) metaEl.textContent = "No s’han pogut carregar els avisos.";
      return;
    }

    const count = Array.isArray(j.items) ? j.items.length : 0;
    const hasAlerts = (j.has_alerts === true) && count > 0;

    if (!hasAlerts) {
      renderNoAlerts(j);
      return;
    }

    renderAlerts(j);

  } catch (e) {
    setHeader({ updated_ts: null, message: "Error carregant avisos" });
    const metaEl = $("mvAlertsMeta");
    if (metaEl) metaEl.textContent = `Error carregant avisos: ${e?.message || e}`;
  }
}

export function initAvisos(){
  if ($("year")) $("year").textContent = String(new Date().getFullYear());

  // inicial
  loadAlerts();
}
