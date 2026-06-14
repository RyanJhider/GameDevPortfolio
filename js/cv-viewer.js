// ========================================
// CV VIEWER - Lecteur PDF integre (simple, robuste)
// ========================================

(function () {
  'use strict';

  var PDFJS = window.pdfjsLib;
  var PDF_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
  var PDF_LIB = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';

  function $(id) { return document.getElementById(id); }

  function setStatus(msg, isError) {
    var el = $('cv-status');
    if (el) {
      el.textContent = msg;
      el.classList.toggle('cv-viewer-status-error', !!isError);
    }
  }

  function show(elId) { var el = $(elId); if (el) el.hidden = false; }
  function hide(elId) { var el = $(elId); if (el) el.hidden = true; }

  function setControlsEnabled(enabled) {
    ['cv-prev', 'cv-next', 'cv-zoom-in', 'cv-zoom-out', 'cv-page-num'].forEach(function (id) {
      var el = $(id);
      if (el) el.disabled = !enabled;
    });
  }

  // Charge la lib PDF.js a la demande si pas deja disponible
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PDF_LIB;
      s.onload = function () {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('pdfjsLib indisponible apres chargement'));
        }
      };
      s.onerror = function () { reject(new Error('Impossible de charger pdf.js')); };
      document.head.appendChild(s);
    });
  }

  var state = {
    doc: null,
    page: 1,
    numPages: 0,
    scale: 1.2,
    task: null,
    rendering: false
  };

  function clearCanvas() {
    var c = $('cv-canvas');
    if (!c) return;
    var ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
  }

  function cancelRender() {
    if (state.task) {
      try { state.task.cancel(); } catch (e) {}
      state.task = null;
    }
  }

  function renderPage(num) {
    if (!state.doc) return;
    cancelRender();
    state.rendering = true;

    state.doc.getPage(num).then(function (page) {
      var canvas = $('cv-canvas');
      if (!canvas) { state.rendering = false; return; }

      // 1) Calcul d'un viewport adapte a la largeur du container
      var stage = $('cv-stage');
      var containerWidth = stage ? stage.clientWidth : 800;
      var baseVp = page.getViewport({ scale: 1 });
      var fitScale = containerWidth / baseVp.width;
      var finalScale = fitScale * state.scale;

      // 2) Construction du viewport final
      var vp = page.getViewport({ scale: finalScale });

      // 3) Dimensionne le canvas en pixels reels (1:1, pas de DPR)
      var w = Math.floor(vp.width);
      var h = Math.floor(vp.height);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      // 4) Reset transform puis rend
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      setStatus('Rendu de la page ' + num + '/' + state.numPages + '...');
      show('cv-loader');
      hide('cv-canvas-wrap');

      state.task = page.render({ canvasContext: ctx, viewport: vp });
      return state.task.promise.then(function () {
        state.rendering = false;
        state.task = null;
        state.page = num;
        hide('cv-loader');
        show('cv-canvas-wrap');
        var numEl = $('cv-page-num');
        var countEl = $('cv-page-count');
        if (numEl) numEl.value = num;
        if (countEl) countEl.textContent = state.numPages;
      });
    }).catch(function (err) {
      state.rendering = false;
      state.task = null;
      if (err && err.name === 'RenderingCancelledException') return;
      setStatus('Erreur: ' + (err && err.message ? err.message : 'rendu'), true);
    });
  }

  function bindControls() {
    $('cv-prev').addEventListener('click', function () {
      if (state.page > 1) renderPage(state.page - 1);
    });
    $('cv-next').addEventListener('click', function () {
      if (state.page < state.numPages) renderPage(state.page + 1);
    });
    $('cv-zoom-in').addEventListener('click', function () {
      state.scale = Math.min(state.scale + 0.2, 3);
      var zl = $('cv-zoom-level');
      if (zl) zl.textContent = Math.round(state.scale * 100) + '%';
      renderPage(state.page);
    });
    $('cv-zoom-out').addEventListener('click', function () {
      state.scale = Math.max(state.scale - 0.2, 0.4);
      var zl = $('cv-zoom-level');
      if (zl) zl.textContent = Math.round(state.scale * 100) + '%';
      renderPage(state.page);
    });
    var numInput = $('cv-page-num');
    if (numInput) {
      numInput.addEventListener('change', function () {
        var v = parseInt(numInput.value, 10);
        if (!isNaN(v) && v >= 1 && v <= state.numPages) renderPage(v);
      });
    }
  }

  function load(src) {
    if (!src) return;
    setStatus('Chargement du lecteur...');
    show('cv-loader');
    hide('cv-canvas-wrap');
    setControlsEnabled(false);

    loadPdfJs().then(function (pdfjs) {
      setStatus('Ouverture du document...');
      // Pour data:URL on desactive range/stream (plus fiable)
      var isData = /^data:/i.test(src);
      var opts = { url: src, withCredentials: false };
      if (isData) { opts.disableRange = true; opts.disableStream = true; }

      var task = pdfjs.getDocument(opts);
      return task.promise.then(function (doc) {
        state.doc = doc;
        state.numPages = doc.numPages;
        state.page = 1;
        state.scale = 1.2;
        var zl = $('cv-zoom-level');
        if (zl) zl.textContent = '120%';
        setControlsEnabled(true);
        renderPage(1);
      });
    }).catch(function (err) {
      setStatus('Echec du chargement: ' + (err && err.message ? err.message : 'inconnu'), true);
      setControlsEnabled(false);
    });
  }

  window.initCvViewer = function () {
    var root = $('cv-viewer');
    if (!root || root.dataset.inited === '1') return;
    var src = $('cv-source') ? $('cv-source').value : '';
    if (!src) return;
    root.dataset.inited = '1';
    root.classList.remove('cv-viewer-empty');
    var ph = root.querySelector('.cv-viewer-placeholder');
    if (ph) ph.hidden = true;
    bindControls();
    load(src);
  };
})();
