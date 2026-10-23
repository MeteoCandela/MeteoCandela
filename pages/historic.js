// pages/historic.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import { fmt1, fmtInt } from "../lib/format.js";
import { initChartFullscreen } from "../lib/fullscreen_chart.js";
function fmtDateCA(ymd) {
  try {
    const [y, m, d] = String(ymd).slice(0,10).split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("ca-ES", { year:"numeric", month:"2-digit", day:"2-digit" }).format(dt);
  } catch { return String(ymd || "—"); }
}

function monthNameCA(mm){
  const map = {
    "01":"Gener","02":"Febrer","03":"Març","04":"Abril","05":"Maig","06":"Juny",
    "07":"Juliol","08":"Agost","09":"Setembre","10":"Octubre","11":"Novembre","12":"Desembre"
  };
  return map[mm] || mm || "";
}

function isYmd(s){
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function todayYmdLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
/* =========================
   URL filters (y,m,d)
   ========================= */
function getUrlFilters() {
  try {
    const u = new URL(location.href);
    return {
      y: u.searchParams.get("y") || "",
      m: u.searchParams.get("m") || "",
      d: u.searchParams.get("d") || ""
    };
  } catch { return { y: "", m: "", d: "" }; }
}

function setUrlFilters(y, m, d) {
  try {
    const u = new URL(location.href);

    if (y) u.searchParams.set("y", y); else u.searchParams.delete("y");
    if (m) u.searchParams.set("m", m); else u.searchParams.delete("m");
    if (d) u.searchParams.set("d", d); else u.searchParams.delete("d");

    history.replaceState(null, "", u.toString());
  } catch {}
}

/* =========================
   Data helpers
   ========================= */
function yearsFromRows(rows) {
  const set = new Set(
    (rows || [])
      .map(r => String((r.date ?? r.day) || "").slice(0,4))
      .filter(Boolean)
  );
  return Array.from(set).sort();
}

function applyFilters(rows, y, m, d) {
  return (rows || []).filter(r => {
    const day = String((r.date ?? r.day) || "").slice(0,10);
    if (!isYmd(day)) return false;

    // Si hi ha dia concret, és un filtre "fort"
    if (d) return day === d;

    if (y && day.slice(0,4) !== y) return false;
    if (m && day.slice(5,7) !== m) return false;
    return true;
  });
}

/* =========================
   Render table / cards
   ========================= */
function render(rows) {
  const tbody = $("histBody");
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted-cell">Sense dades per al filtre seleccionat.</td></tr>`;
    return;
  }

  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  const list = rows
    .slice()
    .sort((a,b)=> String(a.date ?? a.day).localeCompare(String(b.date ?? b.day)))
    .reverse();

  const pick = (r, a, b, c) => (r?.[a] ?? r?.[b] ?? r?.[c]);

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
              const day  = (r.date ?? r.day);

              const tmin = pick(r, "temp_min_c", "tmin");
              const tmax = pick(r, "temp_max_c", "tmax");
              const tavg = pick(r, "temp_avg_c", "tavg");

              const rain = pick(r, "rain_mm", "rain");
              const gust = pick(r, "gust_max_kmh", "gust_max", "gust");
              const wind = pick(r, "wind_avg_kmh", "wind_avg");
              const hum  = pick(r, "hum_avg_pct", "hum_avg");

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
    const day  = (r.date ?? r.day);

    const tmin = (r.temp_min_c ?? r.tmin);
    const tmax = (r.temp_max_c ?? r.tmax);
    const tavg = (r.temp_avg_c ?? r.tavg);

    const rain = (r.rain_mm ?? r.rain);
    const gust = (r.gust_max_kmh ?? r.gust_max ?? r.gust);
    const wind = (r.wind_avg_kmh ?? r.wind_avg);
    const hum  = (r.hum_avg_pct ?? r.hum_avg);

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

/* =========================
   Summary KPIs (period)
   ========================= */
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

  const tmins = nums(rows.map(r => (r.temp_min_c ?? r.tmin)));
  const tmaxs = nums(rows.map(r => (r.temp_max_c ?? r.tmax)));
  const tavgs = nums(rows.map(r => (r.temp_avg_c ?? r.tavg)));

  const hums  = nums(rows.map(r => (r.hum_avg_pct ?? r.hum_avg)));
  const rains = nums(rows.map(r => (r.rain_mm ?? r.rain)));
  const gusts = nums(rows.map(r => (r.gust_max_kmh ?? r.gust_max ?? r.gust)));
  const winds = nums(rows.map(r => (r.wind_avg_kmh ?? r.wind_avg)));

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

/* =========================
   Charts
   ========================= */
function fmtDayLabel(ymd) {
  try {
    const [, m, d] = String(ymd).slice(0, 10).split("-");
    return `${d}/${m}`;
  } catch { return String(ymd || ""); }
}

function destroyHistCharts() {
  try { window.__histChartTemp?.destroy?.(); } catch {}
  try { window.__histChartRain?.destroy?.(); } catch {}
  window.__histChartTemp = window.__histChartRain = null;
}

function buildHistCharts(rows) {
  destroyHistCharts();

  const tempSection = document.getElementById("chartHistTempSection");
  const rainSection = document.getElementById("chartHistRainSection");

  const multiDay = rows && rows.length > 1;

  if (!multiDay || typeof window.Chart === "undefined") {
    if (tempSection) tempSection.style.display = "none";
    if (rainSection) rainSection.style.display = "none";
    return;
  }

  const sorted = rows
    .slice()
    .sort((a, b) => String(a.date ?? a.day).localeCompare(String(b.date ?? b.day)));

  const labels = sorted.map(r => fmtDayLabel(r.date ?? r.day));
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const commonBase = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    layout: { padding: { top: 6, right: 4, bottom: 4 } },
    interaction: { mode: "nearest", intersect: false, axis: "x" },
    scales: {
      x: {
        type: "category",
        ticks: { autoSkip: true, maxTicksLimit: 14, maxRotation: 45, minRotation: 0, padding: 4 },
        grid: { drawTicks: true }
      }
    }
  };

  // ---- Temperatura ----
  const tempCanvas = document.getElementById("chartHistTemp");
  if (tempCanvas && tempSection) {
    const tmin = sorted.map(r => { const v = Number(r.temp_min_c ?? r.tmin); return Number.isFinite(v) ? v : null; });
    const tmax = sorted.map(r => { const v = Number(r.temp_max_c ?? r.tmax); return Number.isFinite(v) ? v : null; });
    const tavg = sorted.map(r => { const v = Number(r.temp_avg_c ?? r.tavg); return Number.isFinite(v) ? v : null; });

    const finiteMax = tmax.filter(v => v != null);
    const finiteMin = tmin.filter(v => v != null);
    const periodMax = finiteMax.length ? Math.max(...finiteMax) : null;
    const periodMin = finiteMin.length ? Math.min(...finiteMin) : null;

    tempSection.style.display = "";
    const titleEl = document.getElementById("chartHistTempTitle");
    if (titleEl) {
      const extras = [
        periodMax != null ? `màx ${periodMax.toFixed(1)} °C` : null,
        periodMin != null ? `mín ${periodMin.toFixed(1)} °C` : null,
      ].filter(Boolean).join(" / ");
      titleEl.textContent = `Temperatura (°C) · ${rows.length} dies${extras ? ` · ${extras}` : ""}`;
    }

    window.__histChartTemp = new Chart(tempCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "T màxima", data: tmax, tension: 0.2, pointRadius: rows.length > 60 ? 0 : 2, pointHoverRadius: 5, borderWidth: 1.4, borderDash: [5, 3], fill: false },
          { label: "T mínima", data: tmin, tension: 0.2, pointRadius: rows.length > 60 ? 0 : 2, pointHoverRadius: 5, borderWidth: 1.4, borderDash: [5, 3], fill: false },
          { label: "T mitjana", data: tavg, tension: 0.25, pointRadius: rows.length > 60 ? 0 : 2, pointHoverRadius: 5, borderWidth: 1.8, fill: false },
          ...(periodMax != null ? [{ label: "Màx", data: labels.map(() => periodMax), tension: 0, pointRadius: 0, pointHoverRadius: 0, borderWidth: 1, borderDash: [2, 4], fill: false }] : []),
          ...(periodMin != null ? [{ label: "Mín", data: labels.map(() => periodMin), tension: 0, pointRadius: 0, pointHoverRadius: 0, borderWidth: 1, borderDash: [2, 4], fill: false }] : []),
        ]
      },
      options: {
        ...commonBase,
        plugins: {
          legend: { display: true, labels: { filter: (item) => item.datasetIndex < 3 } },
          tooltip: {
            displayColors: false,
            filter: (item) => item.datasetIndex < 3,
            callbacks: {
              title: (items) => {
                const idx = items?.[0]?.dataIndex;
                return idx != null ? fmtDateCA(sorted[idx]?.date ?? sorted[idx]?.day) : "";
              },
              label: (ctx) => {
                const v = ctx.parsed?.y;
                return v == null ? "—" : `${ctx.dataset.label}: ${Number(v).toFixed(1)} °C`;
              }
            }
          }
        }
      }
    });
  }

  // ---- Pluja ----
  const rainCanvas = document.getElementById("chartHistRain");
  if (rainCanvas && rainSection) {
    const rain = sorted.map(r => { const v = Number(r.rain_mm ?? r.rain); return Number.isFinite(v) ? v : 0; });
    const hasRain = rain.some(v => v > 0);

    if (!hasRain) {
      rainSection.style.display = "none";
    } else {
      rainSection.style.display = "";
      if (document.getElementById("chartHistRainTitle")) {
        const total = rain.reduce((a, b) => a + b, 0);
        document.getElementById("chartHistRainTitle").textContent =
          `Pluja diària (mm) · total ${total.toFixed(1)} mm`;
      }

      window.__histChartRain = new Chart(rainCanvas, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Pluja (mm)",
            data: rain,
            borderWidth: 0,
            borderRadius: 3,
          }]
        },
        options: {
          ...commonBase,
          scales: {
            ...commonBase.scales,
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              callbacks: {
                title: (items) => {
                  const idx = items?.[0]?.dataIndex;
                  return idx != null ? fmtDateCA(sorted[idx]?.date ?? sorted[idx]?.day) : "";
                },
                label: (ctx) => {
                  const v = ctx.parsed?.y;
                  return v == null ? "—" : `Pluja: ${Number(v).toFixed(1)} mm`;
                }
              }
            }
          }
        }
      });
    }
  }

  initChartFullscreen(["chartHistTemp", "chartHistRain"]);
}

