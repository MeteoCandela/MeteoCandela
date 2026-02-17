// lib/meteocat_badge.js
import { getApi } from "./env.js";

function $(id){ return document.getElementById(id); }

function levelToClass(maxPerill){
  // Meteocat: perill 1 (moderat) / 2 (alt) / 3 (molt alt) habitualment
  if (Number(maxPerill) >= 2) return "is-danger";
  if (Number(maxPerill) >= 1) return "is-warn";
  return "";
}

export async function initMeteocatBadge(){
  const badge = $("meteocatBadge");
  const txt = $("meteocatBadgeText");
  if (!badge || !txt) return;

  try {
    const { API_BASE } = getApi();

    // summary és molt lleuger i no et menja consultes
    const res = await fetch(`${API_BASE}/meteocat/alerts/summary`, { cache: "no-store" });
    const j = await res.json();

    if (!j?.ok || !j?.has_alerts) {
      badge.classList.add("mv-hidden");
      return;
    }

    const cls = levelToClass(j.max_perill);
    badge.classList.remove("mv-hidden");
    badge.classList.toggle("is-warn", cls === "is-warn");
    badge.classList.toggle("is-danger", cls === "is-danger");

    const n = Number(j.count || 0);
    txt.textContent = n > 0
      ? `⚠️ Avisos Meteocat (${n}) — Alt Camp`
      : `⚠️ Avisos Meteocat — Alt Camp`;

  } catch (e) {
    // Si falla, no molestem (no mostrem res)
    badge.classList.add("mv-hidden");
  }
}
