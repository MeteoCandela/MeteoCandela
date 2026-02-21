// lib/fullscreen_chart.js
// Fullscreen charts per Chart.js (modal) + botó ⛶ al títol (NO obre amb tap al canvas)

export function initChartFullscreen(canvasIds = []) {
  if (typeof window === "undefined") return;

  // Chart.js ha d'estar carregat i ha d'exposar Chart.getChart()
  if (!window.Chart || typeof window.Chart.getChart !== "function") {
    console.warn("Chart.js no disponible o Chart.getChart() no existeix.");
    return;
  }

  // =========================
  // 1) Overlay/modal (1 cop)
  // =========================
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

  // Estat del canvas mogut
  let active = null; // { canvas, placeholder, parent, nextSibling, chart }

  function setLock(on) {
    if (on) {
      document.documentElement.classList.add("fs-lock");
      document.body.classList.add("fs-lock");
    } else {
      document.documentElement.classList.remove("fs-lock");
      document.body.classList.remove("fs-lock");
    }
  }

  // ==================================
  // 2) Obrir/tancar modal
  // ==================================
  function openForCanvas(canvas) {
    if (!canvas) return;

    const chart = window.Chart.getChart(canvas);
    if (!chart) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Títol "net"
    const card = canvas.closest(".card");
    const h2 = card ? card.querySelector("h2") : null;

    const titleClean =
  (h2?.textContent || "")
    .replace(/\s*⛶\s*$/, "")
    .replace(/⛶/g, "")
    .trim() ||
  "Gràfica";

    if (fsTitle) fsTitle.textContent = titleClean;

    // Placeholder per no trencar la graella
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

    // Mou canvas al modal
    parent.replaceChild(placeholder, canvas);
    fsHost.innerHTML = "";
    fsHost.appendChild(canvas);

    // Assegura que el canvas ompli el contenidor del modal
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    overlay.classList.add("open");
    setLock(true);

    // Resize Chart.js
    try { chart.resize(); } catch {}
  }

  function closeModal() {
    if (!active) return;

    const { canvas, placeholder, parent, nextSibling, chart } = active;

    overlay.classList.remove("open");
    setLock(false);

    // Retorna canvas a la seva posició original
    if (nextSibling) parent.insertBefore(canvas, nextSibling);
    else parent.appendChild(canvas);

    // Elimina placeholder
    if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);

    // Neteja estils
    canvas.style.width = "";
    canvas.style.height = "";

    // Resize Chart.js
    try { chart.resize(); } catch {}

    active = null;
  }

// =========================
// Events de tancar (ROBUST)
// =========================
if (!overlay.__fsCloseDelegBound) {

  function tryCloseFromEvent(e) {
    const btn = e.target?.closest?.("#fsClose");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return true;
    }
    // clic/tap fora del panell
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
      return true;
    }
    return false;
  }

  // Click (capture)
  overlay.addEventListener("click", (e) => {
    tryCloseFromEvent(e);
  }, true);

  // Pointerdown (capture) — Android modern
  overlay.addEventListener("pointerdown", (e) => {
    tryCloseFromEvent(e);
  }, true);

  // Touchstart (capture) — Android WebView “tonto”
  overlay.addEventListener("touchstart", (e) => {
    tryCloseFromEvent(e);
  }, { capture: true, passive: false });

  overlay.__fsCloseDelegBound = true;
}

  // Clic al fons (fora del panell) tanca
  if (!overlay.__fsBgBound) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.__fsBgBound = true;
  }

  // ESC tanca
  if (!window.__fsEscBound) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
    window.__fsEscBound = true;
  }

  // ==================================
  // 3) Injecta botó ⛶ als H2
  // ==================================
  for (const id of canvasIds) {
    const canvas = document.getElementById(id);
    if (!canvas) continue;

    const card = canvas.closest(".card");
    const h2 = card ? card.querySelector("h2") : null;
    if (!h2) continue;

    // Evita duplicats
    if (h2.querySelector(".fs-zoom-btn")) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fs-zoom-btn";
    btn.setAttribute("aria-label", "Veure la gràfica a pantalla completa");
    btn.title = "Pantalla completa";
    btn.textContent = "⛶";

    // ✅ IMPORTANT: NO capturar el canvas antic
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const cardNow = btn.closest(".card");
      const canvasNow = cardNow?.querySelector("canvas");
      if (!canvasNow) return;

      openForCanvas(canvasNow);
    });

    h2.appendChild(btn);
  }
}
