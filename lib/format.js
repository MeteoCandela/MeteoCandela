// lib/format.js
export function fToC(f) { return (f - 32) * 5 / 9; }
export function mphToKmh(mph) { return mph * 1.609344; }

export function fmt1(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
  return Number(x).toFixed(1);
}

export function fmtInt(x) {
  const n = Number(x);
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}

export function fmtDate(tsMs) {
  const d = new Date(tsMs);
  return new Intl.DateTimeFormat("ca-ES", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).format(d);
}

export function fmtTime(tsMs) {
  const d = new Date(tsMs);
  return new Intl.DateTimeFormat("ca-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function fmtTimeWithH(tsMs) {
  return `${fmtTime(tsMs)} h`;
}

export function fmtDayLong(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("ca-ES", {
    weekday: "long", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(dt);
}

export function dayKeyFromTs(tsMs) {
  const d = new Date(tsMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function startEndMsFromDayKey(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function minMax(values) {
  const v = values
    .filter(x => x != null && Number.isFinite(Number(x)))
    .map(Number);
  if (!v.length) return { min: null, max: null };
  return { min: Math.min(...v), max: Math.max(...v) };
}

export function degToWindCatalan(deg) {
  if (deg == null || Number.isNaN(Number(deg))) return "—";
  const d = ((Number(deg) % 360) + 360) % 360;

  if (d >= 337.5 || d < 22.5) return "N – Tramuntana";
  if (d >= 22.5 && d < 67.5) return "NE – Gregal";
  if (d >= 67.5 && d < 112.5) return "E – Llevant";
  if (d >= 112.5 && d < 157.5) return "SE – Xaloc";
  if (d >= 157.5 && d < 202.5) return "S – Migjorn";
  if (d >= 202.5 && d < 247.5) return "SW – Garbí";
  if (d >= 247.5 && d < 292.5) return "W – Ponent";
  if (d >= 292.5 && d < 337.5) return "NW – Mestral";
  return "—";
}
