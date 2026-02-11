// lib/charts_day.js
import { $ } from "./dom.js";
import { fmtDayLong, fmtTime, fmtTimeWithH, minMax, startEndMsFromDayKey } from "./format.js";

export function buildChartsForDay(allRows, dayKey, currentMaybe) {
  const { start, end } = startEndMsFromDayKey(dayKey);

  const rDay = allRows.filter(r => r.ts >= start && r.ts <= end).slice();

  if (currentMaybe && Number.isFinite(currentMaybe.ts) && currentMaybe.ts >= start && currentMaybe.ts <= end) {
    const lastTs = rDay.length ? rDay[rDay.length - 1].ts : null;
    if (!lastTs || currentMaybe.ts > lastTs) rDay.push(currentMaybe);
  }

  const labels = rDay.map(r => fmtTime(r.ts));
  const temp = rDay.map(r => (Number.isFinite(Number(r.temp_c)) ? Number(r.temp_c) : null));
  const hum  = rDay.map(r => (Number.isFinite(Number(r.hum_pct)) ? Number(r.hum_pct) : null));
  const wind = rDay.map(r => (Number.isFinite(Number(r.wind_kmh)) ? Number(r.wind_kmh) : null));
  const gust = rDay.map(r => (Number.isFinite(Number(r.gust_kmh)) ? Number(r.gust_kmh) : null));

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
  if (window.__chartTemp) window.__chartTemp.destroy();
  if (window.__chartHum)  window.__chartHum.destroy();
  if (window.__chartWind) window.__chartWind.destroy();
  if (window.__chartRain) window.__chartRain.destroy();

  window.__chartTemp = window.__chartHum = window.__chartWind = window.__chartRain = null;

  if (typeof window.Chart === "undefined") return;

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

  function commonTooltip(unit, nameFormatter) {
    return {
      displayColors: false,
      callbacks: {
        title: (items) => {
          const idx = items?.[0]?.dataIndex;
          const ts = (idx == null) ? null : rDay[idx]?.ts;
          return ts ? fmtTimeWithH(ts) : "";
        },
        label: (ctx) => {
          const v = ctx.parsed?.y;
          if (v == null) return "—";
          const label = (typeof nameFormatter === "function")
            ? nameFormatter(ctx)
            : (ctx.dataset?.label || "");
          const prefix = label ? `${label}: ` : "";
          return `${prefix}${Number(v).toFixed(2)} ${unit}`;
        }
      }
    };
  }

  const commonBase = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: false, axis: "x" },
    scales: { x: { type: "category", ticks: { maxTicksLimit: 10 } } }
  };

  const tempCanvas = $("chartTemp");
  if (tempCanvas) {
    window.__chartTemp = new Chart(tempCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "", data: temp, tension: 0.25, pointRadius: 2, pointHoverRadius: 7, pointHitRadius: 12, borderWidth: 2, fill: false },
          ...(vMin == null ? [] : [{ label: "Mín", data: labels.map(() => vMin), tension: 0, pointRadius: 0, borderWidth: 1.5, borderDash: [4, 4], fill: false }]),
          ...(vMax == null ? [] : [{ label: "Màx", data: labels.map(() => vMax), tension: 0, pointRadius: 0, borderWidth: 1.5, borderDash: [4, 4], fill: false }]),
        ]
      },
      options: { ...commonBase, plugins: { legend: { display: false }, tooltip: tooltipMainTempOnly("°C") } }
    });
  }

  const humCanvas = $("chartHum");
  if (humCanvas) {
    window.__chartHum = new Chart(humCanvas, {
      type: "line",
      data: { labels, datasets: [{ data: hum, tension: 0.25, pointRadius: 2, pointHoverRadius: 7, pointHitRadius: 12, borderWidth: 2, fill: false }] },
      options: { ...commonBase, scales: { ...commonBase.scales, y: { min: 0, max: 100 } }, plugins: { legend: { display: false }, tooltip: commonTooltip("%") } }
    });
  }

  const windCanvas = $("chartWind");
  if (windCanvas) {
    window.__chartWind = new Chart(windCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Ratxa màxima", data: gust, tension: 0.25, pointRadius: 2, pointHoverRadius: 6, pointHitRadius: 12, borderWidth: 2, borderDash: [6, 4], fill: false },
          { label: "Vent mitjà", data: wind, tension: 0.25, pointRadius: 2, pointHoverRadius: 6, pointHitRadius: 12, borderWidth: 2.5, fill: true }
        ]
      },
      options: { ...commonBase, plugins: { legend: { display: true }, tooltip: commonTooltip("km/h", (ctx) => ctx.dataset?.label || "") } }
    });
  }

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
          pointRadius: 2,
          pointHoverRadius: 6,
          pointHitRadius: 12,
          borderWidth: 2,
          fill: true,
          stepped: true
        }]
      },
      options: {
        ...commonBase,
        scales: { ...commonBase.scales, y: { min: 0, suggestedMax: yMax } },
        plugins: { legend: { display: false }, tooltip: commonTooltip("mm") }
      }
    });
  }
}
