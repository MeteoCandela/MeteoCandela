// lib/charts_day.js
import { $ } from "./dom.js";
import {
  fmtDayLong,
  fmtTime,
  fmtTimeWithH,
  minMax,
  startEndMsFromDayKey
} from "./format.js";

// ============================================
// Charts del dia (Chart.js)
// - Millora nitidesa en mòbil (devicePixelRatio)
// - Més referències a l'eix X (ticks)
// - Línies més fines / menys punts per evitar “borrositat”
// - Mode “lite” NOMÉS per Vent/Ratxa en mòbil:
//    * bucket 30' => 1 punt/bucket
//    * conserva pics: gust = màxim del bucket
//    * vent = mitjana del bucket
// ============================================

function isMobileLite(rDayLen) {
  try {
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const small  = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
    const tooMany = (rDayLen || 0) > 180; // si hi ha massa punts, també entra “lite”
    return coarse || small || tooMany;
  } catch {
    return (rDayLen || 0) > 180;
  }
}

// Decimació robusta: 1 punt per bucket
// - ts representatiu: últim punt del bucket amb dades
// - gust: màxim del bucket (no perds ratxa màxima)
// - wind: mitjana del bucket (més estable i representatiu)
function decimateWindGustBuckets(rDay, bucketMin, dayStartTs) {
  if (!Array.isArray(rDay) || rDay.length < 3) {
    const rows = Array.isArray(rDay) ? rDay : [];
    return {
      rows,
      labels: rows.map(r => fmtTime(r.ts)),
      wind: rows.map(r => Number.isFinite(Number(r.wind_kmh)) ? Number(r.wind_kmh) : null),
      gust: rows.map(r => Number.isFinite(Number(r.gust_kmh)) ? Number(r.gust_kmh) : null),
    };
  }

  const bucketMs = bucketMin * 60 * 1000;

  // assegura ordre temporal
  const rows = rDay.slice().sort((a, b) => (Number(a?.ts) || 0) - (Number(b?.ts) || 0));

  // alinea el bucket a l'inici del dia (millor per etiquetes i coherència)
  let bStart = Number.isFinite(Number(dayStartTs))
    ? Number(dayStartTs)
    : (rows[0].ts - (rows[0].ts % bucketMs));

  let bEnd = bStart + bucketMs;

  let sumWind = 0, nWind = 0;
  let maxGust = null;
  let repTs = null;

  const outRows = [];
  const outLabels = [];
  const outWind = [];
  const outGust = [];

  function flush() {
    if (repTs == null) return; // bucket buit

    const w = nWind ? (sumWind / nWind) : null;
    const g = maxGust;

    outRows.push({ ts: repTs });
    outLabels.push(fmtTime(repTs));
    outWind.push(w == null ? null : Number(w));
    outGust.push(g == null ? null : Number(g));
  }

  for (const r of rows) {
    const ts = Number(r?.ts);
    if (!Number.isFinite(ts)) continue;

    // avança buckets fins que el ts caigui dins
    while (ts >= bEnd) {
      flush();
      bStart = bEnd;
      bEnd = bStart + bucketMs;

      sumWind = 0; nWind = 0;
      maxGust = null;
      repTs = null;
    }

    const w0 = Number(r?.wind_kmh);
    const g0 = Number(r?.gust_kmh);

    if (Number.isFinite(w0)) { sumWind += w0; nWind++; }
    if (Number.isFinite(g0)) maxGust = (maxGust == null) ? g0 : Math.max(maxGust, g0);

    // ts representatiu: últim punt del bucket amb dades
    if (Number.isFinite(w0) || Number.isFinite(g0)) repTs = ts;
  }

  flush();
  return { rows: outRows, labels: outLabels, wind: outWind, gust: outGust };
}

