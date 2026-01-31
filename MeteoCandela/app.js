const HISTORY_URL = "data/history.json";
let chartTemp, chartHum;

function degToCardinal(deg){
  const d = Number(deg);
  if (!Number.isFinite(d)) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(d/22.5) % 16];
}

async function loadHistory(){
  const res = await fetch(`${HISTORY_URL}?t=${Date.now()}`);
  return await res.json();
}

function renderCurrent(last){
  document.getElementById("temp").textContent = last.temp_c ?? "—";
  document.getElementById("hum").textContent = last.hum_pct ?? "—";
  document.getElementById("wind").textContent = last.wind_kmh ?? "—";
  document.getElementById("rainDay").textContent = last.rain_day_mm ?? "0.0";

  document.getElementById("lastUpdated").textContent =
    "Actualitzat: " + new Date(last.ts).toLocaleTimeString("ca-ES");
}

async function refresh(){
  const history = await loadHistory();
  if (!history.length) return;

  const last = history.at(-1);
  renderCurrent(last);
}

refresh();
setInterval(refresh, 60000);
