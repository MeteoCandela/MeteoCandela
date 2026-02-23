// pages/agricola.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import {
  fmt1,
  fmtDate,
  dayKeyFromTs,
  startEndMsFromDayKey,
  minMax,
} from "../lib/format.js";
import { loadHistoryOnce, loadCurrentAndHeartbeat } from "../lib/api.js";
import { initChartFullscreen } from "../lib/fullscreen_chart.js";

const REFRESH_CURRENT_MS = 60 * 1000;       // 1 min
const REFRESH_HISTORY_MS = 60 * 60 * 1000;  // 60 min
const REFRESH_ON_VISIBLE = true;

const LAT_VALLS = 41.29;

// Fullscreen charts (ids del teu agrícola.html nou)
const FS_CANVAS_IDS = ["chartVpd", "chartDew", "chartAgroTemp", "chartEt"];

// ---------- helpers UI ----------
function setText(id, txt) {
  const el = $(id);
  if (el) el.textContent = txt;
}

function setSourceLine(txt) {
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

function fmt2(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmtTimeHHMM(ts) {
  try {
    return new Date(Number(ts)).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

// ---------- Agro maths ----------
function esat_kpa(Tc) {
  return 0.6108 * Math.exp((17.27 * Tc) / (Tc + 237.3));
}

function vpd_kpa(Tc, RH) {
  if (!Number.isFinite(Tc) || !Number.isFinite(RH)) return NaN;
  const rh = clamp(Number(RH), 0, 100);
  return esat_kpa(Tc) * (1 - rh / 100);
}

// Ra FAO56 (MJ/m²/day)
function ra_mj_m2_day(latDeg, dateObj) {
  const lat = (Math.PI / 180) * latDeg;

  const J = Math.floor(
    (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) -
      Date.UTC(dateObj.getFullYear(), 0, 0)) / 86400000
  );

  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * J);
  const delta = 0.409 * Math.sin((2 * Math.PI / 365) * J - 1.39);
  const ws = Math.acos(clamp(-Math.tan(lat) * Math.tan(delta), -1, 1));
  const Gsc = 0.0820; // MJ/m²/min

  return (24 * 60 / Math.PI) * Gsc * dr *
    (ws * Math.sin(lat) * Math.sin(delta) +
      Math.cos(lat) * Math.cos(delta) * Math.sin(ws));
}

// ET0 Hargreaves (mm/day)
function et0_hargreaves_mm(Tmax, Tmin, Tmean, latDeg, dateObj) {
  const Ra = ra_mj_m2_day(latDeg, dateObj);
  const dT = Math.max(0, Number(Tmax) - Number(Tmin));
  const Tm = Number(Tmean);
  if (!Number.isFinite(Ra) || !Number.isFinite(dT) || !Number.isFinite(Tm)) return NaN;
  return 0.0023 * Ra * (Tm + 17.8) * Math.sqrt(dT);
}

function gdd_day(Tmax, Tmin, base) {
  const tmean = (Number(Tmax) + Number(Tmin)) / 2;
  return Math.max(0, tmean - Number(base));
}

function countHoursOver(rows, thr) {
  let minutes = 0;
  for (const r of rows) {
    const v = vpd_kpa(Number(r?.temp_c), Number(r?.hum_pct));
    if (Number.isFinite(v) && v > thr) minutes += 5; // 5 min per punt
  }
  return minutes / 60;
}

// ---------- day rows ----------
function computeRowsForDay(allRows, dayKey, currentMaybe) {
  const { start, end } = startEndMsFromDayKey(dayKey);

  const rows = (Array.isArray(allRows) ? allRows : [])
    .filter((r) => Number.isFinite(Number(r?.ts)) && r.ts >= start && r.ts <= end)
    .slice()
    .sort((a, b) => a.ts - b.ts);

  if (currentMaybe && Number.isFinite(Number(currentMaybe?.ts)) &&
      currentMaybe.ts >= start && currentMaybe.ts <= end) {
    const lastTs = rows.length ? rows[rows.length - 1].ts : null;
    if (!lastTs || currentMaybe.ts > lastTs) rows.push(currentMaybe);
  }

  return rows;
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

function getUrlDayParam() {
  try {
    const u = new URL(location.href);
    const v = u.searchParams.get("day");
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  } catch { return null; }
}

function setUrlDayParam(dayKey) {
  try {
    const u = new URL(location.href);
    u.searchParams.set("day", dayKey);
    history.replaceState(null, "", u.toString());
  } catch {}
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
    if (i > 0) { sel.value = dayKeys[i - 1]; sel.dispatchEvent(new Event("change")); }
  });

  next.addEventListener("click", () => {
    const i = currentIndex();
    if (i >= 0 && i < dayKeys.length - 1) { sel.value = dayKeys[i + 1]; sel.dispatchEvent(new Event("change")); }
  });

  updateButtons();
  return sel.value;
}

// ---------- charts ----------
function destroyChart(ref) {
  try { ref?.destroy?.(); } catch {}
  return null;
}

function buildLineChart(canvasId, labels, data, label, unit, rowsRef) {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return null;

  const dpr = Math.min(2, (window.devicePixelRatio || 1));

  return new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        tension: 0.25,
        pointRadius: 1,
        pointHoverRadius: 5,
        pointHitRadius: 10,
        borderWidth: 1.8,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      plugins: {
        legend: { display: true },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items?.[0]?.dataIndex;
              const ts = (idx == null) ? null : rowsRef?.[idx]?.ts;
              return ts ? fmtTimeHHMM(ts) : "";
            },
            label: (ctx) => {
              const v = ctx.parsed?.y;
              if (v == null) return "—";
              const n = Number(v);
              const txt = Number.isFinite(n) ? n.toFixed(2) : "—";
              return `${ctx.dataset?.label || ""}: ${txt} ${unit || ""}`.trim();
            }
          }
        }
      },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 14, maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: false }
      }
    }
  });
}

