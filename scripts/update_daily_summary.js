// scripts/update_daily_summary.js
// Genera/actualitza data/daily-summary.json mantenint l'històric antic (permanent)

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const CURRENT_PATH = path.join(DATA_DIR, "current.json");
const OUT_PATH = path.join(DATA_DIR, "daily-summary.json");

const TZ = "Europe/Madrid";

/**
 * Límits de plausibilitat (AMPLIS) per filtrar errors de lectura.
 * Ajustables si vols ser més estricte.
 */
const LIMITS = {
  temp_c:      { min: -20, max: 55 },   // Catalunya: ample, però evita 63°C, -99, etc.
  hum_pct:     { min: 0,   max: 100 },
  dew_c:       { min: -40, max: 35 },   // punt de rosada rarament passa de 30-35
  wind_kmh:    { min: 0,   max: 150 },
  gust_kmh:    { min: 0,   max: 200 },
  rain_day_mm: { min: 0,   max: 500 }   // molt ample
};

function readJsonSafe(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function fToC(f) { return (f - 32) * 5 / 9; }
function mphToKmh(mph) { return mph * 1.609344; }

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function keepIfPlausible(x, lim) {
  if (x == null) return null;
  return (x >= lim.min && x <= lim.max) ? x : null;
}

function normalizeRow(r) {
  // ts esperem ms (com ja tens)
  const ts = toNum(r.ts);
  if (ts == null) return null;

  // Temp
  let tempC = r.temp_c ?? null;
  if (tempC == null) {
    if (r.temp_f != null) tempC = fToC(Number(r.temp_f));
    else if (r.temperature != null) {
      const t = Number(r.temperature);
      tempC = (t >= 80) ? fToC(t) : t; // heurística
    }
  }
  tempC = toNum(tempC);

  // Hum
  const hum = toNum(r.hum_pct);

  // Dew
  let dewC = r.dew_c ?? null;
  if (dewC == null && r.dew_f != null) dewC = fToC(Number(r.dew_f));
  dewC = toNum(dewC);

  // Wind / gust
  let windKmh = r.wind_kmh ?? null;
  if (windKmh == null) {
    if (r.wind_mph != null) windKmh = mphToKmh(Number(r.wind_mph));
    else if (r.wind_speed != null) windKmh = Number(r.wind_speed);
  }
  windKmh = toNum(windKmh);

  let gustKmh = r.gust_kmh ?? null;
  if (gustKmh == null) {
    if (r.gust_mph != null) gustKmh = mphToKmh(Number(r.gust_mph));
    else if (r.wind_gust != null) gustKmh = Number(r.wind_gust);
  }
  gustKmh = toNum(gustKmh);

  // Rain day acumulada
  let rainDay = toNum(r.rain_day_mm ?? r.rain_day);
  if (rainDay == null) rainDay = 0;

  // ✅ Filtre de plausibilitat (descarta valors extrems / errors de lectura)
  tempC   = keepIfPlausible(tempC,   LIMITS.temp_c);
  const humP  = keepIfPlausible(hum,    LIMITS.hum_pct);
  dewC    = keepIfPlausible(dewC,    LIMITS.dew_c);
  windKmh = keepIfPlausible(windKmh, LIMITS.wind_kmh);
  gustKmh = keepIfPlausible(gustKmh, LIMITS.gust_kmh);

  // Pluja: si és absurda, la retornem a 0 per no “trencar” el dia
  rainDay = keepIfPlausible(rainDay, LIMITS.rain_day_mm);
  if (rainDay == null) rainDay = 0;

  return {
    ts,
    temp_c: tempC,
    hum_pct: humP,
    dew_c: dewC,
    wind_kmh: windKmh,
    gust_kmh: gustKmh,
    rain_day_mm: rainDay
  };
}

// DayKey (YYYY-MM-DD) en TZ Europe/Madrid (DST-safe)
function dayKeyMadrid(tsMs) {
  const d = new Date(tsMs);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const get = (type) => parts.find(p => p.type === type)?.value;
  const y = get("year");
  const m = get("month");
  const da = get("day");
  return `${y}-${m}-${da}`; // en-CA ja dona 2-digit
}

function avg(arr) {
  const v = arr.filter(x => x != null && Number.isFinite(x));
  if (!v.length) return null;
  const s = v.reduce((a,b) => a + b, 0);
  return s / v.length;
}

function min(arr) {
  const v = arr.filter(x => x != null && Number.isFinite(x));
  if (!v.length) return null;
  return Math.min(...v);
}

function max(arr) {
  const v = arr.filter(x => x != null && Number.isFinite(x));
  if (!v.length) return null;
  return Math.max(...v);
}

function round1(x) {
  if (x == null) return null;
  return Math.round(x * 10) / 10;
}

function buildDailySummaries(rows) {
  // Agrupa per dia (TZ Madrid)
  const byDay = new Map();
  for (const r of rows) {
    const k = dayKeyMadrid(r.ts);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(r);
  }

  const result = new Map();

  for (const [day, rs] of byDay.entries()) {
    // Ordena per ts
    rs.sort((a,b) => a.ts - b.ts);

    const temps = rs.map(r => r.temp_c);
    const winds = rs.map(r => r.wind_kmh);
    const gusts = rs.map(r => r.gust_kmh);

    // Pluja diària: agafem el màxim del comptador rain_day_mm del dia
    // (assumint que es reseteja a 0 a mitjanit)
    const rainDayMax = max(rs.map(r => r.rain_day_mm)) ?? 0;

    const summary = {
      day, // YYYY-MM-DD
      temp_min_c: round1(min(temps)),
      temp_max_c: round1(max(temps)),
      temp_avg_c: round1(avg(temps)),
      rain_mm: round1(rainDayMax),
      gust_max_kmh: round1(max(gusts)),
      wind_avg_kmh: round1(avg(winds))
    };

    // ✅ Nota: NO descartem el dia sencer.
    // Si un camp queda null (perquè totes les mostres eren “boges”), sortirà "null" al JSON,
    // i a la web ho pots pintar com "—".

    result.set(day, summary);
  }

  return result;
}

function main() {
  const histRaw = readJsonSafe(HISTORY_PATH, []);
  const curRaw = readJsonSafe(CURRENT_PATH, null);

  const hist = Array.isArray(histRaw) ? histRaw.map(normalizeRow).filter(Boolean) : [];
  const cur = (curRaw && typeof curRaw === "object") ? normalizeRow(curRaw) : null;

  // Merge per ts (evita duplicats)
  const byTs = new Map();
  for (const r of hist) byTs.set(r.ts, r);
  if (cur && cur.ts != null) byTs.set(cur.ts, cur);

  const merged = Array.from(byTs.values()).sort((a,b) => a.ts - b.ts);

  // Calcula resums per als dies que coneixem (últims ~30 dies)
  const freshMap = buildDailySummaries(merged);

  // Carrega l'antic històric (permanent) i fes merge
  const old = readJsonSafe(OUT_PATH, []);
  const oldMap = new Map();

  if (Array.isArray(old)) {
    for (const it of old) {
      if (it && typeof it.day === "string") oldMap.set(it.day, it);
    }
  }

  // Sobreescriu/actualitza els dies "fresh" (avui/últims 30 dies)
  for (const [day, s] of freshMap.entries()) {
    oldMap.set(day, s);
  }

  // Escriu sortit ordenat per dia DESC (més recent a dalt)
  const out = Array.from(oldMap.values()).sort((a,b) => b.day.localeCompare(a.day));

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`OK: escrit ${OUT_PATH} (${out.length} dies)`);
}

main();
