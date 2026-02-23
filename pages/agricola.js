// pages/agricola.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import { fmt1, dayKeyFromTs, startEndMsFromDayKey, minMax } from "../lib/format.js";
import { loadHistoryOnce, loadCurrentAndHeartbeat } from "../lib/api.js";

const LAT_VALLS = 41.29; // Valls aprox.

let chVpd = null;
let chTemp = null;

function fmt2(x){ const n = Number(x); return Number.isFinite(n) ? n.toFixed(2) : "—"; }
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function esat_kpa(Tc){
  return 0.6108 * Math.exp((17.27 * Tc) / (Tc + 237.3));
}
function vpd_kpa(Tc, RH){
  if (!Number.isFinite(Tc) || !Number.isFinite(RH)) return NaN;
  const rh = clamp(Number(RH), 0, 100);
  return esat_kpa(Tc) * (1 - rh/100);
}
function dewpoint_c(Tc, RH){
  if (!Number.isFinite(Tc) || !Number.isFinite(RH)) return NaN;
  const rh = clamp(Number(RH), 0.0001, 100);
  const a = 17.27, b = 237.3;
  const alpha = ((a*Tc)/(b+Tc)) + Math.log(rh/100);
  return (b*alpha)/(a-alpha);
}

// Ra FAO56 (MJ/m²/day)
function ra_mj_m2_day(latDeg, dateObj){
  const lat = (Math.PI/180) * latDeg;

  const J = Math.floor(
    (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) - Date.UTC(dateObj.getFullYear(),0,0)) / 86400000
  );

  const dr = 1 + 0.033 * Math.cos((2*Math.PI/365) * J);
  const delta = 0.409 * Math.sin((2*Math.PI/365) * J - 1.39);
  const ws = Math.acos(clamp(-Math.tan(lat) * Math.tan(delta), -1, 1));
  const Gsc = 0.0820; // MJ/m²/min

  return (24*60/Math.PI) * Gsc * dr *
    (ws*Math.sin(lat)*Math.sin(delta) + Math.cos(lat)*Math.cos(delta)*Math.sin(ws));
}

// ET0 Hargreaves (mm/day)
function et0_hargreaves_mm(Tmax, Tmin, Tmean, latDeg, dateObj){
  const Ra = ra_mj_m2_day(latDeg, dateObj);
  const dT = Math.max(0, Number(Tmax) - Number(Tmin));
  const Tm = Number(Tmean);
  if (!Number.isFinite(Ra) || !Number.isFinite(dT) || !Number.isFinite(Tm)) return NaN;
  return 0.0023 * Ra * (Tm + 17.8) * Math.sqrt(dT);
}

function gdd_day(Tmax, Tmin, base){
  const tmean = (Number(Tmax) + Number(Tmin)) / 2;
  return Math.max(0, tmean - Number(base));
}

function computeTodayRows(historyRows, current){
  const todayKey = dayKeyFromTs(Date.now());
  const { start, end } = startEndMsFromDayKey(todayKey);

  const rows = (Array.isArray(historyRows) ? historyRows : [])
    .filter((r) => Number.isFinite(r?.ts) && r.ts >= start && r.ts <= end)
    .slice();

  if (current && Number.isFinite(current.ts) && current.ts >= start && current.ts <= end) {
    const lastHistTs = rows.length ? rows[rows.length - 1].ts : null;
    if (!lastHistTs || current.ts > lastHistTs) rows.push(current);
  }
  return rows;
}

function destroyCharts(){
  try { if (chVpd) chVpd.destroy(); } catch {}
  try { if (chTemp) chTemp.destroy(); } catch {}
  chVpd = null;
  chTemp = null;
}

function buildLineChart(canvasId, labels, data, label){
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return null;

  return new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: false }
      }
    }
  });
}

function countHoursOver(rows, thr){
  // rows són cada ~5 min -> estimem 5 min per punt
  let minutes = 0;
  for (const r of rows){
    const v = vpd_kpa(Number(r?.temp_c), Number(r?.hum_pct));
    if (Number.isFinite(v) && v > thr) minutes += 5;
  }
  return minutes / 60;
}

function setText(id, txt){
  const el = $(id);
  if (el) el.textContent = txt;
}

function recomputeEtc(){
  const kc = Number($("#kcSelect")?.value || 0.7);
  const et0 = Number($("#kpiEt0")?.dataset?.num || NaN);
  const etc = Number.isFinite(et0) ? et0 * kc : NaN;
  setText("kpiEtc", Number.isFinite(etc) ? fmt2(etc) : "—");
}

