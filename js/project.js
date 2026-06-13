// ========================================
// PROJECT.JS - Project detail page (?id=xxx)
// Firebase first, JSON fallback
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;

  var currentSlide = 0;
  var currentSlides = [];

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
              if (data.hidden === true) {
                showError('Project Not Found', 'This project does not exist.');
                return;
              }
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
        if (project && project.hidden !== true) renderProject(project);
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
    window._pdpTitle = p.title || 'Project';
    window._pdpVideoOrientation = (p.videoOrientation === 'vertical') ? 'vertical' : 'landscape';

    setText('pdp-title', p.title || 'Untitled');
    setText('pdp-crumb-title', p.title || 'Project');
    setText('pdp-buybox-title', p.title || 'Untitled');

    var year = p.year || p.date || '';
    var platform = p.platform || 'PC';
    var subtitleParts = [year, platform];
    if (p.status === 'draft') subtitleParts.push('IN DEV');
    else if (p.status === 'wishlist') subtitleParts.push('WISHLIST');
    setText('pdp-subtitle', subtitleParts.filter(Boolean).join(' // '));

    setText('pdp-buybox-platform', platform);
    setText('pdp-buybox-release', year || '—');

    var statusBadge = document.getElementById('pdp-status-badge');
    if (statusBadge) {
      var badgeText, badgeClass;
      if (p.status === 'draft') { badgeText = 'IN DEV'; badgeClass = 'is-draft'; }
      else if (p.status === 'wishlist') { badgeText = 'WISHLIST'; badgeClass = 'is-wishlist'; }
      else if (p.featured) { badgeText = 'FEATURED'; badgeClass = 'is-featured'; }
      else { badgeText = 'RELEASED'; badgeClass = 'is-released'; }
      statusBadge.textContent = badgeText;
      statusBadge.className = 'pdp-hero-badge ' + badgeClass;
    }

    var buyboxStatus = document.getElementById('pdp-buybox-status');
    if (buyboxStatus) {
      if (p.status === 'draft') buyboxStatus.textContent = 'In Development';
      else if (p.status === 'wishlist') buyboxStatus.textContent = 'Wishlist';
      else if (p.status === 'released' || p.status === 'published') buyboxStatus.textContent = 'Released';
      else buyboxStatus.textContent = '';
    }

    currentSlide = 0;
    currentSlides = buildSlides(p);
    preloadImageOrientations(currentSlides);
    renderMedia(currentSlides);
    renderThumbs(currentSlides);
    renderPills(p);
    renderHeroImage(p);
    renderDescription(p);
    renderContributions(p);
    renderLinks(p);
    renderDetails(p);
    renderTech(p);
    bindShare();
    bindPlayerArrows();
    updatePlayerArrows();
  }

  function buildSlides(p) {
    var slides = [];
    var videoId = p.video ? U.extractVideoId(p.video) : null;
    var videoOrientation = (p.videoOrientation === 'vertical') ? 'vertical' : 'landscape';
    if (videoId) {
      slides.push({
        kind: 'video',
        videoId: videoId,
        orientation: videoOrientation,
        thumb: 'https://i.ytimg.com/vi/' + U.escapeAttr(videoId) + '/hqdefault.jpg',
        label: 'TRAILER'
      });
    }
    (p.images || []).forEach(function (src, i) {
      var url = U.safeUrl(src);
      if (url) slides.push({ kind: 'image', url: url, orientation: 'pending', label: 'SCREENSHOT ' + String(i + 1).padStart(2, '0') });
    });
    if (slides.length === 0 && p.thumbnail) {
      var thumbUrl = U.safeUrl(p.thumbnail);
      if (thumbUrl) slides.push({ kind: 'image', url: thumbUrl, orientation: 'pending', label: 'CAPSULE' });
    }
    if (slides.length === 0) {
      slides.push({ kind: 'placeholder', label: 'NO MEDIA' });
    }
    return slides;
  }

  // Preload every image slide off-screen so we know its natural dimensions
  // BEFORE the user clicks the thumbnail. This prevents the player from
  // resizing mid-render (the source of the layout flash).
  function preloadImageOrientations(slides) {
    slides.forEach(function (s) {
      if (s.kind !== 'image') return;
      if (s.orientation && s.orientation !== 'pending') return;
      var probe = new Image();
      probe.onload = function () {
        var w = probe.naturalWidth || 0;
        var h = probe.naturalHeight || 0;
        s.orientation = (w > 0 && h > w) ? 'vertical' : 'landscape';
      };
      probe.onerror = function () { s.orientation = 'landscape'; };
      probe.src = s.url;
    });
  }

  function renderMedia(slides) {
    var media = document.getElementById('pdp-media');
    var label = document.getElementById('pdp-player-label');
    var counter = document.getElementById('pdp-player-counter');
    var player = document.querySelector('.pdp-player');
    if (!media) return;

    var s = slides[currentSlide] || slides[0];
    if (label) label.textContent = s.label || '';
    if (counter) counter.textContent = (currentSlide + 1) + ' / ' + slides.length;

    // 1) Resolve the target orientation BEFORE touching the DOM. For images
    //    this was preloaded by preloadImageOrientations(); if for some
    //    reason it's still pending, fall back to landscape (the container
    //    stays 16/9 briefly, but we'll never re-flow once the image paints).
    var orient = s.orientation;
    if (orient === 'pending' || !orient) {
      orient = (s.kind === 'video') ? (s.orientation || 'landscape') : 'landscape';
    }

    // 2) Set the orientation class on the player FIRST. The player container
    //    resizes to the new aspect-ratio here. Then we swap the media
    //    contents in the same frame so the user never sees a blank/stretched
    //    frame in between.
    if (player) {
      if (orient === 'vertical') player.classList.add('is-vertical');
      else player.classList.remove('is-vertical');
    }

    // 3) Swap the media contents. We build the new node off-DOM first, then
    //    replace in a single innerHTML write to minimize reflow flicker.
    var next = null;
    if (s.kind === 'video') {
      var iframe = document.createElement('iframe');
      var embedUrl = orient === 'vertical'
        ? 'https://www.youtube.com/embed/' + U.escapeAttr(s.videoId) + '?autoplay=1&rel=0&playsinline=1'
        : 'https://www.youtube.com/embed/' + U.escapeAttr(s.videoId) + '?autoplay=1&rel=0';
      iframe.src = embedUrl;
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      next = iframe;
    } else if (s.kind === 'image') {
      var img = document.createElement('img');
      img.src = U.escapeAttr(s.url);
      img.alt = U.escapeAttr((window._pdpTitle || 'Project') + ' - ' + (s.label || 'media'));
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        openLightboxFromSlides(slides, currentSlide);
      });
      next = img;
    } else {
      var ph = document.createElement('div');
      ph.className = 'pdp-media-placeholder';
      ph.textContent = '🎮';
      next = ph;
    }

    media.innerHTML = '';
    media.appendChild(next);
  }

  function renderThumbs(slides) {
    var container = document.getElementById('pdp-thumbs');
    var wrap = document.getElementById('pdp-thumbs-wrap');
    if (!container) return;
    container.innerHTML = '';

    if (slides.length <= 1) {
      if (wrap) wrap.style.display = 'none';
      return;
    }

    if (wrap) wrap.style.display = '';

    slides.forEach(function (s, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pdp-thumb';
      if (idx === currentSlide) btn.classList.add('is-active');
      btn.setAttribute('data-idx', String(idx));
      btn.setAttribute('aria-label', s.label || ('Media ' + (idx + 1)));

      if (s.kind === 'video') {
        btn.classList.add('is-video');
        var img = document.createElement('img');
        img.src = U.escapeAttr(s.thumb);
        img.alt = '';
        img.loading = 'lazy';
        btn.appendChild(img);
        var play = document.createElement('span');
        play.className = 'pdp-thumb-play';
        play.setAttribute('aria-hidden', 'true');
        play.textContent = '▶';
        btn.appendChild(play);
      } else if (s.kind === 'image') {
        var img = document.createElement('img');
        img.src = U.escapeAttr(s.url);
        img.alt = '';
        img.loading = 'lazy';
        btn.appendChild(img);
      } else {
        var ph = document.createElement('span');
        ph.className = 'pdp-thumb-ph';
        ph.textContent = '🎮';
        btn.appendChild(ph);
      }

      var num = document.createElement('span');
      num.className = 'pdp-thumb-num';
      num.textContent = String(idx + 1).padStart(2, '0');
      btn.appendChild(num);

      btn.addEventListener('click', function () {
        if (currentSlide === idx) return;
        currentSlide = idx;
        var allThumbs = container.querySelectorAll('.pdp-thumb');
        allThumbs.forEach(function (t) { t.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderMedia(slides);
      });

      container.appendChild(btn);
    });
  }

  function openLightboxFromSlides(slides, index) {
    var images = [];
    slides.forEach(function (s) {
      if (s.kind === 'image') images.push({ url: s.url, alt: s.label });
    });
    if (images.length === 0) return;
    var imgIdx = 0;
    for (var i = 0; i <= index && i < slides.length; i++) {
      if (slides[i].kind === 'image') imgIdx++;
    }
    imgIdx = Math.max(0, imgIdx - 1);
    openLightbox(images, imgIdx, document.title);
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

  function renderHeroImage(p) {
    var wrap = document.getElementById('pdp-hero-image');
    if (!wrap) return;
    wrap.innerHTML = '';

    var thumb = p.thumbnail ? U.safeUrl(p.thumbnail) : null;
    if (thumb) {
      wrap.classList.add('has-image');
      var img = document.createElement('img');
      img.src = U.escapeAttr(thumb);
      img.alt = U.escapeAttr(p.title || 'Project cover');
      img.loading = 'eager';
      wrap.appendChild(img);
    } else {
      wrap.classList.remove('has-image');
      var ph = document.createElement('div');
      ph.className = 'pdp-hero-image-placeholder';
      ph.textContent = '🎮';
      wrap.appendChild(ph);
    }
  }

  function renderDescription(p) {
    setText('pdp-desc', p.description || '');
    setText('pdp-desc-long', p.descriptionLong || p.description || '');
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
    var release = p.date || p.year;
    if (release) rows.push({ label: 'Release', value: release });
    if (p.platform) rows.push({ label: 'Platform', value: p.platform });
    if (p.status) {
      var statusLabel;
      if (p.status === 'draft') statusLabel = 'In Development';
      else if (p.status === 'wishlist') statusLabel = 'Wishlist';
      else statusLabel = 'Released';
      rows.push({ label: 'Status', value: statusLabel });
    }
    if (p.featured) rows.push({ label: 'Featured', value: 'Yes' });

    var roles = [];
    (p.tags || []).forEach(function (t) {
      if (U.getTagCategory(t) === 'role') roles.push(U.getTagName(t));
    });
    if (roles.length) rows.push({ label: 'My Role', value: roles.join(', ') });

    if (p.team) {
      var teamStr = U.formatTeam(p.team);
      if (teamStr) rows.push({ label: 'Team', value: teamStr });
    }
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

  function bindShare() {
    var btns = document.querySelectorAll('.pdp-share-btn');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-share');
        var url = encodeURIComponent(window.location.href);
        var title = encodeURIComponent(document.title);
        if (type === 'twitter') {
          window.open('https://twitter.com/intent/tweet?text=' + title + '&url=' + url, '_blank', 'noopener,noreferrer');
        } else if (type === 'linkedin') {
          window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank', 'noopener,noreferrer');
        } else if (type === 'copy') {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(function () {
              btn.textContent = '✓';
              setTimeout(function () { btn.textContent = '⎘'; }, 1500);
            }).catch(function () { fallbackCopy(window.location.href); });
          } else {
            fallbackCopy(window.location.href);
          }
        }
      });
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ----- Player prev/next arrows -----
  function bindPlayerArrows() {
    var prev = document.getElementById('pdp-player-prev');
    var next = document.getElementById('pdp-player-next');
    if (prev && !prev._bound) {
      prev._bound = true;
      prev.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(currentSlide - 1);
      });
    }
    if (next && !next._bound) {
      next._bound = true;
      next.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(currentSlide + 1);
      });
    }

    // Keyboard arrows when the player area is in view (or always when no
    // lightbox is open). Left/Right cycle through slides.
    if (!window._pdpKeysBound) {
      window._pdpKeysBound = true;
      document.addEventListener('keydown', function (e) {
        var lb = document.getElementById('pdp-lightbox');
        if (lb && lb.classList.contains('is-open')) return;
        if (!currentSlides || currentSlides.length < 2) return;
        var t = e.target;
        var tag = t && t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
        if (e.key === 'ArrowLeft') { goToSlide(currentSlide - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); e.preventDefault(); }
      });
    }
  }

  function updatePlayerArrows() {
    var prev = document.getElementById('pdp-player-prev');
    var next = document.getElementById('pdp-player-next');
    if (!prev || !next) return;
    var multi = currentSlides && currentSlides.length > 1;
    var has = function (el, on) { if (on) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); };
    has(prev, multi);
    has(next, multi);
  }

  function goToSlide(idx) {
    if (!currentSlides || currentSlides.length < 2) return;
    var n = currentSlides.length;
    var wrapped = ((idx % n) + n) % n;
    if (wrapped === currentSlide) return;
    currentSlide = wrapped;

    var thumbs = document.querySelectorAll('#pdp-thumbs .pdp-thumb');
    thumbs.forEach(function (t) { t.classList.remove('is-active'); });
    var active = thumbs[currentSlide];
    if (active) {
      active.classList.add('is-active');
      // Keep the active thumb in view in the horizontal strip
      if (active.scrollIntoView) {
        try { active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }
        catch (e) { active.scrollIntoView(); }
      }
    }
    renderMedia(currentSlides);
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

  document.addEventListener('keydown', function (e) {
    var lb = document.getElementById('pdp-lightbox');
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeLightbox(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { lbNext(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { lbPrev(); e.preventDefault(); }
  });
})();
