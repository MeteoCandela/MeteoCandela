// lib/fullscreen_chart.js
export function initChartFullscreen(canvasIds = []) {
  if (typeof window === "undefined") return;
  if (!window.Chart || typeof window.Chart.getChart !== "function") {
    console.warn("Chart.js no disponible o Chart.getChart() no existeix.");
    return;
  }

  // Crea overlay 1 cop
  let overlay = document.getElementById("fsOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "fsOverlay";
    overlay.className = "fs-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Gràfica a pantalla completa");
    overlay.innerHTML = `
      <div class="fs-panel" role="document">
        <div class="fs-head">
          <div id="fsTitle" class="fs-title">Gràfica</div>
          <button id="fsClose" class="fs-close" type="button" aria-label="Tancar">✕</button>
        </div>
        <div class="fs-body">
          <div id="fsCanvasHost" class="fs-canvas-host"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const fsTitle = overlay.querySelector("#fsTitle");
  const fsClose = overlay.querySelector("#fsClose");
  const fsHost = overlay.querySelector("#fsCanvasHost");

  let active = null; // { canvas, placeholder, parent, nextSibling, chart }

  function openForCanvas(canvas) {
    if (!canvas) return;

    const chart = window.Chart.getChart(canvas);
    if (!chart) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Títol: agafa l'H2 del mateix card
    const card = canvas.closest(".card");
    const h2 = card ? card.querySelector("h2") : null;
    if (fsTitle) fsTitle.textContent = h2?.textContent?.trim() || "Gràfica";

    // Placeholder per no trencar layout
    const rect = canvas.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "fs-placeholder";
    placeholder.style.height = `${Math.max(140, rect.height || 260)}px`;

    active = {
      canvas,
      placeholder,
      parent,
      nextSibling: canvas.nextSibling,
      chart
    };

    parent.replaceChild(placeholder, canvas);
    fsHost.innerHTML = "";
    fsHost.appendChild(canvas);

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    overlay.classList.add("open");
    document.documentElement.classList.add("fs-lock");
    document.body.classList.add("fs-lock");

    try { chart.resize(); } catch {}
  }

  function closeModal() {
    if (!active) return;

    const { canvas, placeholder, parent, nextSibling, chart } = active;

    overlay.classList.remove("open");
    document.documentElement.classList.remove("fs-lock");
    document.body.classList.remove("fs-lock");

    if (nextSibling) parent.insertBefore(canvas, nextSibling);
    else parent.appendChild(canvas);

    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);

    canvas.style.width = "";
    canvas.style.height = "";

    try { chart.resize(); } catch {}

    active = null;
  }

  fsClose?.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  // IMPORTANT: ja NO fem click al canvas.
  // En comptes d'això, afegim un botó ⛶ al títol (h2) de cada chart-card.
  for (const id of canvasIds) {
    const canvas = document.getElementById(id);
    if (!canvas) continue;

    const card = canvas.closest(".card");
    const h2 = card ? card.querySelector("h2") : null;
    if (!h2) continue;

    // Evita duplicats si re-inicialitzes per error
    if (h2.querySelector(".fs-zoom-btn")) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fs-zoom-btn";
    btn.setAttribute("aria-label", "Veure la gràfica a pantalla completa");
    btn.title = "Pantalla completa";
    btn.textContent = "⛶";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openForCanvas(canvas);
    });

    h2.appendChild(btn);
    // Per UX: el canvas ja no “sembla clicable”
    canvas.classList.remove("fs-clickable");
  }
}
