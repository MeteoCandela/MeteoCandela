// pages/poda.js
import { getApi } from "../lib/env.js";

const months = ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];

const PRUNE_DATA = {
  legend: {
    winter_structural: "Poda d’hivern (estructura/sanitària)",
    green_summer: "Poda en verd / estiu (control/aireig)",
    touchup: "Retocs estètics",
  },
  plants: [
    { id:"olive", name:"Olivera", type:"fruit_mediterrani",
      windows:{ winter_structural:[0,1,1,1,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,0,0,0,0,0,0], touchup:[0,0,0,0,0,0,0,0,1,1,0,0]},
      notes:["Poda principal: finals d’hivern i inici de primavera, evitant gelades i dies molt humits."]
    },
    { id:"vine", name:"Vinya", type:"fruit_mediterrani",
      windows:{ winter_structural:[1,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,1,1,1,0,0,0]},
      notes:["Poda d’hivern: gen–mar (evita gel i pluja). Poda en verd: maig–set."]
    },
    { id:"almond", name:"Ametller", type:"fruiter_os",
      windows:{ winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,0,0,0,0,0,0]},
      notes:["Millor feb–mar (Alt Camp)."]
    },
    { id:"hazelnut", name:"Avellaner", type:"fruiter_arbustiu",
      windows:{ winter_structural:[0,1,1,1,0,0,0,0,0,0,0,0], touchup:[0,0,0,0,0,0,0,0,1,0,0,0]},
      notes:["Renovació/aclarida: finals d’hivern–primavera."]
    },
    { id:"apple_pear", name:"Pomera / Perera", type:"fruiter_llavor",
      windows:{ winter_structural:[1,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,1,0,0,0,0,0]},
      notes:["Poda d’hivern gen–mar; en verd maig–juliol."]
    },
    { id:"stone_fruit", name:"Cirerer / Prunera / Presseguer", type:"fruiter_os",
      windows:{ winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,0,1,1,1,1,0,0,0]},
      notes:["Evita poda forta amb risc de gelada; postcollita en verd."]
    },
    { id:"citrus", name:"Cítrics (llimoner/taronger)", type:"fruiter_perenne",
      windows:{ winter_structural:[0,0,1,1,0,0,0,0,0,0,0,0], touchup:[0,0,0,0,1,1,0,0,0,0,0,0]},
      notes:["Mar–abr (evitant fred tardà)."]
    },
    { id:"roses", name:"Rosers", type:"ornamental",
      windows:{ winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,1,1,1,0,0,0], touchup:[0,0,0,0,1,1,1,1,1,1,0,0]},
      notes:["Poda principal feb–mar; manteniment temporada."]
    },
    { id:"hydrangea", name:"Hortènsies", type:"ornamental",
      windows:{ winter_structural:[0,1,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,0,0,1,1,1,0,0,0]},
      notes:["Feb–mar sanejant/aclarint (segons varietat)."]
    },
    { id:"hedges", name:"Bardisses (xiprer/photinia/llorer)", type:"bardissa",
      windows:{ winter_structural:[0,0,1,0,0,0,0,0,0,0,0,0], green_summer:[0,0,0,0,1,1,0,0,0,0,0,0], touchup:[0,0,0,0,0,0,0,0,1,1,0,0]},
      notes:["Retall principal març; retocs maig–juny i set–oct."]
     // --- AFEGEIX A PRUNE_DATA.plants ---
[
  {
    id: "fig",
    name: "Figuera",
    type: "fruiter_mediterrani",
    windows: {
      winter_structural: [0,0,1,1,0,0,0,0,0,0,0,0], // mar-abr
      green_summer:      [0,0,0,0,0,1,1,0,0,0,0,0]  // jun-jul (suau)
    },
    notes: [
      "Poda principal a finals d’hivern/inici primavera (març–abril), evitant gelades tardanes.",
      "A l’estiu, només aclarides suaus i xupons."
    ]
  },
  {
    id: "pomegranate",
    name: "Magraner",
    type: "fruiter_mediterrani",
    windows: {
      winter_structural: [0,0,1,1,0,0,0,0,0,0,0,0],
      green_summer:      [0,0,0,0,0,1,1,1,0,0,0,0]
    },
    notes: [
      "Poda de formació i aclarida mar–abr; elimina rebrots basals.",
      "En verd (jun–ago): control de vigor i aireig."
    ]
  },
  {
    id: "apricot",
    name: "Albercoquer",
    type: "fruiter_os",
    windows: {
      winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0], // feb-mar
      green_summer:      [0,0,0,0,0,1,1,1,0,0,0,0]  // jun-ago (postcollita sovint)
    },
    notes: [
      "Poda d’hivern preferentment feb–mar (minimitza risc de gel).",
      "Poda en verd postcollita per reduir malalties de fusta."
    ]
  },
  {
    id: "plum",
    name: "Prunera (separada)",
    type: "fruiter_os",
    windows: {
      winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
      green_summer:      [0,0,0,0,0,1,1,1,1,0,0,0]
    },
    notes: [
      "Evita podes fortes amb fred; feb–mar millor que gener.",
      "A l’estiu i fins setembre: podes lleugeres i aireig."
    ]
  },
  {
    id: "cherry",
    name: "Cirerer (separat)",
    type: "fruiter_os",
    windows: {
      winter_structural: [0,0,0,0,0,0,0,0,0,0,0,0], // millor evitar poda d’hivern intensa
      green_summer:      [0,0,0,0,0,1,1,1,1,0,0,0]
    },
    notes: [
      "Millor poda en verd i postcollita (jun–set) per minimitzar gomosi i fongs.",
      "En hivern, només sanejament mínim si cal."
    ]
  },
  {
    id: "peach",
    name: "Presseguer / Nectarina",
    type: "fruiter_os",
    windows: {
      winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
      green_summer:      [0,0,0,0,1,1,1,1,0,0,0,0]
    },
    notes: [
      "Poda principal feb–mar (formació i fructificació).",
      "En verd (mai–ago): aclarida de brots i control de vigor."
    ]
  },
  {
    id: "persimmon",
    name: "Caqui",
    type: "fruiter_perenne",
    windows: {
      winter_structural: [0,0,1,1,0,0,0,0,0,0,0,0],
      green_summer:      [0,0,0,0,0,1,1,0,0,0,0,0]
    },
    notes: [
      "Poda de formació mar–abr; vigila branques carregades (fràgils).",
      "A l’estiu, només retocs suaus."
    ]
  },
  {
    id: "walnut",
    name: "Noguera",
    type: "fruiter_llavor",
    windows: {
      winter_structural: [0,0,0,0,0,0,0,0,0,0,0,0], // evitar hivern
      green_summer:      [0,0,0,0,1,1,1,0,0,0,0,0]
    },
    notes: [
      "Evita poda d’hivern (sangrat). Millor finals primavera–estiu (mai–juliol).",
      "Retalls moderats i talls nets."
    ]
  },
  {
    id: "mulberry",
    name: "Morera",
    type: "ornamental",
    windows: {
      winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
      touchup:           [0,0,0,0,0,1,1,0,0,0,0,0]
    },
    notes: [
      "Poda de formació i control feb–mar.",
      "A l’estiu, retocs suaus si molesta (ombra/branques)."
    ]
  },

  // --- Arbustos aromàtics mediterranis (molt comuns) ---
  {
    id: "lavender",
    name: "Lavanda",
    type: "arbust_aromatic",
    windows: {
      touchup:      [0,0,0,1,1,0,0,0,0,0,0,0], // abr-mai (postfloració segons varietat)
      green_summer: [0,0,0,0,0,0,1,0,0,0,0,0]  // jul (retoc suau si cal)
    },
    notes: [
      "Retalla després de florir (primavera) sense entrar a fusta vella.",
      "Evita poda forta a l’hivern."
    ]
  },
  {
    id: "rosemary",
    name: "Romaní",
    type: "arbust_aromatic",
    windows: {
      touchup: [0,0,0,1,1,1,0,0,0,0,0,0]
    },
    notes: [
      "Retocs de forma a primavera (abr–jun).",
      "Evita tallar massa fusta vella."
    ]
  },
  {
    id: "sage",
    name: "Sàlvia",
    type: "arbust_aromatic",
    windows: {
      touchup: [0,0,0,1,1,0,0,0,0,0,0,0]
    },
    notes: [
      "Poda lleugera a primavera (abr–mai) per rejovenir.",
      "Evita excés de poda a l’hivern."
    ]
  },

  // --- Enfiladisses ornamentals ---
  {
    id: "wisteria",
    name: "Glicina",
    type: "ornamental",
    windows: {
      winter_structural: [1,1,0,0,0,0,0,0,0,0,0,0], // gen-feb (estructura)
      green_summer:      [0,0,0,0,0,1,1,1,0,0,0,0]  // jun-ago (retall brots llargs)
    },
    notes: [
      "Poda d’estructura a l’hivern (gen–feb) i retall de brots llargs a l’estiu.",
      "Millora floració i control del volum."
    ]
  },
  {
    id: "bougainvillea",
    name: "Buganvíl·lia",
    type: "ornamental",
    windows: {
      winter_structural: [0,0,1,1,0,0,0,0,0,0,0,0], // mar-abr
      touchup:           [0,0,0,0,1,1,1,0,0,0,0,0]  // mai-jul
    },
    notes: [
      "Poda quan baixa el risc de fred (mar–abr).",
      "Retocs suaus en temporada per estimular floració."
    ]
  },

  // --- Bardisses habituals ---
  {
    id: "privet",
    name: "Lligustrum (bardissa)",
    type: "bardissa",
    windows: {
      green_summer: [0,0,0,0,1,1,1,0,0,0,0,0], // mai-jul
      touchup:      [0,0,0,0,0,0,0,0,1,1,0,0]  // set-oct
    },
    notes: [
      "Retalls principals a final primavera i inici d’estiu.",
      "Un últim retoc a set–oct per frenar rebrot de tardor."
    ]
  },
  {
    id: "pittosporum",
    name: "Pitospor (Pittosporum)",
    type: "bardissa",
    windows: {
      green_summer: [0,0,0,0,1,1,0,0,0,0,0,0],
      touchup:      [0,0,0,0,0,0,0,0,1,0,0,0]
    },
    notes: [
      "Retall de forma maig–juny; evita podes fortes amb calor.",
      "Retoc suau al setembre si cal."
    ]
  }
]
    }
  ],
};

