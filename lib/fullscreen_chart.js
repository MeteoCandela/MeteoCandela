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

    // Títol: intenta agafar l'H2 del mateix card
    const card = canvas.closest(".card");
    const h2 = card ? card.querySelector("h2") : null;
    if (fsTitle) fsTitle.textContent = h2?.textContent?.trim() || "Gràfica";

    // Placeholder per no trencar layout
    const rect = canvas.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "fs-placeholder";
    placeholder.style.height = `${Math.max(120, rect.height || 260)}px`;

    // Guarda posició per restaurar
    active = {
      canvas,
      placeholder,
      parent,
      nextSibling: canvas.nextSibling,
      chart
    };

    // Substitueix canvas per placeholder i mou canvas al modal
    parent.replaceChild(placeholder, canvas);
    fsHost.innerHTML = "";
    fsHost.appendChild(canvas);

    // Aplica estils perquè ompli el contenidor
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    // Obre modal
    overlay.classList.add("open");
    document.documentElement.classList.add("fs-lock");
    document.body.classList.add("fs-lock");

    // Resize Chart.js
    try { chart.resize(); } catch {}
  }

  function closeModal() {
    if (!active) return;

    const { canvas, placeholder, parent, nextSibling, chart } = active;

    // Tanca modal
    overlay.classList.remove("open");
    document.documentElement.classList.remove("fs-lock");
    document.body.classList.remove("fs-lock");

    // Retorna canvas al lloc original
    if (nextSibling) parent.insertBefore(canvas, nextSibling);
    else parent.appendChild(canvas);

    // Treu placeholder
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);

    // Neteja estils
    canvas.style.width = "";
    canvas.style.height = "";

    // Resize Chart.js
    try { chart.resize(); } catch {}

    active = null;
  }

  // Events de tancar
  fsClose?.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    // Tanca només si cliques el fons (fora del panell)
    if (e.target === overlay) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  // Attach click handlers als canvas
  for (const id of canvasIds) {
    const c = document.getElementById(id);
    if (!c) continue;

    // millor UX: cursor i "tap to zoom"
    c.classList.add("fs-clickable");
    c.addEventListener("click", () => openForCanvas(c), { passive: true });
  }
}
