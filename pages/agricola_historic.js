// pages/agricola_historic.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";
import { fmt1 } from "../lib/format.js";
import { loadDailySummaryD1 } from "../lib/api.js";

const REFRESH_MS = 6 * 60 * 60 * 1000; // 6h (D1 no cal cada minut)

function setText(id, txt) {
  const el = $(id);
  if (el) el.textContent = txt;
}

function fmt2(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function dayLabel(dateStr) {
  if (!dateStr) return "—";
  const p = String(dateStr).split("-");
  if (p.length !== 3) return String(dateStr);
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function toSortedRows(rows) {
  const arr = Array.isArray(rows) ? rows : (rows ? [rows] : []);
  return arr
    .filter(r => r && r.date && /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)))
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date))); // asc
}

function destroyChart(ref) {
  try { ref?.destroy?.(); } catch {}
  return null;
}

function buildLineChart(canvasId, labels, datasets, yBeginAtZero = false) {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return null;

  const dpr = Math.min(2, (window.devicePixelRatio || 1));

  return new Chart(el, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      plugins: { legend: { display: true }, tooltip: { displayColors: false } },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 14, maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: yBeginAtZero }
      }
    }
  });
}

function buildBarChart(canvasId, labels, datasetLabel, data) {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return null;

  const dpr = Math.min(2, (window.devicePixelRatio || 1));

  return new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: datasetLabel, data, borderWidth: 1 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr,
      plugins: { legend: { display: true }, tooltip: { displayColors: false } },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 14, maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: true }
      }
    }
  });
}

function pickGddField(base) {
  const b = String(base);
  if (b === "5") return "gdd_base5";
  if (b === "12") return "gdd_base12";
  return "gdd_base10";
}

function computeRangeDaysFromSelect() {
  const raw = String($("rangeSelect")?.value || "y:1"); // default 1 any
  const [unit, nStr] = raw.split(":");
  const n = Number(nStr);

  let days = 365; // fallback
  if (Number.isFinite(n) && n > 0) {
    if (unit === "d") days = Math.round(n);
    else if (unit === "m") days = Math.round(n * 30.4375);
    else if (unit === "y") days = Math.round(n * 365.25);
  }

  // clamp (tu tens max 5 anys a D1)
  return Math.max(1, Math.min(1825, days));
}