const $ = (id) => document.getElementById(id);
const numOrNull = (x) => { const n = Number(x); return Number.isFinite(n) ? n : null; };
const isFiniteNum = (x) => Number.isFinite(x);

function minFinite(arr){ const xs = arr.filter(Number.isFinite); return xs.length ? Math.min(...xs) : null; }
function maxFinite(arr){ const xs = arr.filter(Number.isFinite); return xs.length ? Math.max(...xs) : null; }
function sumFinite(arr){ const xs = arr.filter(Number.isFinite); return xs.length ? xs.reduce((a,b)=>a+b,0) : 0; }

function escapeHtml(s){ return String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c])); }

function fillPlantFilter(){
  const sel = $("plantFilter");
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
  const next3 = (norm.daily||[]).slice(0,3);

  const tmin3d = minFinite(next3.map(d=>d.tmin));
  const tmaxToday = d0.tmax;
  const popDaily = d0.pop;

  const hToday = today ? (norm.hourly||[]).filter(h=>h.date===today) : [];
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

function renderBadge(summary){
  const slot = $("pruneMeteo");
  if (!summary?.date) {
    slot.innerHTML = `<span class="pill">Predicció no disponible</span>`;
    return;
  }
  const g = gradePruning(summary);
  slot.innerHTML = `<span class="pill">${escapeHtml(g.text)}</span>`;
}

function renderGrid({ plantId="", type="", summary=null } = {}){
  const host = $("pruneGrid");
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

  grid.appendChild(head("Planta"));
  months.forEach(m => grid.appendChild(head(m)));

  for (const p of plants){
    const left = document.createElement("div");
    left.className = "cell rowhead";
    left.innerHTML = `<div>${escapeHtml(p.name)}<div class="muted" style="font-weight:400;font-size:12px;margin-top:6px">${escapeHtml(p.notes?.[0]||"")}</div></div>`;
    grid.appendChild(left);

    for (let mi=0; mi<12; mi++){
      const c = cell("cell dot");
      const b = document.createElement("div");
      b.className = "box k-off";

      const activeKeys = activityKeysForPlant(p).filter(k => p.windows?.[k]?.[mi] === 1);
      if (activeKeys.length){
        const prio = ["winter_structural","green_summer","touchup"];
        const key = prio.find(x=>activeKeys.includes(x)) || activeKeys[0];
        b.className = `box ${boxClassForKey(key)}`;

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
  host.style.display="none"; host.offsetHeight; host.style.display="";
}

async function fetchForecast(muniId){
  const API = getApi(); // <- AIXÒ és la clau: ha d'apuntar a meteocandela.cat
  const url = `${API}/api/forecast?muni=${encodeURIComponent(muniId)}`;
  const r = await fetch(url, { cache:"no-store" });
  if (!r.ok) throw new Error(`forecast http ${r.status}`);
  return r.json();
}

export async function initPoda(){
  const root = document.getElementById("pruneApp");
  if (!root) return;

  const muniId = root.dataset.muni || "43161";

  fillPlantFilter();
  renderGrid({}); // sempre, sense meteo

  const apply = (summary) => {
    const plantId = $("plantFilter").value || "";
    const type = $("typeFilter").value || "";
    renderBadge(summary);
    renderGrid({ plantId, type, summary });
  };

  $("plantFilter").addEventListener("change", ()=>apply(window.__PODA_SUMMARY__||null));
  $("typeFilter").addEventListener("change", ()=>apply(window.__PODA_SUMMARY__||null));
  $("btnRefreshPrune").addEventListener("click", async ()=>{
    $("pruneMeteo").innerHTML = `<span class="pill">Carregant predicció…</span>`;
    try{
      const raw = await fetchForecast(muniId);
      const norm = normalizeForecast(raw);
      const summary = summarizeForPruning(norm);
      window.__PODA_SUMMARY__ = summary;
      apply(summary);
    } catch(e){
      $("pruneMeteo").innerHTML = `<span class="pill">⛔ Predicció no disponible</span>`;
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
  } catch {
    apply(null);
  }
}
