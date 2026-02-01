(() => {
  const BASE = (location.pathname.includes("/MeteoCandela/")) ? "/MeteoCandela" : "";

  const HISTORY_URL   = `${BASE}/data/history.json`;
  const CURRENT_URL   = `${BASE}/data/current.json`;
  const HEARTBEAT_URL = `${BASE}/heartbeat/heartbeat.json`;

  const $ = (id) => document.getElementById(id);

  function fToC(f) { return (f - 32) * 5 / 9; }
  function mphToKmh(mph) { return mph * 1.609344; }

  function fmt1(x) {
    if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
    return Number(x).toFixed(1);
  }

  function fmtDate(tsMs) {
    const d = new Date(tsMs);
    return new Intl.DateTimeFormat("ca-ES", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).format(d);
  }

  function fmtTime(tsMs) {
    const d = new Date(tsMs);
    return new Intl.DateTimeFormat("ca-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
  }

  function fmtTimeWithH(tsMs) {
    return `${fmtTime(tsMs)} h`;
  }

  function fmtDayLong(dayKey) {
    const [y, m, d] = dayKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("ca-ES", {
      weekday: "long", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(dt);
  }

  function dayKeyFromTs(tsMs) {
    const d = new Date(tsMs);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  function startEndMsFromDayKey(dayKey) {
    const [y, m, d] = dayKey.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    const end   = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    return { start, end };
  }

  function minMax(values) {
    const v = values
      .filter(x => x != null && Number.isFinite(Number(x)))
      .map(Number);
    if (!v.length) return { min: null, max: null };
    return { min: Math.min(...v), max: Math.max(...v) };
  }

  function degToWindCatalan(deg) {
    if (deg == null || Number.isNaN(Number(deg))) return "—";
    const d = ((Number(deg) % 360) + 360) % 360;

    if (d >= 337.5 || d < 22.5)   return "N – Tramuntana";
    if (d >= 22.5  && d < 67.5)   return "NE – Gregal";
    if (d >= 67.5  && d < 112.5)  return "E – Llevant";
    if (d >= 112.5 && d < 157.5)  return "SE – Xaloc";
    if (d >= 157.5 && d < 202.5)  return "S – Migjorn";
    if (d >= 202.5 && d < 247.5)  return "SW – Garbí";
    if (d >= 247.5 && d < 292.5)  return "W – Ponent";
    if (d >= 292.5 && d < 337.5)  return "NW – Mestral";

    return "—";
  }

  function normalizeRow(r) {
    // TEMPERATURA
    let tempC = (r.temp_c ?? null);
    if (tempC === null || tempC === undefined) {
      if (r.temp_f != null) tempC = fToC(Number(r.temp_f));
      else if (r.temperature != null) {
        const t = Number(r.temperature);
        tempC = (t >= 80) ? fToC(t) : t;
      }
    }

    // ROSADA
    let dewC = (r.dew_c ?? null);
    if (dewC === null || dewC === undefined) {
      if (r.dew_f != null) dewC = fToC(Number(r.dew_f));
    }

    // VENT
    let windKmh = (r.wind_kmh ?? null);
    if (windKmh === null || windKmh === undefined) {
      if (r.wind_mph != null) windKmh = mphToKmh(Number(r.wind_mph));
      else if (r.wind_speed != null) windKmh = Number(r.wind_speed);
    }

    // RATXA
    let gustKmh = (r.gust_kmh ?? null);
    if (gustKmh === null || gustKmh === undefined) {
      if (r.gust_mph != null) gustKmh = mphToKmh(Number(r.gust_mph));
      else if (r.wind_gust != null) gustKmh = Number(r.wind_gust);
    }

    // PLUJA
    const rainDay  = (r.rain_day_mm ?? r.rain_day ?? null);
    const rainRate = (r.rain_rate_mmh ?? r.rain_rate ?? null);

    return {
      ts: Number(r.ts),
      temp_c: tempC != null ? Number(tempC) : null,
      hum_pct: r.hum_pct != null ? Number(r.hum_pct) : null,
      dew_c: dewC != null ? Number(dewC) : null,
      wind_kmh: windKmh != null ? Number(windKmh) : null,
      gust_kmh: gustKmh != null ? Number(gustKmh) : null,
      wind_dir: (r.wind_dir ?? r.wind_direction ?? null),
      rain_day_mm: rainDay != null ? Number(rainDay) : 0,
      rain_rate_mmh: rainRate != null ? Number(rainRate) : 0,
    };
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
    return await res.json();
  }

  function setSourceLine(txt) {
    const el = $("sourceLine");
    if (el) el.textContent = txt;
  }

  function renderCurrent(current, historyRows) {
    $("temp").textContent = current.temp_c == null ? "—" : fmt1(current.temp_c);
    $("hum").textContent  = current.hum_pct == null ? "—" : String(Math.round(current.hum_pct));
    $("wind").textContent = current.wind_kmh == null ? "—" : fmt1(current.wind_kmh);
    $("rainDay").textContent = current.rain_day_mm == null ? "—" : fmt1(current.rain_day_mm);

    if ($("tempSub")) {
      $("tempSub").textContent =
        current.dew_c == null ? "Punt de rosada: —" : `Punt de rosada: ${fmt1(current.dew_c)} °C`;
    }

    const elMinMax = $("tempMinMax");
    if (elMinMax && Array.isArray(historyRows) && historyRows.length) {
      const todayKey = dayKeyFromTs(Date.now());
      const { start, end } = startEndMsFromDayKey(todayKey);

      const todayRows = historyRows
        .filter(r => r.ts >= start && r.ts <= end)
        .slice();

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

    $("lastUpdated").textContent = `Actualitzat: ${fmtDate(current.ts)}`;
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
    for (const r of rows) set.add(dayKeyFromTs(r.ts));
    set.add(dayKeyFromTs(Date.now()));
    if (current && Number.isFinite(current.ts)) set.add(dayKeyFromTs(current.ts));
    return Array.from(set).sort();
  }

  function labelForDay(dayKey) {
    const today = dayKeyFromTs(Date.now());
    const yesterday = dayKeyFromTs(Date.now() - 24*60*60*1000);

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

    const idx0 = Math.max(0, dayKeys.indexOf(initialKey));
    sel.value = dayKeys[idx0] || dayKeys[dayKeys.length - 1];

    function currentIndex() { return dayKeys.indexOf(sel.value); }
    function updateButtons() {
      const i = currentIndex();
      prev.disabled = (i <= 0);
      next.disabled = (i >= dayKeys.length - 1);
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
      if (i < dayKeys.length - 1) { sel.value = dayKeys[i + 1]; sel.dispatchEvent(new Event("change")); }
    });

    updateButtons();
    return sel.value;
  }

  // ===== Charts =====
  function buildChartsForDay(allRows, dayKey) {
    const { start, end } = startEndMsFromDayKey(dayKey);
    const rDay = allRows.filter(r => r.ts >= start && r.ts <= end);

    const labels = rDay.map(r => fmtTime(r.ts));

    const temp = rDay.map(r => (Number.isFinite(Number(r.temp_c)) ? Number(r.temp_c) : null));
    const hum  = rDay.map(r => r.hum_pct);
    const wind = rDay.map(r => r.wind_kmh);
    const gust = rDay.map(r => r.gust_kmh);

    // Mín/Màx reals del dia
    const { min: vMin, max: vMax } = minMax(temp);

    const dayTxt = fmtDayLong(dayKey);

    if ($("chartTempTitle")) $("chartTempTitle").textContent = `Temperatura (°C) · ${dayTxt}`;
    if ($("chartHumTitle"))  $("chartHumTitle").textContent  = `Humitat (%) · ${dayTxt}`;
    if ($("chartWindTitle")) $("chartWindTitle").textContent = `Vent i ratxa (km/h) · ${dayTxt}`;

    const dayLabel = $("dayLabel");
    if (dayLabel) dayLabel.textContent = rDay.length ? dayTxt : `${dayTxt} · sense dades`;

    if (window.__chartTemp) window.__chartTemp.destroy();
    if (window.__chartHum) window.__chartHum.destroy();
    if (window.__chartWind) window.__chartWind.destroy();

    if (typeof window.Chart === "undefined") return;

    function commonTooltip(unit) {
      return {
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex;
            if (idx == null) return "";
            const ts = rDay[idx]?.ts;
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

    const commonBase = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      scales: { x: { type: "category", ticks: { maxTicksLimit: 10 } } }
    };

    // ===== TEMP (net): tooltip només de la sèrie principal =====
    window.__chartTemp = new Chart($("chartTemp"), {
      type: "line",
      data: {
        labels,
        datasets: [
          // Sèrie principal
          {
            label: "Temperatura",
            data: temp,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 7,
            pointHitRadius: 12,
            borderWidth: 2,
            fill: false
          },

          // Línia MÍN
          ...(vMin == null ? [] : [{
            label: "Mín",
            data: labels.map(() => vMin),
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4],
            fill: false
          }]),

          // Línia MÀX
          ...(vMax == null ? [] : [{
            label: "Màx",
            data: labels.map(() => vMax),
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4],
            fill: false
          }]),
        ]
      },
      options: {
        ...commonBase,
        plugins: {
          legend: { display: false },
          tooltip: commonTooltip("°C")
        }
      },
      plugins: [
        // Filtra tooltip perquè només agafi el dataset 0 (Temperatura)
        {
          id: "tempTooltipOnlyMain",
          beforeInit(chart) {
            const tt = chart.options?.plugins?.tooltip;
            if (!tt) return;
            const prevFilter = tt.filter;
            tt.filter = (item) => {
              const ok = (item.datasetIndex === 0);
              return prevFilter ? (ok && prevFilter(item)) : ok;
            };
          }
        },
        // Etiquetes Mín/Màx a la dreta
        {
          id: "minMaxLabels",
          afterDatasetsDraw(chart) {
            if (vMin == null && vMax == null) return;

            const { ctx, chartArea } = chart;
            const yScale = chart.scales?.y;
            if (!yScale) return;

            ctx.save();
ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
ctx.textAlign = "right";
ctx.textBaseline = "middle";

// ✅ millor contrast en fons fosc
ctx.fillStyle = "rgba(255,255,255,0.85)";
ctx.strokeStyle = "rgba(0,0,0,0.55)";
ctx.lineWidth = 3;

            const xRight = chartArea.right - 6;

            if (vMax != null) {
              const yMax = yScale.getPixelForValue(vMax);
              const tMax = `Màx ${Number(vMax).toFixed(1)} °C`;
ctx.strokeText(tMax, xRight, yMax);
ctx.fillText(tMax, xRight, yMax);
            }

            if (vMin != null) {
              const yMin = yScale.getPixelForValue(vMin);
              const tMin = `Mín ${Number(vMin).toFixed(1)} °C`;
ctx.strokeText(tMin, xRight, yMin);
ctx.fillText(tMin, xRight, yMin);
            }

            ctx.restore();
          }
        }
      ]
    });

    // HUM
    window.__chartHum = new Chart($("chartHum"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: hum,
          tension: 0.25,
          pointRadius: 2,
          pointHoverRadius: 7,
          pointHitRadius: 12,
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        ...commonBase,
        scales: { ...commonBase.scales, y: { min: 0, max: 100 } },
        plugins: { legend: { display: false }, tooltip: commonTooltip("%") }
      }
    });

    // WIND + GUST
    window.__chartWind = new Chart($("chartWind"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Ratxa màxima",
            data: gust,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointHitRadius: 12,
            borderWidth: 2,
            borderDash: [6, 4],
            fill: false
          },
          {
            label: "Vent mitjà",
            data: wind,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointHitRadius: 12,
            borderWidth: 2.5,
            fill: true
          }
        ]
      },
      options: {
        ...commonBase,
        plugins: {
          legend: { display: true },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: (items) => {
                const idx = items?.[0]?.dataIndex;
                if (idx == null) return "";
                const ts = rDay[idx]?.ts;
                return ts ? fmtTimeWithH(ts) : "";
              },
              label: (ctx) => {
                const v = ctx.parsed?.y;
                if (v == null) return "—";
                const name = (ctx.dataset?.label || "").trim();
                const prefix = name ? `${name}: ` : "";
                return `${prefix}${Number(v).toFixed(1)} km/h`;
              }
            }
          }
        }
      }
    });
  }

  // ===== Main =====
  async function main() {
    if ($("year")) $("year").textContent = String(new Date().getFullYear());

    // 1) HISTORY
    let rawHist = [];
    try {
      const h = await fetchJson(`${HISTORY_URL}?t=${Date.now()}`);
      rawHist = Array.isArray(h) ? h : [];
    } catch {
      rawHist = [];
    }

    const historyRows = rawHist
      .map(normalizeRow)
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => a.ts - b.ts);

    // 2) CURRENT
    let current = null;
    try {
      const c = await fetchJson(`${CURRENT_URL}?t=${Date.now()}`);
      if (c && typeof c === "object") {
        const cc = normalizeRow(c);
        if (Number.isFinite(cc.ts)) current = cc;
      }
    } catch {
      current = null;
    }

    // 3) HEARTBEAT
    let hb = null;
    try { hb = await fetchJson(`${HEARTBEAT_URL}?t=${Date.now()}`); } catch {}

    // 4) Actual
    let actualRow = null;
    let sourceTag = "històric";

    if (current) {
      actualRow = current;
      sourceTag = "dades en temps real";
    } else if (historyRows.length) {
      actualRow = historyRows[historyRows.length - 1];
      sourceTag = "últim registre disponible";
    }

    if (actualRow) {
      renderCurrent(actualRow, historyRows);
      renderStatus(actualRow.ts, hb);
      setSourceLine(`Origen: ${sourceTag}`);
    } else {
      if ($("lastUpdated")) $("lastUpdated").textContent = "Sense dades.";
      setSourceLine("Origen: —");
      renderStatus(null, hb);
    }

    // 5) Merge per charts
    const rowsForCharts = historyRows.slice();
    if (current && Number.isFinite(current.ts)) {
      const lastHistTs = rowsForCharts.length ? rowsForCharts[rowsForCharts.length - 1].ts : null;
      if (!lastHistTs || current.ts > lastHistTs) rowsForCharts.push(current);
    }

    const byTs = new Map();
    for (const r of rowsForCharts) byTs.set(r.ts, r);
    const mergedCharts = Array.from(byTs.values()).sort((a, b) => a.ts - b.ts);

    // 6) Selector dies
    const dayKeys = buildDayListFromRows(mergedCharts, current);
    const todayKey = dayKeyFromTs(Date.now());
    const initial = getUrlDayParam() || todayKey;

    const selected = setupDaySelector(dayKeys, initial, (dayKey) => {
      buildChartsForDay(mergedCharts, dayKey);
    });

    if (selected) buildChartsForDay(mergedCharts, selected);
    else buildChartsForDay(mergedCharts, initial);
  }

  main().catch(err => {
    console.error(err);
    if ($("lastUpdated")) $("lastUpdated").textContent = "Error carregant dades.";
    if ($("statusLine")) $("statusLine").textContent = String(err);
    setSourceLine("Origen: error");
  });
})();
