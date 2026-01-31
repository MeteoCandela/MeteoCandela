const HISTORY_URL = "data/history.json";
const REFRESH_MS = 60_000;

let chartTemp = null;
let chartHum = null;

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function fmt(x, d = 1) {
  const n = num(x);
  return n === null ? "—" : n.toFixed(d);
}

function degToDir(deg) {
  const d = num(deg);
  if (d === null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(d / 22.5) % 16];
}

async function loadHistory() {
  const res = await fetch(`${HISTORY_URL}?t=${Date.now()}`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("No history.json");
  return await res.json();
}

function set(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function renderCurrent(p) {
  set("temp", fmt(p.temp_c));
  set("hum", fmt(p.hum_pct, 0));
  set("wind", fmt(p.wind_kmh));
  set("rainDay", fmt(p.rain_day_mm));

  set("tempSub", `Punt de rosada: ${fmt(p.dew_c)} °C`);
  set("dewSub",  `Punt de rosada: ${fmt(p.dew_c)} °C`);

  const gust = p.gust_kmh ? fmt(p.gust_kmh) : "—";
  const dir = degToDir(p.wind_dir);

  set(
    "gustSub",
    `Ratxa: ${gust} km/h · Dir: ${dir} (${p.wind_dir ?? "—"}º)`
  );

  set(
    "rainRateSub",
    `Intensitat: ${fmt(p.rain_rate_mmh)} mm/h`
  );

  const d = new Date(p.ts);
  set("lastUpdated", `Actualitzat: ${d.toLocaleString("ca-ES")}`);
}

function buildChart(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const clean = values.map(v => num(v));
  if (!clean.some(v => v !== null)) return null;

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: clean,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { ticks: { maxTicksLimit: 6 } }
      }
    }
  });
}

function renderCharts(hist) {
  const since = Date.now() - 24 * 60 * 60 * 1000;

  const data = hist.filter(p => p.ts >= since);

  const labels = [];
  const temps = [];
  const hums  = [];

  for (const p of data) {
    if (num(p.temp_c) === null && num(p.hum_pct) === null) continue;

    labels.push(
      new Date(p.ts).toLocaleTimeString("ca-ES", {
        hour: "2-digit",
        minute: "2-digit"
      })
    );

    temps.push(p.temp_c);
    hums.push(p.hum_pct);
  }

  if (chartTemp) chartTemp.destroy();
  if (chartHum) chartHum.destroy();

  chartTemp = buildChart("chartTemp", labels, temps);
  chartHum  = buildChart("chartHum",  labels, hums);
}

async function refresh() {
  try {
    const hist = await loadHistory();
    if (!Array.isArray(hist) || hist.length === 0) return;

    const last = hist[hist.length - 1];
    renderCurrent(last);
    renderCharts(hist);
  } catch (e) {
    console.error(e);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
