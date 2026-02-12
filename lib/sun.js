// lib/sun.js
import { $ } from "./dom.js";

const VALLS_LAT = 41.2869;
const VALLS_LON = 1.2490;

function fmtHM(d) {
  return new Intl.DateTimeFormat("ca-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function getSunTimesToday() {
  if (!window.SunCalc || typeof window.SunCalc.getTimes !== "function") return null;
  const now = new Date();
  const t = window.SunCalc.getTimes(now, VALLS_LAT, VALLS_LON);
  return (t && t.sunrise && t.sunset) ? { sunrise: t.sunrise, sunset: t.sunset } : null;
}

export function isNightNowBySun() {
  const st = getSunTimesToday();
  if (!st) return null;
  const now = new Date();
  return (now < st.sunrise || now >= st.sunset);
}

export function renderSunSub() {
  // Escriu a chipSun (i si algun dia vols compatibilitat, també a sunSub)
  const el = $("chipSun") || $("sunSub");
  if (!el) return;

  const st = getSunTimesToday();
  if (!st) {
    el.textContent = "—";
    return;
  }
  el.textContent = `Sortida ${fmtHM(st.sunrise)}h · Posta ${fmtHM(st.sunset)}h`;
}

export function pickHomeEmoji(row) {
  // 1) pluja real ara mateix
  const rate = Number(row?.rain_rate_mmh);
  if (Number.isFinite(rate) && rate > 0) return "🌧️";

  // 2) dia/nit real (solar)
  const night = isNightNowBySun();

  // 3) fallback
  const h = new Date().getHours();
  const fallbackNight = (h >= 20 || h < 8);

  const isNight = (night === null) ? fallbackNight : night;
  return isNight ? "🌙" : "🌤️";
}

export function renderHomeIcon(row) {
  const el = $("currentIcon");
  if (!el) return;
  el.textContent = pickHomeEmoji(row);
}
