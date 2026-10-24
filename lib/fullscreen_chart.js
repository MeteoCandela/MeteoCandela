// lib/fullscreen_chart.js
// Fullscreen charts per Chart.js (modal) + botó ⛶ al títol (NO obre amb tap al canvas)
// Inclou pinch-zoom + pan en mòbil sense distorsió del format.

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
          <div class="fs-head-actions">
            <button id="fsZoomReset" class="fs-zoom-reset" type="button" style="display:none" aria-label="Restablir zoom">1:1</button>
            <button id="fsClose" class="fs-close" type="button" aria-label="Tancar">✕</button>
          </div>
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
  const fsZoomReset = overlay.querySelector("#fsZoomReset");

  // Estat del canvas mogut (GLOBAL al DOM, no a la closure)
  overlay.__fsActive = overlay.__fsActive || null; // { canvas, placeholder, parent, nextSibling, chart }

  function setLock(on) {
    if (on) {
      document.documentElement.classList.add("fs-lock");
      document.body.classList.add("fs-lock");
    } else {
      document.documentElement.classList.remove("fs-lock");
      document.body.classList.remove("fs-lock");
    }
  }

  // =========================
  // 2) Pinch-zoom + pan mòbil
  // =========================
  if (!overlay.__zoomBound) {
    overlay.__zoomBound = true;
    let scale = 1, tx = 0, ty = 0;
    const ptrs = new Map();
    let pinchBase = null; // { d, scale, tx, ty, cx, cy }
    let panBase = null;   // { x, y, tx, ty }
    let lastTap = 0;

    function W() { return fsHost.offsetWidth; }
    function H() { return fsHost.offsetHeight; }

    function clamp() {
      if (scale <= 1) return;
      tx = Math.min(0, Math.max(W() * (1 - scale), tx));
      ty = Math.min(0, Math.max(H() * (1 - scale), ty));
    }

    function applyTransform() {
      clamp();
      fsHost.style.transform = scale <= 1 ? ""
        : `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      if (fsZoomReset) fsZoomReset.style.display = scale > 1 ? "" : "none";
    }

    function resetZoom() {
      scale = 1; tx = 0; ty = 0;
      fsHost.style.transform = "";
      if (fsZoomReset) fsZoomReset.style.display = "none";
    }

    // Botó 1:1
    if (fsZoomReset) {
      fsZoomReset.addEventListener("click", e => {
        e.stopPropagation();
        resetZoom();
      });
    }

    // Exposem reset per poder cridar-lo en obrir/tancar
    overlay.__zoomReset = resetZoom;

    // Pointer events al host (no al close ni al reset)
    fsHost.addEventListener("pointerdown", e => {
      if (e.target.closest("#fsClose,#fsZoomReset")) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const rect = fsHost.getBoundingClientRect();
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const cx = (a.x + b.x) / 2 - rect.left;
        const cy = (a.y + b.y) / 2 - rect.top;
        pinchBase = { d, scale, tx, ty, cx, cy };
        panBase = null;
        e.preventDefault();
      } else if (ptrs.size === 1) {
        // Doble tap: reinicia zoom
        const now = Date.now();
        if (now - lastTap < 280) {
          resetZoom();
          e.preventDefault();
          lastTap = 0;
          return;
        }
        lastTap = now;

        // Pan quan zoom > 1
        if (scale > 1) {
          panBase = { x: e.clientX, y: e.clientY, tx, ty };
          e.stopPropagation(); // no tancar modal per tap quan hi ha zoom
        }
      }
    }, { passive: false });

    fsHost.addEventListener("pointermove", e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (ptrs.size >= 2 && pinchBase) {
        const [a, b] = [...ptrs.values()];
        const newD = Math.hypot(a.x - b.x, a.y - b.y);
        const { d, scale: s0, tx: tx0, ty: ty0, cx, cy } = pinchBase;
        const s1 = Math.max(1, Math.min(6, s0 * newD / d));
        // Mantenir el punt central fix sota els dits
        tx = cx - (cx - tx0) * s1 / s0;
        ty = cy - (cy - ty0) * s1 / s0;
        scale = s1;
        applyTransform();
        e.preventDefault();
      } else if (ptrs.size === 1 && panBase && scale > 1) {
        tx = panBase.tx + (e.clientX - panBase.x);
        ty = panBase.ty + (e.clientY - panBase.y);
        applyTransform();
        e.preventDefault();
      }
    }, { passive: false });

    const onUp = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size === 0) {
        if (scale < 1.1) resetZoom(); // snap back si quasi no s'ha ampliat
        else applyTransform();
        pinchBase = null;
        panBase = null;
      }
    };
    fsHost.addEventListener("pointerup", onUp);
    fsHost.addEventListener("pointercancel", onUp);
  }

  // ==================================
  // 3) Obrir/tancar modal
  // ==================================
  function openForCanvas(canvas) {
    if (!canvas) return;

    const chart = window.Chart.getChart(canvas);
    if (!chart) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    if (overlay.__fsActive) closeModal();

    // Reset zoom en obrir
    if (overlay.__zoomReset) overlay.__zoomReset();

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

    overlay.__fsActive = {
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
    const active = overlay.__fsActive;
    if (!active) return;

    const { canvas, placeholder, parent, nextSibling, chart } = active;

    // Reset zoom en tancar
    if (overlay.__zoomReset) overlay.__zoomReset();

    overlay.classList.remove("open");
    setLock(false);

    // Retorna canvas a la seva posició original
    if (nextSibling && nextSibling.parentNode === parent) parent.insertBefore(canvas, nextSibling);
    else parent.appendChild(canvas);

    // Elimina placeholder
    if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);

    // Neteja estils
    canvas.style.width = "";
    canvas.style.height = "";

    // Resize Chart.js
    try { chart.resize(); } catch {}

    overlay.__fsActive = null;
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

    // Touchstart (capture) — Android WebView "tonto"
    overlay.addEventListener("touchstart", (e) => {
      tryCloseFromEvent(e);
    }, { capture: true, passive: false });

    overlay.__fsCloseDelegBound = true;
  }

  // ESC tanca
  if (!window.__fsEscBound) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
    window.__fsEscBound = true;
  }

  // ==================================
  // 4) Injecta botó ⛶ als H2
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
