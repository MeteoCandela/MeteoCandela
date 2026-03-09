// pages/poda.js (ESM) — Calendari anual de poda + semàfor AEMET (Alt Camp)

import { getApi } from "../lib/env.js";

const months = ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];

// -----------------------------
// DADES (calendari anual)
// -----------------------------
const PRUNE_DATA = {
  legend: {
  winter_structural: "Poda principal (estructura, renovació i sanejament)",
  green_summer: "Retocs en verd (xupons, aclarida i aireig)",
  touchup: "Retocs suaus o de forma",
},
  plants: [
    // --- Base ---
    {
  id:"olive", name:"Olivera", type:"fruit_mediterrani",
  windows:{
    winter_structural:[0,1,1,1,0,0,0,0,0,0,0,0],
    green_summer:[0,0,0,0,1,1,0,0,0,0,0,0],
    touchup:[0,0,0,0,0,0,0,0,1,1,0,0]
  },
  notes:[
    "Poda principal a finals d’hivern i inici de primavera, evitant gelades i dies molt humits.",
    "A finals de primavera es poden fer retocs lleus: xupons, branques molt verticals o aclarida suau per aireig.",
    "A l’estiu no és època de poda forta."
  ]
},
    {
      id:"almond", name:"Ametller", type:"fruiter_os",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,0,0,0,0,0,0]
      },
      notes:[
  "Poda principal preferentment entre febrer i març, millor evitant els dies de fred intens.",
  "A finals de primavera es poden fer petits retocs de vigor o aireig si l’arbre va massa carregat.",
  "Evita podes fortes en plena calor o amb risc de gelada."
]
    },
    {
      id:"hazelnut", name:"Avellaner", type:"fruiter_arbustiu",
      windows:{
        winter_structural:[0,1,1,1,0,0,0,0,0,0,0,0],
        touchup:[0,0,0,0,0,0,0,0,1,0,0,0]
      },
      notes:[
  "Poda de renovació i aclarida a finals d’hivern i inici de primavera.",
  "Convé eliminar tanys vells, fusta mal orientada i excés de rebrots des de la base.",
  "Els retocs de tardor han de ser lleus i només de manteniment."
]
    },
    {
      id:"apple_pear", name:"Pomera / Perera", type:"fruiter_llavor",
      windows:{
        winter_structural:[1,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,1,0,0,0,0,0]
      },
      notes:[
  "Poda principal d’hivern entre gener i març per donar forma i regular la producció.",
  "Entre maig i juliol es poden fer aclarides suaus i eliminació de brots massa vigorosos.",
  "La poda en verd és complementària i no substitueix la poda principal."
]
    },
    {
      id:"stone_fruit", name:"Cirerer / Prunera / Presseguer", type:"fruiter_os",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,1,0,0,0]
      },
      notes:[
  "La poda principal sol fer-se entre finals d’hivern i inici de primavera, evitant fred intens.",
  "En moltes varietats és molt útil la poda en verd o postcollita per aireig i control del vigor.",
  "Evita podes fortes en dies humits o amb risc de malalties de fusta."
]
    },
    {
      id:"citrus", name:"Cítrics", type:"fruiter_perenne",
      windows:{
        winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0],
        touchup:[0,0,0,0,1,1,0,0,0,0,0,0]
      },
      notes:[
  "Poda principal entre març i abril, quan baixa el risc de fred tardà.",
  "Convé eliminar branques seques, mal orientades o que espesseixen massa la copa.",
  "Els retocs de temporada han de ser suaus."
]
    },
    {
      id:"roses", name:"Rosers", type:"ornamental",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,1,1,1,0,0,0],
        touchup:[0,0,0,0,1,1,1,1,1,1,0,0]
      },
      notes:[
  "Poda principal entre febrer i març per estimular rebrot i floració.",
  "Durant la temporada es poden anar traient flors passades, branques seques i brots desordenats.",
  "Els retocs d’estiu i tardor són de manteniment, no de renovació forta."
]
    },
    {
      id:"hydrangea", name:"Hortènsies", type:"ornamental",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,0,1,1,1,0,0,0]
      },
      notes:[
  "Poda de sanejament i aclarida entre febrer i març, segons el tipus d’hortènsia.",
  "A l’estiu només convé retirar parts seques o descompensades si cal.",
  "No totes les varietats admeten la mateixa intensitat de poda."
]
    },
    {
      id:"hedges", name:"Bardisses (xiprer/llorer)", type:"bardissa",
      windows:{
        winter_structural:[0,0,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,0,0,0,0,0,0],
        touchup:[0,0,0,0,0,0,0,0,1,1,0,0]
      },
      notes:[
  "Retall principal a finals d’hivern o inici de primavera per definir la forma general.",
  "A finals de primavera i inici d’estiu es poden fer repassos per mantenir densitat i línia.",
  "Els retocs de tardor han de ser lleus."
]
    },

    // --- Fruiters mediterranis habituals ---
    {
      id:"fig", name:"Figuera", type:"fruiter_mediterrani",
      windows:{
        winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,0,0,0,0,0]
      },
      notes:[
        "Poda principal a finals d’hivern/inici primavera (març–abril), evitant gelades tardanes.",
        "A l’estiu, només aclarides suaus i xupons."
      ]
    },
    {
      id:"pomegranate", name:"Magraner", type:"fruiter_mediterrani",
      windows:{
        winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,0,0,0,0]
      },
      notes:[
        "Poda de formació i aclarida mar–abr; elimina rebrots basals.",
        "En verd (jun–ago): control de vigor i aireig."
      ]
    },
    {
      id:"persimmon", name:"Caqui", type:"fruiter_perenne",
      windows:{
        winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,0,0,0,0,0]
      },
      notes:[
        "Poda de formació mar–abr; vigila branques carregades (fràgils).",
        "A l’estiu, només retocs suaus."
      ]
    },

    // --- Fruiters d’os (detallats) ---
    {
      id:"apricot", name:"Albercoquer", type:"fruiter_os",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,0,0,0,0]
      },
      notes:[
        "Poda d’hivern preferentment feb–mar (minimitza risc de gel).",
        "Poda en verd postcollita per reduir malalties de fusta."
      ]
    },
    {
      id:"plum", name:"Prunera", type:"fruiter_os",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,1,0,0,0]
      },
      notes:[
        "Evita podes fortes amb fred; feb–mar millor que gener.",
        "A l’estiu i fins setembre: podes lleugeres i aireig."
      ]
    },
    {
      id:"cherry", name:"Cirerer", type:"fruiter_os",
      windows:{
        winter_structural:[0,0,0,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,1,0,0,0]
      },
      notes:[
        "Millor poda en verd i postcollita (jun–set) per minimitzar gomosi i fongs.",
        "En hivern, només sanejament mínim si cal."
      ]
    },
    {
      id:"peach", name:"Presseguer / Nectarina", type:"fruiter_os",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,1,1,0,0,0,0]
      },
      notes:[
        "Poda principal feb–mar (formació i fructificació).",
        "En verd (mai–ago): aclarida de brots i control de vigor."
      ]
    },

    // --- Altres ---
    {
      id:"walnut", name:"Noguera", type:"fruiter_llavor",
      windows:{
        winter_structural:[0,0,0,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,1,1,1,0,0,0,0,0]
      },
      notes:[
  "Evita la poda d’hivern perquè la noguera tendeix a sagnar molt.",
  "Millor fer retalls moderats entre finals de primavera i estiu.",
  "Convé limitar-se a talls nets i no excessius."
]
    },
    {
      id:"mulberry", name:"Morera", type:"ornamental",
      windows:{
        winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0],
        touchup:[0,0,0,0,0,1,1,0,0,0,0,0]
      },
      notes:[
        "Poda de formació i control feb–mar.",
        "A l’estiu, retocs suaus si molesta (ombra/branques)."
      ]
    },

    // --- Aromàtiques ---
    {
      id:"lavender", name:"Espígol", type:"arbust_aromatic",
      windows:{
        touchup:[0,0,0,1,1,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,0,1,0,0,0,0,0]
      },
      notes:[
        "Retalla després de florir (primavera) sense entrar a fusta vella.",
        "Evita poda forta a l’hivern."
      ]
    },
    {
      id:"rosemary", name:"Romaní", type:"arbust_aromatic",
      windows:{ touchup:[0,0,0,1,1,1,0,0,0,0,0,0] },
      notes:[
        "Retocs de forma a primavera (abr–jun).",
        "Evita tallar massa fusta vella."
      ]
    },
    {
      id:"sage", name:"Sàlvia", type:"arbust_aromatic",
      windows:{ touchup:[0,0,0,1,1,0,0,0,0,0,0,0] },
      notes:[
        "Poda lleugera a primavera (abr–mai) per rejovenir.",
        "Evita excés de poda a l’hivern."
      ]
    },

    // --- Enfiladisses ornamentals ---
    {
      id:"wisteria", name:"Glicina", type:"ornamental",
      windows:{
        winter_structural:[1,1,0,0,0,0,0,0,0,0,0,0],
        green_summer:[0,0,0,0,0,1,1,1,0,0,0,0]
      },
      notes:[
        "Poda d’estructura a l’hivern (gen–feb) i retall de brots llargs a l’estiu.",
        "Millora floració i control del volum."
      ]
    },
    {
      id:"bougainvillea", name:"Buganvíl·lia", type:"ornamental",
      windows:{
        winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0],
        touchup:[0,0,0,0,1,1,1,0,0,0,0,0]
      },
      notes:[
        "Poda quan baixa el risc de fred (mar–abr).",
        "Retocs suaus en temporada per estimular floració."
      ]
    },

    // --- Bardisses habituals ---
    {
      id:"privet", name:"Lligustrum (bardissa)", type:"bardissa",
      windows:{
        green_summer:[0,0,0,0,1,1,1,0,0,0,0,0],
        touchup:[0,0,0,0,0,0,0,0,1,1,0,0]
      },
      notes:[
        "Retalls principals a final primavera i inici d’estiu.",
        "Un últim retoc a set–oct per frenar rebrot de tardor."
      ]
    },
    {
      id:"pittosporum", name:"Pitospor (Pittosporum)", type:"bardissa",
      windows:{
        green_summer:[0,0,0,0,1,1,0,0,0,0,0,0],
        touchup:[0,0,0,0,0,0,0,0,1,0,0,0]
      },
      notes:[
        "Retall de forma maig–juny; evita podes fortes amb calor.",
        "Retoc suau al setembre si cal."
      ]
    }
  ],
};

