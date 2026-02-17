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

async function loadAlerts(){
  const { API_BASE } = getApi();

  const metaEl = $("mvAlertsMeta");
  const summaryBox = $("mvAlertsSummary");
  const titleEl = $("mvAlertsTitle");
  const msgEl = $("mvAlertsMsg");
  const whenEl = $("mvAlertsWhen");
  const listEl = $("mvAlertsList");

  metaEl.textContent = "Carregant…";
  listEl.innerHTML = "";

  const res = await fetch(`${API_BASE}/meteocat/alerts`, { cache:"no-store" });
  const j = await res.json();

  if (!j?.ok){
    metaEl.textContent = "No s’han pogut carregar els avisos.";
    return;
  }

  metaEl.textContent = `Actualitzat: ${fmtTs(j.updated_ts)} · Perill màxim: ${perillText(j.max_perill)} · Episodis: ${Array.isArray(j.items)? j.items.length : 0}`;

  if (!j.has_alerts){
    summaryBox.style.display = "block";
    summaryBox.classList.remove("is-warn","is-danger");
    titleEl.textContent = "Sense avisos vigents";
    msgEl.textContent = "Ara mateix Meteocat no indica cap avís vigent per a l’Alt Camp.";
    whenEl.textContent = "";
    return;
  }

  // Resum
  summaryBox.style.display = "block";
  const cls = levelToClass(j.max_perill);
  summaryBox.classList.toggle("is-warn", cls==="is-warn");
  summaryBox.classList.toggle("is-danger", cls==="is-danger");
  titleEl.textContent = `Avisos vigents · Perill ${perillText(j.max_perill)}`;
  msgEl.textContent = "Consulta el detall a continuació.";
  whenEl.textContent = `Actualització: ${fmtTs(j.updated_ts)}`;

  // Llista detall
  const items = Array.isArray(j.items) ? j.items : [];
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

(function main(){
  if ($("year")) $("year").textContent = String(new Date().getFullYear());
  loadAlerts().catch(() => {
    const metaEl = $("mvAlertsMeta");
    if (metaEl) metaEl.textContent = "Error carregant avisos.";
  });
})();
