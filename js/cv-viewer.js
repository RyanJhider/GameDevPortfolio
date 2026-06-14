// ========================================
// CV VIEWER - PS2 Horror themed PDF reader
// Compact preview (page 1) + click-to-expand in-page modal
// Modal: native vertical scroll, bottom thumbs,
// wheel = scroll (Ctrl+wheel = zoom), optional fullscreen
// ========================================

(function () {
  'use strict';

  var PDF_LIB = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
  var PDF_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

  var $ = function (id) { return document.getElementById(id); };

  var els = {};
  var state = {
    pdfjs: null,
    doc: null,
    numPages: 0,
    pageMeta: [],
    baseScale: 1.0,
    userScale: 1.0,
    minUserScale: 0.4,
    maxUserScale: 4.0,
    activeRenders: [],
    _scrollRaf: null,
    _thumbsBuilt: false
  };

  // ============== LIB ==============

  function loadPdfJs() {
    if (window.pdfjsLib) {
      state.pdfjs = window.pdfjsLib;
      state.pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
      return Promise.resolve(state.pdfjs);
    }
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PDF_LIB;
      s.onload = function () {
        if (!window.pdfjsLib) return reject(new Error('pdfjsLib indisponible'));
        state.pdfjs = window.pdfjsLib;
        state.pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
        resolve(state.pdfjs);
      };
      s.onerror = function () { reject(new Error('Impossible de charger pdf.js')); };
      document.head.appendChild(s);
    });
  }

  function dataUrlToUint8(src) {
    var comma = src.indexOf(',');
    if (comma < 0) return null;
    try {
      var bin = atob(src.slice(comma + 1));
      var len = bin.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    } catch (e) { return null; }
  }

  // ============== UI HELPERS ==============

  function setStatus(msg, isError) {
    if (els.status) {
      els.status.textContent = msg;
      els.status.classList.toggle('cv-viewer-status-error', !!isError);
    }
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ============== RENDER CANCEL ==============

  function cancelActiveRenders() {
    state.activeRenders.forEach(function (t) {
      try { t.cancel(); } catch (e) {}
      try { t.destroy(); } catch (e) {}
    });
    state.activeRenders = [];
  }

  // ============== PREVIEW (compact, page 1) ==============

  function getPreviewMetrics() {
    if (!els.previewInner) return { width: 400, height: 240 };
    var rect = els.previewInner.getBoundingClientRect();
    var cs = window.getComputedStyle(els.previewInner);
    var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    return {
      width: Math.max(100, Math.floor(rect.width - padX)),
      height: Math.max(100, Math.floor(rect.height - padY))
    };
  }

  function renderPreview() {
    if (!state.doc || !els.previewCanvas) return Promise.resolve();
    cancelActiveRenders();
    var metrics = getPreviewMetrics();
    return state.doc.getPage(1).then(function (page) {
      if (!els.previewCanvas) return;
      var baseVp = page.getViewport({ scale: 1 });
      if (!baseVp.width || !baseVp.height) return;
      var aspect = baseVp.height / baseVp.width;
      var fitCssW = Math.min(metrics.width, metrics.height / aspect);
      var cssW = Math.max(80, fitCssW);
      var cssH = cssW * aspect;
      var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      var renderScale = (cssW / baseVp.width) * dpr;
      var vp = page.getViewport({ scale: renderScale });
      els.previewCanvas.width = Math.max(1, Math.floor(vp.width));
      els.previewCanvas.height = Math.max(1, Math.floor(vp.height));
      els.previewCanvas.style.width = cssW + 'px';
      els.previewCanvas.style.height = cssH + 'px';
      var ctx = els.previewCanvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      var task = page.render({ canvasContext: ctx, viewport: vp });
      state.activeRenders.push(task);
      return task.promise;
    }).catch(function (err) {
      if (err && err.name === 'RenderingCancelledException') return;
      console.error('[CV] preview render error:', err);
    });
  }

  // ============== MODAL: BUILD PAGES & THUMBS ==============

  function buildModalPages() {
    if (!els.modalPages) return;
    els.modalPages.innerHTML = '';
    for (var i = 0; i < state.numPages; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'cv-modal-page-wrap';
      wrap.dataset.page = String(i + 1);

      var canvas = document.createElement('canvas');
      canvas.className = 'cv-modal-page-canvas';

      var badge = document.createElement('div');
      badge.className = 'cv-modal-page-badge';
      badge.textContent = 'P. ' + (i + 1) + ' / ' + state.numPages;

      wrap.appendChild(canvas);
      wrap.appendChild(badge);
      els.modalPages.appendChild(wrap);
    }
  }

  function buildModalThumbs() {
    if (!els.modalThumbs || state._thumbsBuilt) return;
    state._thumbsBuilt = true;
    els.modalThumbs.innerHTML = '';
    for (var i = 0; i < state.numPages; i++) {
      (function (idx) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'cv-modal-thumb';
        item.dataset.page = String(idx + 1);
        item.setAttribute('aria-label', 'Aller a la page ' + (idx + 1));

        var canvas = document.createElement('canvas');
        canvas.className = 'cv-modal-thumb-canvas';
        var label = document.createElement('span');
        label.className = 'cv-modal-thumb-label';
        label.textContent = String(idx + 1);

        item.appendChild(canvas);
        item.appendChild(label);
        item.addEventListener('click', function () { scrollModalToPage(idx + 1, true); });
        els.modalThumbs.appendChild(item);

        state.doc.getPage(idx + 1).then(function (page) {
          if (!canvas.isConnected) return;
          var thumbWidth = 60;
          var baseVp = page.getViewport({ scale: 1 });
          var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
          var renderScale = (thumbWidth / baseVp.width) * dpr;
          var vp = page.getViewport({ scale: renderScale });
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          canvas.style.width = (vp.width / dpr) + 'px';
          canvas.style.height = (vp.height / dpr) + 'px';
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          var task = page.render({ canvasContext: ctx, viewport: vp });
          state.activeRenders.push(task);
          return task.promise;
        }).catch(function (err) {
          if (err && err.name === 'RenderingCancelledException') return;
          console.error('[CV] thumb ' + (idx + 1) + ':', err);
        });
      })(i);
    }
  }

  // ============== MODAL: SCALE ==============

  function computeBaseScale() {
    if (!state.doc || !state.pageMeta[0] || !els.modalStage) return 1.0;
    var stageW = els.modalStage.clientWidth - 64; // padding 2rem each side
    if (stageW <= 0) stageW = 800;
    return stageW / state.pageMeta[0].width;
  }

  // ============== MODAL: RENDER ALL PAGES ==============

  function renderAllModalPages(preserveVisiblePage) {
    if (!state.doc || !els.modalPages) return;
    cancelActiveRenders();
    var visibleBefore = preserveVisiblePage ? currentModalPage() : 1;
    var scale = state.baseScale * state.userScale;
    var canvases = els.modalPages.querySelectorAll('.cv-modal-page-canvas');
    for (var i = 0; i < state.numPages; i++) {
      (function (idx) {
        var canvas = canvases[idx];
        if (!canvas) return;
        state.doc.getPage(idx + 1).then(function (page) {
          if (!canvas.isConnected) return;
          var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
          var renderScale = scale * dpr;
          var vp = page.getViewport({ scale: renderScale });
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          canvas.style.width = (vp.width / dpr) + 'px';
          canvas.style.height = (vp.height / dpr) + 'px';
          var ctx = canvas.getContext('2d');
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          var task = page.render({ canvasContext: ctx, viewport: vp });
          state.activeRenders.push(task);
          return task.promise;
        }).catch(function (err) {
          if (err && err.name === 'RenderingCancelledException') return;
          console.error('[CV] modal page ' + (idx + 1) + ':', err);
        });
      })(i);
    }
    if (preserveVisiblePage) {
      requestAnimationFrame(function () { scrollModalToPage(visibleBefore, false); });
    }
  }

  // ============== MODAL: ZOOM (preserves viewport center) ==============

  function setUserScale(newScale, anchor) {
    var oldScale = state.userScale;
    var oldRender = state.baseScale * oldScale;
    newScale = clamp(newScale, state.minUserScale, state.maxUserScale);
    if (Math.abs(newScale - oldScale) < 0.001) {
      updateZoomDisplay();
      return;
    }
    var newRender = state.baseScale * newScale;
    var ratio = newRender / oldRender;

    state.userScale = newScale;
    updateZoomDisplay();
    renderAllModalPages(false);

    if (els.modalStage) {
      var rect = els.modalStage.getBoundingClientRect();
      var ax, ay, offsetX, offsetY;
      if (anchor) {
        ax = anchor.x - rect.left + els.modalStage.scrollLeft;
        ay = anchor.y - rect.top + els.modalStage.scrollTop;
        offsetX = anchor.x - rect.left;
        offsetY = anchor.y - rect.top;
      } else {
        ax = els.modalStage.scrollLeft + rect.width / 2;
        ay = els.modalStage.scrollTop + rect.height / 2;
        offsetX = rect.width / 2;
        offsetY = rect.height / 2;
      }
      requestAnimationFrame(function () {
        els.modalStage.scrollLeft = Math.max(0, ax * ratio - offsetX);
        els.modalStage.scrollTop = Math.max(0, ay * ratio - offsetY);
      });
    }
  }

  function zoomIn()  { setUserScale(state.userScale + 0.2, lastMouseAnchor()); }
  function zoomOut() { setUserScale(state.userScale - 0.2, lastMouseAnchor()); }
  function fitModal() { setUserScale(1.0); }

  function updateZoomDisplay() {
    if (els.modalZoomLevel) {
      els.modalZoomLevel.textContent = Math.round(state.userScale * 100) + '%';
    }
  }

  var lastMouseAnchor = function () { return null; };

  // ============== MODAL: NAVIGATION ==============

  function currentModalPage() {
    if (!els.modalStage || !els.modalPages) return 1;
    var stageRect = els.modalStage.getBoundingClientRect();
    var wraps = els.modalPages.querySelectorAll('.cv-modal-page-wrap');
    var best = 1;
    var bestDist = Infinity;
    for (var i = 0; i < wraps.length; i++) {
      var r = wraps[i].getBoundingClientRect();
      var center = r.top + r.height / 2;
      var dist = Math.abs(center - (stageRect.top + stageRect.height / 2));
      if (dist < bestDist) { bestDist = dist; best = i + 1; }
    }
    return best;
  }

  function updateModalCounter() {
    var p = currentModalPage();
    if (els.modalPageNum) els.modalPageNum.textContent = p;
    if (els.modalPageCount) els.modalPageCount.textContent = state.numPages;
    updateModalThumbActive(p);
  }

  function updateModalThumbActive(page) {
    if (!els.modalThumbs) return;
    var items = els.modalThumbs.querySelectorAll('.cv-modal-thumb');
    items.forEach(function (it) {
      var p = parseInt(it.dataset.page, 10);
      var active = p === page;
      it.classList.toggle('is-active', active);
      if (active) {
        var rect = it.getBoundingClientRect();
        var stripRect = els.modalThumbs.getBoundingClientRect();
        if (rect.left < stripRect.left || rect.right > stripRect.right) {
          it.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    });
  }

  function scrollModalToPage(n, smooth) {
    if (!els.modalStage || !els.modalPages) return;
    n = clamp(n, 1, state.numPages);
    var wraps = els.modalPages.querySelectorAll('.cv-modal-page-wrap');
    var wrap = wraps[n - 1];
    if (!wrap) return;
    var stageRect = els.modalStage.getBoundingClientRect();
    var wrapRect = wrap.getBoundingClientRect();
    var targetTop = stageRect.top - wrapRect.top + els.modalStage.scrollTop;
    els.modalStage.scrollTo({
      top: targetTop,
      left: els.modalStage.scrollLeft,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  function modalNextPage() { scrollModalToPage(currentModalPage() + 1, true); }
  function modalPrevPage() { scrollModalToPage(currentModalPage() - 1, true); }

  // ============== MODAL: WHEEL (Ctrl+wheel = zoom) ==============

  function onModalWheel(e) {
    if (els.modal.hidden) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.15 : 0.15;
      setUserScale(state.userScale + delta, { x: e.clientX, y: e.clientY });
    }
  }

  // ============== MODAL: DOUBLE CLICK ==============

  function onModalDoubleClick(e) {
    if (els.modal.hidden) return;
    var canvas = e.target.closest('.cv-modal-page-canvas');
    if (!canvas) return;
    if (state.userScale > 1.05) setUserScale(1.0);
    else setUserScale(2.0);
  }

  // ============== MODAL: OPEN / CLOSE / FULLSCREEN ==============

  function openModal() {
    if (!state.doc) return;
    if (els.modal) {
      els.modal.hidden = false;
      els.modal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('cv-modal-open');
    requestAnimationFrame(function () {
      state.baseScale = computeBaseScale();
      state.userScale = 1.0;
      updateZoomDisplay();
      renderAllModalPages(false);
      updateModalCounter();
      if (els.modalStage) els.modalStage.focus({ preventScroll: true });
    });
  }

  function closeModal() {
    if (isPanelFullscreen()) {
      try {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      } catch (e) {}
    }
    if (els.modal) {
      els.modal.hidden = true;
      els.modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('cv-modal-open');
    cancelActiveRenders();
    requestAnimationFrame(function () { renderPreview(); });
  }

  function isPanelFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    var panel = els.modalPanel;
    if (!panel) return;
    if (isPanelFullscreen()) {
      try {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      } catch (e) {}
    } else {
      var req = panel.requestFullscreen || panel.webkitRequestFullscreen;
      if (req) {
        try {
          req.call(panel).catch(function () { /* user denied, no-op */ });
        } catch (e) {}
      }
    }
  }

  function onFullscreenChange() {
    var fs = isPanelFullscreen();
    if (els.modalFullscreen) {
      els.modalFullscreen.classList.toggle('is-active', fs);
    }
    if (!els.modal.hidden) {
      requestAnimationFrame(function () {
        state.baseScale = computeBaseScale();
        renderAllModalPages(true);
      });
    }
  }

  // ============== EVENTS ==============

  function bindEvents() {
    if (els.previewBtn) els.previewBtn.addEventListener('click', openModal);
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.modalPrev) els.modalPrev.addEventListener('click', modalPrevPage);
    if (els.modalNext) els.modalNext.addEventListener('click', modalNextPage);
    if (els.modalZoomIn) els.modalZoomIn.addEventListener('click', zoomIn);
    if (els.modalZoomOut) els.modalZoomOut.addEventListener('click', zoomOut);
    if (els.modalFit) els.modalFit.addEventListener('click', fitModal);
    if (els.modalFullscreen) els.modalFullscreen.addEventListener('click', toggleFullscreen);

    if (els.modalStage) {
      els.modalStage.addEventListener('wheel', onModalWheel, { passive: false });
      els.modalStage.addEventListener('dblclick', onModalDoubleClick);
      els.modalStage.addEventListener('scroll', function () {
        if (state._scrollRaf) return;
        state._scrollRaf = requestAnimationFrame(function () {
          state._scrollRaf = null;
          if (!els.modal.hidden) updateModalCounter();
        });
      });
      els.modalStage.addEventListener('mousemove', function (e) {
        lastMouseAnchor = function () { return { x: e.clientX, y: e.clientY }; };
      });
      els.modalStage.addEventListener('mouseleave', function () {
        lastMouseAnchor = function () { return null; };
      });
    }

    if (els.modalBackdrop) {
      els.modalBackdrop.addEventListener('click', closeModal);
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    document.addEventListener('keydown', function (e) {
      if (!state.doc) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var modalOpen = !els.modal.hidden;
      if (e.key === 'Escape' && modalOpen) {
        if (isPanelFullscreen()) return; // let native handle
        e.preventDefault();
        closeModal();
        return;
      }
      if (!modalOpen) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); modalPrevPage(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); modalNextPage(); }
      else if (e.key === 'Home') { e.preventDefault(); scrollModalToPage(1, true); }
      else if (e.key === 'End') { e.preventDefault(); scrollModalToPage(state.numPages, true); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); fitModal(); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (!state.doc) return;
        if (!els.modal.hidden) {
          state.baseScale = computeBaseScale();
          renderAllModalPages(true);
        } else {
          renderPreview();
        }
      });
      if (els.previewInner) ro.observe(els.previewInner);
      if (els.modalStage) ro.observe(els.modalStage);
    } else {
      window.addEventListener('resize', function () {
        if (!state.doc) return;
        if (!els.modal.hidden) {
          state.baseScale = computeBaseScale();
          renderAllModalPages(true);
        } else {
          renderPreview();
        }
      });
    }
  }

  // ============== LOAD ==============

  function load(src) {
    if (!src) return;
    setStatus('Chargement du lecteur...');
    show(els.loader);
    hide(els.previewBtn);
    setControlsEnabled(false);

    loadPdfJs().then(function (pdfjs) {
      setStatus('Ouverture du document...');

      var isData = /^data:/i.test(src);
      var docPromise;

      if (isData) {
        var bytes = dataUrlToUint8(src);
        if (bytes && bytes.length >= 5) {
          var sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
          if (sig !== '%PDF-') {
            setStatus('Source PDF invalide (signature ' + sig + ')', true);
            return;
          }
          docPromise = pdfjs.getDocument({
            data: bytes,
            disableRange: true,
            disableStream: true,
            isEvalSupported: false
          }).promise;
        } else {
          docPromise = pdfjs.getDocument({ url: src, withCredentials: false, disableRange: true, disableStream: true }).promise;
        }
      } else {
        docPromise = pdfjs.getDocument({ url: src, withCredentials: false }).promise;
      }

      return docPromise.then(function (doc) {
        state.doc = doc;
        state.numPages = doc.numPages;
        state.pageMeta = [];

        var metaPromises = [];
        for (var i = 1; i <= state.numPages; i++) {
          (function (n) {
            metaPromises.push(
              state.doc.getPage(n).then(function (page) {
                var vp = page.getViewport({ scale: 1 });
                state.pageMeta.push({ width: vp.width, height: vp.height });
              })
            );
          })(i);
        }
        return Promise.all(metaPromises);
      }).then(function () {
        if (els.root) els.root.classList.remove('cv-viewer-empty');
        if (els.placeholder) hide(els.placeholder);
        show(els.previewBtn);
        hide(els.loader);
        setControlsEnabled(true);
        buildModalPages();
        buildModalThumbs();
        requestAnimationFrame(function () { renderPreview(); });
      });
    }).catch(function (err) {
      console.error('[CV] load error:', err);
      setStatus('Echec du chargement: ' + (err && err.message ? err.message : 'inconnu'), true);
      setControlsEnabled(false);
    });
  }

  function setControlsEnabled(enabled) {
    var ids = ['modalPrev', 'modalNext', 'modalZoomIn', 'modalZoomOut', 'modalFit', 'modalClose', 'modalFullscreen'];
    ids.forEach(function (k) {
      if (els[k]) els[k].disabled = !enabled;
    });
  }

  // ============== INIT ==============

  function cacheEls() {
    els.root = $('cv-viewer');
    els.source = $('cv-source');
    els.previewBtn = $('cv-preview-btn');
    els.previewInner = document.querySelector('.cv-viewer-preview-inner');
    els.previewCanvas = $('cv-canvas');
    els.loader = $('cv-loader');
    els.status = $('cv-status');
    els.placeholder = $('cv-placeholder');
    els.download = $('cv-download');

    els.modal = $('cv-modal');
    els.modalBackdrop = els.modal ? els.modal.querySelector('.cv-modal-backdrop') : null;
    els.modalPanel = els.modal ? els.modal.querySelector('.cv-modal-panel') : null;
    els.modalStage = $('cv-modal-stage');
    els.modalPages = $('cv-modal-pages');
    els.modalThumbs = $('cv-modal-thumbs');
    els.modalPageNum = $('cv-modal-page-num');
    els.modalPageCount = $('cv-modal-page-count');
    els.modalPrev = $('cv-modal-prev');
    els.modalNext = $('cv-modal-next');
    els.modalZoomIn = $('cv-modal-zoom-in');
    els.modalZoomOut = $('cv-modal-zoom-out');
    els.modalZoomLevel = $('cv-modal-zoom-level');
    els.modalFit = $('cv-modal-fit');
    els.modalDownload = $('cv-modal-download');
    els.modalFullscreen = $('cv-modal-fullscreen');
    els.modalClose = $('cv-modal-close');
  }

  window.initCvViewer = function () {
    if (!els.root) cacheEls();
    if (!els.root || els.root.dataset.inited === '1') return;
    var src = els.source ? els.source.value : '';
    if (!src) return;
    els.root.dataset.inited = '1';
    bindEvents();
    load(src);
  };
})();