export function buildChartsForDay(allRows, dayKey, currentMaybe) {
  const { start, end } = startEndMsFromDayKey(dayKey);

  const rDay = (Array.isArray(allRows) ? allRows : [])
    .filter(r => Number.isFinite(Number(r?.ts)) && r.ts >= start && r.ts <= end)
    .slice()
    .sort((a, b) => a.ts - b.ts);

  // afegeix current si pertany al dia i és més nou que l'últim hist
  if (currentMaybe && Number.isFinite(Number(currentMaybe?.ts)) && currentMaybe.ts >= start && currentMaybe.ts <= end) {
    const lastTs = rDay.length ? rDay[rDay.length - 1].ts : null;
    if (!lastTs || currentMaybe.ts > lastTs) rDay.push(currentMaybe);
  }

  const labels = rDay.map(r => fmtTime(r.ts));
  const temp = rDay.map(r => (Number.isFinite(Number(r.temp_c)) ? Number(r.temp_c) : null));
  const hum  = rDay.map(r => (Number.isFinite(Number(r.hum_pct)) ? Number(r.hum_pct) : null));

  // Wind/Gust “full” (després pot anar a lite)
  const windFull = rDay.map(r => (Number.isFinite(Number(r.wind_kmh)) ? Number(r.wind_kmh) : null));
  const gustFull = rDay.map(r => (Number.isFinite(Number(r.gust_kmh)) ? Number(r.gust_kmh) : null));

  // PLUJA acumulada “real” (sense offset d’ahir)
  const rainRaw = rDay.map(r => (r.rain_day_mm == null ? null : Number(r.rain_day_mm)));

  const rainAcc = [];
  let acc = 0;
  let prev = null;

  for (const v0 of rainRaw) {
    const v = (v0 == null || !Number.isFinite(v0)) ? null : v0;

    if (v == null) { rainAcc.push(null); continue; }
    if (prev == null) { prev = v; rainAcc.push(0); continue; }

    const dv = v - prev;
    if (dv > 0.05) acc += dv;
    prev = v;
    rainAcc.push(Number(acc.toFixed(3)));
  }

  const { min: vMin, max: vMax } = minMax(temp);
  const dayTxt = fmtDayLong(dayKey);

  if ($("chartTempTitle")) $("chartTempTitle").textContent = `Temperatura (°C) · ${dayTxt}`;
  if ($("chartHumTitle"))  $("chartHumTitle").textContent  = `Humitat (%) · ${dayTxt}`;
  if ($("chartWindTitle")) $("chartWindTitle").textContent = `Vent i ratxa (km/h) · ${dayTxt}`;
  if ($("chartRainTitle")) $("chartRainTitle").textContent = `Pluja acumulada (mm) · ${dayTxt}`;

  const dayLabel = $("dayLabel");
  if (dayLabel) dayLabel.textContent = rDay.length ? dayTxt : `${dayTxt} · sense dades`;

  // destroy previs
  try { window.__chartTemp?.destroy?.(); } catch {}
  try { window.__chartHum?.destroy?.(); } catch {}
  try { window.__chartWind?.destroy?.(); } catch {}
  try { window.__chartRain?.destroy?.(); } catch {}

  window.__chartTemp = window.__chartHum = window.__chartWind = window.__chartRain = null;

  if (typeof window.Chart === "undefined") return;

  // ---- tooltips ----
  function tooltipMainTempOnly(unit) {
    return {
      displayColors: false,
      filter: (item) => item.datasetIndex === 0,
      callbacks: {
        title: (items) => {
          const idx = items?.[0]?.dataIndex;
          const ts = (idx == null) ? null : rDay[idx]?.ts;
          return ts ? fmtTimeWithH(ts) : "";
        },
        label: (ctx) => {
          const v = ctx.parsed?.y;
          if (v == null) return "—";
          return `${Number(v).toFixed(1)} ${unit}`;
        }
      }
    };
  }

  function commonTooltip(unit, nameFormatter, rowsRef) {
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
          const label = (typeof nameFormatter === "function")
            ? nameFormatter(ctx)
            : (ctx.dataset?.label || "");
          const prefix = label ? `${label}: ` : "";
          return `${prefix}${Number(v).toFixed(1)} ${unit}`;
        }
      }
    };
  }

  // ---- base chart config (nitidesa + ticks) ----
  const dpr = Math.min(2, (window.devicePixelRatio || 1));
  const commonBase = {
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

  // =========================
  // Temperatura
  // =========================
  const tempCanvas = $("chartTemp");
  if (tempCanvas) {
    window.__chartTemp = new Chart(tempCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "", data: temp, tension: 0.25, pointRadius: 1, pointHoverRadius: 5, pointHitRadius: 10, borderWidth: 1.6, fill: false },
          ...(vMin == null ? [] : [{
            label: "Mín",
            data: labels.map(() => vMin),
            tension: 0,
            pointRadius: 0,
            borderWidth: 1,
            borderDash: [4, 4],
            fill: false
          }]),
          ...(vMax == null ? [] : [{
            label: "Màx",
            data: labels.map(() => vMax),
            tension: 0,
            pointRadius: 0,
            borderWidth: 1,
            borderDash: [4, 4],
            fill: false
          }]),
        ]
      },
      options: { ...commonBase, plugins: { legend: { display: false }, tooltip: tooltipMainTempOnly("°C") } }
    });
  }

  // =========================
  // Humitat
  // =========================
  const humCanvas = $("chartHum");
  if (humCanvas) {
    window.__chartHum = new Chart(humCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "", data: hum, tension: 0.25, pointRadius: 1, pointHoverRadius: 5, pointHitRadius: 10, borderWidth: 1.6, fill: false }
        ]
      },
      options: {
        ...commonBase,
        scales: { ...commonBase.scales, y: { min: 0, max: 100 } },
        plugins: { legend: { display: false }, tooltip: commonTooltip("%", null, rDay) }
      }
    });
  }

  // =========================
  // Vent / Ratxa (lite en mòbil)
  // =========================
  const windCanvas = $("chartWind");
  if (windCanvas) {
    const lite = isMobileLite(rDay.length);

    const W = lite
      ? decimateWindGustBuckets(rDay, 30, start)
      : { rows: rDay, labels, wind: windFull, gust: gustFull };

    window.__chartWind = new Chart(windCanvas, {
      type: "line",
      data: {
        labels: W.labels,
        datasets: [
          { label: "Ratxa màxima", data: W.gust, tension: 0.25, pointRadius: 1, pointHoverRadius: 5, pointHitRadius: 10, borderWidth: 1.4, borderDash: [6, 4], fill: false },
          { label: "Vent mitjà",   data: W.wind, tension: 0.25, pointRadius: 1, pointHoverRadius: 5, pointHitRadius: 10, borderWidth: 1.8, fill: false }
        ]
      },
      options: {
        ...commonBase,
        plugins: {
          legend: { display: true },
          tooltip: commonTooltip("km/h", (ctx) => ctx.dataset?.label || "", W.rows)
        }
      }
    });
  }

  // =========================
  // Pluja acumulada
  // =========================
  const rainCanvas = $("chartRain");
  const rainMsgEl = $("rainMsg");

  const hasRainSensorData = rainAcc.some(v => v != null && Number.isFinite(v));
  const lastRain = (() => {
    for (let i = rainAcc.length - 1; i >= 0; i--) {
      if (rainAcc[i] != null && Number.isFinite(rainAcc[i])) return Number(rainAcc[i]);
    }
    return null;
  })();

  const hasAnyRain = (hasRainSensorData && lastRain != null && lastRain > 0);

  if (!rDay.length) {
    if (rainCanvas) rainCanvas.style.display = "none";
    if (rainMsgEl) { rainMsgEl.textContent = ""; rainMsgEl.style.display = "none"; }
  } else if (!hasRainSensorData) {
    if (rainCanvas) rainCanvas.style.display = "none";
    if (rainMsgEl) { rainMsgEl.textContent = "Sense dades de precipitació per al dia seleccionat."; rainMsgEl.style.display = "block"; }
  } else if (!hasAnyRain) {
    if (rainCanvas) rainCanvas.style.display = "none";
    if (rainMsgEl) { rainMsgEl.textContent = "Sense precipitació registrada"; rainMsgEl.style.display = "block"; }
  } else {
    if (rainCanvas) rainCanvas.style.display = "block";
    if (rainMsgEl) { rainMsgEl.textContent = ""; rainMsgEl.style.display = "none"; }

    const yMax = Math.max(1, lastRain * 1.2);

    window.__chartRain = new Chart(rainCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Pluja acumulada",
          data: rainAcc,
          tension: 0,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointHitRadius: 10,
          borderWidth: 1.6,
          fill: true,
          stepped: true
        }]
      },
      options: {
        ...commonBase,
        scales: { ...commonBase.scales, y: { min: 0, suggestedMax: yMax } },
        plugins: { legend: { display: false }, tooltip: commonTooltip("mm", null, rDay) }
      }
    });
  }
}
