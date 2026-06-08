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

    (p.images || []).forEach(function (src) {
      var url = U.safeUrl(src);
      if (!url) return;
      var item = document.createElement('div');
      item.className = 'pdp-gallery-item';
      var img = document.createElement('img');
      img.src = url;
      img.alt = U.escapeAttr(p.title || 'Screenshot');
      img.loading = 'lazy';
      item.appendChild(img);
      container.appendChild(item);
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
})();
