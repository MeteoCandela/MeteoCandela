// poda.js (ESM) — calendari + semàfor meteo AEMET (format com el teu Forecast)
// Requisits:
// - tens un endpoint que et retorna EXACTAMENT l'objecte "Forecast" que has enganxat
//   Ex: /api/forecast?muni=43161 o similar (ajusta a fetchForecast())

const months = ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];

const PRUNE_DATA = {
  location: "Alt Camp (Valls)",
  months,
  legend: {
    winter_structural: "Poda d’hivern (estructura/sanitària)",
    green_summer: "Poda en verd / estiu (control/aireig)",
    touchup: "Retocs estètics",
  },
  plants: [
    {
      id: "olive",
      name: "Olivera",
      type: "fruit_mediterrani",
      windows: {
        winter_structural: [0,1,1,1,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,0,0,0,0,0,0],
        touchup:          [0,0,0,0,0,0,0,0,1,1,0,0]
      },
      notes: [
        "Poda principal: finals d’hivern i inici de primavera, evitant gelades i dies molt humits.",
        "A l’estiu: només xupons i aireig suau per evitar cremades."
      ]
    },
    {
      id: "vine",
      name: "Vinya",
      type: "fruit_mediterrani",
      windows: {
        winter_structural: [1,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,1,1,1,0,0,0]
      },
      notes: [
        "Poda d’hivern (poda seca): habitualment gen–mar; evita dies de gel i pluja.",
        "Poda en verd: maig–setembre (despuntat, aclarida, control de vigor)."
      ]
    },
    {
      id: "almond",
      name: "Ametller",
      type: "fruiter_os",
      windows: {
        winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,0,0,0,0,0,0]
      },
      notes: [
        "Millor feb–mar a l’Alt Camp (menys risc de gelada que al gener).",
        "En verd: xupons i aireig moderat."
      ]
    },
    {
      id: "hazelnut",
      name: "Avellaner",
      type: "fruiter_arbustiu",
      windows: {
        winter_structural: [0,1,1,1,0,0,0,0,0,0,0,0],
        touchup:          [0,0,0,0,0,0,0,0,1,0,0,0]
      },
      notes: [
        "Renovació i aclarida de tanys: finals d’hivern–primavera.",
        "Retoc suau postestiu si hi ha excés de vigor."
      ]
    },
    {
      id: "apple_pear",
      name: "Pomera / Perera",
      type: "fruiter_llavor",
      windows: {
        winter_structural: [1,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,1,0,0,0,0,0]
      },
      notes: [
        "Poda d’hivern gen–mar (sovint feb–mar és el punt òptim).",
        "En verd: maig–juliol per aireig i control de vigor."
      ]
    },
    {
      id: "stone_fruit",
      name: "Cirerer / Prunera / Presseguer",
      type: "fruiter_os",
      windows: {
        winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,0,1,1,1,1,0,0,0]
      },
      notes: [
        "Evita poda forta al gener si hi ha risc de gelades.",
        "Postcollita (estiu–setembre): podes lleugeres i aireig."
      ]
    },
    {
      id: "citrus",
      name: "Cítrics (llimoner/taronger)",
      type: "fruiter_perenne",
      windows: {
        winter_structural: [0,0,1,1,0,0,0,0,0,0,0,0],
        touchup:          [0,0,0,0,1,1,0,0,0,0,0,0]
      },
      notes: [
        "A l’Alt Camp, millor mar–abr (evitant fred tardà).",
        "Retocs suaus després de brotació."
      ]
    },
    {
      id: "roses",
      name: "Rosers",
      type: "ornamental",
      windows: {
        winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,1,1,1,0,0,0],
        touchup:          [0,0,0,0,1,1,1,1,1,1,0,0]
      },
      notes: [
        "Poda principal: feb–mar.",
        "Durant la temporada: despuntar i retirar flors passades."
      ]
    },
    {
      id: "hydrangea",
      name: "Hortènsies",
      type: "ornamental",
      windows: {
        winter_structural: [0,1,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,0,0,1,1,1,0,0,0]
      },
      notes: [
        "Poda segons varietat: com a norma, feb–mar sanejant i aclarint.",
        "A l’estiu: retirar inflorescències passades i retocs suaus."
      ]
    },
    {
      id: "hedges",
      name: "Bardisses (xiprer/photinia/llorer)",
      type: "bardissa",
      windows: {
        winter_structural: [0,0,1,0,0,0,0,0,0,0,0,0],
        green_summer:     [0,0,0,0,1,1,0,0,0,0,0,0],
        touchup:          [0,0,0,0,0,0,0,0,1,1,0,0]
      },
      notes: [
        "Retall principal: març (quan baixa el risc de gelada).",
        "Retocs: maig–juny i un últim retoc set–oct."
      ]
    }
  ]
};

