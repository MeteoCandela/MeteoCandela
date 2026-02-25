// lib/api.js
import { fToC, mphToKmh } from "./format.js";

export function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeRow(r) {
  // TEMPERATURA
  let tempC = (r.temp_c ?? null);
  if (tempC === null || tempC === undefined) {
    if (r.temp_f != null) tempC = fToC(Number(r.temp_f));
    else if (r.temperature != null) {
      const t = Number(r.temperature);
      tempC = (t >= 80) ? fToC(t) : t; // heuristic F vs C
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
  const hum = r.hum_pct ?? r.humidity ?? r.hum ?? null;
  const rainDay = r.rain_day_mm ?? r.rain_day ?? r.daily_rain ?? r.rainfall_daily ?? null;
  const rainRate = r.rain_rate_mmh ?? r.rain_rate ?? r.rainrate ?? null;

  return {
    ts: Number(r.ts),
    temp_c: toNumOrNull(tempC),
    hum_pct: toNumOrNull(hum),
    dew_c: toNumOrNull(dewC),
    wind_kmh: toNumOrNull(windKmh),
    gust_kmh: toNumOrNull(gustKmh),
    wind_dir: (r.wind_dir ?? r.wind_direction ?? null),
    rain_day_mm: toNumOrNull(rainDay),
    rain_rate_mmh: toNumOrNull(rainRate),
  };
}

export async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
  return await res.json();
}

export async function loadHistoryOnce(HISTORY_URL, state) {
  try {
    const h = await fetchJson(`${HISTORY_URL}?t=${Date.now()}`);
    const rawHist = Array.isArray(h) ? h : [];
    state.historyRows = rawHist
      .map(normalizeRow)
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => a.ts - b.ts);
  } catch {
    console.warn("History offline o no disponible");
    state.historyRows = state.historyRows || [];
  }
  return state.historyRows;
}

export async function loadCurrentAndHeartbeat(CURRENT_URL, HEARTBEAT_URL, state) {
  let current = state.current;
  let hb = state.hb;

  try {
    const c = await fetchJson(`${CURRENT_URL}?t=${Date.now()}`);
    const cc = normalizeRow(c);
    if (Number.isFinite(cc.ts)) current = cc;
  } catch {
    console.warn("Current offline");
  }

  try {
    hb = await fetchJson(`${HEARTBEAT_URL}?t=${Date.now()}`);
  } catch {
    console.warn("Heartbeat offline");
  }

  state.current = current;
  state.hb = hb;
  return { current, hb };
}
export async function loadDailySummaryD1(DAILY_SUMMARY_D1_URL, days = 365) {
  // Accepta:
  // - array de files
  // - objecte únic (el convertim a array)
  // El worker ideal: ?days=365 (ORDER BY date DESC LIMIT days)
  try {
    const url = new URL(DAILY_SUMMARY_D1_URL, location.origin);
    // només setegem days si no ve ja informat
    if (!url.searchParams.has("days")) url.searchParams.set("days", String(days));
    url.searchParams.set("t", String(Date.now()));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);

    const j = await res.json();
    if (Array.isArray(j)) return j;
    if (j && typeof j === "object") return [j];
    return [];
  } catch (e) {
    console.warn("Daily summary D1 offline o no disponible", e);
    return [];
  }
}
