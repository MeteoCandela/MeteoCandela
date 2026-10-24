// lib/fullscreen_chart.js
// Fullscreen charts per Chart.js (modal) + botó ⛶ al títol
// Pinch-zoom + pan mòbil sense distorsió. Tooltip extern (no escala amb zoom).

export function initChartFullscreen(canvasIds = []) {
  if (typeof window === "undefined") return;
  if (!window.Chart || typeof window.Chart.getChart !== "function") return;

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
        <div id="fsScrollbarWrap" class="fs-scrollbar-wrap" style="display:none">
          <div id="fsScrollInfo" class="fs-scroll-info"></div>
          <input id="fsScrollSlider" class="fs-scrollbar" type="range" min="0" max="0" value="0" step="1" aria-label="Navega per les dades">
        </div>
        <div id="fsTooltip" class="fs-ext-tooltip" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const fsTitle        = overlay.querySelector("#fsTitle");
  const fsClose        = overlay.querySelector("#fsClose");
  const fsHost         = overlay.querySelector("#fsCanvasHost");
  const fsZoomReset    = overlay.querySelector("#fsZoomReset");
  const fsTooltip      = overlay.querySelector("#fsTooltip");
  const fsPanel        = overlay.querySelector(".fs-panel");
  const fsScrollbarWrap = overlay.querySelector("#fsScrollbarWrap");
  const fsScrollSlider  = overlay.querySelector("#fsScrollSlider");
  const fsScrollInfo    = overlay.querySelector("#fsScrollInfo");

  overlay.__fsActive = overlay.__fsActive || null;

  function setLock(on) {
    document.documentElement.classList.toggle("fs-lock", on);
    document.body.classList.toggle("fs-lock", on);
  }

  // =========================
  // 2) Pinch-zoom + pan (1 cop)
  // =========================
  if (!overlay.__zoomBound) {
    overlay.__zoomBound = true;

    let scale = 1, tx = 0, ty = 0;
    const ptrs = new Map();
    let pinchBase = null;
    let panBase = null;
    let lastTap = 0;
    let gesturing = false;

    function W() { return fsHost.offsetWidth; }
    function H() { return fsHost.offsetHeight; }

    function clamp() {
      if (scale <= 1) return;
      tx = Math.min(0, Math.max(W() * (1 - scale), tx));
      ty = Math.min(0, Math.max(H() * (1 - scale), ty));
    }

    function applyTransform() {
      clamp();
      const t = scale <= 1 ? ""
        : `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      fsHost.style.transform = t;
      // Exposa l'estat per al tooltip extern
      fsHost._zs = { scale, tx, ty };
      if (fsZoomReset) fsZoomReset.style.display = scale > 1 ? "" : "none";
    }

    function resetZoom() {
      scale = 1; tx = 0; ty = 0;
      fsHost.style.transform = "";
      fsHost._zs = { scale: 1, tx: 0, ty: 0 };
      if (fsZoomReset) fsZoomReset.style.display = "none";
      if (fsTooltip) fsTooltip.style.display = "none";
    }

    if (fsZoomReset) {
      fsZoomReset.addEventListener("click", e => { e.stopPropagation(); resetZoom(); });
    }

    overlay.__zoomReset = resetZoom;

    // Listener al host en fase captura per garantir prioritat sobre Chart.js
    fsHost.addEventListener("pointerdown", e => {
      if (fsHost._scrollModeActive) return; // scroll mode: no zoom
      if (e.target.closest("#fsClose,#fsZoomReset")) return;

      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (ptrs.size === 2) {
        gesturing = true;
        if (fsTooltip) fsTooltip.style.display = "none";
        const [a, b] = [...ptrs.values()];
        const rect = fsHost.getBoundingClientRect();
        // getBoundingClientRect inclou el transform visual; corregim restant el desplaçament
        const hostL = rect.left - tx;
        const hostT = rect.top  - ty;
        const d  = Math.hypot(a.x - b.x, a.y - b.y);
        const cx = (a.x + b.x) / 2 - hostL;
        const cy = (a.y + b.y) / 2 - hostT;
        pinchBase = { d, scale, tx, ty, cx, cy };
        panBase = null;
        e.preventDefault();
      } else if (ptrs.size === 1) {
        // Doble tap → reset
        const now = Date.now();
        if (now - lastTap < 280) {
          resetZoom();
          e.preventDefault();
          lastTap = 0;
          return;
        }
        lastTap = now;
        if (scale > 1) {
          gesturing = true;
          if (fsTooltip) fsTooltip.style.display = "none";
          panBase = { x: e.clientX, y: e.clientY, tx, ty };
          e.stopPropagation();
        }
      }
    }, { passive: false, capture: true });

    fsHost.addEventListener("pointermove", e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (ptrs.size >= 2 && pinchBase) {
        const [a, b] = [...ptrs.values()];
        const newD = Math.hypot(a.x - b.x, a.y - b.y);
        const { d, scale: s0, tx: tx0, ty: ty0, cx, cy } = pinchBase;
        const s1 = Math.max(1, Math.min(6, s0 * newD / d));
        // Manté el punt central fix sota els dits
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
        gesturing = false;
        if (scale < 1.1) resetZoom();
        else applyTransform();
        pinchBase = null;
        panBase = null;
      }
    };
    fsHost.addEventListener("pointerup",     onUp);
    fsHost.addEventListener("pointercancel", onUp);

    // Exposa l'indicador de gest per al tooltip
    overlay.__isGesturing = () => gesturing;
  }

  // =========================
  // 3) Tooltip extern (escala 1:1 sempre)
  // =========================
  function makeExternalTooltip(chart) {
    return function(context) {
      if (!fsTooltip || !fsPanel) return;

      const { tooltip } = context;

      // Amaga durant gestos o si no hi ha dades
      if (overlay.__isGesturing?.() || tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
        fsTooltip.style.display = "none";
        return;
      }

      // Contingut
      const title = tooltip.title?.[0] ?? "";
      const lines = (tooltip.body ?? []).flatMap(b => b.lines ?? []);
      fsTooltip.innerHTML =
        (title ? `<div class="fs-tt-title">${title}</div>` : "") +
        lines.map(l => `<div class="fs-tt-line">${l}</div>`).join("");

      // Posició: coordenades canvas → pantalla, corregint el zoom
      const zs = fsHost._zs ?? { scale: 1, tx: 0, ty: 0 };
      const fsBodyEl = fsHost.parentElement;
      const bodyRect  = fsBodyEl  ? fsBodyEl.getBoundingClientRect()  : { left: 0, top: 0 };
      const panelRect = fsPanel.getBoundingClientRect();

      // caretX/caretY → posició de pantalla relativa al panel
      const sx = tooltip.caretX * zs.scale + zs.tx + (bodyRect.left - panelRect.left);
      const sy = tooltip.caretY * zs.scale + zs.ty + (bodyRect.top  - panelRect.top);

      fsTooltip.style.display = "";
      // Posiciona i centra horitzontalment
      const w  = fsTooltip.offsetWidth  || 120;
      const h  = fsTooltip.offsetHeight || 40;
      const pw = fsPanel.offsetWidth    || 400;
      const ph = fsPanel.offsetHeight   || 300;

      let lft = sx - w / 2;

      // Barres (pluja): tooltip centrat verticalment al mig del gràfic.
      // Línies (temp, vent): tooltip just per sobre del punt.
      const isBar = chart.config?.type === "bar";
      let top;
      if (isBar) {
        const bodyH = fsBodyEl ? fsBodyEl.offsetHeight : ph;
        const bodyOffsetTop = fsBodyEl ? (bodyRect.top - panelRect.top) : 0;
        top = bodyOffsetTop + bodyH / 2 - h / 2;
      } else {
        top = sy - h - 10;
        top = top < 4 ? sy + 14 : top;
      }

      // No surti pels laterals ni per sota
      lft = Math.max(4, Math.min(pw - w - 4, lft));
      top = Math.max(4, Math.min(ph - h - 4, top));

      fsTooltip.style.left = `${lft}px`;
      fsTooltip.style.top  = `${top}px`;
    };
  }

  // =========================
  // 4) Obrir/tancar modal
  // =========================
  function openForCanvas(canvas) {
    if (!canvas) return;
    const chart = window.Chart.getChart(canvas);
    if (!chart) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    if (overlay.__fsActive) closeModal();

    // Reset zoom
    if (overlay.__zoomReset) overlay.__zoomReset();

    // Títol
    const card = canvas.closest(".card");
    const h2   = card ? card.querySelector("h2") : null;
    const titleClean = (h2?.textContent || "")
      .replace(/\s*⛶\s*$/, "").replace(/⛶/g, "").trim() || "Gràfica";
    if (fsTitle) fsTitle.textContent = titleClean;

    // Placeholder
    const rect = canvas.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "fs-placeholder";
    placeholder.style.height = `${Math.max(140, rect.height || 260)}px`;

    overlay.__fsActive = { canvas, placeholder, parent, nextSibling: canvas.nextSibling, chart };

    // Mou canvas al modal
    parent.replaceChild(placeholder, canvas);
    fsHost.innerHTML = "";
    fsHost.appendChild(canvas);
    canvas.style.width  = "100%";
    canvas.style.height = "100%";

    // Activa tooltip extern (no escala amb zoom)
    try {
      const orig = chart.options?.plugins?.tooltip;  // referència, no còpia (preserva funcions)
      overlay.__fsActive.origTooltip = orig;
      chart.options.plugins.tooltip = {
        ...(orig ?? {}),
        enabled: false,
        external: makeExternalTooltip(chart),
      };
      chart.update("none");
    } catch {}

    // Scroll mode: mòbil en retrat + moltes etiquetes → finestra lliscant, sense pinch-zoom
    const WIN = 90; // nombre màxim de punts visibles
    const isMobilePortrait = window.innerWidth <= 640 && window.innerHeight > window.innerWidth;
    const labels = chart.data?.labels ?? [];
    if (isMobilePortrait && labels.length > WIN) {
      fsHost._scrollModeActive = true;
      const origLabels = labels.slice();
      const origData   = (chart.data.datasets ?? []).map(ds => (ds.data ?? []).slice());
      overlay.__fsActive.scrollOrig = { labels: origLabels, data: origData };

      const maxStart = labels.length - WIN;

      function applyWin(start) {
        start = Math.max(0, Math.min(maxStart, start));
        chart.data.labels = origLabels.slice(start, start + WIN);
        chart.data.datasets.forEach((ds, i) => {
          ds.data = origData[i].slice(start, start + WIN);
        });
        chart.update("none");
        if (fsScrollInfo) {
          const from = origLabels[start]        ?? "";
          const to   = origLabels[start + WIN - 1] ?? "";
          fsScrollInfo.textContent = `${from} — ${to}`;
        }
        if (fsScrollSlider) fsScrollSlider.value = start;
      }

      if (fsScrollSlider) {
        fsScrollSlider.min   = 0;
        fsScrollSlider.max   = maxStart;
        fsScrollSlider.value = 0;
        fsScrollSlider.oninput = () => applyWin(Number(fsScrollSlider.value));
      }
      if (fsScrollbarWrap) fsScrollbarWrap.style.display = "";
      applyWin(0);
    } else {
      fsHost._scrollModeActive = false;
      if (fsScrollbarWrap) fsScrollbarWrap.style.display = "none";
    }

    overlay.classList.add("open");
    setLock(true);
    try { chart.resize(); } catch {}
  }

  function closeModal() {
    const active = overlay.__fsActive;
    if (!active) return;
    const { canvas, placeholder, parent, nextSibling, chart } = active;

    // Reset zoom
    if (overlay.__zoomReset) overlay.__zoomReset();

    // Restaura tooltip original
    try {
      if (active.origTooltip !== undefined) {
        chart.options.plugins.tooltip = active.origTooltip;
        chart.update("none");
      }
    } catch {}

    if (fsTooltip) fsTooltip.style.display = "none";

    // Restaura dades originals si estava en scroll mode
    if (active.scrollOrig) {
      try {
        chart.data.labels = active.scrollOrig.labels;
        chart.data.datasets.forEach((ds, i) => {
          ds.data = active.scrollOrig.data[i];
        });
        chart.update("none");
      } catch {}
      if (fsScrollbarWrap) fsScrollbarWrap.style.display = "none";
      if (fsScrollSlider)  fsScrollSlider.oninput = null;
      fsHost._scrollModeActive = false;
    }

    overlay.classList.remove("open");
    setLock(false);

    if (nextSibling && nextSibling.parentNode === parent) parent.insertBefore(canvas, nextSibling);
    else parent.appendChild(canvas);
    if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);

    canvas.style.width  = "";
    canvas.style.height = "";
    try { chart.resize(); } catch {}

    overlay.__fsActive = null;
  }

  // =========================
  // Events de tancar (ROBUST)
  // =========================
  if (!overlay.__fsCloseDelegBound) {
    function tryClose(e) {
      if (e.target?.closest?.("#fsClose")) {
        e.preventDefault(); e.stopPropagation(); closeModal(); return true;
      }
      if (e.target === overlay) {
        e.preventDefault(); closeModal(); return true;
      }
      return false;
    }
    overlay.addEventListener("click",      tryClose, true);
    overlay.addEventListener("pointerdown", tryClose, true);
    overlay.addEventListener("touchstart",  tryClose, { capture: true, passive: false });
    overlay.__fsCloseDelegBound = true;
  }

  if (!window.__fsEscBound) {
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
    window.__fsEscBound = true;
  }

  // =========================
  // 5) Injecta botó ⛶ als H2
  // =========================
  for (const id of canvasIds) {
    const canvas = document.getElementById(id);
    if (!canvas) continue;
    const card = canvas.closest(".card");
    const h2   = card ? card.querySelector("h2") : null;
    if (!h2) continue;
    if (h2.querySelector(".fs-zoom-btn")) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fs-zoom-btn";
    btn.setAttribute("aria-label", "Veure la gràfica a pantalla completa");
    btn.title = "Pantalla completa";
    btn.textContent = "⛶";

    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const cardNow   = btn.closest(".card");
      const canvasNow = cardNow?.querySelector("canvas");
      if (!canvasNow) return;
      openForCanvas(canvasNow);
    });

    h2.appendChild(btn);
  }
}
