// pages/historic.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";

function fmt1(x){ const n = Number(x); return Number.isFinite(n) ? n.toFixed(1) : "—"; }
function fmtInt(x){ const n = Number(x); return Number.isFinite(n) ? String(Math.round(n)) : "—"; }

function fmtDateCA(ymd) {
  try {
    const [y, m, d] = String(ymd).split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("ca-ES", { year:"numeric", month:"2-digit", day:"2-digit" }).format(dt);
  } catch { return String(ymd || "—"); }
}

function monthNameCA(mm){
  const map = {
    "01":"Gener","02":"Febrer","03":"Març","04":"Abril","05":"Maig","06":"Juny",
    "07":"Juliol","08":"Agost","09":"Setembre","10":"Octubre","11":"Novembre","12":"Desembre"
  };
  return map[mm] || mm;
}

function getUrlFilters() {
  try {
    const u = new URL(location.href);
    return { y: u.searchParams.get("y") || "", m: u.searchParams.get("m") || "" };
  } catch { return { y: "", m: "" }; }
}

function setUrlFilters(y, m) {
  try {
    const u = new URL(location.href);
    if (y) u.searchParams.set("y", y); else u.searchParams.delete("y");
    if (m) u.searchParams.set("m", m); else u.searchParams.delete("m");
    history.replaceState(null, "", u.toString());
  } catch {}
}

function yearsFromRows(rows) {
  const set = new Set(rows.map(r => String((r.date ?? r.day) || "").slice(0,4)).filter(Boolean));
  return Array.from(set).sort();
}

function applyFilters(rows, y, m) {
  return rows.filter(r => {
    const day = String((r.date ?? r.day) || "");
    if (day.length < 10) return false;
    if (y && day.slice(0,4) !== y) return false;
    if (m && day.slice(5,7) !== m) return false;
    return true;
  });
}

function render(rows) {
  const tbody = $("histBody");
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted-cell">Sense dades per al filtre seleccionat.</td></tr>`;
    return;
  }

  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const list = rows.slice().sort((a,b)=> String(a.date ?? a.day).localeCompare(String(b.date ?? b.day))).reverse();

  if (isMobile) {
    const row = (k, v) => `
      <div class="dayrow">
        <div class="dayrow__k">${k}</div>
        <div class="dayrow__v">${v}</div>
      </div>
    `;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="padding:0;border:0">
          <div class="daycards">
            ${list.map(r => {
              const day  = r.date ?? r.day;
              const tmin = r.temp_min_c ?? r.tmin;
              const tmax = r.temp_max_c ?? r.tmax;
              const tavg = r.temp_avg_c ?? r.tavg;

              const rain = r.rain_mm ?? r.rain;
              const gust = r.gust_max_kmh ?? r.gust_max ?? r.gust;
              const wind = r.wind_avg_kmh ?? r.wind_avg;
              const hum  = r.hum_avg_pct ?? r.hum_avg;

              return `
                <div class="daycard daycard--kv">
                  ${row("Data", fmtDateCA(day))}
                  ${row("T mín / màx (°C)", `${fmt1(tmin)} / ${fmt1(tmax)}`)}
                  ${row("T mitjana (°C)", fmt1(tavg))}
                  ${row("Pluja (mm)", fmt1(rain))}
                  ${row("Ratxa màxima (km/h)", fmt1(gust))}
                  ${row("Vent mitjà (km/h)", fmt1(wind))}
                  ${row("Humitat mitjana (%)", fmtInt(hum))}
                </div>
              `;
            }).join("")}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const day  = r.date ?? r.day;

    const tmin = r.temp_min_c ?? r.tmin;
    const tmax = r.temp_max_c ?? r.tmax;
    const tavg = r.temp_avg_c ?? r.tavg;

    const rain = r.rain_mm ?? r.rain;
    const gust = r.gust_max_kmh ?? r.gust_max ?? r.gust;
    const wind = r.wind_avg_kmh ?? r.wind_avg;
    const hum  = r.hum_avg_pct ?? r.hum_avg;

    return `
      <tr>
        <td>${fmtDateCA(day)}</td>
        <td>${fmt1(tmin)} / ${fmt1(tmax)}</td>
        <td>${fmt1(tavg)}</td>
        <td>${fmt1(rain)}</td>
        <td>${fmt1(gust)}</td>
        <td>${fmt1(wind)}</td>
        <td>${fmtInt(hum)}</td>
      </tr>
    `;
  }).join("");
}

