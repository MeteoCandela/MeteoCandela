// pages/previsio.js
import { $ } from "../lib/dom.js";
import { getApi } from "../lib/env.js";

// LocalStorage
const LS_ZONE = "meteovalls:fx_zone";
const LS_MUNI_GLOBAL = "meteovalls:muni_id"; // compat vell
const LS_MUNI_BY_ZONE_PREFIX = "meteovalls:muni_id:";

// IDs
const VALLS_ID = "43161";

// Labels finals UI (han de ser EXACTES)
const ZONES_WANTED = [
  "Municipis Alt Camp",
  "Capitals província Tarragona",
  "Capitals província Barcelona",
  "Capitals província Girona",
  "Capitals província Lleida",
];

// Defaults per zona
const DEFAULT_BY_ZONE_LABEL = {
  "Municipis Alt Camp": VALLS_ID,
  "Capitals província Tarragona": "43148", // Tarragona
  "Capitals província Barcelona": "08019", // Barcelona
  "Capitals província Girona": "17079",    // Girona
  "Capitals província Lleida": "25120",    // Lleida
};

// -------------------- util format --------------------
function hourNum(hourStr){
  const m = String(hourStr ?? "").match(/^\s*(\d{1,2})/);
  return m ? Number(m[1]) : NaN;
}
function fmt1(x){
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}
function fmtInt(x){
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}
function fmt0orDash(x){
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}
function ymdTodayLocal(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function rotateDailyToToday(daily){
  if (!Array.isArray(daily) || !daily.length) return daily;
  const today = ymdTodayLocal();
  const idx = daily.findIndex(d => String(d?.date).slice(0,10) === today);
  return idx > 0 ? daily.slice(idx).concat(daily.slice(0, idx)) : daily;
}
function fmtDateCA(ymd){
  try{
    const [y,m,d] = String(ymd).slice(0,10).split("-").map(Number);
    const dt = new Date(y, m-1, d);
    return new Intl.DateTimeFormat("ca-ES", { weekday:"short", day:"2-digit", month:"2-digit" }).format(dt);
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
  return `fa ${Math.round(mins/60)} h`;
}

function parseHourMin(hourStr){
  const m = String(hourStr ?? "").match(/^\s*(\d{1,2})(?::(\d{2}))?/);
  if (!m) return { h: NaN, min: 0 };
  return { h: Number(m[1]), min: m[2] ? Number(m[2]) : 0 };
}
function parseLocalDateTime(ymd, hourStr){
  const s = String(ymd || "").slice(0,10);
  const [Y,M,D] = s.split("-").map(Number);
  if (![Y,M,D].every(Number.isFinite)) return null;
  const { h, min } = parseHourMin(hourStr);
  if (!Number.isFinite(h)) return null;
  return new Date(Y, M-1, D, h, Number.isFinite(min) ? min : 0, 0, 0);
}
function rowToDate(row, todayYMD){
  const s = String(row?.ts_local ?? "").trim();
  if (s) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
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
  return d && !isNaN(d.getTime()) ? d : null;
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
  let t = String(s).trim().toLowerCase().replace(/\s+/g," ");
  t = t.replace(/\bnubes\s+altas\b/g, "núvols alts")
       .replace(/\bnubes\s+medias\b/g, "núvols mitjans")
       .replace(/\bnubes\s+bajas\b/g, "núvols baixos")
       .replace(/\bnubes\b/g, "núvols")
       .replace(/\bintervalos\s+nubosos\b/g, "intervals ennuvolats")
       .replace(/\bpoco\s+nuboso\b/g, "poc ennuvolat")
       .replace(/\bmuy\s+nuboso\b/g, "molt ennuvolat")
       .replace(/\bnuboso\b/g, "ennuvolat")
       .replace(/\bcubierto\b/g, "cobert")
       .replace(/\bdespejado\b/g, "cel serè")
       .replace(/\blluvia\s+escasa\b/g, "pluja feble")
       .replace(/\blluvia\b/g, "pluja")
       .replace(/\btormentas\b/g, "tempestes")
       .replace(/\btormenta\b/g, "tempesta")
       .replace(/\bnieve\b/g, "neu")
       .replace(/\bniebla\b/g, "boira")
       .replace(/\bbruma\b/g, "broma")
       .replace(/\bcon\b/g, "amb");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function iconFromSky(s, hourStr){
  const h = hourNum(hourStr);
  const isNight = Number.isFinite(h) ? (h >= 20 || h < 7) : false;
  const t = String(s || "").toLowerCase();
  if (t.includes("torment") || t.includes("tempest")) return "⛈️";
  if (t.includes("nieve") || t.includes("neu")) return "🌨️";
  if (t.includes("niebla") || t.includes("boira") || t.includes("bruma") || t.includes("broma")) return "🌫️";
  if (t.includes("pluja feble") || t.includes("lluvia escasa")) return isNight ? "🌧️" : "🌦️";
  if (t.includes("pluja") || t.includes("lluvia")) return "🌧️";
  if (t.includes("cobert") || t.includes("cubierto")) return "☁️";
  if (t.includes("intervals") || t.includes("intervalos")) return isNight ? "☁️🌙" : "🌤️";
  if (t.includes("ennuvolat") || t.includes("nuboso") || t.includes("núvols")) return isNight ? "☁️" : "⛅";
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
  try { data = txt ? JSON.parse(txt) : null; } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.detail))
      ? `${data.error || "error"} ${data.detail || ""}`.trim()
      : txt.slice(0,140);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data;
}

function getSelectedText(selectId){
  const sel = document.getElementById(selectId);
  const opt = sel?.selectedOptions?.[0];
  return opt ? String(opt.textContent || "").trim() : "";
}
function getSelectedMuniName(){
  return getSelectedText("muniSelect").replace(/^★\s*/,"").trim();
}
function getSelectedZoneLabel(){
  return getSelectedText("zoneSelect");
}
function setHeaderPlace(){
  let name = getSelectedMuniName() || "Valls";
  if (name.toLowerCase() === "valls") name = "Ciutat de Valls";

  const h1 = document.getElementById("fxTitle");
  if (h1) h1.textContent = `Previsió · ${name}`;

  const sub = document.getElementById("fxSubtitle");
  if (sub) {
    const z = getSelectedZoneLabel();
    sub.textContent = z ? `MeteoValls · ${z}` : "MeteoValls · Previsió";
  }
}

// ---------- render ----------
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

  // 1 punt per hora
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
          const hourStrForIcon = dt ? `${String(dt.getHours()).padStart(2,"0")}:00` : (h.hour || "12:00");
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

// ---------- zones ----------
function muniKeyForZone(label){
  return `${LS_MUNI_BY_ZONE_PREFIX}${label}`;
}
function cleanLabel(x){
  return String(x || "").trim();
}
function idProvincia(id){
  const s = String(id || "");
  if (s.startsWith("43")) return "Tarragona";
  if (s.startsWith("08")) return "Barcelona";
  if (s.startsWith("17")) return "Girona";
  if (s.startsWith("25")) return "Lleida";
  return "";
}

// Converteix qualsevol format del Worker a 5 zones fixes
function normGroupsToZones(rawGroups){
  const groups = Array.isArray(rawGroups) ? rawGroups : [];

  // Format nou: ja porta les 5 zones
  const hasNew = groups.some(g => ZONES_WANTED.includes(cleanLabel(g?.label)));
  if (hasNew) {
    return groups
      .map(g => ({
        label: cleanLabel(g.label),
        items: (Array.isArray(g.items) ? g.items : []).map(it => ({ id: String(it.id), name: String(it.name) })),
      }))
      .filter(g => ZONES_WANTED.includes(g.label) && g.items.length);
  }

  // Format antic: "Alt Camp" + "Capitals de comarca"
  const byLabelLoose = (want) =>
    groups.find(g => cleanLabel(g?.label).toLowerCase() === String(want).toLowerCase()) || null;

  const altCamp = byLabelLoose("Alt Camp");
  const caps = byLabelLoose("Capitals de comarca");

  const altItems = (Array.isArray(altCamp?.items) ? altCamp.items : []).map(it => ({ id: String(it.id), name: String(it.name) }));
  const capItems = (Array.isArray(caps?.items) ? caps.items : []).map(it => ({ id: String(it.id), name: String(it.name) }));

  const capsT = capItems.filter(x => idProvincia(x.id) === "Tarragona");
  const capsB = capItems.filter(x => idProvincia(x.id) === "Barcelona");
  const capsG = capItems.filter(x => idProvincia(x.id) === "Girona");
  const capsL = capItems.filter(x => idProvincia(x.id) === "Lleida");

  const sortByName = (a,b) => a.name.localeCompare(b.name, "ca");

  const zones = [
    { label: "Municipis Alt Camp", items: altItems.sort(sortByName) },
    { label: "Capitals província Tarragona", items: capsT.sort(sortByName) },
    { label: "Capitals província Barcelona", items: capsB.sort(sortByName) },
    { label: "Capitals província Girona", items: capsG.sort(sortByName) },
    { label: "Capitals província Lleida", items: capsL.sort(sortByName) },
  ].filter(z => z.items.length);

  return zones;
}

function optionLabel(id, name){
  const n = String(name || "");
  if (String(id) === VALLS_ID) return n.startsWith("★") ? n : `★ ${n}`;
  return n;
}

// -------------------- INIT --------------------
export function initPrevisio() {
  const api = getApi?.() || {};
  const ORIGIN = window.location.origin;

  const FORECAST_URL = api.FORECAST_URL || "/api/forecast";
  const MUNICIPIS_URL = api.MUNICIPIS_URL || "/api/municipis";

  const status = $("fxStatus");
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());

  const zoneSel = document.getElementById("zoneSelect");
  const muniSel = document.getElementById("muniSelect");

  let zones = []; // [{label, items:[{id,name}]}]

  function groupByLabel(label){
    return zones.find(g => cleanLabel(g?.label) === cleanLabel(label)) || null;
  }
  function findZoneContainingMuni(muniId){
    const id = String(muniId || "");
    if (!id) return null;
    for (const g of zones) {
      const items = Array.isArray(g?.items) ? g.items : [];
      if (items.some(it => String(it?.id) === id)) return String(g.label || "");
    }
    return null;
  }

  function populateZoneSelect(startLabel){
    if (!zoneSel) return;

    zoneSel.innerHTML = zones
      .map(g => `<option value="${String(g.label)}">${String(g.label)}</option>`)
      .join("");

    if (startLabel && zones.some(g => cleanLabel(g.label) === cleanLabel(startLabel))) {
      zoneSel.value = String(startLabel);
    } else if (zones.length) {
      zoneSel.value = String(zones[0].label);
    }
  }

  function populateMuniSelect(zoneLabel, muniIdToSelect){
    if (!muniSel) return;

    const g = groupByLabel(zoneLabel);
    const items = Array.isArray(g?.items) ? g.items : [];

    muniSel.innerHTML = items
      .map(m => `<option value="${String(m.id)}">${optionLabel(m.id, m.name)}</option>`)
      .join("");

    const desired = String(muniIdToSelect || "");
    if (desired && items.some(m => String(m.id) === desired)) {
      muniSel.value = desired;
      return;
    }

    const def = DEFAULT_BY_ZONE_LABEL[String(zoneLabel)] || null;
    if (def && items.some(m => String(m.id) === String(def))) {
      muniSel.value = String(def);
      return;
    }

    if (items.length) muniSel.value = String(items[0].id);
  }

  async function loadAndRender(muniId){
    const meta = $("fxMeta");

    try{
      const url = new URL(FORECAST_URL, ORIGIN);
      if (muniId) url.searchParams.set("m", String(muniId));
      url.searchParams.set("t", String(Date.now()));

      const fx = await fetchJson(url.toString());

      const provider = fx.provider || "—";
      const updated = fx.updated_ts ? timeAgo(fx.updated_ts) : "—";

      setHeaderPlace();

      const placeForStatus = getSelectedMuniName() || "Valls";
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
      if (status) status.textContent = `Error carregant previsió (/api/forecast): ${e?.message || e}`;
      const hw = $("hourlyWrap"); if (hw) hw.innerHTML = `<p class="muted-line">Error carregant previsió.</p>`;
      const dw = $("dailyWrap");  if (dw) dw.innerHTML = `<p class="muted-line">Error carregant previsió.</p>`;
    }
  }

  async function initSelectors(){
    if (status) status.textContent = "Carregant municipis…";

    // 1) carrega municipis del Worker
    const muniUrl = new URL(MUNICIPIS_URL, ORIGIN);
    muniUrl.searchParams.set("t", String(Date.now()));

    const cfg = await fetchJson(muniUrl.toString());
    const rawGroups = Array.isArray(cfg?.groups) ? cfg.groups : null;

    if (!rawGroups || !rawGroups.length) {
      throw new Error("Resposta /api/municipis sense groups (buit o format inesperat).");
    }

    zones = normGroupsToZones(rawGroups);

    if (!zones.length) {
      throw new Error(`No he pogut normalitzar zones. Labels rebuts: ${rawGroups.map(g=>g?.label).join(", ")}`);
    }

    // 2) decideix zona inicial
    const savedZone = localStorage.getItem(LS_ZONE);
    const savedGlobalMuni = localStorage.getItem(LS_MUNI_GLOBAL);
    const inferredZoneFromGlobal = findZoneContainingMuni(savedGlobalMuni);

    const zoneLabel =
      (savedZone && groupByLabel(savedZone)) ? savedZone :
      (inferredZoneFromGlobal && groupByLabel(inferredZoneFromGlobal)) ? inferredZoneFromGlobal :
      "Municipis Alt Camp";

    populateZoneSelect(zoneLabel);

    // 3) municipi inicial per zona
    const currentZone = zoneSel ? String(zoneSel.value || zoneLabel) : zoneLabel;
    const savedMuniForZone = localStorage.getItem(muniKeyForZone(currentZone));

    populateMuniSelect(
      currentZone,
      savedMuniForZone || (currentZone === inferredZoneFromGlobal ? savedGlobalMuni : null)
    );

    // 4) render inicial
    setHeaderPlace();
    await loadAndRender(muniSel ? muniSel.value : VALLS_ID);

    // 5) listeners
    if (zoneSel) {
      zoneSel.addEventListener("change", async () => {
        const z = String(zoneSel.value || "");
        localStorage.setItem(LS_ZONE, z);

        const lastMuni = localStorage.getItem(muniKeyForZone(z));
        populateMuniSelect(z, lastMuni);

        setHeaderPlace();

        const muniId = muniSel ? String(muniSel.value || "") : "";
        if (muniId) {
          localStorage.setItem(LS_MUNI_GLOBAL, muniId);
          localStorage.setItem(muniKeyForZone(z), muniId);
          await loadAndRender(muniId);
        }
      });
    }

    if (muniSel) {
      muniSel.addEventListener("change", async () => {
        const z = zoneSel ? String(zoneSel.value || "") : "";
        const id = String(muniSel.value || "");
        if (!id) return;

        localStorage.setItem(LS_MUNI_GLOBAL, id);
        if (z) localStorage.setItem(muniKeyForZone(z), id);

        setHeaderPlace();
        await loadAndRender(id);
      });
    }
  }

  initSelectors().catch(async (e) => {
    console.error(e);
    if (status) status.textContent = `ERROR /api/municipis: ${e?.message || e}`;

    // fallback mínim (però ara TE'N ENTERES)
    if (zoneSel) {
      zoneSel.innerHTML = `<option value="Municipis Alt Camp">Municipis Alt Camp</option>`;
      zoneSel.value = "Municipis Alt Camp";
    }
    if (muniSel) {
      muniSel.innerHTML = `<option value="${VALLS_ID}">★ Valls</option>`;
      muniSel.value = VALLS_ID;
    }

    setHeaderPlace();
    await loadAndRender(VALLS_ID);
  });
}
