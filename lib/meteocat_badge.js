// lib/meteocat_badge.js
import { getApi } from "./env.js";

function $(id){ return document.getElementById(id); }

function levelToClass(maxPerill){
  if (Number(maxPerill) >= 2) return "is-danger";
  if (Number(maxPerill) >= 1) return "is-warn";
  return "";
}

export async function initMeteocatBadge(){
  const icon = $("meteocatIcon");
  const countEl = $("meteocatIconCount");
  if (!icon || !countEl) return;

  try {
    const { API_BASE } = getApi();
    const res = await fetch(`${API_BASE}/meteocat/alerts/summary`, { cache: "no-store" });
    const j = await res.json();

    if (!j?.ok || !j?.has_alerts){
      icon.classList.add("mv-hidden");
      return;
    }

    const cls = levelToClass(j.max_perill);
    icon.classList.remove("mv-hidden");
    icon.classList.toggle("is-warn", cls === "is-warn");
    icon.classList.toggle("is-danger", cls === "is-danger");

    const n = Number(j.count || 0);
    countEl.textContent = n > 0 ? n : "";
    countEl.style.display = n > 0 ? "flex" : "none";

  } catch {
    icon.classList.add("mv-hidden");
  }
}
