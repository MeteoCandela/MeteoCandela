// pages/home.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import { fmt1, fmtDate, dayKeyFromTs, startEndMsFromDayKey, minMax, degToWindCatalan } from "../lib/format.js";
import { loadHistoryOnce, loadCurrentAndHeartbeat } from "../lib/api.js";
import { renderHomeIcon, renderSunSub } from "../lib/sun.js";
import { buildChartsForDay } from "../lib/charts_day.js";

const REFRESH_CURRENT_MS = 60 * 1000;
const REFRESH_HISTORY_MS = 60 * 60 * 1000;
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

  if (!lastTsMs) { el.textContent = "Sense dades (history/current no carregat)."; return; }

  const dataAgeMin = (now - lastTsMs) / 60000;
  const hbAgeMin = hbTs ? (now - hbTs) / 60000 : null;

  let msg = `Dada: fa ${Math.round(dataAgeMin)} min`;
  if (hbAgeMin != null) msg += ` · Workflow: fa ${Math.round(hbAgeMin)} min`;
  if (dataAgeMin > 20) msg += " · ⚠️ Dades antigues (possible aturada o límit).";
  el.textContent = msg;
}

function renderCurrent(current, historyRows) {
  if ($("temp")) $("temp").textContent = current.temp_c == null ? "—" : fmt1(current.temp_c);
  if ($("hum")) $("hum").textContent  = current.hum_pct == null ? "—" : String(Math.round(current.hum_pct));
  if ($("wind")) $("wind").textContent = current.wind_kmh == null ? "—" : fmt1(current.wind_kmh);
  if ($("rainDay")) $("rainDay").textContent = current.rain_day_mm == null ? "—" : fmt1(current.rain_day_mm);

  if ($("tempSub")) {
    $("tempSub").textContent =
      current.dew_c == null ? "Punt de rosada: —" : `Punt de rosada: ${fmt1(current.dew_c)} °C`;
  }

  renderSunSub();

  const elMinMax = $("tempMinMax");
  if (elMinMax && Array.isArray(historyRows) && historyRows.length) {
    const todayKey = dayKeyFromTs(Date.now());
    const { start, end } = startEndMsFromDayKey(todayKey);

    const todayRows = historyRows.filter(r => r.ts >= start && r.ts <= end).slice();

    if (current && Number.isFinite(current.ts) && current.ts >= start && current.ts <= end) {
      const lastHistTs = todayRows.length ? todayRows[todayRows.length - 1].ts : null;
      if (!lastHistTs || current.ts > lastHistTs) todayRows.push(current);
    }

    const { min, max } = minMax(todayRows.map(r => r.temp_c));
    elMinMax.textContent =
      (min == null || max == null)
        ? "Temperatura avui: mín — · màx —"
        : `Temperatura avui: mín ${fmt1(min)} °C · màx ${fmt1(max)} °C`;
  }

  let dirTxt = "—";
  if (current.wind_dir != null && current.wind_dir !== "") {
    const deg = Number(current.wind_dir);
    if (!Number.isNaN(deg)) dirTxt = `${deg.toFixed(0)}° (${degToWindCatalan(deg)})`;
  }

  if ($("gustSub")) {
    $("gustSub").textContent =
      current.gust_kmh == null
        ? `Ratxa: — · Dir: ${dirTxt}`
        : `Ratxa: ${fmt1(current.gust_kmh)} km/h · Dir: ${dirTxt}`;
  }

  if ($("rainRateSub")) {
    $("rainRateSub").textContent =
      current.rain_rate_mmh == null
        ? "Intensitat de pluja: —"
        : `Intensitat de pluja: ${fmt1(current.rain_rate_mmh)} mm/h`;
  }

  if ($("lastUpdated")) $("lastUpdated").textContent = `Actualitzat: ${fmtDate(current.ts)}`;
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

function buildDayListFromRows(rows, current) {
  const set = new Set();
  for (const r of rows) set.add(dayKeyFromTs(r.ts));
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
    if (i > 0) { sel.value = dayKeys[i - 1]; sel.dispatchEvent(new Event("change")); }
  });

  next.addEventListener("click", () => {
    const i = currentIndex();
    if (i >= 0 && i < dayKeys.length - 1) { sel.value = dayKeys[i + 1]; sel.dispatchEvent(new Event("change")); }
  });

  updateButtons();
  return sel.value;
}

export function initHome() {
  const { HISTORY_URL, CURRENT_URL, HEARTBEAT_URL } = getApi();

  const state = {
    historyRows: [],
    current: null,
    hb: null,
    selectedDay: null,
    timers: { cur: null, hist: null }
  };

  function renderAll() {
    const historyRows = state.historyRows || [];
    const current = state.current;
    const hb = state.hb;

    let actualRow = null;
    let sourceTag = "històric";

    if (current) { actualRow = current; sourceTag = "dades en temps real"; }
    else if (historyRows.length) { actualRow = historyRows[historyRows.length - 1]; sourceTag = "últim registre històric"; }

    if (!actualRow) {
      setSourceLine("Sense dades carregades.");
      if ($("statusLine")) $("statusLine").textContent = "No es pot mostrar informació: falta history/current.";
      return null;
    }

    setSourceLine(`Font: ${sourceTag}`);
    renderCurrent(actualRow, historyRows);
    renderStatus(actualRow.ts, hb);
    renderHomeIcon(actualRow);
    renderSunSub();
    return actualRow;
  }

  function renderChartsIfNeeded() {
    if (!state.selectedDay) return;
    const todayKey = dayKeyFromTs(Date.now());
    const currentMaybe = (state.selectedDay === todayKey) ? state.current : null;
    buildChartsForDay(state.historyRows || [], state.selectedDay, currentMaybe);
  }

  async function main() {
    try {
      if ($("year")) $("year").textContent = String(new Date().getFullYear());

      await loadHistoryOnce(HISTORY_URL, state);
      await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);

      const historyRows = state.historyRows || [];
      const initialActual = state.current || (historyRows.length ? historyRows[historyRows.length - 1] : null);
      if (!initialActual) { renderAll(); return; }

      const dayKeys = buildDayListFromRows(historyRows, state.current);
      const wanted = getUrlDayParam();
      const initial = (wanted && dayKeys.includes(wanted)) ? wanted : dayKeyFromTs(initialActual.ts);

      const selected = setupDaySelector(dayKeys, initial, (k) => {
        state.selectedDay = k;
        renderChartsIfNeeded();
      });

      state.selectedDay = selected || initial;

      renderAll();
      renderChartsIfNeeded();

      state.timers.cur = setInterval(async () => {
        await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);
        renderAll();
        renderChartsIfNeeded();
      }, REFRESH_CURRENT_MS);

      state.timers.hist = setInterval(async () => {
        await loadHistoryOnce(HISTORY_URL, state);

        const dayKeys2 = buildDayListFromRows(state.historyRows, state.current);
        const keepWanted = state.selectedDay || getUrlDayParam() || dayKeyFromTs(Date.now());
        const keep = dayKeys2.includes(keepWanted) ? keepWanted : (dayKeys2[dayKeys2.length - 1] || keepWanted);

        const sel = setupDaySelector(dayKeys2, keep, (k) => {
          state.selectedDay = k;
          renderChartsIfNeeded();
        });

        state.selectedDay = sel || keep;

        renderAll();
        renderChartsIfNeeded();
      }, REFRESH_HISTORY_MS);

      if (REFRESH_ON_VISIBLE) {
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState !== "visible") return;
          await loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state);
          renderAll();
          renderChartsIfNeeded();
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
