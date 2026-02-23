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

const LAT_VALLS = 41.29;

// Charts
let chVpd = null;
let chTemp = null;
let chDew = null;
let chEt = null;

function fmt2(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

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

// --- AGRO physics ---
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
    (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) - Date.UTC(dateObj.getFullYear(), 0, 0)) / 86400000
  );

  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * J);
  const delta = 0.409 * Math.sin((2 * Math.PI / 365) * J - 1.39);
  const ws = Math.acos(clamp(-Math.tan(lat) * Math.tan(delta), -1, 1));
  const Gsc = 0.0820; // MJ/m²/min

  return (24 * 60 / Math.PI) * Gsc * dr *
    (ws * Math.sin(lat) * Math.sin(delta) + Math.cos(lat) * Math.cos(delta) * Math.sin(ws));
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

// --- Day URL param helpers (copied pattern from home.js) ---
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

// --- Data slice per selected day ---
function rowsForDay(historyRows, current, dayKey) {
  const { start, end } = startEndMsFromDayKey(dayKey);

  const rows = (Array.isArray(historyRows) ? historyRows : [])
    .filter((r) => Number.isFinite(r?.ts) && r.ts >= start && r.ts <= end)
    .slice();

  if (current && Number.isFinite(current.ts) && current.ts >= start && current.ts <= end) {
    const lastHistTs = rows.length ? rows[rows.length - 1].ts : null;
    if (!lastHistTs || current.ts > lastHistTs) rows.push(current);
  }
  return rows;
}

// --- Charts ---
function destroyCharts() {
  try { if (chVpd) chVpd.destroy(); } catch {}
  try { if (chTemp) chTemp.destroy(); } catch {}
  try { if (chDew) chDew.destroy(); } catch {}
  try { if (chEt) chEt.destroy(); } catch {}
  chVpd = chTemp = chDew = chEt = null;
}

function buildLineChart(canvasId, labels, data, label) {
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
        y: { beginAtZero: false },
      }
    }
  });
}

function countHoursOver(rows, thr) {
  let minutes = 0;
  for (const r of rows) {
    const v = vpd_kpa(Number(r?.temp_c), Number(r?.hum_pct));
    if (Number.isFinite(v) && v > thr) minutes += 5; // 5-min samples
  }
  return minutes / 60;
}

function pickActualRow(state) {
  const hist = state.historyRows || [];
  if (state.current) return { row: state.current, tag: "dades en temps real" };
  if (hist.length) return { row: hist[hist.length - 1], tag: "últim registre històric" };
  return { row: null, tag: "sense dades carregades" };
}

function recomputeEtc() {
  const kc = Number($("#kcSelect")?.value || 0.7);
  const et0 = Number($("#kpiEt0")?.dataset?.num || NaN);
  const etc = Number.isFinite(et0) ? et0 * kc : NaN;
  setText("kpiEtc", Number.isFinite(etc) ? fmt2(etc) : "—");

  // Re-render ET chart if present
  try {
    if (chEt) chEt.destroy();
  } catch {}
  chEt = buildLineChart("chartEt", ["ET0", "ETc"], [Number.isFinite(et0) ? et0 : null, Number.isFinite(etc) ? etc : null], "mm");
}

function updateDayLabel(dayKey) {
  const pretty = dayKey.split("-").reverse().join("/");
  const today = dayKeyFromTs(Date.now());
  setText("dayLabel", dayKey === today ? `Avui (${pretty})` : pretty);
}