// -----------------------------
// HELPERS
// -----------------------------
const $ = (id) => document.getElementById(id);

const numOrNull = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};
const isFiniteNum = (x) => Number.isFinite(x);

function minFinite(arr){
  const xs = (arr || []).filter(Number.isFinite);
  return xs.length ? Math.min(...xs) : null;
}
function maxFinite(arr){
  const xs = (arr || []).filter(Number.isFinite);
  return xs.length ? Math.max(...xs) : null;
}
function sumFinite(arr){
  const xs = (arr || []).filter(Number.isFinite);
  return xs.length ? xs.reduce((a,b)=>a+b,0) : 0;
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c]));
}
function escapeAttr(s){
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c])).replace(/\n/g, " ");
}

function safeSetHtml(id, html){
  const el = $(id);
  if (!el) return false;
  el.innerHTML = html;
  return true;
}
function safeOn(id, evt, fn){
  const el = $(id);
  if (!el) return false;
  el.addEventListener(evt, fn);
  return true;
}

function fillPlantFilter(){
  const sel = $("plantFilter");
  if (!sel) return;

  sel.querySelectorAll('option[data-plant="1"]').forEach(o => o.remove());

  for (const p of PRUNE_DATA.plants){
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    o.dataset.plant = "1";
    sel.appendChild(o);
  }
}