/* =========================
   Fetch daily summary
   ========================= */
async function fetchDaily(DAILY_URL) {
  const info = $("histInfo");
  try {
    const res = await fetch(`${DAILY_URL}?t=${Date.now()}`, { cache: "no-store" });
    const txt = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt.slice(0,150)}`);

    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (info) info.textContent = "No es pot carregar /api/daily-summary (Worker/KV). Revisa route i cron.";
    return [];
  }
}

/* =========================
   UI helpers
   ========================= */
function updateFilterBadge(filterInfoEl, y, m, d){
  if (!filterInfoEl) return;

  // ✅ Prioritat 1: dia concret
  if (d) {
    filterInfoEl.innerHTML =
      `<span class="hist-filter-badge">📍 Dia: <strong>${fmtDateCA(d)}</strong></span>`;
    return;
  }

  // ✅ Prioritat 2: mes o any
  if (m) {
    filterInfoEl.innerHTML =
      `<span class="hist-filter-badge">📅 Resum de <strong>${monthNameCA(m)}</strong> ${y}</span>`;
  } else {
    filterInfoEl.innerHTML =
      `<span class="hist-filter-badge hist-filter-badge--year">📆 Resum de l’any <strong>${y}</strong></span>`;
  }
}

/* =========================
   Init
   ========================= */
export function initHistoric() {
  const { DAILY_URL } = getApi();

  const yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  async function main() {
    const info = $("histInfo");
    const filterInfo = $("histFilterInfo");

    const yearSel = $("yearSelect");
    const monthSel = $("monthSelect");
    const dayPicker = $("dayPicker");
    const dayClearBtn = $("dayClearBtn");
    const clearBtn = $("clearBtn");

    if (!yearSel || !monthSel) {
      if (info) info.textContent = "Error: no s'han trobat els controls de filtre (yearSelect/monthSelect).";
      return;
    }

    const daily = await fetchDaily(DAILY_URL);

    if (!daily.length) {
      render([]);
      renderSummary([]);
      if (info) info.textContent = "Sense dades encara (daily-summary buit).";
      if (filterInfo) filterInfo.textContent = "";
      return;
    }

    // Any disponibles
    const yrs = yearsFromRows(daily);
    yearSel.innerHTML = yrs.map(y => `<option value="${y}">${y}</option>`).join("");

    // Dates disponibles (per min/max del date picker)
    const allDays = daily
      .map(r => String((r.date ?? r.day) || "").slice(0,10))
      .filter(isYmd)
      .sort();

    const minDay = allDays[0] || "";
    const maxDay = allDays[allDays.length - 1] || "";
    if (dayPicker) {
      if (minDay) dayPicker.min = minDay;
      if (maxDay) dayPicker.max = maxDay;
    }

    // Inicial (URL -> UI)
    const { y: y0, m: m0, d: d0 } = getUrlFilters();

    const defaultY = (y0 && yrs.includes(y0)) ? y0 : yrs[yrs.length - 1];
    yearSel.value = defaultY;
    monthSel.value = m0 || "";

    if (dayPicker) {
      dayPicker.value = isYmd(d0) ? d0 : "";
      // Si ve dia per URL, sincronitza any/mes amb aquell dia
      if (dayPicker.value) {
        const yy = dayPicker.value.slice(0,4);
        const mm = dayPicker.value.slice(5,7);
        if (yy && yrs.includes(yy)) yearSel.value = yy;
        if (mm) monthSel.value = mm;
      }
    }

    function refresh() {
      let y = yearSel.value || "";
      let m = monthSel.value || "";
      let d = (dayPicker && isYmd(dayPicker.value)) ? dayPicker.value : "";

      // Si trio un dia, ajusto any/mes perquè el context sigui coherent
      if (d) {
        const yy = d.slice(0,4);
        const mm = d.slice(5,7);
        if (yy && yrs.includes(yy)) { y = yy; yearSel.value = yy; }
        if (mm) { m = mm; monthSel.value = mm; }
      }

      setUrlFilters(y, m, d);

      let filtered = applyFilters(daily, y, m, d);

// En vista general, no mostrem el dia actual perquè encara no està tancat
if (!d) {
  const today = todayYmdLocal();
  filtered = filtered.filter(r => String((r.date ?? r.day) || "").slice(0,10) !== today);
}

render(filtered);
renderSummary(filtered);
buildHistCharts(filtered);

      // Badge anual/mensual (sempre clar)
      updateFilterBadge(filterInfo, y, m, d);

      if (info) {
        info.textContent = d
          ? `Mostrant el dia ${fmtDateCA(d)}.`
          : `Mostrant ${filtered.length} dia/dies.`;
      }
    }

    // Canviar any/mes implica mode llista -> neteja dia
    yearSel.addEventListener("change", () => {
      if (dayPicker) dayPicker.value = "";
      refresh();
    });

    monthSel.addEventListener("change", () => {
      if (dayPicker) dayPicker.value = "";
      refresh();
    });

    // Calendari
    if (dayPicker) {
      dayPicker.addEventListener("change", refresh);
    }
    if (dayClearBtn) {
      dayClearBtn.addEventListener("click", () => {
        if (dayPicker) dayPicker.value = "";
        refresh();
      });
    }

    // Neteja general
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        yearSel.value = yrs[yrs.length - 1];
        monthSel.value = "";
        if (dayPicker) dayPicker.value = "";
        refresh();
      });
    }

    // Primera renderització
    refresh();
  }

  main();
}