export function initAgricola(){
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
  };

  // listeners UI
  $("#kcSelect")?.addEventListener("change", recomputeEtc);
  $("#gddBase")?.addEventListener("change", () => { main().catch(()=>{}); });

  async function refresh(){
    await Promise.all([
      loadHistoryOnce(HISTORY_URL, state),
      loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state),
    ]);
    render();
  }

  function render(){
    const hist = state.historyRows || [];
    const cur = state.current || (hist.length ? hist[hist.length - 1] : null);
    if (!cur) {
      setText("lastUpdated", "Sense dades carregades");
      return;
    }

    // Dades instantànies
    const Tnow = Number(cur.temp_c);
    const RHnow = Number(cur.hum_pct);
    const rainDay = Number(cur.rain_day_mm);

    const vpdNow = vpd_kpa(Tnow, RHnow);
    const dewNow = dewpoint_c(Tnow, RHnow);

    setText("kpiVpdNow", Number.isFinite(vpdNow) ? fmt2(vpdNow) : "—");
    setText("chipDew", Number.isFinite(dewNow) ? `${fmt1(dewNow)} °C` : "—");
    setText("kpiSpread", (Number.isFinite(Tnow) && Number.isFinite(dewNow)) ? fmt1(Tnow - dewNow) : "—");
    setText("chipRain", Number.isFinite(rainDay) ? `${fmt1(rainDay)} mm` : "—");

    // Sèrie d’avui (per màxims/hores/charts)
    const todayRows = computeTodayRows(hist, state.current);

    const temps = todayRows.map(r => Number(r.temp_c)).filter(Number.isFinite);
    const hums  = todayRows.map(r => Number(r.hum_pct)).filter(Number.isFinite);

    const mm = minMax(temps);
    const Tmax = mm?.max ?? null;
    const Tmin = mm?.min ?? null;
    const Tmean = (Tmax != null && Tmin != null) ? (Tmax + Tmin)/2 : null;

    // VPD màxim del dia
    let vpdMax = -Infinity;
    const vpdSeries = [];
    const labels = [];

    for (const r of todayRows){
      const Tc = Number(r.temp_c);
      const RH = Number(r.hum_pct);
      if (!Number.isFinite(Tc) || !Number.isFinite(RH)) continue;

      const v = vpd_kpa(Tc, RH);
      if (Number.isFinite(v)) vpdMax = Math.max(vpdMax, v);
      vpdSeries.push(v);

      try{
        labels.push(new Date(r.ts).toLocaleTimeString("ca-ES", { hour:"2-digit", minute:"2-digit" }));
      } catch {
        labels.push("—");
      }
    }

    setText("kpiVpdMax", Number.isFinite(vpdMax) ? fmt2(vpdMax) : "—");

    // Hores sobre llindars
    const h12 = countHoursOver(todayRows, 1.2);
    const h16 = countHoursOver(todayRows, 1.6);
    setText("chipVpd12", Number.isFinite(h12) ? `${fmt1(h12)} h` : "—");
    setText("chipVpd16", Number.isFinite(h16) ? `${fmt1(h16)} h` : "—");

    // ET0 Hargreaves + GDD
    const base = Number($("#gddBase")?.value || 10);
    const d0 = new Date();
    const dateObj = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());

    const et0 = (Tmax != null && Tmin != null && Tmean != null)
      ? et0_hargreaves_mm(Tmax, Tmin, Tmean, LAT_VALLS, dateObj)
      : NaN;

    const gdd = (Tmax != null && Tmin != null) ? gdd_day(Tmax, Tmin, base) : NaN;

    const kpiEt0 = $("#kpiEt0");
    if (kpiEt0){
      kpiEt0.textContent = Number.isFinite(et0) ? fmt2(et0) : "—";
      kpiEt0.dataset.num = Number.isFinite(et0) ? String(et0) : "";
    }
    setText("kpiGdd", Number.isFinite(gdd) ? fmt2(gdd) : "—");

    recomputeEtc();

    // Charts
    destroyCharts();
    chVpd = buildLineChart("chartVpd", labels, vpdSeries, "VPD (kPa)");
    chTemp = buildLineChart("chartAgroTemp", labels, todayRows.map(r=>Number(r.temp_c)), "Temperatura (°C)");

    // Capçalera updated
    setText("lastUpdated", `Actualitzat: ${new Date(cur.ts).toLocaleString("ca-ES")}`);
  }

  async function main(){
    try {
      if ($("year")) $("year").textContent = String(new Date().getFullYear());
      await refresh();
    } catch (e) {
      console.warn("Agrícola init parcial", e);
      try { render(); } catch {}
    }
  }

  main();
          }
