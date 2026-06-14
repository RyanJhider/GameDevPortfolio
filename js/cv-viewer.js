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
  var RENDER_TIMEOUT_MS = 15000;
  var workerInitialized = false;
  var docLoadingTask = null;

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

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error(label + ' : delai d\'attente depasse (' + Math.round(ms / 1000) + 's)'));
      }, ms);
      promise.then(function (v) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      }, function (e) {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(e);
      });
    });
  }

  function renderPage(num) {
    if (!pdfDoc) return;
    if (rendering) { pendingPage = num; return; }
    rendering = true;
    showLoader();
    setStatus('Rendu de la page ' + num + '...');

    withTimeout(pdfDoc.getPage(num), RENDER_TIMEOUT_MS, 'Chargement page')
      .then(function (page) {
        var canvas = $('cv-canvas');
        if (!canvas) { rendering = false; return; }
        var ctx = canvas.getContext('2d');
        var viewport = page.getViewport({ scale: currentZoom });
        var dpr = Math.max(1, window.devicePixelRatio || 1);

        var stage = canvas.parentElement ? canvas.parentElement.parentElement : null;
        var availableWidth = stage ? (stage.clientWidth - 48) : 0;
        var naturalWidth = viewport.width;
        var cssScale = currentZoom;
        if (availableWidth > 0 && naturalWidth > availableWidth) {
          cssScale = currentZoom * (availableWidth / naturalWidth);
        }
        var renderViewport = page.getViewport({ scale: cssScale });

        canvas.width = Math.floor(renderViewport.width * dpr);
        canvas.height = Math.floor(renderViewport.height * dpr);
        canvas.style.width = Math.floor(renderViewport.width) + 'px';
        canvas.style.height = Math.floor(renderViewport.height) + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
        return withTimeout(renderTask.promise, RENDER_TIMEOUT_MS, 'Rendu canvas')
          .then(function () {
            rendering = false;
            showCanvas();
            currentPage = num;
            updateCounter();
            if (pendingPage !== null && pendingPage !== num) {
              var next = pendingPage;
              pendingPage = null;
              renderPage(next);
            }
          })
          .catch(function (err) {
            rendering = false;
            try { renderTask.cancel(); } catch (e) {}
            setStatus('Erreur de rendu: ' + (err && err.message ? err.message : 'inconnue') + '. Essayez de recharger la page.', true);
          });
      })
      .catch(function (err) {
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

  function destroyDoc() {
    if (docLoadingTask) {
      try { docLoadingTask.destroy(); } catch (e) {}
      docLoadingTask = null;
    }
    if (pdfDoc) {
      try { pdfDoc.destroy(); } catch (e) {}
      pdfDoc = null;
    }
    rendering = false;
    pendingPage = null;
  }

  function ensureWorker(useWorker) {
    if (workerInitialized || !PDFJS) return;
    try {
      if (useWorker) {
        PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      workerInitialized = true;
    } catch (e) {
      console.warn('[CV] worker init failed', e);
    }
  }

  function loadFromSource(src) {
    if (!PDFJS) {
      setStatus('Lecteur PDF non disponible (connexion requise).', true);
      return;
    }
    if (!src) return;

    if (/^data:application\/pdf/i.test(src)) {
      var approxBytes = Math.floor(src.length * 0.75);
      if (approxBytes > 850000) {
        var mb = (approxBytes / 1024 / 1024).toFixed(2);
        setStatus('CV trop volumineux pour stockage base64 (' + mb + ' MB > 800 KB). Compressez le PDF ou hebergez-le (champ URL).', true);
        return;
      }
    }

    destroyDoc();
    ensureWorker(!isDataUrl);

    showLoader();
    setStatus('Chargement du document...');
    setControlsEnabled(false);

    var isDataUrl = /^data:/i.test(src);
    var params = { url: src, withCredentials: false };
    if (isDataUrl) {
      params.disableRange = true;
      params.disableStream = true;
    }

    try {
      docLoadingTask = PDFJS.getDocument(params);
    } catch (e) {
      setStatus('Impossible d\'ouvrir le document (' + e.message + ').', true);
      return;
    }

    docLoadingTask.onProgress = function (p) {
      if (p && typeof p.loaded === 'number' && typeof p.total === 'number' && p.total > 0) {
        var pct = Math.round((p.loaded / p.total) * 100);
        setStatus('Telechargement PDF... ' + pct + '%');
      }
    };

    withTimeout(docLoadingTask.promise, RENDER_TIMEOUT_MS, 'Telechargement PDF')
      .then(function (doc) {
        pdfDoc = doc;
        currentPage = 1;
        currentZoom = 1.0;
        updateZoomLabel();
        setControlsEnabled(true);
        renderPage(1);
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : 'erreur';
        var hint = isDataUrl
          ? ' Stockage base64 limite. Utilisez le champ "URL du CV" en placant le PDF sur Firebase Hosting (ex: cv/cv.pdf).'
          : ' Verifiez l\'URL ou la taille du fichier.';
        setStatus('Impossible de charger le PDF (' + msg + ').' + hint, true);
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

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (pdfDoc) renderPage(currentPage);
      }, 150);
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
