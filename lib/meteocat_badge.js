// lib/meteocat_badge.js
import { getApi } from "./env.js";

function getDemo() {
  try {
    return new URL(location.href).searchParams.get("demo");
  } catch {
    return null;
  }
}

// =========================
// Utilitats (igual idea que avisos.js)
// =========================

function safeText(x, fallback = "—") {
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

function ymdFromDia(dia) {
  const s = String(dia || "").trim();
  return s ? s.slice(0, 10) : "";
}

function normPeriode(p) {
  return String(p || "").trim().replaceAll(" ", "");
}

/**
 * Agrupa episodis que són el mateix avís però en franges diferents.
 * Retorna un array d'objectes agrupats (un per "avís").
 */
function groupItems(items) {
  const map = new Map();

  for (const it of items || []) {
    const g = {
      meteor: safeText(it?.meteor, "Meteor"),
      tipus: safeText(it?.tipus, "Avís"),
      comarca: safeText(it?.comarca, ""),
      perill: Number(it?.perill ?? 0),
      dia: String(it?.dia ?? ""),
      llindar: safeText(it?.llindar, ""),
      inici: String(it?.inici ?? ""),
      fi: String(it?.fi ?? ""),
      coment: safeText(it?.comentari, "—"),
      periodes: [],
    };

    // Clau d'agrupació (mateix criteri que a avisos.js)
    const key = [
      g.meteor,
      g.tipus,
      g.comarca,
      ymdFromDia(g.dia),
      g.perill,
      g.llindar,
      g.inici,
      g.fi,
      g.coment,
    ].join("|");

    if (!map.has(key)) map.set(key, g);

    const per = normPeriode(it?.periode);
    if (per) {
      const agg = map.get(key);
      if (!agg.periodes.includes(per)) agg.periodes.push(per);
    }
  }

  return Array.from(map.values());
}

// =========================
// Badge
// =========================

export async function initMeteocatBadge() {
  const badge = document.getElementById("meteocatIcon");
  const countEl = document.getElementById("meteocatIconCount");
  if (!badge) return;

  function applyState({ visible, perill, count }) {
    badge.style.visibility = visible ? "visible" : "hidden";

    badge.classList.toggle("mv-hidden", !visible);
    badge.classList.toggle("is-warn", Number(perill) >= 1 && Number(perill) <= 2);
    badge.classList.toggle("is-high", Number(perill) >= 3 && Number(perill) <= 4);
    badge.classList.toggle("is-danger", Number(perill) >= 5);

    if (countEl) countEl.textContent = Number(count) > 0 ? String(count) : "";
  }

  // ✅ DEMO
  const demo = getDemo();
  if (demo === "warn") return applyState({ visible: true, perill: 2, count: 1 });
  if (demo === "high") return applyState({ visible: true, perill: 4, count: 2 });
  if (demo === "danger") return applyState({ visible: true, perill: 6, count: 3 });
  if (demo === "off") return applyState({ visible: false, perill: 0, count: 0 });

  // ✅ NORMAL (API) — usem /meteocat/alerts i agrupem al client
  try {
    const { API_BASE } = getApi();
    const res = await fetch(`${API_BASE}/meteocat/alerts`, { cache: "no-store" });
    const j = await res.json().catch(() => null);

    if (!j?.ok || j.has_alerts !== true) {
      return applyState({ visible: false, perill: 0, count: 0 });
    }

    const items = Array.isArray(j.items) ? j.items : [];
    if (!items.length) {
      return applyState({ visible: false, perill: 0, count: 0 });
    }

    const grouped = groupItems(items);

    return applyState({
      visible: true,
      perill: j.max_perill || 0,     // perill màxim real (0..6)
      count: grouped.length || 0,    // ✅ “count” agrupat (no franges)
    });
  } catch {
    return applyState({ visible: false, perill: 0, count: 0 });
  }
}
