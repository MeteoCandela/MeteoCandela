// pages/agricola.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import {
  fmt1,
  fmt2,          // si NO tens fmt2 al teu format.js, elimina aquesta importació i usa la funció local fmt2f()
  fmtDate,
  fmtDayLong,
  fmtTime,
  fmtTimeWithH,
  dayKeyFromTs,
  startEndMsFromDayKey,
  minMax,
} from "../lib/format.js";
import { loadHistoryOnce, loadCurrentAndHeartbeat } from "../lib/api.js";
import { initChartFullscreen } from "../lib/fullscreen_chart.js";

// =========================
// Config
// =========================
const LAT_VALLS = 41.29;

const REFRESH_CURRENT_MS = 60 * 1000;       // 1 min
const REFRESH_HISTORY_MS = 60 * 60 * 1000;  // 60 min
const REFRESH_ON_VISIBLE = true;

// canvases del layout agrícola
const FS_CANVAS_IDS = ["chartVpd", "chartDew", "chartAgroTemp", "chartEt"];

// =========================
// Helpers bàsics
// =========================
function fmt2f(x){
  const n = Number(x);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function setText(id, txt){
  const el = $(id);
  if (el) el.textContent = txt;
}

function setSourceLine(txt){
  const el = $("sourceLine");
  if (el) el.textContent = txt;
}

function renderStatus(lastTsMs, hb) {
  const el = $("statusLine");
  if (!el) return;

  const now = Date.now();
  const hbTs = hb?.run_ts ? Number(hb.run_ts) : null;

  if (!lastTsMs) {
    el.textContent = "Sense dades (history/current no carregat).";
    return;
  }

  const dataAgeMin = (now - lastTsMs) / 60000;
  const hbAgeMin = hbTs ? (now - hbTs) / 60000 : null;

  let msg = `Dada: fa ${Math.round(dataAgeMin)} min`;
  if (hbAgeMin != null) msg += ` · Workflow: fa ${Math.round(hbAgeMin)} min`;
  if (dataAgeMin > 20) msg += " · ⚠️ Dades antigues (possible aturada o límit).";
  el.textContent = msg;
}

// =========================
// Física agro
// =========================
function esat_kpa(Tc){
  return 0.6108 * Math.exp((17.27 * Tc) / (Tc + 237.3));
}

function vpd_kpa(Tc, RH){
  if (!Number.isFinite(Tc) || !Number.isFinite(RH)) return NaN;
  const rh = clamp(Number(RH), 0, 100);
  return esat_kpa(Tc) * (1 - rh/100);
}

// Ra FAO56 (MJ/m²/day)
function ra_mj_m2_day(latDeg, dateObj){
  const lat = (Math.PI/180) * latDeg;

  const J = Math.floor(
    (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) - Date.UTC(dateObj.getFullYear(), 0, 0)) / 86400000
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

// =========================
// Day selector (mateix patró que home.js)
// =========================
function getUrlDayParam() {
  try {
    const u = new URL(location.href);
    const v = u.searchParams.get("day");
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

function setUrlDayParam(dayKey) {
  try {
    const u = new URL(location.href);
    u.searchParams.set("day", dayKey);
    history.replaceState(null, "", u.toString());
  } catch {}
}

function buildDayListFromRows(rows, current) {
  const set = new Set();
  for (const r of (rows || [])) {
    if (r && Number.isFinite(r.ts)) set.add(dayKeyFromTs(r.ts));
  }
  set.add(dayKeyFromTs(Date.now()));
  if (current && Number.isFinite(current.ts)) set.add(dayKeyFromTs(current.ts));
  return Array.from(set).sort();
}

function labelForDay(dayKey) {
  const today = dayKeyFromTs(Date.now());
  const yesterday = dayKeyFromTs(Date.now() - 24 * 60 * 60 * 1000);
  const pretty = dayKey.split("-").reverse().join("/");
  if (dayKey === today) return `Avui (${pretty})`;
  if (dayKey === yesterday) return `Ahir (${pretty})`;
  return pretty;
}

function setupDaySelector(dayKeys, initialKey, onChange) {
  const sel = $("daySelect");
  const prev = $("dayPrev");
  const next = $("dayNext");
  if (!sel || !prev || !next) return null;

  sel.innerHTML = "";
  for (const k of dayKeys) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = labelForDay(k);
    sel.appendChild(opt);
  }

  const idx0 = dayKeys.indexOf(initialKey);
  sel.value = (idx0 >= 0) ? dayKeys[idx0] : (dayKeys[dayKeys.length - 1] || initialKey);

  function currentIndex() { return dayKeys.indexOf(sel.value); }
  function updateButtons() {
    const i = currentIndex();
    prev.disabled = (i <= 0);
    next.disabled = (i < 0 || i >= dayKeys.length - 1);
  }

  sel.addEventListener("change", () => {
    updateButtons();
    setUrlDayParam(sel.value);
    onChange(sel.value);
  });

  prev.addEventListener("click", () => {
    const i = currentIndex();
    if (i > 0) {
      sel.value = dayKeys[i - 1];
      sel.dispatchEvent(new Event("change"));
    }
  });

  next.addEventListener("click", () => {
    const i = currentIndex();
    if (i >= 0 && i < dayKeys.length - 1) {
      sel.value = dayKeys[i + 1];
      sel.dispatchEvent(new Event("change"));
    }
  });

  updateButtons();
  return sel.value;
}

// =========================
// Rows per dia seleccionat
// =========================
function rowsForDay(allRows, dayKey, currentMaybe){
  const { start, end } = startEndMsFromDayKey(dayKey);

  const rDay = (Array.isArray(allRows) ? allRows : [])
    .filter(r => Number.isFinite(Number(r?.ts)) && r.ts >= start && r.ts <= end)
    .slice()
    .sort((a, b) => a.ts - b.ts);

  if (currentMaybe && Number.isFinite(Number(currentMaybe?.ts)) && currentMaybe.ts >= start && currentMaybe.ts <= end) {
    const lastTs = rDay.length ? rDay[rDay.length - 1].ts : null;
    if (!lastTs || currentMaybe.ts > lastTs) rDay.push(currentMaybe);
  }

  return rDay;
}

// =========================
// Charts (mateix “feeling” que charts_day.js)
// =========================
function destroyAgroCharts(){
  try { window.__chartVpd?.destroy?.(); } catch {}
  try { window.__chartDew?.destroy?.(); } catch {}
  try { window.__chartAgroTemp?.destroy?.(); } catch {}
  try { window.__chartEt?.destroy?.(); } catch {}
  window.__chartVpd = window.__chartDew = window.__chartAgroTemp = window.__chartEt = null;
}

function commonBaseOptions(){
  const dpr = Math.min(2, (window.devicePixelRatio || 1));
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: dpr,
    interaction: { mode: "nearest", intersect: false, axis: "x" },
    scales: {
      x: {
        type: "category",
        ticks: {
          autoSkip: true,
          maxTicksLimit: 14,
          maxRotation: 45,
          minRotation: 45,
          padding: 6
        },
        grid: { drawTicks: true }
      }
    }
  };
}

function tooltipForSeries(unit, rowsRef){
  return {
    displayColors: false,
    callbacks: {
      title: (items) => {
        const idx = items?.[0]?.dataIndex;
        const ts = (idx == null) ? null : rowsRef?.[idx]?.ts;
        return ts ? fmtTimeWithH(ts) : "";
      },
      label: (ctx) => {
        const v = ctx.parsed?.y;
        if (v == null) return "—";
        return `${Number(v).toFixed(2)} ${unit}`;
      }
    }
  };
}

function tooltipEt(){
  return {
    displayColors: false,
    callbacks: {
      title: () => "",
      label: (ctx) => {
        const v = ctx.parsed?.y;
        if (v == null) return "—";
        const name = ctx.label || "";
        return `${name}: ${Number(v).toFixed(2)} mm`;
      }
    }
  };
}

function buildLineChart(canvasId, labels, data, unit, rowsRef){
  const canvas = $(canvasId);
  if (!canvas || typeof window.Chart === "undefined") return null;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "",
        data,
        tension: 0.25,
        pointRadius: 1,
        pointHoverRadius: 5,
        pointHitRadius: 10,
        borderWidth: 1.6,
        fill: false
      }]
    },
    options: { ...commonBaseOptions(), plugins: { legend: { display: false }, tooltip: tooltipForSeries(unit, rowsRef) } }
  });
}

