// lib/meteocat_badge.js
import { getApi } from "./env.js";

function $(id){ return document.getElementById(id); }

function levelToClass(maxPerill){
  if (Number(maxPerill) >= 2) return "is-danger";
  if (Number(maxPerill) >= 1) return "is-warn";
  return "";
}

export async function initMeteocatBadge(){

  const badge = document.getElementById("meteocatIcon");
  const count = document.getElementById("meteocatIconCount");
  if (!badge) return;

  try {
    const { API_BASE } = getApi();
    const res = await fetch(`${API_BASE}/meteocat/alerts/summary`, { cache:"no-store" });
    const j = await res.json();

    if (!j?.ok || !j.has_alerts) {
      badge.classList.add("mv-hidden");
      badge.classList.remove("is-danger");
      return;
    }

    badge.classList.remove("mv-hidden");

    // només pampalluga si perill ≥1
    if (Number(j.max_perill) >= 1) {
      badge.classList.add("is-danger");
    }

    const n = Number(j.count || 0);
    if (count) count.textContent = n || "";

  } catch {
    badge.classList.add("mv-hidden");
  }
}