// ---------- Meteo → semàfor ----------
// Treballem amb el teu Forecast: daily[] i hourly[].
function normalizeForecast(raw) {
  const daily = (raw?.daily || []).map(d => ({
    date: d.date,
    tmin: numOrNull(d.tmin_c),
    tmax: numOrNull(d.tmax_c),
    pop:  numOrNull(d.pop_pct),
    wind: numOrNull(d.wind_kmh),
    gust: numOrNull(d.gust_kmh),
    sky: d.sky || null
  }));

  // hourly pot contenir pluja (rain_mm) + gust
  const hourly = (raw?.hourly || []).map(h => ({
    date: h.date,
    hour: h.hour,
    temp: numOrNull(h.temp_c),
    pop:  numOrNull(h.pop_pct),
    rain: numOrNull(h.rain_mm),
    wind: numOrNull(h.wind_kmh),
    gust: numOrNull(h.gust_kmh),
    hum:  numOrNull(h.hum_pct),
    sky: h.sky || null,
    ts_local: h.ts_local || null
  }));

  return { daily, hourly };
}

function summarizeForPruning(norm) {
  const d0 = norm.daily[0] || {};
  const next3 = norm.daily.slice(0, 3);

  const tmin3d = minFinite(next3.map(d => d.tmin));
  const tmaxToday = finiteOrNull(d0.tmax);
  const popToday = finiteOrNull(d0.pop);

  // vent/ratxa: agafem màxim entre hourly d'avui i daily
  const today = d0.date;
  const hToday = norm.hourly.filter(h => h.date === today);
  const windMax = maxFinite([
    ...hToday.map(h => h.wind),
    finiteOrNull(d0.wind)
  ]);
  const gustMax = maxFinite([
    ...hToday.map(h => h.gust),
    finiteOrNull(d0.gust)
  ]);

  // pluja: si hi ha hourly rain_mm > 0 és pluja efectiva; si no, només probabilitat.
  const rainMmToday = sumFinite(hToday.map(h => h.rain));
  const hasRain = rainMmToday > 0;

  return {
    date: today || null,
    tmin3d,
    tmaxToday,
    popToday,
    windMax,
    gustMax,
    rainMmToday,
    hasRain,
    sky: d0.sky || null
  };
}

function gradePruning(summary) {
  // Bloquejos
  const blocks = [];

  if (isFinite(summary.tmin3d) && summary.tmin3d <= 0) blocks.push("Risc de gelada (Tmin ≤ 0 °C en 72 h).");
  // Pluja: o bé mm, o bé POP alta (quan tens POP=100)
  if (summary.hasRain) blocks.push("Pluja registrada avui (talls desfavorables).");
  else if (isFinite(summary.popToday) && summary.popToday >= 60) blocks.push("Probabilitat de pluja alta (≥ 60%).");

  const windRef = isFinite(summary.gustMax) ? summary.gustMax : summary.windMax;
  if (isFinite(windRef) && windRef >= 45) blocks.push("Vent/ratxes fortes (≥ 45 km/h).");

  if (blocks.length) {
    return { status: "no", title: "⛔ Avui no és bon dia per podar", detail: blocks.join(" ") };
  }

  // Cauteles
  const cautions = [];
  if (isFinite(summary.tmin3d) && summary.tmin3d <= 2) cautions.push("Fred (Tmin baixa): millor podes moderades i talls nets.");
  if (isFinite(summary.popToday) && summary.popToday >= 40) cautions.push("Possibles precipitacions: evita talls grans.");
  if (isFinite(windRef) && windRef >= 30) cautions.push("Vent moderat: precaució amb talls grans.");

  // Calor (no és el cas ara, però queda)
  if (isFinite(summary.tmaxToday) && summary.tmaxToday >= 32) cautions.push("Calor: millor primera hora i poda molt suau.");

  if (cautions.length) {
    return { status: "maybe", title: "🟧 Avui és acceptable amb cautela", detail: cautions.join(" ") };
  }

  return { status: "yes", title: "✅ Bon dia per podar", detail: "Condicions meteorològiques favorables." };
}

