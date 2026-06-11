// ========================================
// PROJECT.JS - Project detail page (?id=xxx)
// Firebase first, JSON fallback
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;

  document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var projectId = urlParams.get('id');
    if (!projectId) {
      showError('Project Not Found', 'Missing project ID in URL.');
      return;
    }
    loadProject(projectId);
  });

  function loadProject(projectId) {
    var config = window.FIREBASE_CONFIG;
    if (config && config.apiKey && typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) firebase.initializeApp(config);
        firebase.firestore().collection('projects').doc(projectId).get()
          .then(function (doc) {
            if (doc.exists) {
              var data = doc.data();
              data.id = data.id || doc.id;
              renderProject(data);
            } else {
              loadFromJSON(projectId);
            }
          })
          .catch(function () { loadFromJSON(projectId); });
      } catch (e) {
        loadFromJSON(projectId);
      }
    } else {
      loadFromJSON(projectId);
    }
  }

  function loadFromJSON(projectId) {
    fetch('data/projects.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var project = (data.projects || []).find(function (p) { return p.id === projectId; });
        if (project) renderProject(project);
        else showError('Project Not Found', 'This project does not exist.');
      })
      .catch(function () { showError('Error Loading', 'Failed to load project data.'); });
  }

  function showError(title, msg) {
    setText('pdp-title', title);
    setText('pdp-subtitle', msg);
    var media = document.getElementById('pdp-media');
    if (media) media.innerHTML = '';
  }

  function renderProject(p) {
    document.title = (p.title || 'Project') + ' | Ryan Jhider';

    setText('pdp-title', p.title || 'Untitled');

    var subtitleParts = [p.year || p.date || '', p.platform || 'PC'];
    if (p.status === 'draft') subtitleParts.push('DRAFT');
    setText('pdp-subtitle', subtitleParts.filter(Boolean).join(' // '));

    renderMedia(p);
    renderPills(p);
    renderDescription(p);
    renderContributions(p);
    renderLinks(p);
    renderDetails(p);
    renderTech(p);
    renderGallery(p);
  }

  function renderMedia(p) {
    var media = document.getElementById('pdp-media');
    if (!media) return;
    media.innerHTML = '';

    var videoId = p.video ? U.extractVideoId(p.video) : null;
    if (videoId) {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + U.escapeAttr(videoId);
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      media.appendChild(iframe);
    } else if (p.thumbnail) {
      var img = document.createElement('img');
      img.src = U.escapeAttr(p.thumbnail);
      img.alt = U.escapeAttr(p.title || 'Project thumbnail');
      media.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'pdp-media-placeholder';
      ph.textContent = '🎮';
      media.appendChild(ph);
    }
  }

  function renderPills(p) {
    var pills = document.getElementById('pdp-pills');
    if (!pills) return;
    pills.innerHTML = '';

    var items = [];
    (p.tags || []).forEach(function (t) {
      var cat = U.getTagCategory(t);
      if (cat === 'engine' || cat === 'genre') items.push({ name: U.getTagName(t), cat: cat });
    });
    if (p.mode) items.push({ name: p.mode, cat: 'other' });

    items.forEach(function (it) {
      var span = document.createElement('span');
      span.className = 'pdp-pill';
      span.textContent = it.name;
      span.style.borderColor = U.getTagColor(it.cat) + '60';
      span.style.color = U.getTagColor(it.cat);
      pills.appendChild(span);
    });
  }

  function renderDescription(p) {
    setText('pdp-desc', p.descriptionLong || p.description || '');
  }

  function renderContributions(p) {
    var section = document.getElementById('pdp-contributions-section');
    var container = document.getElementById('pdp-contributions');
    if (!section || !container) return;
    container.innerHTML = '';

    var list = [];
    (p.contributions || []).forEach(function (c) {
      if (!c) return;
      var title, desc;
      if (typeof c === 'string') { title = c; desc = ''; }
      else { title = c.title || ''; desc = c.description || ''; }
      title = String(title).trim();
      if (!title) return;
      list.push({ title: title, desc: String(desc).trim() });
    });

    if (list.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    list.forEach(function (it) {
      var card = document.createElement('div');
      card.className = 'pdp-contrib-card';

      var titleEl = document.createElement('h3');
      titleEl.className = 'pdp-contrib-title';
      titleEl.textContent = it.title;
      card.appendChild(titleEl);

      if (it.desc) {
        var descEl = document.createElement('div');
        descEl.className = 'pdp-contrib-desc markdown-body';
        descEl.innerHTML = U.renderMarkdown(it.desc);
        card.appendChild(descEl);
      }

      container.appendChild(card);
    });
  }

  function renderLinks(p) {
    var container = document.getElementById('pdp-links');
    if (!container) return;
    container.innerHTML = '';

    var links = U.normalizeLinks(p.links);
    if (links.length === 0) {
      var span = document.createElement('span');
      span.className = 'pdp-no-links';
      span.textContent = 'No download links available';
      container.appendChild(span);
      return;
    }

    links.forEach(function (link) {
      var url = U.safeUrl(link.url);
      if (!url) return;
      var a = document.createElement('a');
      a.href = url;
      a.className = 'pdp-link-btn';
      a.textContent = U.linkLabel(link.type);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      container.appendChild(a);
    });
  }

  function renderDetails(p) {
    var container = document.getElementById('pdp-details');
    if (!container) return;
    container.innerHTML = '';

    var rows = [];
    if (p.date) rows.push({ label: 'Release', value: p.date });
    if (p.year) rows.push({ label: 'Year', value: p.year });
    if (p.platform) rows.push({ label: 'Platform', value: p.platform });
    if (p.status) rows.push({ label: 'Status', value: p.status === 'published' ? 'Released' : 'Draft' });
    if (p.featured) rows.push({ label: 'Featured', value: 'Yes' });

    var roles = [];
    (p.tags || []).forEach(function (t) {
      if (U.getTagCategory(t) === 'role') roles.push(U.getTagName(t));
    });
    if (roles.length) rows.push({ label: 'My Role', value: roles.join(', ') });

    if (p.role && roles.indexOf(p.role) === -1) rows.push({ label: 'Role', value: p.role });
    if (p.team) rows.push({ label: 'Team', value: p.team });
    if (p.context) rows.push({ label: 'Context', value: p.context });
    if (p.duration) rows.push({ label: 'Duration', value: p.duration });

    var langs = [];
    (p.tags || []).forEach(function (t) {
      if (U.getTagCategory(t) === 'language') langs.push(U.getTagName(t));
    });
    if (langs.length) rows.push({ label: 'Languages', value: langs.join(', ') });

    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'pdp-detail-row';
      var lbl = document.createElement('span');
      lbl.className = 'pdp-detail-label';
      lbl.textContent = r.label;
      var val = document.createElement('span');
      val.className = 'pdp-detail-value';
      val.textContent = r.value;
      row.appendChild(lbl);
      row.appendChild(val);
      container.appendChild(row);
    });
  }

  function renderTech(p) {
    var container = document.getElementById('pdp-tech');
    if (!container) return;
    container.innerHTML = '';

    (p.tags || []).forEach(function (t) {
      var name = U.getTagName(t);
      var cat = U.getTagCategory(t);
      if (!name) return;
      var span = document.createElement('span');
      span.className = 'pdp-tech-tag';
      span.textContent = name;
      span.style.borderLeft = '3px solid ' + U.getTagColor(cat);
      container.appendChild(span);
    });
  }

  function renderGallery(p) {
    var container = document.getElementById('pdp-gallery');
    if (!container) return;
    container.innerHTML = '';

    var images = [];
    (p.images || []).forEach(function (src) {
      var url = U.safeUrl(src);
      if (url) images.push({ url: url, alt: U.escapeAttr(p.title || 'Screenshot') });
    });
    if (p.thumbnail && images.length === 0) {
      var thumbUrl = U.safeUrl(p.thumbnail);
      if (thumbUrl) images.push({ url: thumbUrl, alt: U.escapeAttr(p.title || 'Cover') });
    }

    images.forEach(function (it, idx) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'pdp-gallery-item';
      item.setAttribute('data-idx', String(idx));
      item.setAttribute('aria-label', 'Open image ' + (idx + 1) + ' of ' + images.length);
      var img = document.createElement('img');
      img.src = it.url;
      img.alt = it.alt;
      img.loading = 'lazy';
      var zoom = document.createElement('span');
      zoom.className = 'pdp-gallery-zoom';
      zoom.setAttribute('aria-hidden', 'true');
      zoom.textContent = '+';
      item.appendChild(img);
      item.appendChild(zoom);
      container.appendChild(item);
    });

    container._lightboxImages = images;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ----- Lightbox -----
  var lbImages = [];
  var lbIndex = 0;
  var lbTitle = '';

  function openLightbox(images, index, title) {
    lbImages = images;
    lbIndex = index;
    lbTitle = title || '';
    var lb = ensureLightbox();
    var img = lb.querySelector('.pdp-lightbox-img');
    if (img) {
      img.classList.remove('is-swapping');
      // force reflow so the opening animation re-runs cleanly each open
    }
    lb.classList.remove('is-open', 'is-opening');
    // restart opening animation
    void lb.offsetWidth;
    lb.classList.add('is-opening', 'is-open');
    updateLightbox(true);
    preloadNeighbors();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('pdp-lightbox');
    if (!lb) return;
    lb.classList.remove('is-open', 'is-opening');
    document.body.style.overflow = '';
    var img = lb.querySelector('.pdp-lightbox-img');
    if (img) {
      setTimeout(function () {
        if (!lb.classList.contains('is-open') && img) img.src = '';
      }, 400);
    }
  }

  function updateLightbox(skipAnim) {
    var lb = document.getElementById('pdp-lightbox');
    if (!lb || !lbImages.length) return;
    var img = lb.querySelector('.pdp-lightbox-img');
    var counter = lb.querySelector('.pdp-lightbox-counter');
    var hint = lb.querySelector('.pdp-lightbox-hint');
    if (img) {
      if (skipAnim) {
        img.classList.remove('is-swapping');
        img.src = lbImages[lbIndex].url;
        img.alt = lbImages[lbIndex].alt || '';
      } else {
        img.classList.remove('is-swapping');
        void img.offsetWidth;
        img.classList.add('is-swapping');
        img.src = lbImages[lbIndex].url;
        img.alt = lbImages[lbIndex].alt || '';
      }
    }
    if (counter) counter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
    if (hint) {
      var btns = [];
      btns.push('ESC CLOSE');
      if (lbImages.length > 1) {
        btns.push('← → NAVIGATE');
        btns.push('CLICK OUTSIDE');
      }
      hint.textContent = btns.join('   //   ');
      hint.style.display = lbImages.length > 1 ? '' : 'none';
    }
    preloadNeighbors();
  }

  function preloadNeighbors() {
    if (!lbImages.length) return;
    var n = lbImages.length;
    [lbIndex - 1, lbIndex + 1].forEach(function (i) {
      var wrapped = ((i % n) + n) % n;
      var src = lbImages[wrapped].url;
      if (src && /^https?:\/\//i.test(src)) {
        var pre = new Image();
        pre.src = src;
      }
    });
  }

  function lbNext() {
    if (!lbImages.length) return;
    lbIndex = (lbIndex + 1) % lbImages.length;
    updateLightbox(false);
  }

  function lbPrev() {
    if (!lbImages.length) return;
    lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
    updateLightbox(false);
  }

  function ensureLightbox() {
    var lb = document.getElementById('pdp-lightbox');
    if (lb) return lb;

    lb = document.createElement('div');
    lb.id = 'pdp-lightbox';
    lb.className = 'pdp-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button type="button" class="pdp-lightbox-close" aria-label="Close (Escape)">&times;</button>' +
      '<button type="button" class="pdp-lightbox-prev" aria-label="Previous image (Left arrow)">&#10094;</button>' +
      '<button type="button" class="pdp-lightbox-next" aria-label="Next image (Right arrow)">&#10095;</button>' +
      '<img class="pdp-lightbox-img" alt="" />' +
      '<div class="pdp-lightbox-counter"></div>' +
      '<div class="pdp-lightbox-hint"></div>';

    document.body.appendChild(lb);

    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
    lb.querySelector('.pdp-lightbox-close').addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
    lb.querySelector('.pdp-lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); lbPrev(); });
    lb.querySelector('.pdp-lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); lbNext(); });

    // Swipe support (mobile)
    var startX = 0, startY = 0, startT = 0, tracking = false;
    lb.addEventListener('touchstart', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (!e.touches || !e.touches[0]) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      tracking = true;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
      if (!t) return;
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      var dt = Date.now() - startT;
      if (dt > 700) return;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) lbNext();
      else lbPrev();
    }, { passive: true });

    return lb;
  }

  document.addEventListener('click', function (e) {
    var item = e.target.closest && e.target.closest('.pdp-gallery-item');
    if (!item) return;
    var container = document.getElementById('pdp-gallery');
    if (!container || !container._lightboxImages) return;
    var idx = parseInt(item.getAttribute('data-idx') || '0', 10);
    openLightbox(container._lightboxImages, idx, document.title);
  });

  document.addEventListener('keydown', function (e) {
    var lb = document.getElementById('pdp-lightbox');
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeLightbox(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { lbNext(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { lbPrev(); e.preventDefault(); }
  });
})();
