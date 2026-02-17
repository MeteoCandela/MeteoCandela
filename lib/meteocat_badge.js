// lib/meteocat_badge.js
import { getApi } from "./env.js";

export async function initMeteocatBadge(){
  const badge = document.getElementById("meteocatIcon");
  const countEl = document.getElementById("meteocatIconCount");
  if (!badge) return;

  try {
    const { API_BASE } = getApi();
    const res = await fetch(`${API_BASE}/meteocat/alerts/summary`, { cache:"no-store" });
    const j = await res.json();

    if (!j?.ok) {
      badge.classList.add("mv-hidden");
      badge.classList.remove("is-warn","is-danger");
      if (countEl) countEl.textContent = "";
      return;
    }

    // mostra només si hi ha avisos reals
    const has = !!j.has_alerts || Number(j.count || 0) > 0 || Number(j.max_perill || 0) > 0;
    if (!has) {
      badge.classList.add("mv-hidden");
      badge.classList.remove("is-warn","is-danger");
      if (countEl) countEl.textContent = "";
      return;
    }

    badge.classList.remove("mv-hidden");

    const p = Number(j.max_perill || 0);
    badge.classList.toggle("is-warn", p >= 1 && p < 2);
    badge.classList.toggle("is-danger", p >= 2);

    const n = Number(j.count || 0);
    if (countEl) countEl.textContent = n > 0 ? String(n) : "";

  } catch (e) {
    badge.classList.add("mv-hidden");
    badge.classList.remove("is-warn","is-danger");
    if (countEl) countEl.textContent = "";
  }
}