// Ajust per activitat (hivern / en verd / retoc)
function gradeByActivity(summary, activityId) {
  // personalitza llindars per tipus d'activitat
  // - hivern_structural: més estricta amb gelada i pluja
  // - green_summer: més estricta amb calor
  // - touchup: una mica més permissiva, però evita pluja efectiva i vent fort
  const base = gradePruning(summary);

  if (activityId === "touchup") {
    // si només era bloqueig per POP alta però sense pluja efectiva, podem passar a "maybe"
    if (base.status === "no" && !summary.hasRain && (summary.popToday ?? 0) >= 60) {
      return { status: "maybe", title: "🟧 Retoc possible amb cautela", detail: "Hi ha risc de pluja: fes només retocs mínims i evita talls grans." };
    }
  }

  if (activityId === "green_summer") {
    if (isFinite(summary.tmaxToday) && summary.tmaxToday >= 30) {
      // no bloquegem, però avisem
      if (base.status === "yes") return { status: "maybe", title: "🟧 En verd amb cautela", detail: "Millor a primera hora i amb intensitat baixa (evita exposar fusta)." };
    }
  }

  return base;
}

// ---------- UI ----------
const $ = (id) => document.getElementById(id);

function fillFilters() {
  const plantSel = $("plantFilter");
  PRUNE_DATA.plants.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    plantSel.appendChild(o);
  });
}

function getMonthIndexLocal() {
  const now = new Date();
  return now.getMonth(); // 0..11
}

function activityKeysForPlant(p) {
  // ordre fix (coherent amb llegenda)
  const keys = [];
  if (p.windows.winter_structural) keys.push("winter_structural");
  if (p.windows.green_summer) keys.push("green_summer");
  if (p.windows.touchup) keys.push("touchup");
  return keys;
}

function boxClassForKey(k) {
  if (k === "winter_structural") return "k-winter";
  if (k === "green_summer") return "k-summer";
  if (k === "touchup") return "k-touch";
  return "";
}

