(() => {
  const BASE = "/MeteoCandela";
  const HISTORY_URL = `${BASE}/data/history.json`;
  const HEARTBEAT_URL = `${BASE}/heartbeat/heartbeat.json`;

  const $ = (id) => document.getElementById(id);

  function fToC(f){ return (f - 32) * 5/9; }
  function mphToKmh(mph){ return mph * 1.609344; }

  function fmt1(x){
    if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
    return Number(x).toFixed(1);
  }

  function fmtDate(tsMs){
    const d = new Date(tsMs);
    return new Intl.DateTimeFormat("ca-ES", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).format(d);
  }

  function normalizeRow(r){
    // Temperatura
    let tempC = r.temp_c;
    if (tempC === null || tempC === undefined) {
      if (r.temp_f !== undefined && r.temp_f !== null) tempC = fToC(Number(r.temp_f));
      else if (r.temperature !== undefined && r.temperature !== null) {
        // alguns payloads diuen temperature en F
        const t = Number(r.temperature);
        tempC = (t > 60) ? fToC(t) : t; // heurística: >60 probablement °F
      }
    }

    // Rosada
    let dewC = r.dew_c;
    if (dewC === null || dewC === undefined) {
      if (r.dew_f !== undefined && r.dew_f !== null) dewC = fToC(Number(r.dew_f));
    }

    // Vent
    let windKmh = r.wind_kmh;
    if (windKmh === null || windKmh === undefined) {
      if (r.wind_mph !== undefined && r.wind_mph !== null) windKmh = mphToKmh(Number(r.wind_mph));
      else if (r.wind_speed !== undefined && r.wind_speed !== null) windKmh = Number(r.wind_speed); // assumim ja km/h si ve així
    }

    // Ratxa
    let gustKmh = r.gust_kmh;
    if (gustKmh === null || gustKmh === undefined) {
      if (r.gust_mph !== undefined && r.gust_mph !== null) gustKmh = mphToKmh(Number(r.gust_mph));
      else if (r.wind_gust !== undefined && r.wind_gust !== null) gustKmh = Number(r.wind_gust); // assumim km/h si ja ho tens així
    }

    // Pluja
    const rainDay = (r.rain_day_mm ?? r.rain_day ?? r.rain_day_in ?? null);
    const rainRate = (r.rain_rate_mmh ?? r.rain_rate ?? null);

    return {
      ts: Number(r.ts),
      temp_c: tempC !== undefined && tempC !== null ? Number(tempC) : null,
      hum_pct: r.hum_pct !== undefined && r.hum_pct !== null ? Number(r.hum_pct) : null,
      dew_c: dewC !== undefined && dewC !== null ? Number(dewC) : null,
      wind_kmh: windKmh !== undefined && windKmh !== null ? Number(windKmh) : null,
      gust_kmh: gustKmh !== undefined && gustKmh !== null ? Number(gustKmh) : null,
      wind_dir: r.wind_dir ?? r.wind_direction ?? null,
      rain_day_mm: rainDay !== undefined && rainDay !== null ? Number(rainDay) : 0,
      rain_rate_mmh: rainRate !== undefined && rainRate !== null ? Number(rainRate) : 0,
    };
  }

  async function fetchJson(url){
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  }

  function buildCharts(rows){
    const last24hMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const r24 = rows.filter(r => r.ts >= (now - last24hMs));

    const labels = r24.map(r => new Date(r.ts));
    const temp = r24.map(r => r.temp_c);
    const hum = r24.map(r => r.hum_pct);

    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      scales: {
        x: { type: "time", time: { unit: "hour" } },
      },
      plugins: { legend: { display: false } }
    };

    // Chart.js time scale needs adapter in some builds; if et fallés, ho canviem a labels string.
    // Però com que ja et funcionava abans, ho deixo així.

    new Chart($("chartTemp"), {
      type: "line",
      data: {
        labels,
        datasets: [{ data: temp }]
      },
      options: {
        ...commonOpts,
        scales: { ...commonOpts.scales, y: { title: { display: false } } }
      }
    });

    new Chart($("chartHum"), {
      type: "line",
      data: {
        labels,
        datasets: [{ data: hum }]
      },
      options: {
        ...commonOpts,
        scales: { ...commonOpts.scales, y: { min: 0, max: 100 } }
      }
    });
  }

  function renderCurrent(last){
    $("temp").textContent = last.temp_c == null ? "—" : fmt1(last.temp_c);
    $("hum").textContent = last.hum_pct == null ? "—" : String(Math.round(last.hum_pct));
    $("wind").textContent = last.wind_kmh == null ? "—" : fmt1(last.wind_kmh);
    $("rainDay").textContent = last.rain_day_mm == null ? "—" : fmt1(last.rain_day_mm);

    $("tempSub").textContent =
      last.dew_c == null ? "Punt de rosada: —" : `Punt de rosada: ${fmt1(last.dew_c)} °C`;

    const dir = last.wind_dir == null ? "—" : String(last.wind_dir);
    $("gustSub").textContent =
      last.gust_kmh == null ? `Ratxa: — · Dir: ${dir}` : `Ratxa: ${fmt1(last.gust_kmh)} km/h · Dir: ${dir}`;

    $("rainRateSub").textContent =
      last.rain_rate_mmh == null ? "Intensitat: —" : `Intensitat: ${fmt1(last.rain_rate_mmh)} mm/h`;

    $("lastUpdated").textContent = `Actualitzat: ${fmtDate(last.ts)}`;
  }

  function renderStatus(rows, hb){
    const now = Date.now();
    const lastDataTs = rows.length ? rows[rows.length - 1].ts : null;
    const hbTs = hb?.run_ts ? Number(hb.run_ts) : null;

    let msg = "";
    if (!lastDataTs) msg = "Sense dades (history.json buit).";
    else {
      const dataAgeMin = (now - lastDataTs) / 60000;
      const hbAgeMin = hbTs ? (now - hbTs) / 60000 : null;

      msg = `Dada: fa ${Math.round(dataAgeMin)} min`;
      if (hbAgeMin != null) msg += ` · Workflow: fa ${Math.round(hbAgeMin)} min`;

      if (dataAgeMin > 20) msg += " · ⚠️ Dades antigues (possible aturada o límit de GitHub).";
    }
    $("statusLine").textContent = msg;
  }

  async function main(){
    $("year").textContent = String(new Date().getFullYear());

    let raw = await fetchJson(`${HISTORY_URL}?t=${Date.now()}`);
    if (!Array.isArray(raw)) raw = [];

    const rows = raw.map(normalizeRow).filter(r => Number.isFinite(r.ts)).sort((a,b)=>a.ts-b.ts);
    if (rows.length) renderCurrent(rows[rows.length - 1]);

    // heartbeat és opcional
    let hb = null;
    try {
      hb = await fetchJson(`${HEARTBEAT_URL}?t=${Date.now()}`);
    } catch (_) {}

    renderStatus(rows, hb);

    // gràfics
    try { buildCharts(rows); } catch (e) {
      // si mai Chart.js time scale dóna guerra, m’ho dius i el refem amb labels string
      console.warn(e);
    }
  }

  main().catch(err => {
    console.error(err);
    $("lastUpdated").textContent = "Error carregant dades.";
    $("statusLine").textContent = String(err);
  });
})();