export function initAgricolaHistoric() {
  const { DAILY_SUMMARY_D1_URL } = getApi();

  const state = {
    rows: [],
    charts: { et: null, gdd: null, vpd: null, rain: null },
    timer: null
  };

  function renderStatus() {
    const last = state.rows.length ? state.rows[state.rows.length - 1] : null;
    if (!last) {
      setText("lastUpdated", "Sense dades D1");
      setText("statusLine", "—");
      return;
    }
    setText("lastUpdated", `D1: últim dia ${dayLabel(last.date)}`);
    setText("statusLine", "Resum diari (D1). Període configurable.");
  }

  function renderDetail(r, kc, base) {
    setText("detailDate", r?.date ? dayLabel(r.date) : "—");

    const et0 = safeNum(r?.et0_hargreaves_mm);
    const etc = (et0 == null) ? null : et0 * kc;

    const gddField = pickGddField(base);
    const gdd = safeNum(r?.[gddField]);
    const rain = safeNum(r?.rain_mm);

    const tmin = safeNum(r?.temp_min_c);
    const tmax = safeNum(r?.temp_max_c);
    const tavg = safeNum(r?.temp_avg_c);

    const vavg = safeNum(r?.vpd_avg_kpa);
    const vmax = safeNum(r?.vpd_max_kpa);
    const h12 = safeNum(r?.hours_vpd_gt_120);
    const h16 = safeNum(r?.hours_vpd_gt_160);

    setText("dEt0", et0 == null ? "—" : fmt2(et0));
    setText("dEtc", etc == null ? "—" : fmt2(etc));
    setText("dGdd", gdd == null ? "—" : fmt2(gdd));
    setText("dRain", rain == null ? "—" : fmt1(rain));

    const tTxt =
      (tmin == null && tmax == null && tavg == null)
        ? "—"
        : `${tmin == null ? "—" : fmt1(tmin)} / ${tmax == null ? "—" : fmt1(tmax)} / ${tavg == null ? "—" : fmt1(tavg)}`;
    setText("dTemp", tTxt);

    const vTxt =
      `${vavg == null ? "—" : fmt2(vavg)} / ${vmax == null ? "—" : fmt2(vmax)} · ` +
      `${h12 == null ? "—" : fmt1(h12)} · ${h16 == null ? "—" : fmt1(h16)}`;
    setText("dVpd", vTxt);
  }

  function renderKPIsAndCharts() {
    const rangeDays = computeRangeDays();
    const kc = Number($("kcSelect")?.value || 0.7);
    const base = $("gddBase")?.value || "10";
    const gddField = pickGddField(base);

    const rows = state.rows.slice(Math.max(0, state.rows.length - rangeDays));
    const labels = rows.map(r => dayLabel(r.date));

    const et0 = rows.map(r => safeNum(r.et0_hargreaves_mm));
    const etc = et0.map(v => (v == null ? null : Number((v * kc).toFixed(2))));
    const gdd = rows.map(r => safeNum(r[gddField]));
    const rain = rows.map(r => safeNum(r.rain_mm));
    const h12 = rows.map(r => safeNum(r.hours_vpd_gt_120));
    const h16 = rows.map(r => safeNum(r.hours_vpd_gt_160));

    const sum = (arr) => arr.reduce((acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);

    const et0Sum = sum(et0);
    const etcSum = sum(etc);
    const rainSum = sum(rain);
    const gddSum = sum(gdd);
    const vpd16Days = rows.reduce((acc, r) => acc + (((safeNum(r.hours_vpd_gt_160) || 0) > 0) ? 1 : 0), 0);

    setText("kpiEt0Sum", Number.isFinite(et0Sum) ? fmt2(et0Sum) : "—");
    setText("kpiEtcSum", Number.isFinite(etcSum) ? fmt2(etcSum) : "—");
    setText("kpiRainSum", Number.isFinite(rainSum) ? fmt1(rainSum) : "—");
    setText("kpiGddSum", Number.isFinite(gddSum) ? fmt2(gddSum) : "—");
    setText("kpiVpd16Days", String(vpd16Days));

    const last = state.rows.length ? state.rows[state.rows.length - 1] : null;
    setText("kpiLastDay", last?.date ? dayLabel(last.date) : "—");

    state.charts.et = destroyChart(state.charts.et);
    state.charts.gdd = destroyChart(state.charts.gdd);
    state.charts.vpd = destroyChart(state.charts.vpd);
    state.charts.rain = destroyChart(state.charts.rain);

    state.charts.et = buildLineChart("chartEtDaily", labels, [
      { label: "ET0 (mm)", data: et0, tension: 0.25, pointRadius: 0, borderWidth: 1.8, fill: false },
      { label: "ETc (mm)", data: etc, tension: 0.25, pointRadius: 0, borderWidth: 1.8, fill: false }
    ], true);

    state.charts.gdd = buildLineChart("chartGddDaily", labels, [
      { label: `GDD base ${base} (diari)`, data: gdd, tension: 0.25, pointRadius: 0, borderWidth: 1.8, fill: false }
    ], true);

    state.charts.vpd = buildLineChart("chartVpdHours", labels, [
      { label: "Hores VPD > 1.2", data: h12, tension: 0.25, pointRadius: 0, borderWidth: 1.8, fill: false },
      { label: "Hores VPD > 1.6", data: h16, tension: 0.25, pointRadius: 0, borderWidth: 1.8, fill: false }
    ], true);

    state.charts.rain = buildBarChart("chartRainDaily", labels, "Pluja (mm/dia)", rain);

    const bindDetail = (chartRef) => {
      if (!chartRef) return;
      chartRef.options.onClick = (_evt, activeEls) => {
        const idx = activeEls?.[0]?.index;
        if (idx == null) return;
        const r = rows[idx];
        if (!r) return;
        renderDetail(r, kc, base);
      };
      chartRef.update();
    };

    bindDetail(state.charts.et);
    bindDetail(state.charts.gdd);
    bindDetail(state.charts.vpd);

    if (state.charts.rain) {
      state.charts.rain.options.onClick = (_evt, activeEls) => {
        const idx = activeEls?.[0]?.index;
        if (idx == null) return;
        const r = rows[idx];
        if (!r) return;
        renderDetail(r, kc, base);
      };
      state.charts.rain.update();
    }

    if (rows.length) renderDetail(rows[rows.length - 1], kc, base);
  }

  async function refresh() {
    const wantedMax = 1825;
    const rows = await loadDailySummaryD1(DAILY_SUMMARY_D1_URL, wantedMax);
    state.rows = toSortedRows(rows);
    renderStatus();
    renderKPIsAndCharts();
  }

  function bindControls() {
    $("rangeValue")?.addEventListener("change", renderKPIsAndCharts);
    $("rangeUnit")?.addEventListener("change", renderKPIsAndCharts);
    $("kcSelect")?.addEventListener("change", renderKPIsAndCharts);
    $("gddBase")?.addEventListener("change", renderKPIsAndCharts);
  }

  async function main() {
    if ($("year")) $("year").textContent = String(new Date().getFullYear());
    bindControls();
    await refresh();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(refresh, REFRESH_MS);
  }

  main().catch((e) => {
    console.warn("Agrícola històric init parcial", e);
    setText("lastUpdated", "Error carregant D1");
  });
}
