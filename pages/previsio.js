// pages/previsio.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";

const LS_KEY = "meteovalls:muni_id";

function hourNum(hourStr){
  const m = String(hourStr ?? "").match(/^\s*(\d{1,2})/);
  return m ? Number(m[1]) : NaN;
}

function fmt1(x){
  if (x === null || x === undefined) return "—";
  const s = String(x).trim();
  if (s === "") return "—";
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}

function fmtInt(x){
  if (x === null || x === undefined) return "—";
  const s = String(x).trim();
  if (s === "") return "—";
  const n = Number(s);
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}

function fmt0orDash(x){
  if (x === null || x === undefined) return "—";
  const s = String(x).trim();
  if (s === "") return "—";
  const n = Number(s);
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}

function ymdTodayLocal(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rotateDailyToToday(daily){
  if (!Array.isArray(daily) || !daily.length) return daily;
  const today = ymdTodayLocal();
  const idx = daily.findIndex(d => String(d?.date).slice(0,10) === today);
  if (idx <= 0) return daily;
  return daily.slice(idx).concat(daily.slice(0, idx));
}

function fmtDateCA(ymd){
  try{
    const [y,m,d] = String(ymd).slice(0,10).split("-").map(Number);
    const dt = new Date(y, m-1, d);
    return new Intl.DateTimeFormat("ca-ES", {
      weekday:"short", day:"2-digit", month:"2-digit"
    }).format(dt);
  }catch{
    return String(ymd || "—");
  }
}

function timeAgo(ts){
  const n = Number(ts);
  if (!Number.isFinite(n)) return "—";
  const mins = Math.round((Date.now() - n) / 60000);
  if (mins < 1) return "fa <1 min";
  if (mins < 60) return `fa ${mins} min`;
  const h = Math.round(mins / 60);
  return `fa ${h} h`;
}

function parseHourMin(hourStr){
  const m = String(hourStr ?? "").match(/^\s*(\d{1,2})(?::(\d{2}))?/);
  if (!m) return { h: NaN, min: 0 };
  return { h: Number(m[1]), min: m[2] ? Number(m[2]) : 0 };
}

function parseLocalDateTime(ymd, hourStr){
  const s = String(ymd || "").slice(0,10);
  const [Y,M,D] = s.split("-").map(Number);
  if (!Number.isFinite(Y) || !Number.isFinite(M) || !Number.isFinite(D)) return null;

  const { h, min } = parseHourMin(hourStr);
  if (!Number.isFinite(h)) return null;

  return new Date(Y, M-1, D, h, Number.isFinite(min) ? min : 0, 0, 0);
}

function rowToDate(row, todayYMD){
  const s = String(row?.ts_local ?? "").trim();
  if (s) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const Y  = Number(m[1]), Mo = Number(m[2]), D  = Number(m[3]);
      const H  = Number(m[4]), Mi = Number(m[5]), S  = Number(m[6] ?? 0);
      const d = new Date(Y, Mo - 1, D, H, Mi, S, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const ts = Number(row?.ts);
  if (Number.isFinite(ts)) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }

  if (row?.date) {
    const d = parseLocalDateTime(row.date, row.hour);
    if (d && !isNaN(d.getTime())) return d;
  }

  const d = parseLocalDateTime(todayYMD, row?.hour);
  if (d && !isNaN(d.getTime())) return d;

  return null;
}

function fmtHourLabelFromDate(dt){
  try{
    return new Intl.DateTimeFormat("ca-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(dt);
  }catch{
    return `${String(dt.getHours()).padStart(2,"0")}:00`;
  }
}

function skyToCA(s){
  if (!s) return s;

  // normalitza
  let t = String(s).trim().toLowerCase().replace(/\s+/g, " ");

  // IMPORTANT: “nubes altas” pot venir amb coma o “con…”
  t = t.replace(/\bnubes\s+altas\b/g, "núvols alts");
  t = t.replace(/\bnubes\s+medias\b/g, "núvols mitjans");
  t = t.replace(/\bnubes\s+bajas\b/g, "núvols baixos");
  t = t.replace(/\bnubes\b/g, "núvols"); // fallback

  t = t.replace(/\bintervalos\s+nubosos\b/g, "intervals ennuvolats");
  t = t.replace(/\bpoco\s+nuboso\b/g, "poc ennuvolat");
  t = t.replace(/\bmuy\s+nuboso\b/g, "molt ennuvolat");
  t = t.replace(/\bnuboso\b/g, "ennuvolat");
  t = t.replace(/\bcubierto\b/g, "cobert");
  t = t.replace(/\bdespejado\b/g, "cel serè");

  t = t.replace(/\blluvia\s+escasa\b/g, "pluja feble");
  t = t.replace(/\blluvia\b/g, "pluja");
  t = t.replace(/\btormentas\b/g, "tempestes");
  t = t.replace(/\btormenta\b/g, "tempesta");
  t = t.replace(/\bnieve\b/g, "neu");
  t = t.replace(/\bniebla\b/g, "boira");
  t = t.replace(/\bbruma\b/g, "broma");

  // “con” -> “amb”
  t = t.replace(/\bcon\b/g, "amb");

  return t.charAt(0).toUpperCase() + t.slice(1);
}

function iconFromSky(s, hourStr){
  const h = hourNum(hourStr);
  const isNight = Number.isFinite(h) ? (h >= 20 || h < 7) : false;

  const t = String(s || "").toLowerCase();

  if (t.includes("torment")) return "⛈️";
  if (t.includes("nieve") || t.includes("neu")) return "🌨️";
  if (t.includes("niebla") || t.includes("boira") || t.includes("bruma") || t.includes("broma")) return "🌫️";
  if (t.includes("pluja feble") || t.includes("lluvia escasa")) return isNight ? "🌧️" : "🌦️";
  if (t.includes("pluja") || t.includes("lluvia")) return "🌧️";
  if (t.includes("cobert") || t.includes("cubierto")) return "☁️";
  if (t.includes("intervals") || t.includes("intervalos")) return isNight ? "☁️🌙" : "🌤️";
  if (t.includes("ennuvolat") || t.includes("nuboso")) return isNight ? "☁️" : "⛅";
  if (t.includes("serè") || t.includes("despejado")) return isNight ? "🌙" : "☀️";

  return isNight ? "🌙" : "🌤️";
}

function fmtWind(h){
  const v = Number(h.wind_kmh);
  const g = Number(h.gust_kmh);
  const dir = h.wind_dir ? String(h.wind_dir) : "";

  const vTxt = Number.isFinite(v) ? `${Math.round(v)} km/h` : "—";
  const dTxt = dir ? ` ${dir}` : "";
  const gust = Number.isFinite(g) ? `<div class="fx-gust">ratxa ${Math.round(g)} km/h</div>` : "";

  return `<div class="fx-wind-main">${vTxt}${dTxt}</div>${gust}`;
}

async function fetchJson(url){
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
  if (!res.ok) {
    const msg = (data && (data.error || data.detail)) ? `${data.error || "error"} ${data.detail || ""}` : txt.slice(0,140);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data;
}

function deriveMunicipisUrl(forecastUrl){
  return String(forecastUrl || "").replace(/\/forecast(\?.*)?$/i, "/municipis");
}

async function fetchMunicipis(MUNICIPIS_URL){
  return fetchJson(`${MUNICIPIS_URL}?t=${Date.now()}`);
}

async function fetchForecast(FORECAST_URL, muniId){
  const url = new URL(FORECAST_URL, window.location.origin);
  if (muniId) url.searchParams.set("m", muniId);
  url.searchParams.set("t", String(Date.now()));
  return fetchJson(url.toString());
}

// ⬇️ AIXÒ ÉS EL QUE ET GARANTEIX “SENSE ALT CAMP”
function getSelectedMuniName(){
  const sel = document.getElementById("muniSelect");
  const opt = sel?.selectedOptions?.[0];
  return opt ? String(opt.textContent || "").trim() : "";
}

function setHeaderPlace(){
  const h1 = document.getElementById("fxTitle");
  const name = getSelectedMuniName() || "Valls";
  if (h1) h1.textContent = `Previsió · ${name}`;
}

function renderHourly(hourly){
  const wrap = $("hourlyWrap");
  if (!wrap) return;

  if (!Array.isArray(hourly) || !hourly.length){
    wrap.innerHTML = `<p class="muted-line">Sense dades horàries disponibles.</p>`;
    return;
  }

  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0,0,0);
  const startMs = start.getTime();
  const endMs = startMs + 24 * 60 * 60 * 1000;

  const todayYMD = ymdTodayLocal();

  let list = hourly
    .map(h => {
      const dt = rowToDate(h, todayYMD);
      const ms = dt ? dt.getTime() : NaN;
      return { ...h, _dt: dt, _ms: ms };
    })
    .filter(h => Number.isFinite(h._ms))
    .filter(h => h._ms >= startMs && h._ms < endMs)
    .sort((a,b) => a._ms - b._ms);

  const seen = new Set();
  list = list.filter(h => {
    const bucket = Math.floor(h._ms / 3600000);
    if (seen.has(bucket)) return false;
    seen.add(bucket);
    return true;
  });

  if (!list.length){
    wrap.innerHTML = `<p class="muted-line">Sense dades per a les properes 24 h.</p>`;
    return;
  }

  wrap.innerHTML = `
    <div class="fx-shelf">
      <div class="fx-track" aria-hidden="true"></div>
      <div class="fx-rail" role="list" aria-label="Previsió properes 24 hores">
        ${list.map(h => {
          const dt = h._dt;
          const hourStrForIcon = dt
            ? `${String(dt.getHours()).padStart(2,"0")}:00`
            : (h.hour || "12:00");

          const skyCA = skyToCA(h.sky);

          return `
            <article class="fx-item" role="listitem">
              <div class="fx-time">${dt ? fmtHourLabelFromDate(dt) : (h.hour || "—")}</div>
              <div class="fx-icon" aria-hidden="true">${iconFromSky(skyCA, hourStrForIcon)}</div>
              <div class="fx-temp">${fmt1(h.temp_c)}°</div>

              <div class="fx-row">
                <span class="fx-k">💧</span>
                <span class="fx-v">${fmt0orDash(h.pop_pct)}%</span>
              </div>

              <div class="fx-row fx-row--wind">
                <span class="fx-k">💨</span>
                <div class="fx-v">${fmtWind(h)}</div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderDaily(daily){
  const wrap = $("dailyWrap");
  if (!wrap) return;

  if (!Array.isArray(daily) || !daily.length){
    wrap.innerHTML = `<p class="muted-line">Sense dades diàries disponibles.</p>`;
    return;
  }

  const mins = daily.map(d => Number(d.tmin_c)).filter(Number.isFinite);
  const maxs = daily.map(d => Number(d.tmax_c)).filter(Number.isFinite);
  const gMin = mins.length ? Math.min(...mins) : 0;
  const gMax = maxs.length ? Math.max(...maxs) : 0;
  const span = (gMax - gMin) || 1;

  const bar = (tmin, tmax) => {
    const a = Number(tmin), b = Number(tmax);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return "";
    const left = ((a - gMin) / span) * 100;
    const width = ((b - a) / span) * 100;
    return `<div class="fx7-bar"><span style="left:${left}%;width:${width}%"></span></div>`;
  };

  wrap.innerHTML = `
    <div class="fx7">
      ${daily.map(d => {
        const skyCA = skyToCA(d.sky);
        return `
          <div class="fx7-row">
            <div class="fx7-left">
              <div class="fx7-date">${fmtDateCA(d.date)}</div>
              <div class="fx7-sky">${skyCA || ""}</div>
            </div>

            <div class="fx7-mid">
              <div class="fx7-icon" aria-hidden="true">${iconFromSky(skyCA, "12:00")}</div>
              ${bar(d.tmin_c, d.tmax_c)}
            </div>

            <div class="fx7-right">
              <div class="fx7-temps">
                <span class="fx7-min">${fmt1(d.tmin_c)}°</span>
                <span class="fx7-max">${fmt1(d.tmax_c)}°</span>
              </div>
              <div class="fx7-pop">💧 ${fmtInt(d.pop_pct)}%</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function initPrevisio() {
  const tag = document.getElementById("buildTag");
  if (tag) tag.textContent = "BUILD: 2026-02-11-100 (previsio.js nou)";
  const { FORECAST_URL } = getApi();
  const MUNICIPIS_URL = deriveMunicipisUrl(FORECAST_URL);

  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());

  const sel = document.getElementById("muniSelect");

  async function loadAndRender(muniId){
    const status = $("fxStatus");
    const meta = $("fxMeta");

    try{
      const fx = await fetchForecast(FORECAST_URL, muniId);

      const provider = fx.provider || "—";
      const updated = fx.updated_ts ? timeAgo(fx.updated_ts) : "—";

      // ✅ títol sempre des del selector (sense Alt Camp)
      setHeaderPlace();

      const placeForStatus = getSelectedMuniName() || (fx.place || "Valls");
      if (status) status.textContent = `Previsió: ${placeForStatus} · ${provider} · Actualitzat ${updated}.`;

      if (meta) {
        meta.innerHTML = `
          <div>Font: <strong>${provider}</strong></div>
          <div>Actualitzat: <strong>${fx.updated_iso_utc ? fx.updated_iso_utc.replace("T"," ").slice(0,16) : "—"}</strong> (${updated})</div>
        `;
      }

      renderHourly(fx.hourly);
      renderDaily(rotateDailyToToday(fx.daily));
    } catch(e){
      console.error(e);
      if (status) status.textContent = "No es pot carregar la previsió (/api/forecast).";
      const hw = $("hourlyWrap"); if (hw) hw.innerHTML = `<p class="muted-line">Error carregant previsió.</p>`;
      const dw = $("dailyWrap");  if (dw) dw.innerHTML = `<p class="muted-line">Error carregant previsió.</p>`;
    }
  }

  async function initSelect(){
    if (!sel) return;

    try{
      const cfg = await fetchMunicipis(MUNICIPIS_URL);
      const municipis = Array.isArray(cfg?.municipis) ? cfg.municipis : [];
      const defId = String(cfg?.default_id || "43161");

      sel.innerHTML = municipis
        .slice()
        .sort((a,b) => String(a.name).localeCompare(String(b.name), "ca"))
        .map(m => `<option value="${String(m.id)}">${String(m.name)}</option>`)
        .join("");

      const saved = localStorage.getItem(LS_KEY);
      const startId = (saved && municipis.some(m => String(m.id) === String(saved))) ? String(saved) : defId;
      sel.value = startId;

      sel.addEventListener("change", () => {
        const id = String(sel.value || defId);
        localStorage.setItem(LS_KEY, id);
        loadAndRender(id);
      });

      await loadAndRender(startId);
    } catch(e){
      console.error(e);
      await loadAndRender(null);
    }
  }

  initSelect();
  }