function buildEtChart(et0, etc){
  const canvas = $("chartEt");
  if (!canvas || typeof window.Chart === "undefined") return null;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels: ["ET0", "ETc"],
      datasets: [{
        label: "",
        data: [
          Number.isFinite(et0) ? et0 : null,
          Number.isFinite(etc) ? etc : null
        ],
        tension: 0,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointHitRadius: 10,
        borderWidth: 1.6,
        fill: false
      }]
    },
    options: { ...commonBaseOptions(), plugins: { legend: { display: false }, tooltip: tooltipEt() } }
  });
}

function countHoursOver(rows, thr){
  let minutes = 0;
  for (const r of rows){
    const v = vpd_kpa(Number(r?.temp_c), Number(r?.hum_pct));
    if (Number.isFinite(v) && v > thr) minutes += 5; // 5-min samples
  }
  return minutes / 60;
}

// =========================
// Main
// =========================
export function initAgricola(){
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
    selectedDay: null,
    timers: { cur: null, hist: null },
    chartsReady: false,
    io: null,
  };

  function pickActualRow() {
    const hist = state.historyRows || [];
    if (state.current) return { row: state.current, tag: "dades en temps real" };
    if (hist.length) return { row: hist[hist.length - 1], tag: "últim registre històric" };
    return { row: null, tag: "sense dades carregades" };
  }

  function recomputeEtcOnly(){
    const kc = Number($("kcSelect")?.value || 0.7);
    const et0 = Number($("kpiEt0")?.dataset?.num || NaN);
    const etc = Number.isFinite(et0) ? et0 * kc : NaN;

    setText("kpiEtc", Number.isFinite(etc) ? fmt2f(etc) : "—");

    // Rebuild ET chart only (cheap)
    try { window.__chartEt?.destroy?.(); } catch {}
    window.__chartEt = buildEtChart(et0, etc);
    initChartFullscreen(FS_CANVAS_IDS); // idempotent
  }

  $("kcSelect")?.addEventListener("change", recomputeEtcOnly);
  $("gddBase")?.addEventListener("change", () => { renderAll(); });

  function setupLazyChartsObserver(){
    if (state.chartsReady) return;

    const target = document.querySelector(".chart-box") || document.getElementById("daySelect");
    if (!target) { state.chartsReady = true; return; }

    if (!("IntersectionObserver" in window)) { state.chartsReady = true; return; }
    if (state.io) return;

    state.io = new IntersectionObserver((entries) => {
      const e = entries && entries[0];
      if (!e || !e.isIntersecting) return;

      state.chartsReady = true;
      try { state.io.disconnect(); } catch {}
      state.io = null;

      renderCharts(); // ara sí
    }, { root: null, rootMargin: "250px", threshold: 0.01 });

    state.io.observe(target);
  }

  async function refreshCurrent(){
    await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);
    renderAll(false);
  }

  async function refreshHistory(){
    await loadHistoryOnce(HISTORY_URL, state);

    // Rebuild selector (com home) mantenint selecció
    const dayKeys = buildDayListFromRows(state.historyRows, state.current);
    const keepWanted = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
    const keep = dayKeys.includes(keepWanted) ? keepWanted : (dayKeys[dayKeys.length - 1] || keepWanted);

    const sel = setupDaySelector(dayKeys, keep, (k) => {
      state.selectedDay = k;
      if (!state.chartsReady) state.chartsReady = true;
      renderAll(true);
    });

    state.selectedDay = sel || keep;

    renderAll(true);
  }

  function renderAll(withCharts = true){
    const { row, tag } = pickActualRow();
    if (!row) {
      setSourceLine("Font: sense dades carregades");
      setText("statusLine", "No es pot mostrar informació: falta history/current.");
      setText("lastUpdated", "Sense dades");
      return;
    }

    setSourceLine(`Font: ${tag}`);
    setText("lastUpdated", `Actualitzat: ${fmtDate(row.ts)}`);
    renderStatus(row.ts, state.hb);

    if (withCharts) renderCharts();
  }

  function renderCharts(){
    if (!state.chartsReady) return;

    const hist = state.historyRows || [];
    const dayKeys = buildDayListFromRows(hist, state.current);

    // assegura selectedDay
    const wanted = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
    const dayKey = dayKeys.includes(wanted) ? wanted : (dayKeys[dayKeys.length - 1] || wanted);
    state.selectedDay = dayKey;

    // etiqueta de dia (mateix estil que charts_day)
    const dayTxt = fmtDayLong(dayKey);
    const dayLabel = $("dayLabel");
    if (dayLabel) dayLabel.textContent = dayTxt;

    // dades del dia
    const rDay = rowsForDay(hist, dayKey, state.current);

    // sèries
    const labels = rDay.map(r => fmtTime(r.ts));
    const temp = rDay.map(r => (Number.isFinite(Number(r.temp_c)) ? Number(r.temp_c) : null));
    const dew  = rDay.map(r => (Number.isFinite(Number(r.dew_c)) ? Number(r.dew_c) : null));
    const vpd  = rDay.map(r => {
      const Tc = Number(r?.temp_c);
      const RH = Number(r?.hum_pct);
      const vv = vpd_kpa(Tc, RH);
      return Number.isFinite(vv) ? vv : null;
    });

    // KPIs (instantanis del row “actual”)
    const Tnow = Number(state.current?.temp_c ?? row?.temp_c);
    const RHnow = Number(state.current?.hum_pct ?? row?.hum_pct);
    const dewNow = Number(state.current?.dew_c ?? row?.dew_c);
    const rainDay = Number(state.current?.rain_day_mm ?? row?.rain_day_mm);

    const vpdNow = vpd_kpa(Tnow, RHnow);
    setText("kpiVpdNow", Number.isFinite(vpdNow) ? fmt2f(vpdNow) : "—");
    setText("chipDew", Number.isFinite(dewNow) ? `${fmt1(dewNow)} °C` : "—");
    setText("kpiSpreadChip", (Number.isFinite(Tnow) && Number.isFinite(dewNow)) ? `${fmt1(Tnow - dewNow)} °C` : "—");
    setText("kpiRainDayAgro", Number.isFinite(rainDay) ? fmt1(rainDay) : "—");

    // agregats del dia (Tmin/Tmax, VPD max, hores)
    const mm = minMax(temp);
    const Tmin = mm?.min ?? null;
    const Tmax = mm?.max ?? null;
    const Tmean = (Tmin != null && Tmax != null) ? (Tmin + Tmax)/2 : null;

    const vpdMax = (() => {
      let m = null;
      for (const x of vpd) if (x != null && Number.isFinite(x)) m = (m == null) ? x : Math.max(m, x);
      return m;
    })();

    setText("kpiVpdMax", Number.isFinite(vpdMax) ? fmt2f(vpdMax) : "—");

    const h12 = countHoursOver(rDay, 1.2);
    const h16 = countHoursOver(rDay, 1.6);
    setText("chipVpd12", Number.isFinite(h12) ? `${fmt1(h12)} h` : "—");
    setText("chipVpd16", Number.isFinite(h16) ? `${fmt1(h16)} h` : "—");

    // ET0/GDD del dia seleccionat
    const base = Number($("gddBase")?.value || 10);
    let dateObj = new Date();
    try {
      const [y, m, d] = dayKey.split("-").map(Number);
      dateObj = new Date(y, m - 1, d);
    } catch {}

    const et0 = (Tmax != null && Tmin != null && Tmean != null)
      ? et0_hargreaves_mm(Tmax, Tmin, Tmean, LAT_VALLS, dateObj)
      : NaN;

    const gdd = (Tmax != null && Tmin != null) ? gdd_day(Tmax, Tmin, base) : NaN;

    const kpiEt0 = $("kpiEt0");
    if (kpiEt0){
      kpiEt0.textContent = Number.isFinite(et0) ? fmt2f(et0) : "—";
      kpiEt0.dataset.num = Number.isFinite(et0) ? String(et0) : "";
    }

    setText("kpiGdd", Number.isFinite(gdd) ? fmt2f(gdd) : "—");

    const kc = Number($("kcSelect")?.value || 0.7);
    const etc = Number.isFinite(et0) ? et0 * kc : NaN;
    setText("kpiEtc", Number.isFinite(etc) ? fmt2f(etc) : "—");

    // TITLES (com charts_day)
    if ($("chartVpdTitle")) $("chartVpdTitle").textContent = `VPD (kPa) · ${dayTxt}`;
    if ($("chartDewTitle")) $("chartDewTitle").textContent = `Punt de rosada (°C) · ${dayTxt}`;
    if ($("chartTempTitle")) $("chartTempTitle").textContent = `Temperatura (°C) · ${dayTxt}`;
    if ($("chartEtTitle")) $("chartEtTitle").textContent = `ET0 / ETc (mm) · ${dayTxt}`;

    // Charts render
    destroyAgroCharts();
    if (typeof window.Chart !== "undefined") {
      window.__chartVpd = buildLineChart("chartVpd", labels, vpd, "kPa", rDay);
      window.__chartDew = buildLineChart("chartDew", labels, dew, "°C", rDay);
      window.__chartAgroTemp = buildLineChart("chartAgroTemp", labels, temp, "°C", rDay);
      window.__chartEt = buildEtChart(et0, etc);
    }

    initChartFullscreen(FS_CANVAS_IDS); // injecta ⛶ als H2 (idempotent)
  }

  async function main(){
    try {
      if ($("year")) $("year").textContent = String(new Date().getFullYear());

      await Promise.all([
        loadHistoryOnce(HISTORY_URL, state),
        loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state),
      ]);

      // selector inicial
      const dayKeys = buildDayListFromRows(state.historyRows || [], state.current);
      const wanted = getUrlDayParam();
      const initial = (wanted && dayKeys.includes(wanted))
        ? wanted
        : (state.current && Number.isFinite(state.current.ts))
          ? dayKeyFromTs(state.current.ts)
          : dayKeyFromTs(Date.now());

      const selected = setupDaySelector(dayKeys, initial, (k) => {
        state.selectedDay = k;
        if (!state.chartsReady) state.chartsReady = true;
        renderAll(true);
      });

      state.selectedDay = selected || initial;

      setupLazyChartsObserver();
      renderAll(true);

      // timers (com home)
      try { if (state.timers.cur) clearInterval(state.timers.cur); } catch {}
      try { if (state.timers.hist) clearInterval(state.timers.hist); } catch {}

      state.timers.cur = setInterval(refreshCurrent, REFRESH_CURRENT_MS);
      state.timers.hist = setInterval(refreshHistory, REFRESH_HISTORY_MS);

      if (REFRESH_ON_VISIBLE) {
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState !== "visible") return;
          await refreshCurrent();
        });
      }
    } catch (e) {
      console.warn("Inicialització agrícola parcial (offline?)", e);
      setupLazyChartsObserver();
      renderAll(true);
    }
  }

  main();
}