function renderGrid({ plantId = "", type = "", summary = null } = {}) {
  const host = $("pruneGrid");
  const grid = document.createElement("div");
  grid.className = "pg";

  // capçalera
  grid.appendChild(cell("Planta", "cell head"));
  months.forEach(m => grid.appendChild(cell(m, "cell head")));

  const monthNow = getMonthIndexLocal();

  const plants = PRUNE_DATA.plants.filter(p => {
    if (plantId && p.id !== plantId) return false;
    if (type && p.type !== type) return false;
    return true;
  });

  // files: una fila per planta (sumem activitats en una sola casella/mes)
  plants.forEach(p => {
    const left = document.createElement("div");
    left.className = "cell rowhead";
    left.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px">
        <div>${escapeHtml(p.name)}</div>
        <div class="muted" style="font-weight:400;font-size:12px">${escapeHtml(p.notes?.[0] || "")}</div>
      </div>
    `;
    grid.appendChild(left);

    for (let mi = 0; mi < 12; mi++) {
      const c = document.createElement("div");
      c.className = "cell dot";
      const b = document.createElement("div");
      b.className = "box k-off";

      // determina quines activitats estan ON aquest mes
      const activeKeys = activityKeysForPlant(p).filter(k => (p.windows[k]?.[mi] === 1));

      if (activeKeys.length) {
        // si hi ha més d'una activitat ON, fem “mix”:
        // - prioritat: hivern > en verd > retoc
        const prio = ["winter_structural","green_summer","touchup"];
        const key = prio.find(x => activeKeys.includes(x)) || activeKeys[0];
        b.className = `box ${boxClassForKey(key)}`;

        // semàfor meteo només per al mes actual (per no “marejar”)
        if (summary && mi === monthNow) {
          const g = gradeByActivity(summary, key);
          if (g.status === "no") b.classList.add("k-dim");

          const title = [
            `${p.name} — ${PRUNE_DATA.legend[key]}`,
            `Avui: ${g.title.replace(/^[✅🟧⛔]\s*/, "")}`,
            g.detail
          ].join("\n");
          b.title = title;
        } else {
          b.title = `${p.name} — ${PRUNE_DATA.legend[key]}`;
        }
      } else {
        b.title = `${p.name} — fora de temporada`;
      }

      c.appendChild(b);
      grid.appendChild(c);
    }
  });

  host.innerHTML = "";
  host.appendChild(grid);
}

function cell(txt, cls){
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = txt;
  return d;
}

function renderMeteoBadge(summary, grade) {
  const el = $("pruneMeteo");
  if (!summary?.date) {
    el.innerHTML = `<div class="badge b-neutral">Sense predicció disponible</div>`;
    return;
  }
  const bcls = grade.status === "yes" ? "b-ok" : (grade.status === "maybe" ? "b-maybe" : "b-no");
  const parts = [];
  if (isFinite(summary.tmaxToday) && isFinite(summary.tmin3d)) parts.push(`Tmax ${summary.tmaxToday}°C · Tmin(72h) ${summary.tmin3d}°C`);
  if (isFinite(summary.popToday)) parts.push(`POP ${summary.popToday}%`);
  const windRef = isFinite(summary.gustMax) ? summary.gustMax : summary.windMax;
  if (isFinite(windRef)) parts.push(`Vent/ratxa ${windRef} km/h`);
  if (summary.hasRain) parts.push(`Pluja ${summary.rainMmToday.toFixed(1)} mm`);

  el.innerHTML = `
    <div class="badge ${bcls}" title="${escapeAttr(grade.detail)}">${escapeHtml(grade.title)}</div>
    <div class="badge b-neutral">${escapeHtml(parts.join(" · ") || "—")}</div>
  `;
}

// ---------- Fetch (ajusta a la teva API) ----------
async function fetchForecast(muniId) {
  // AJUSTA AIXÒ:
  // Exemples:
  //  - return (await fetch(`/api/forecast?muni=${muniId}`)).json();
  //  - return (await fetch(`/api/forecast/${muniId}`)).json();
  const r = await fetch(`/api/forecast?muni=${encodeURIComponent(muniId)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`forecast http ${r.status}`);
  return r.json();
}

// ---------- Utils ----------
function numOrNull(x){ const n = Number(x); return Number.isFinite(n) ? n : null; }
function finiteOrNull(x){ return Number.isFinite(x) ? x : null; }
function minFinite(arr){
  const xs = arr.filter(Number.isFinite);
  return xs.length ? Math.min(...xs) : null;
}
function maxFinite(arr){
  const xs = arr.filter(Number.isFinite);
  return xs.length ? Math.max(...xs) : null;
}
function sumFinite(arr){
  const xs = arr.filter(Number.isFinite);
  return xs.length ? xs.reduce((a,b)=>a+b,0) : 0;
}
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
}
function escapeAttr(s){ return escapeHtml(s).replace(/\n/g, " "); }

// ---------- Boot ----------
async function boot() {
  fillFilters();

  const root = document.getElementById("pruneApp");
  const muniId = root?.dataset?.muni || "43161";

  const apply = (summary) => {
    const plantId = $("plantFilter").value;
    const type = $("typeFilter").value;

    // badge global (general, no per planta)
    const g = summary ? gradePruning(summary) : { status: "neutral", title: "—", detail: "" };
    if (summary) renderMeteoBadge(summary, g);

    renderGrid({ plantId, type, summary });
  };

  // listeners
  $("plantFilter").addEventListener("change", () => apply(window.__PRUNE_SUMMARY__ || null));
  $("typeFilter").addEventListener("change", () => apply(window.__PRUNE_SUMMARY__ || null));
  $("btnRefreshPrune").addEventListener("click", async () => {
    $("pruneMeteo").innerHTML = `<div class="badge b-neutral">Actualitzant predicció…</div>`;
    try {
      const raw = await fetchForecast(muniId);
      const norm = normalizeForecast(raw);
      const summary = summarizeForPruning(norm);
      window.__PRUNE_SUMMARY__ = summary;
      apply(summary);
    } catch (e) {
      console.warn(e);
      $("pruneMeteo").innerHTML = `<div class="badge b-no">⛔ No s’ha pogut carregar la predicció</div>`;
      apply(null);
    }
  });

  // càrrega inicial
  try {
    const raw = await fetchForecast(muniId);
    const norm = normalizeForecast(raw);
    const summary = summarizeForPruning(norm);
    window.__PRUNE_SUMMARY__ = summary;
    apply(summary);
  } catch (e) {
    console.warn(e);
    $("pruneMeteo").innerHTML = `<div class="badge b-no">⛔ Predicció no disponible</div>`;
    apply(null);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
  }
