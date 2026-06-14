// ========================================
// CV VIEWER - Lecteur PDF integre (PDF.js)
// Rendu page par page, navigation, zoom, telechargement
// ========================================

(function () {
  'use strict';

  var PDFJS = window.pdfjsLib;
  var pdfDoc = null;
  var currentPage = 1;
  var currentZoom = 1.0;
  var rendering = false;
  var pendingPage = null;
  var ZOOM_STEP = 0.2;
  var ZOOM_MIN = 0.5;
  var ZOOM_MAX = 3.0;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  function setStatus(msg, isError) {
    var el = $('cv-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('cv-viewer-status-error', !!isError);
  }

  function showLoader() {
    var l = $('cv-loader');
    var c = $('cv-canvas-wrap');
    if (l) l.hidden = false;
    if (c) c.hidden = true;
  }

  function showCanvas() {
    var l = $('cv-loader');
    var c = $('cv-canvas-wrap');
    if (l) l.hidden = true;
    if (c) c.hidden = false;
  }

  function setControlsEnabled(enabled) {
    var ids = ['cv-prev', 'cv-next', 'cv-zoom-in', 'cv-zoom-out', 'cv-page-num'];
    ids.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.disabled = !enabled;
    });
  }

  function updateCounter() {
    var numEl = $('cv-page-num');
    var countEl = $('cv-page-count');
    if (numEl) numEl.value = currentPage;
    if (countEl && pdfDoc) countEl.textContent = pdfDoc.numPages;
  }

  function updateZoomLabel() {
    var el = $('cv-zoom-level');
    if (el) el.textContent = Math.round(currentZoom * 100) + '%';
  }

  function renderPage(num) {
    if (!pdfDoc) return;
    if (rendering) { pendingPage = num; return; }
    rendering = true;
    showLoader();
    setStatus('Rendu de la page ' + num + '...');

    pdfDoc.getPage(num).then(function (page) {
      var canvas = $('cv-canvas');
      if (!canvas) { rendering = false; return; }
      var ctx = canvas.getContext('2d');
      var viewport = page.getViewport({ scale: currentZoom });
      var dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var renderTask = page.render({ canvasContext: ctx, viewport: viewport });
      renderTask.promise.then(function () {
        rendering = false;
        showCanvas();
        currentPage = num;
        updateCounter();
        if (pendingPage !== null && pendingPage !== num) {
          var next = pendingPage;
          pendingPage = null;
          renderPage(next);
        }
      }).catch(function (err) {
        rendering = false;
        setStatus('Erreur de rendu: ' + (err && err.message ? err.message : 'inconnue'), true);
      });
    }).catch(function (err) {
      rendering = false;
      setStatus('Impossible de charger la page: ' + (err && err.message ? err.message : 'inconnue'), true);
    });
  }

  function goPrev() {
    if (!pdfDoc || currentPage <= 1) return;
    renderPage(currentPage - 1);
  }

  function goNext() {
    if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
    renderPage(currentPage + 1);
  }

  function zoomIn() {
    if (currentZoom >= ZOOM_MAX) return;
    currentZoom = Math.min(ZOOM_MAX, currentZoom + ZOOM_STEP);
    updateZoomLabel();
    renderPage(currentPage);
  }

  function zoomOut() {
    if (currentZoom <= ZOOM_MIN) return;
    currentZoom = Math.max(ZOOM_MIN, currentZoom - ZOOM_STEP);
    updateZoomLabel();
    renderPage(currentPage);
  }

  function loadFromSource(src) {
    if (!PDFJS) {
      setStatus('Lecteur PDF non disponible (connexion requise).', true);
      return;
    }
    if (!src) return;
    if (!initialized) {
      try {
        PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        initialized = true;
      } catch (e) {
        setStatus('Impossible d\'initialiser le lecteur PDF.', true);
        return;
      }
    }

    showLoader();
    setStatus('Chargement du document...');
    setControlsEnabled(false);

    var loadingTask = PDFJS.getDocument({ url: src, withCredentials: false });
    loadingTask.promise.then(function (doc) {
      pdfDoc = doc;
      currentPage = 1;
      currentZoom = 1.0;
      updateZoomLabel();
      setControlsEnabled(true);
      renderPage(1);
    }).catch(function (err) {
      setStatus('Impossible de charger le PDF (' + (err && err.message ? err.message : 'erreur') + '). Verifiez l\'URL ou la taille du fichier.', true);
      setControlsEnabled(false);
    });
  }

  function bindControls() {
    var prev = $('cv-prev');
    var next = $('cv-next');
    var inBtn = $('cv-zoom-in');
    var outBtn = $('cv-zoom-out');
    var numInput = $('cv-page-num');
    if (prev) prev.addEventListener('click', goPrev);
    if (next) next.addEventListener('click', goNext);
    if (inBtn) inBtn.addEventListener('click', zoomIn);
    if (outBtn) outBtn.addEventListener('click', zoomOut);
    if (numInput) {
      numInput.addEventListener('change', function () {
        if (!pdfDoc) return;
        var v = parseInt(numInput.value, 10);
        if (isNaN(v)) v = 1;
        if (v < 1) v = 1;
        if (v > pdfDoc.numPages) v = pdfDoc.numPages;
        renderPage(v);
      });
      numInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); numInput.blur(); }
      });
    }

    document.addEventListener('keydown', function (e) {
      var root = $('cv-viewer');
      if (!root || root.classList.contains('cv-viewer-empty')) return;
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === '+' || e.key === '=') { zoomIn(); }
      else if (e.key === '-' || e.key === '_') { zoomOut(); }
    });

    window.addEventListener('resize', function () {
      if (pdfDoc) renderPage(currentPage);
    });
  }

  window.initCvViewer = function () {
    var root = $('cv-viewer');
    if (!root || root.classList.contains('cv-viewer-initialized')) return;
    var srcEl = $('cv-source');
    var src = srcEl ? srcEl.value : '';
    if (!src) return;
    root.classList.add('cv-viewer-initialized');
    root.classList.remove('cv-viewer-empty');
    var placeholder = root.querySelector('.cv-viewer-placeholder');
    if (placeholder) placeholder.hidden = true;
    if (!root.dataset.bound) {
      bindControls();
      root.dataset.bound = '1';
    }
    loadFromSource(src);
  };
})();