function activityKeysForPlant(p){
  const keys = [];
  if (p.windows?.winter_structural) keys.push("winter_structural");
  if (p.windows?.green_summer) keys.push("green_summer");
  if (p.windows?.touchup) keys.push("touchup");
  return keys;
}
function boxClassForKey(k){
  if (k === "winter_structural") return "k-winter";
  if (k === "green_summer") return "k-summer";
  if (k === "touchup") return "k-touch";
  return "";
}

// -----------------------------
// METEO: normalització + semàfor
// -----------------------------
function normalizeForecast(raw){
  const daily = (raw?.daily || []).map(d => ({
    date: d.date,
    tmin: numOrNull(d.tmin_c),
    tmax: numOrNull(d.tmax_c),
    pop:  numOrNull(d.pop_pct),
    wind: numOrNull(d.wind_kmh),
    gust: numOrNull(d.gust_kmh),
  }));

  const hourly = (raw?.hourly || []).map(h => ({
    date: h.date,
    pop:  numOrNull(h.pop_pct),
    rain: numOrNull(h.rain_mm),
    wind: numOrNull(h.wind_kmh),
    gust: numOrNull(h.gust_kmh),
  }));

  return { daily, hourly };
}

function summarizeForPruning(norm){
  const d0 = norm.daily?.[0] || {};
  const today = d0.date || null;
  const next3 = (norm.daily || []).slice(0,3);

  const tmin3d = minFinite(next3.map(d=>d.tmin));
  const tmaxToday = d0.tmax;
  const popDaily = d0.pop;

  const hToday = today ? (norm.hourly || []).filter(h=>h.date === today) : [];

  const gustMax = maxFinite([...hToday.map(h=>h.gust), d0.gust]);
  const windMax = maxFinite([...hToday.map(h=>h.wind), d0.wind]);
  const windRef = isFiniteNum(gustMax) ? gustMax : windMax;

  const rainMmToday = sumFinite(hToday.map(h=>h.rain));
  const hasRain = rainMmToday > 0;

  const popHourlyMax = maxFinite(hToday.map(h=>h.pop));
  const popToday = isFiniteNum(popDaily) ? popDaily : popHourlyMax;

  return { date: today, tmin3d, tmaxToday, popToday, windRef, rainMmToday, hasRain };
}

