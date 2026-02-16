// pages/home.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import {
  fmt1,
  fmtDate,
  dayKeyFromTs,
  startEndMsFromDayKey,
  minMax,
  degToWindCatalan,
} from "../lib/format.js";
import { loadHistoryOnce, loadCurrentAndHeartbeat } from "../lib/api.js";
import { renderHomeIcon, renderSunSub } from "../lib/sun.js";
import { buildChartsForDay } from "../lib/charts_day.js";
import { initChartFullscreen } from "../lib/fullscreen_chart.js";
import { initAlertsXL } from "../lib/alerts_ui.js";

const REFRESH_CURRENT_MS = 60 * 1000;       // 1 min
const REFRESH_HISTORY_MS = 60 * 60 * 1000;  // 60 min
const REFRESH_ON_VISIBLE = true;

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

function computeTodayRows(historyRows, current) {
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

function renderCurrent(current, historyRows) {
  // KPIs
  if ($("kpiTemp")) $("kpiTemp").textContent = current.temp_c == null ? "—" : fmt1(current.temp_c);
  if ($("kpiHum")) $("kpiHum").textContent = current.hum_pct == null ? "—" : String(Math.round(current.hum_pct));
  if ($("kpiWind")) $("kpiWind").textContent = current.wind_kmh == null ? "—" : fmt1(current.wind_kmh);
  if ($("kpiRainDay")) $("kpiRainDay").textContent = current.rain_day_mm == null ? "—" : fmt1(current.rain_day_mm);

  // KPI GRAN: intensitat pluja
  if ($("kpiRainRate")) $("kpiRainRate").textContent = current.rain_rate_mmh == null ? "—" : fmt1(current.rain_rate_mmh);

  // Chip: rosada
  if ($("chipDew")) $("chipDew").textContent = current.dew_c == null ? "—" : `${fmt1(current.dew_c)} °C`;

  // Chip: direcció
  let dirTxt = "—";
  if (current.wind_dir != null && current.wind_dir !== "") {
    const deg = Number(current.wind_dir);
    if (!Number.isNaN(deg)) dirTxt = `${deg.toFixed(0)}° (${degToWindCatalan(deg)})`;
  }
  if ($("chipDir")) $("chipDir").textContent = dirTxt;

  // Chip: actualitzat
  if ($("chipUpdated")) $("chipUpdated").textContent = fmtDate(current.ts);

  // Sol
  renderSunSub(); // escriu a #chipSun

  // Min/Max i gust màxim del dia
  const todayRows = computeTodayRows(historyRows, current);

  const elMinMax = $("chipMinMax");
  if (elMinMax) {
    const { min, max } = minMax(todayRows.map((r) => r.temp_c));
    elMinMax.textContent = (min == null || max == null) ? "—" : `${fmt1(min)}–${fmt1(max)} °C`;
  }

  const elGustMaxDay = $("kpiGustMaxDay");
  if (elGustMaxDay) {
    const gusts = todayRows.map((r) => Number(r.gust_kmh)).filter(Number.isFinite);
    elGustMaxDay.textContent = gusts.length ? fmt1(Math.max(...gusts)) : "—";
  }

  // Icona actual
  renderHomeIcon(current);

  // Capçalera
  if ($("lastUpdated")) $("lastUpdated").textContent = `Actualitzat: ${fmtDate(current.ts)}`;
}

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

function safeClearInterval(id) {
  try { if (id) clearInterval(id); } catch {}
}

export function initHome() {
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
    selectedDay: null,
    timers: { cur: null, hist: null },
    fsInited: false,
  };

  function pickActualRow() {
    const hist = state.historyRows || [];
    if (state.current) return { row: state.current, tag: "dades en temps real" };
    if (hist.length) return { row: hist[hist.length - 1], tag: "últim registre històric" };
    return { row: null, tag: "sense dades carregades" };
  }

  function renderAll() {
    const { row, tag } = pickActualRow();

    if (!row) {
      setSourceLine("Font: sense dades carregades");
      if ($("statusLine")) $("statusLine").textContent = "No es pot mostrar informació: falta history/current.";
      return null;
    }

    setSourceLine(`Font: ${tag}`);
    renderCurrent(row, state.historyRows || []);
    renderStatus(row.ts, state.hb);
    return row;
  }

  function renderChartsIfNeeded() {
    if (!state.selectedDay) return;

    const todayKey = dayKeyFromTs(Date.now());
    const currentMaybe = (state.selectedDay === todayKey) ? state.current : null;

    buildChartsForDay(state.historyRows || [], state.selectedDay, currentMaybe);

    if (!state.fsInited) {
      initChartFullscreen(["chartTemp", "chartHum", "chartWind", "chartRain"]);
      state.fsInited = true;
    }
  }

  async function refreshCurrent() {
    await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);
    renderAll();
    renderChartsIfNeeded();
  }

  async function refreshHistory() {
    await loadHistoryOnce(HISTORY_URL, state);

    const dayKeys = buildDayListFromRows(state.historyRows, state.current);
    const keepWanted = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
    const keep = dayKeys.includes(keepWanted) ? keepWanted : (dayKeys[dayKeys.length - 1] || keepWanted);

    const sel = setupDaySelector(dayKeys, keep, (k) => {
      state.selectedDay = k;
      renderChartsIfNeeded();
    });

    state.selectedDay = sel || keep;

    renderAll();
    renderChartsIfNeeded();
  }

  async function main() {
    try {
      if ($("year")) $("year").textContent = String(new Date().getFullYear());

      // 1) Carrega dades
      await loadHistoryOnce(HISTORY_URL, state);
      await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);

      // 2) Render base
      const hist = state.historyRows || [];
      const initialActual = state.current || (hist.length ? hist[hist.length - 1] : null);

      renderAll();
      
      // Avisos XL (últim avís registrat al worker)
      initAlertsXL({ pollMs: 60000 });
      
      // 3) Selector de dia
      const dayKeys = buildDayListFromRows(hist, state.current);
      const wanted = getUrlDayParam();
      const initial = (wanted && dayKeys.includes(wanted))
        ? wanted
        : (initialActual ? dayKeyFromTs(initialActual.ts) : dayKeyFromTs(Date.now()));

      const selected = setupDaySelector(dayKeys, initial, (k) => {
        state.selectedDay = k;
        renderChartsIfNeeded();
      });

      state.selectedDay = selected || initial;

      // 4) Gràfiques
      renderChartsIfNeeded();

      // 5) Timers
      safeClearInterval(state.timers.cur);
      safeClearInterval(state.timers.hist);

      state.timers.cur = setInterval(refreshCurrent, REFRESH_CURRENT_MS);
      state.timers.hist = setInterval(refreshHistory, REFRESH_HISTORY_MS);

      // 6) Quan tornes a la pestanya
      if (REFRESH_ON_VISIBLE) {
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState !== "visible") return;
          await refreshCurrent();
        });
      }
    } catch (e) {
      console.warn("Inicialització parcial (offline?)", e);
      renderAll();
      renderChartsIfNeeded();
    }
  }

  main();
}
