(() => {
  // Detecta automàticament si estàs servint sota /MeteoCandela/
  const BASE = (location.pathname.includes("/MeteoCandela/")) ? "/MeteoCandela" : "";

  const HISTORY_URL   = `${BASE}/data/history.json`;
  const CURRENT_URL   = `${BASE}/data/current.json`;          // temps real
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
    return new Intl.DateTimeFormat("ca-ES", {
      hour: "2-digit", minute: "2-digit"
    }).format(d);
  }

  function fmtDayLong(dayKey) {
    // dayKey = YYYY-MM-DD
    const [y, m, d] = dayKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("ca-ES", {
      weekday: "long", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(dt);
  }

  // ===== utilitats de dia (hora local) =====
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
  // =========================================

  // Converteix graus a nom de vent en català (8 sectors) amb Garbí
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
    // TEMPERATURA (prioritza temp_c)
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

    // VENT (prioritza km/h)
    let windKmh = (r.wind_kmh ?? null);
    if (windKmh === null || windKmh === undefined) {
      if (r.wind_mph != null) windKmh = mphToKmh(Number(r.wind_mph));
      else if (r.wind_speed != null) windKmh = Number(r.wind_speed);
    }

    // RATXA (prioritza km/h)
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

  // ===== FIX Chart.js en mòbil (evita canvas blanc) =====
  function fixChartsMobile() {
    // Alguns navegadors (Android) creen charts quan el contenidor encara no té layout final.
    // Fem resize/update després d’un parell de ticks del render.
    const doFix = () => {
      const charts = [window.__chartTemp, window.__chartHum, window.__chartWind].filter(Boolean);
      for (const c of charts) {
        try {
          c.resize();
          c.update();
        } catch {}
      }
    };

    // 1) després del proper frame
    requestAnimationFrame(() => {
      doFix();
      // 2) i també amb una mica de retard (clau a Android)
      setTimeout(doFix, 200);
    });
  }
  // ===========================================

  // ===== Charts =====
  function buildChartsForDay(allRows, dayKey) {
    const { start, end } = startEndMsFromDayKey(dayKey);
    const rDay = allRows.filter(r => r.ts >= start && r.ts <= end);

    // Labels i sèries
    const labels = rDay.map(r => fmtTime(r.ts));
    const temp = rDay.map(r => r.temp_c);
    const hum  = rDay.map(r => r.hum_pct);
    const wind = rDay.map(r => r.wind_kmh);
    const gust = rDay.map(r => r.gust_kmh);

    // Títols amb data (sense “24h”)
    const dayTxt = fmtDayLong(dayKey);
    if ($("chartTempTitle")) $("chartTempTitle").textContent = `Temperatura · ${dayTxt}`;
    if ($("chartHumTitle"))  $("chartHumTitle").textContent  = `Humitat · ${dayTxt}`;
    if ($("chartWindTitle")) $("chartWindTitle").textContent = `Vent i ratxa · ${dayTxt}`;

    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          callbacks: {
            title: () => "",
            label: (ctx) => {
              const v = ctx.parsed?.y;
              if (v == null) return "—";
              const unit = ctx.dataset?.__unit || "";
              const prefix = ctx.dataset?.__prefix || "";
              return `${prefix}${Number(v).toFixed(1)}${unit ? ` ${unit}` : ""}`;
            }
          }
        }
      },
      scales: { x: { type: "category", ticks: { maxTicksLimit: 10 } } }
    };

    // Destroy abans de recrear
    if (window.__chartTemp) window.__chartTemp.destroy();
    if (window.__chartHum) window.__chartHum.destroy();
    if (window.__chartWind) window.__chartWind.destroy();

    window.__chartTemp = new Chart($("chartTemp"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: temp, __unit: "°C", __prefix: "",
          tension: 0.25, pointRadius: 2, pointHoverRadius: 7, pointHitRadius: 12,
          borderWidth: 2, fill: false
        }]
      },
      options: commonOpts
    });

    window.__chartHum = new Chart($("chartHum"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: hum, __unit: "%", __prefix: "",
          tension: 0.25, pointRadius: 2, pointHoverRadius: 7, pointHitRadius: 12,
          borderWidth: 2, fill: false
        }]
      },
      options: { ...commonOpts, scales: { ...commonOpts.scales, y: { min: 0, max: 100 } } }
    });

    const windCanvas = $("chartWind");
    if (windCanvas) {
      window.__chartWind = new Chart(windCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            // ordre per tooltip: primer Ratxa, després Vent
            {
              label: "ratxa",
              data: gust,
              __unit: "km/h",
              __prefix: "Ratxa: ",
              tension: 0.25,
              pointRadius: 2,
              pointHoverRadius: 6,
              pointHitRadius: 12,
              borderWidth: 2,
              borderDash: [6, 4],
              fill: false
            },
            {
              label: "vent",
              data: wind,
              __unit: "km/h",
              __prefix: "Vent: ",
              tension: 0.25,
              pointRadius: 2,
              pointHoverRadius: 6,
              pointHitRadius: 12,
              borderWidth: 2.5,
              fill: true
            }
          ]
        },
        options: commonOpts
      });
    }

    // Si no hi ha punts aquell dia, avisa (sense trencar res)
    const dayLabel = $("dayLabel");
    if (dayLabel) {
      if (rDay.length) {
        dayLabel.textContent = `${dayTxt} · ${rDay.length} punts`;
      } else {
        dayLabel.textContent = `${dayTxt} · sense dades`;
      }
    }

    // ✅ FIX: força resize/update després de crear (evita canvas blanc a mòbil)
    fixChartsMobile();
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

    // mín/màx avui a partir de history (i si cal inclou current al càlcul)
    const elMinMax = $("tempMinMax");
    if (elMinMax && Array.isArray(historyRows) && historyRows.length) {
      const todayKey = dayKeyFromTs(Date.now());
      const { start, end } = startEndMsFromDayKey(todayKey);

      const todayRows = historyRows
        .filter(r => r.ts >= start && r.ts <= end)
        .slice();

      // afegeix current si és d’avui i és més nou
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

    // direcció vent
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

  // ===== Selector de dia =====
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

    // assegura que “avui” hi sigui (si només tens current i history va endarrerit)
    const todayKey = dayKeyFromTs(Date.now());
    set.add(todayKey);

    // si current és d’un altre dia (poc probable) també
    if (current && Number.isFinite(current.ts)) set.add(dayKeyFromTs(current.ts));

    return Array.from(set).sort(); // asc
  }

  function labelForDay(dayKey) {
    const today = dayKeyFromTs(Date.now());
    const yesterday = dayKeyFromTs(Date.now() - 24*60*60*1000);

    if (dayKey === today) return `Avui (${dayKey.split("-").reverse().join("/")})`;
    if (dayKey === yesterday) return `Ahir (${dayKey.split("-").reverse().join("/")})`;
    return dayKey.split("-").reverse().join("/");
  }

  function setupDaySelector(dayKeys, initialKey, onChange) {
    const sel = $("daySelect");
    const prev = $("dayPrev");
    const next = $("dayNext");

    if (!sel) return;

    sel.innerHTML = "";
    for (const k of dayKeys) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = labelForDay(k);
      sel.appendChild(opt);
    }

    const idx0 = Math.max(0, dayKeys.indexOf(initialKey));
    sel.value = dayKeys[idx0] || dayKeys[dayKeys.length - 1];

    function currentIndex() {
      return dayKeys.indexOf(sel.value);
    }

    function updateButtons() {
      const i = currentIndex();
      if (prev) prev.disabled = (i <= 0);
      if (next) next.disabled = (i >= dayKeys.length - 1);
    }

    sel.addEventListener("change", () => {
      updateButtons();
      setUrlDayParam(sel.value);
      onChange(sel.value);
    });

    if (prev) prev.addEventListener("click", () => {
      const i = currentIndex();
      if (i > 0) {
        sel.value = dayKeys[i - 1];
        sel.dispatchEvent(new Event("change"));
      }
    });

    if (next) next.addEventListener("click", () => {
      const i = currentIndex();
      if (i < dayKeys.length - 1) {
        sel.value = dayKeys[i + 1];
        sel.dispatchEvent(new Event("change"));
      }
    });

    updateButtons();
    return sel.value;
  }

  // ===== Main =====
  async function main() {
    if ($("year")) $("year").textContent = String(new Date().getFullYear());

    // Re-fix en casos típics de mòbil (back/forward cache, gir de pantalla)
    window.addEventListener("orientationchange", () => fixChartsMobile());
    window.addEventListener("pageshow", () => fixChartsMobile());

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

    // 4) “Actual” sempre: preferim current, si falla fem fallback a últim history
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

    // 5) Rows per gràfiques: history + (si és avui i és més nou) current
    const rowsForCharts = historyRows.slice();
    if (current && Number.isFinite(current.ts)) {
      const lastHistTs = rowsForCharts.length ? rowsForCharts[rowsForCharts.length - 1].ts : null;
      if (!lastHistTs || current.ts > lastHistTs) rowsForCharts.push(current);
    }

    // Dedupe per ts i ordena
    const byTs = new Map();
    for (const r of rowsForCharts) byTs.set(r.ts, r);
    const mergedCharts = Array.from(byTs.values()).sort((a, b) => a.ts - b.ts);

    // 6) Selector de dies
    const dayKeys = buildDayListFromRows(mergedCharts, current);
    const todayKey = dayKeyFromTs(Date.now());
    const initial = getUrlDayParam() || todayKey;

    const selected = setupDaySelector(dayKeys, initial, (dayKey) => {
      buildChartsForDay(mergedCharts, dayKey);
      // ✅ extra: torna a forçar el fix al canvi de dia (mòbil)
      fixChartsMobile();
    });

    // primera render
    if (selected) {
      buildChartsForDay(mergedCharts, selected);
      fixChartsMobile();
    }
  }

  main().catch(err => {
    console.error(err);
    if ($("lastUpdated")) $("lastUpdated").textContent = "Error carregant dades.";
    if ($("statusLine")) $("statusLine").textContent = String(err);
    setSourceLine("Origen: error");
  });
})();
