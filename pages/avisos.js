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

async function loadAlerts({ forceRefresh = false } = {}){
  const { API_BASE } = getApi();

  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const titleEl = $("mvAlertsTitle");
  const msgEl = $("mvAlertsMsg");
  const whenEl = $("mvAlertsWhen");
  const listEl = $("mvAlertsList");
  const emptyBox = $("mvAlertsEmpty");
  const hintEl = $("mvAlertsHint");

  // guardes (no petar si falta algun node)
  if (metaEl) metaEl.textContent = "Carregant…";
  if (listEl) listEl.innerHTML = "";
  if (summaryBox) {
    summaryBox.style.display = "none";
    summaryBox.classList.remove("is-warn","is-danger");
  }
  if (emptyBox) emptyBox.style.display = "none";
  if (hintEl) hintEl.style.display = "none";

  try {
    // 1) opcional: refresh manual (només si cliques el botó)
    if (forceRefresh) {
      // aquest endpoint et torna {ok, note, data} o error
      await fetchJson(`${API_BASE}/meteocat/alerts/refresh`, { method:"POST" });
      if (hintEl) {
        hintEl.textContent = "Actualització demanada (cache renovada).";
        hintEl.style.display = "block";
      }
    }

    // 2) carrega cache normal
    const j = await fetchJson(`${API_BASE}/meteocat/alerts`, { cache:"no-store" });

    if (!j?.ok) {
      if (metaEl) metaEl.textContent = "No s’han pogut carregar els avisos.";
      return;
    }

    const count = Array.isArray(j.items) ? j.items.length : 0;
    if (metaEl) {
      metaEl.textContent =
        `Actualitzat: ${fmtTs(j.updated_ts)} · Perill màxim: ${perillText(j.max_perill)} · Episodis: ${count}`;
    }

    // SENSE AVISOS
    if (!j.has_alerts || count === 0) {
      if (emptyBox) {
        emptyBox.style.display = "block";
      } else if (summaryBox && titleEl && msgEl && whenEl) {
        // fallback si no tens mvAlertsEmpty al HTML
        summaryBox.style.display = "block";
        titleEl.textContent = "Sense avisos vigents";
        msgEl.textContent = "Ara mateix Meteocat no indica cap avís vigent per a l’Alt Camp.";
        whenEl.textContent = "";
      }
      return;
    }

    // AMB AVISOS: resum
    if (summaryBox && titleEl && msgEl && whenEl) {
      summaryBox.style.display = "block";
      const cls = levelToClass(j.max_perill);
      summaryBox.classList.toggle("is-warn", cls === "is-warn");
      summaryBox.classList.toggle("is-danger", cls === "is-danger");
      titleEl.textContent = `Avisos vigents · Perill ${perillText(j.max_perill)}`;
      msgEl.textContent = "Consulta el detall a continuació.";
      whenEl.textContent = `Actualització: ${fmtTs(j.updated_ts)}`;
    }

    // Llista detall
    if (listEl) {
      for (const it of (j.items || [])) {
        const card = document.createElement("div");
        const c = levelToClass(it.perill);
        card.className = `mv-alert-item ${c}`;

        const t = `${it.meteor || "Meteor"} · ${it.tipus || "Avís"}`;
        const peri = it.periode ? ` · ${it.periode}` : "";
        const dia = it.dia ? `Dia: ${it.dia}` : "";
        const ll = it.llindar ? `Llindar: ${it.llindar}` : "";
        const ini = it.inici ? `Inici: ${it.inici}` : "";
        const fi = it.fi ? `Fi: ${it.fi}` : "";

        card.innerHTML = `
          <div class="mv-alert-item__head">
            <div>
              <div class="mv-alert-item__title">${t}</div>
              <div class="mv-alert-item__meta">Perill: ${perillText(it.perill)}${peri}</div>
            </div>
            <div class="mv-alert-item__meta">${it.comarca || ""}</div>
          </div>
          <div class="mv-alert-item__txt">${(it.comentari || "").trim() || "—"}</div>
          <div class="mv-alert-item__meta" style="margin-top:10px;">
            ${[dia, ll, ini, fi].filter(Boolean).join(" · ")}
          </div>
        `;
        listEl.appendChild(card);
      }
    }

  } catch (e) {
    if (metaEl) metaEl.textContent = `Error carregant avisos: ${e?.message || e}`;
  }
}

export function initAvisos(){
  if ($("year")) $("year").textContent = String(new Date().getFullYear());

  // Carrega inicial
  loadAlerts();

  // Botó refresh (si existeix)
  const btn = $("btnAlertsRefresh");
  if (btn) {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try { await loadAlerts({ forceRefresh: true }); }
      finally { btn.disabled = false; }
    });
  }
}
