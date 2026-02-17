// lib/meteocat_badge.js
import { getApi } from "./env.js";

function getDemo() {
  try {
    return new URL(location.href).searchParams.get("demo");
  } catch {
    return null;
  }
}

export async function initMeteocatBadge(){
  const badge = document.getElementById("meteocatIcon");
  const countEl = document.getElementById("meteocatIconCount");
  if (!badge) return;

  // helper per pintar l’estat
  function applyState({ visible, perill, count }) {
  // evita flash inicial
  badge.style.visibility = visible ? "visible" : "hidden";

  badge.classList.toggle("mv-hidden", !visible);
  badge.classList.toggle("is-warn", Number(perill) >= 1 && Number(perill) < 2);
  badge.classList.toggle("is-danger", Number(perill) >= 2);

  if (countEl) countEl.textContent = (Number(count) > 0) ? String(count) : "";
  }

  // ✅ DEMO
  const demo = getDemo();
  if (demo === "warn")   return applyState({ visible:true,  perill:1, count:1 });
  if (demo === "danger") return applyState({ visible:true,  perill:2, count:3 });
  if (demo === "off")    return applyState({ visible:false, perill:0, count:0 });

  // ✅ NORMAL (API)
  try {
    const { API_BASE } = getApi();
    const res = await fetch(`${API_BASE}/meteocat/alerts/summary`, { cache:"no-store" });
    const j = await res.json();

    if (!j?.ok) return applyState({ visible:false, perill:0, count:0 });

    // NOMÉS quan Meteocat indica avisos
    const has = (j.has_alerts === true);
    if (!has) return applyState({ visible:false, perill:0, count:0 });

    return applyState({
      visible: true,
      perill: j.max_perill || 0,
      count:  j.count || 0
    });

  } catch {
    return applyState({ visible:false, perill:0, count:0 });
  }
}