function buildBarChartET(canvasId, et0, etc) {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return null;

  const dpr = Math.min(2, (window.devicePixelRatio || 1));

  const data = [
    Number.isFinite(et0) ? Number(et0.toFixed(2)) : null,
    Number.isFinite(etc) ? Number(etc.toFixed(2)) : null
  ];

  return new Chart(el, {
    type: "bar",
    data: {
      labels: ["ET0", "ETc"],
      datasets: [{
        label: "ET (mm)",
        data,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr,
      plugins: {
        legend: { display: true },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.y;
              if (v == null) return "—";
              const n = Number(v);
              return `ET: ${Number.isFinite(n) ? n.toFixed(2) : "—"} mm`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { autoSkip: false } },
        y: { beginAtZero: true }
      }
    }
  });
}

// ---------- main ----------
export function initAgricola() {
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
    selectedDay: null,
    timers: { cur: null, hist: null },
    charts: { vpd: null, temp: null, dew: null, et: null },
  };

  function pickActualRow() {
    const hist = state.historyRows || [];
    if (state.current) return { row: state.current, tag: "dades en temps real" };
    if (hist.length) return { row: hist[hist.length - 1], tag: "últim registre històric" };
    return { row: null, tag: "sense dades carregades" };
  }

  function recomputeEtc() {
    const kc = Number($("kcSelect")?.value || 0.7);
    const et0 = Number($("kpiEt0")?.dataset?.num || NaN);
    const etc = Number.isFinite(et0) ? et0 * kc : NaN;
    setText("kpiEtc", Number.isFinite(etc) ? fmt2(etc) : "—");

    // si existeix chartEt, el refem perquè reflecteixi Kc
    if (document.getElementById("chartEt")) {
      state.charts.et = destroyChart(state.charts.et);
      state.charts.et = buildBarChartET("chartEt", et0, etc);
      initChartFullscreen(FS_CANVAS_IDS);
    }
  }

  function renderKPIsForDay(rowsDay, curRow, dayKey) {
    const base = Number($("gddBase")?.value || 10);

    const labels = [];
    const vpdSeries = [];
    const tSeries = [];
    const dewSeries = [];
    const rowsRef = [];

    let vpdMax = -Infinity;

    for (const r of rowsDay) {
      const ts = Number(r?.ts);
      if (!Number.isFinite(ts)) continue;

      const Tc = Number(r?.temp_c);
      const RH = Number(r?.hum_pct);
      const Td = Number(r?.dew_c);

      rowsRef.push({ ts });

      labels.push(fmtTimeHHMM(ts));

      tSeries.push(Number.isFinite(Tc) ? Tc : null);
      dewSeries.push(Number.isFinite(Td) ? Td : null);

      const v = vpd_kpa(Tc, RH);
      vpdSeries.push(Number.isFinite(v) ? v : null);
      if (Number.isFinite(v)) vpdMax = Math.max(vpdMax, v);
    }

    // Tmin/Tmax/Tmean (per ET0/GDD) del DIA SELECCIONAT
    const temps = rowsDay.map(r => Number(r?.temp_c)).filter(Number.isFinite);
    const mmT = minMax(temps);
    const Tmax = mmT?.max ?? null;
    const Tmin = mmT?.min ?? null;
    const Tmean = (Tmax != null && Tmin != null) ? (Tmax + Tmin) / 2 : null;

    // data del dia seleccionat
    const [yy, mmS, dd] = String(dayKey).split("-").map(Number);
    const dateObj = new Date(yy, (mmS || 1) - 1, dd || 1);

    const et0 = (Tmax != null && Tmin != null && Tmean != null)
      ? et0_hargreaves_mm(Tmax, Tmin, Tmean, LAT_VALLS, dateObj)
      : NaN;

    const gdd = (Tmax != null && Tmin != null)
      ? gdd_day(Tmax, Tmin, base)
      : NaN;

    // Instantani (curRow real)
    const Tnow = Number(curRow?.temp_c);
    const RHnow = Number(curRow?.hum_pct);
    const TdNow = Number(curRow?.dew_c);
    const rainDayNow = Number(curRow?.rain_day_mm);

    const vpdNow = vpd_kpa(Tnow, RHnow);

    // KPIs
    setText("kpiVpdNow", Number.isFinite(vpdNow) ? fmt2(vpdNow) : "—");
    setText("kpiVpdMax", Number.isFinite(vpdMax) ? fmt2(vpdMax) : "—");

    const kpiEt0 = $("kpiEt0");
    if (kpiEt0) {
      kpiEt0.textContent = Number.isFinite(et0) ? fmt2(et0) : "—";
      kpiEt0.dataset.num = Number.isFinite(et0) ? String(et0) : "";
    }

    setText("kpiGdd", Number.isFinite(gdd) ? fmt2(gdd) : "—");

    // Spread (ara) -> id nou
    setText("kpiSpreadChip",
      (Number.isFinite(Tnow) && Number.isFinite(TdNow)) ? fmt1(Tnow - TdNow) : "—"
    );

    // Pluja (ara) -> id nou
    setText("kpiRainDayAgro", Number.isFinite(rainDayNow) ? fmt1(rainDayNow) : "—");

    // Rosada (ara)
    setText("chipDew", Number.isFinite(TdNow) ? `${fmt1(TdNow)} °C` : "—");

    // Hores llindar (del dia seleccionat)
    const h12 = countHoursOver(rowsDay, 1.2);
    const h16 = countHoursOver(rowsDay, 1.6);
    setText("chipVpd12", Number.isFinite(h12) ? `${fmt1(h12)} h` : "—");
    setText("chipVpd16", Number.isFinite(h16) ? `${fmt1(h16)} h` : "—");

    // ETc depèn de Kc
    const kc = Number($("kcSelect")?.value || 0.7);
    const etc = Number.isFinite(et0) ? et0 * kc : NaN;
    setText("kpiEtc", Number.isFinite(etc) ? fmt2(etc) : "—");

    // Charts
    state.charts.vpd = destroyChart(state.charts.vpd);
    state.charts.temp = destroyChart(state.charts.temp);
    state.charts.dew = destroyChart(state.charts.dew);
    state.charts.et = destroyChart(state.charts.et);

    state.charts.vpd = buildLineChart("chartVpd", labels, vpdSeries, "VPD", "kPa", rowsRef);
    state.charts.dew = buildLineChart("chartDew", labels, dewSeries, "Punt de rosada", "°C", rowsRef);
    state.charts.temp = buildLineChart("chartAgroTemp", labels, tSeries, "Temperatura", "°C", rowsRef);

    // ET bar
    if (document.getElementById("chartEt")) {
      state.charts.et = buildBarChartET("chartEt", et0, etc);
    }

    initChartFullscreen(FS_CANVAS_IDS);
  }

  function renderAll() {
    const { row, tag } = pickActualRow();
    if (!row) {
      setSourceLine("Font: sense dades carregades");
      setText("lastUpdated", "Sense dades");
      renderStatus(null, state.hb);
      return;
    }

    setSourceLine(`Font: ${tag}`);
    setText("lastUpdated", `Actualitzat: ${fmtDate(row.ts)}`);
    renderStatus(row.ts, state.hb);

    const dayKey = state.selectedDay || dayKeyFromTs(Date.now());
    const isToday = dayKey === dayKeyFromTs(Date.now());

    const rowsDay = computeRowsForDay(
      state.historyRows,
      dayKey,
      isToday ? state.current : null
    );

    setText("dayLabel", rowsDay.length ? labelForDay(dayKey) : `${labelForDay(dayKey)} · sense dades`);
    renderKPIsForDay(rowsDay, row, dayKey);
  }

  async function refreshCurrent() {
    await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);
    renderAll();
  }

  async function refreshHistory() {
    await loadHistoryOnce(HISTORY_URL, state);

    const dayKeys = buildDayListFromRows(state.historyRows, state.current);
    const wanted = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
    const keep = dayKeys.includes(wanted) ? wanted : (dayKeys[dayKeys.length - 1] || wanted);

    const sel = setupDaySelector(dayKeys, keep, (k) => {
      state.selectedDay = k;
      renderAll();
    });

    state.selectedDay = sel || keep;
    renderAll();
  }

  function safeClearInterval(id) {
    try { if (id) clearInterval(id); } catch {}
  }

  async function main() {
    if ($("year")) $("year").textContent = String(new Date().getFullYear());

    $("kcSelect")?.addEventListener("change", recomputeEtc);
    $("gddBase")?.addEventListener("change", () => renderAll());

    await Promise.all([
      loadHistoryOnce(HISTORY_URL, state),
      loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state),
    ]);

    const hist = state.historyRows || [];
    const dayKeys = buildDayListFromRows(hist, state.current);

    const wanted = getUrlDayParam();
    const initial = (wanted && dayKeys.includes(wanted))
      ? wanted
      : dayKeyFromTs(Date.now());

    const selected = setupDaySelector(dayKeys, initial, (k) => {
      state.selectedDay = k;
      renderAll();
    });

    state.selectedDay = selected || initial;

    renderAll();

    safeClearInterval(state.timers.cur);
    safeClearInterval(state.timers.hist);

    state.timers.cur = setInterval(refreshCurrent, REFRESH_CURRENT_MS);
    state.timers.hist = setInterval(refreshHistory, REFRESH_HISTORY_MS);

    if (REFRESH_ON_VISIBLE) {
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState !== "visible") return;
        await refreshCurrent();
      });
    }
  }

  main().catch((e) => {
    console.warn("Agrícola init parcial", e);
    try { renderAll(); } catch {}
  });
}