function gradePruning(s){
  const blocks = [];

  if (isFiniteNum(s.tmin3d) && s.tmin3d <= 0) blocks.push("Gelada (Tmin ≤ 0 °C en 72 h)");
  if (s.hasRain) blocks.push("Pluja avui");
  else if (isFiniteNum(s.popToday) && s.popToday >= 60) blocks.push("Risc pluja (≥60%)");
  if (isFiniteNum(s.windRef) && s.windRef >= 45) blocks.push("Vent/ratxes (≥45 km/h)");

  if (blocks.length) return { status:"no", text:`⛔ No recomanat: ${blocks.join(" · ")}` };
  return { status:"yes", text:"✅ Condicions bones" };
}

function renderBadge(summary, errMsg = ""){
  const slot = $("pruneMeteo");
  if (!slot) return;

  if (!summary?.date) {
    const t = errMsg ? ` title="${escapeAttr(errMsg)}"` : "";
    slot.innerHTML = `<span class="pill"${t}>Predicció no disponible</span>`;
    return;
  }

  const g = gradePruning(summary);
  slot.innerHTML = `<span class="pill">${escapeHtml(g.text)}</span>`;
}

// -----------------------------
// UI: grid anual + notes plegables
// -----------------------------
function renderGrid({ plantId="", type="", summary=null } = {}){
  const host = $("pruneGrid");
  if (!host) return;

  const monthNow = new Date().getMonth();

  const plants = PRUNE_DATA.plants.filter(p=>{
    if (plantId && p.id !== plantId) return false;
    if (type && p.type !== type) return false;
    return true;
  });

  const grid = document.createElement("div");
  grid.className = "pg";

  const head = (txt) => {
    const d = document.createElement("div");
    d.className = "cell head";
    d.textContent = txt;
    return d;
  };

  const cell = (cls) => {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  };

  // ✅ TOP-LEFT = head + rowhead (sticky top + sticky left)
  const tl = head("Planta");
  tl.classList.add("rowhead");
  grid.appendChild(tl);

  months.forEach(m => grid.appendChild(head(m)));

  for (const p of plants){
    const left = document.createElement("div");
    left.className = "cell rowhead";

    const note = (p.notes && p.notes.length) ? p.notes.join(" ") : "";

    left.innerHTML = `
      <div class="plant-title">
        <div class="plant-name">${escapeHtml(p.name)}</div>
        ${note ? `<button type="button" class="plant-info-btn" aria-expanded="false">Info</button>` : ""}
      </div>
      ${note ? `<div class="plant-note">${escapeHtml(note)}</div>` : ""}
    `;

    grid.appendChild(left);

    if (note) {
      const btn = left.querySelector(".plant-info-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          // només una oberta a la vegada
          grid.querySelectorAll(".rowhead.is-open").forEach((el) => {
            if (el !== left) {
              el.classList.remove("is-open");
              const b = el.querySelector(".plant-info-btn");
              if (b) { b.setAttribute("aria-expanded","false"); b.textContent = "Info"; }
            }
          });

          const open = left.classList.toggle("is-open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          btn.textContent = open ? "Tanca" : "Info";
        });
      }
    }

    for (let mi=0; mi<12; mi++){
      const c = cell("cell dot");
      const b = document.createElement("div");
      b.className = "box k-off";

      const activeKeys = activityKeysForPlant(p).filter(k => p.windows?.[k]?.[mi] === 1);

      if (activeKeys.length){
        const prio = ["winter_structural","green_summer","touchup"];
        const key = prio.find(x=>activeKeys.includes(x)) || activeKeys[0];
        b.className = `box ${boxClassForKey(key)}`;

        // semàfor només al mes actual
        if (summary && mi === monthNow){
          const g = gradePruning(summary);
          if (g.status === "no") b.classList.add("k-dim");
        }
      }

      c.appendChild(b);
      grid.appendChild(c);
    }
  }

  host.innerHTML = "";
  host.appendChild(grid);

  // repaint Android
  host.style.display = "none";
  host.offsetHeight;
  host.style.display = "";
}