export function initAgricola() {
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
    selectedDay: null,
  };

  // UI listeners
  $("#kcSelect")?.addEventListener("change", recomputeEtc);
  $("#gddBase")?.addEventListener("change", () => { renderAll(); });
  // day selector listeners set in setupDaySelector

  async function refreshAll() {
    await Promise.all([
      loadHistoryOnce(HISTORY_URL, state),
      loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state),
    ]);
  }

  function renderAll() {
    const { row, tag } = pickActualRow(state);

    if (!row) {
      setSourceLine("Font: sense dades carregades");
      setText("statusLine", "No es pot mostrar informació: falta history/current.");
      return;
    }

    setSourceLine(`Font: ${tag}`);
    setText("lastUpdated", `Actualitzat: ${fmtDate(row.ts)}`);
    renderStatus(row.ts, state.hb);

    // Day selection
    const dayKey = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
    state.selectedDay = dayKey;
    updateDayLabel(dayKey);

    // Data slice for day
    const dayRows = rowsForDay(state.historyRows || [], state.current, dayKey);

    // KPIs instantaneous (from actual row)
    const Tnow = Number(row.temp_c);
    const RHnow = Number(row.hum_pct);
    const dewNow = Number(row.dew_c);
    const rainDay = Number(row.rain_day_mm);

    const vpdNow = vpd_kpa(Tnow, RHnow);
    setText("kpiVpdNow", Number.isFinite(vpdNow) ? fmt2(vpdNow) : "—");
    setText("chipDew", Number.isFinite(dewNow) ? `${fmt1(dewNow)} °C` : "—");
    setText("kpiSpreadChip", (Number.isFinite(Tnow) && Number.isFinite(dewNow)) ? `${fmt1(Tnow - dewNow)} °C` : "—");

    // rain in KPI slot
    setText("kpiRainDayAgro", Number.isFinite(rainDay) ? fmt1(rainDay) : "—");

    // Day aggregates (from dayRows)
    const temps = dayRows.map(r => Number(r.temp_c)).filter(Number.isFinite);
    const { min: Tmin, max: Tmax } = minMax(temps);
    const Tmean = (Tmin != null && Tmax != null) ? (Tmin + Tmax) / 2 : null;

    // VPD max + series
    let vpdMax = -Infinity;

    const labels = [];
    const vpdSeries = [];
    const tempSeries = [];
    const dewSeries = [];

    for (const r of dayRows) {
      const Tc = Number(r.temp_c);
      const RH = Number(r.hum_pct);
      const dw = Number(r.dew_c);

      // label
      try {
        labels.push(new Date(r.ts).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }));
      } catch {
        labels.push("—");
      }

      tempSeries.push(Number.isFinite(Tc) ? Tc : null);
      dewSeries.push(Number.isFinite(dw) ? dw : null);

      const v = vpd_kpa(Tc, RH);
      vpdSeries.push(Number.isFinite(v) ? v : null);
      if (Number.isFinite(v)) vpdMax = Math.max(vpdMax, v);
    }

    setText("kpiVpdMax", Number.isFinite(vpdMax) ? fmt2(vpdMax) : "—");

    const h12 = countHoursOver(dayRows, 1.2);
    const h16 = countHoursOver(dayRows, 1.6);
    setText("chipVpd12", Number.isFinite(h12) ? `${fmt1(h12)} h` : "—");
    setText("chipVpd16", Number.isFinite(h16) ? `${fmt1(h16)} h` : "—");

    // ET0 + GDD for selected day
    const base = Number($("#gddBase")?.value || 10);

    // dateObj must match selected day in local time
    let dateObj = new Date();
    try {
      const [y, m, d] = dayKey.split("-").map(Number);
      dateObj = new Date(y, (m - 1), d);
    } catch {}

    const et0 = (Tmax != null && Tmin != null && Tmean != null)
      ? et0_hargreaves_mm(Tmax, Tmin, Tmean, LAT_VALLS, dateObj)
      : NaN;

    const gdd = (Tmax != null && Tmin != null) ? gdd_day(Tmax, Tmin, base) : NaN;

    const kpiEt0 = $("kpiEt0");
    if (kpiEt0) {
      kpiEt0.textContent = Number.isFinite(et0) ? fmt2(et0) : "—";
      kpiEt0.dataset.num = Number.isFinite(et0) ? String(et0) : "";
    }

    setText("kpiGdd", Number.isFinite(gdd) ? fmt2(gdd) : "—");

    // ETc
    const kc = Number($("#kcSelect")?.value || 0.7);
    const etc = Number.isFinite(et0) ? et0 * kc : NaN;
    setText("kpiEtc", Number.isFinite(etc) ? fmt2(etc) : "—");

    // Charts
    destroyCharts();
    chVpd = buildLineChart("chartVpd", labels, vpdSeries, "VPD (kPa)");
    chDew = buildLineChart("chartDew", labels, dewSeries, "Punt de rosada (°C)");
    chTemp = buildLineChart("chartAgroTemp", labels, tempSeries, "Temperatura (°C)");
    chEt = buildLineChart("chartEt", ["ET0", "ETc"], [Number.isFinite(et0) ? et0 : null, Number.isFinite(etc) ? etc : null], "mm");
  }

  async function main() {
    try {
      if ($("year")) $("year").textContent = String(new Date().getFullYear());

      await refreshAll();

      // Setup day selector
      const dayKeys = buildDayListFromRows(state.historyRows || [], state.current);
      const wanted = getUrlDayParam();
      const initial = (wanted && dayKeys.includes(wanted))
        ? wanted
        : (state.current && Number.isFinite(state.current.ts))
          ? dayKeyFromTs(state.current.ts)
          : dayKeyFromTs(Date.now());

      const selected = setupDaySelector(dayKeys, initial, (k) => {
        state.selectedDay = k;
        renderAll();
      });

      state.selectedDay = selected || initial;

      renderAll();
    } catch (e) {
      console.warn("Inicialització agrícola parcial (offline?)", e);
      renderAll();
    }
  }

  main();
}