function renderSummary(rows){
  const box = $("summaryKpis");
  if (!box) return;

  if (!rows || !rows.length){
    box.innerHTML = `<div class="muted-line">Sense dades per al període seleccionat.</div>`;
    return;
  }

  const nums = (arr) => arr.map(Number).filter(Number.isFinite);
  const sum = (a)=> a.reduce((x,y)=>x+y,0);
  const avg = (a)=> a.length ? sum(a)/a.length : NaN;

  const tmins = nums(rows.map(r => r.temp_min_c ?? r.tmin));
  const tmaxs = nums(rows.map(r => r.temp_max_c ?? r.tmax));
  const tavgs = nums(rows.map(r => r.temp_avg_c ?? r.tavg));

  const hums  = nums(rows.map(r => r.hum_avg_pct ?? r.hum_avg));
  const rains = nums(rows.map(r => r.rain_mm ?? r.rain));
  const gusts = nums(rows.map(r => r.gust_max_kmh ?? r.gust_max ?? r.gust));
  const winds = nums(rows.map(r => r.wind_avg_kmh ?? r.wind_avg));

  const cards = [
    { v: tmins.length ? Math.min(...tmins).toFixed(1) : "—", l:"T mín (període) °C" },
    { v: tmaxs.length ? Math.max(...tmaxs).toFixed(1) : "—", l:"T màx (període) °C" },
    { v: tavgs.length ? avg(tavgs).toFixed(1) : "—",         l:"T mitjana (període) °C" },
    { v: hums.length  ? String(Math.round(avg(hums))) : "—", l:"Humitat mitjana %" },
    { v: rains.length ? sum(rains).toFixed(1) : "0.0",       l:"Pluja total (mm)" },
    { v: gusts.length ? Math.max(...gusts).toFixed(1) : "—", l:"Ratxa màxima (km/h)" },
    { v: winds.length ? avg(winds).toFixed(1) : "—",         l:"Vent mitjà (km/h)" },
  ];

  box.innerHTML = cards.map(c => `
    <div class="kpi">
      <div class="kpi__v">${c.v}</div>
      <div class="kpi__l">${c.l}</div>
    </div>
  `).join("");
}

async function fetchDaily(DAILY_URL) {
  const info = $("histInfo");
  try {
    const res = await fetch(`${DAILY_URL}?t=${Date.now()}`, { cache: "no-store" });
    const txt = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt.slice(0,150)}`);
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : [];
  } catch {
    if (info) info.textContent = "No es pot carregar /api/daily-summary (Worker/KV). Revisa route i cron.";
    return [];
  }
}

export function initHistoric() {
  const { DAILY_URL } = getApi();
  const yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  async function main() {
    const info = $("histInfo");
    const daily = await fetchDaily(DAILY_URL);

    if (!daily.length) {
      render([]);
      if (info) info.textContent = "Sense dades encara (daily-summary buit).";
      return;
    }

    const yrs = yearsFromRows(daily);
    const yearSel = $("yearSelect");
    const monthSel = $("monthSelect");

    yearSel.innerHTML = yrs.map(y => `<option value="${y}">${y}</option>`).join("");

    const { y: y0, m: m0 } = getUrlFilters();
    const defaultY = (y0 && yrs.includes(y0)) ? y0 : yrs[yrs.length - 1];

    yearSel.value = defaultY;
    monthSel.value = m0 || "";

    function refresh() {
      const y = yearSel.value || "";
      const m = monthSel.value || "";
      setUrlFilters(y, m);

      const filtered = applyFilters(daily, y, m);
      render(filtered);
      renderSummary(filtered);

      if (info) {
        const count = filtered.length;
        const labelM = m ? ` · ${monthNameCA(m)}` : "";
        info.textContent = `Mostrant ${count} dia/dies · any ${y}${labelM}.`;
      }
    }

    yearSel.addEventListener("change", refresh);
    monthSel.addEventListener("change", refresh);

    const clearBtn = $("clearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        yearSel.value = yrs[yrs.length - 1];
        monthSel.value = "";
        refresh();
      });
    }

    refresh();
  }

  main();
                                                   }