// -----------------------------
// API forecast
// -----------------------------
async function fetchJson(url){
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
  if (!res.ok) {
    const msg = (data && (data.error || data.detail))
      ? `${data.error || "error"} ${data.detail || ""}`.trim()
      : txt.slice(0, 180);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data;
}

async function fetchForecast(muniId){
  const api = getApi?.() || {};
  const ORIGIN = window.location.origin;
  const FORECAST_URL = api.FORECAST_URL || "/api/forecast";

  const url = new URL(FORECAST_URL, ORIGIN);
  url.searchParams.set("m", String(muniId || "43161"));
  url.searchParams.set("t", String(Date.now()));

  return fetchJson(url.toString());
}

// -----------------------------
// ENTRYPOINT
// -----------------------------
export async function initPoda(){
  const root = $("pruneApp");
  if (!root) return;

  const muniId = root.dataset.muni || "43161";

  fillPlantFilter();
  renderGrid({}); // inicial
  renderBadge(null);

  const getFilters = () => ({
    plantId: $("plantFilter")?.value || "",
    type: $("typeFilter")?.value || ""
  });

  const apply = (summary) => {
    const { plantId, type } = getFilters();
    renderBadge(summary);
    renderGrid({ plantId, type, summary });
  };

  safeOn("plantFilter", "change", () => apply(window.__PODA_SUMMARY__ || null));
  safeOn("typeFilter", "change", () => apply(window.__PODA_SUMMARY__ || null));

  safeOn("btnRefreshPrune", "click", async () => {
    safeSetHtml("pruneMeteo", `<span class="pill">Carregant predicció…</span>`);
    try{
      const raw = await fetchForecast(muniId);
      const norm = normalizeForecast(raw);
      const summary = summarizeForPruning(norm);
      window.__PODA_SUMMARY__ = summary;
      apply(summary);
    } catch (e) {
      renderBadge(null, e?.message || String(e));
      apply(null);
    }
  });

  // meteo inicial
  try{
    const raw = await fetchForecast(muniId);
    const norm = normalizeForecast(raw);
    const summary = summarizeForPruning(norm);
    window.__PODA_SUMMARY__ = summary;
    apply(summary);
  } catch (e) {
    renderBadge(null, e?.message || String(e));
    apply(null);
  }
}
