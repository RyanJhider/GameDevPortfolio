// ========================================
// MAIN.JS - Portfolio public pages (home, projects)
// Firebase first, JSON fallback, dynamic tag filters
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;
  var projectsData = [];
  var activeTags = [];
  var searchQuery = '';
  var sortMode = 'order';

  document.addEventListener('DOMContentLoaded', function () {
    loadData();
    initProjectsPageControls();
  });

  function loadData() {
    var config = window.FIREBASE_CONFIG;
    if (config && config.apiKey && typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) firebase.initializeApp(config);
        var db = firebase.firestore();
        db.collection('projects').get()
          .then(function (snapshot) {
            var out = [];
            snapshot.forEach(function (doc) {
              var data = doc.data();
              data.id = data.id || doc.id;
              out.push(data);
            });
            if (out.length > 0) {
              projectsData = U.sortProjectsByOrder(out);
              afterLoad();
            } else {
              loadFromJSON();
            }
          })
          .catch(function () { loadFromJSON(); });
      } catch (e) {
        loadFromJSON();
      }
    } else {
      loadFromJSON();
    }
  }

  function loadFromJSON() {
    fetch('data/projects.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(function (data) {
        if (data.projects && data.projects.length > 0) {
          projectsData = U.sortProjectsByOrder(data.projects);
          afterLoad();
        }
      })
      .catch(function (e) { console.error('Error loading data:', e); });
  }

  function afterLoad() {
    renderProjects();
    updateStats();
    if (typeof window.loadProfile === 'function') {
      try { window.loadProfile(); } catch (e) { /* noop */ }
    }
  }

  // ========================================
  // PROJECTS PAGE - Controls (search + sort)
  // ========================================

  function initProjectsPageControls() {
    var searchInput = document.getElementById('projects-search-input');
    var searchClear = document.getElementById('projects-search-clear');
    var sortSelect = document.getElementById('projects-sort-select');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.trim();
        if (searchClear) searchClear.classList.toggle('visible', searchQuery.length > 0);
        renderProjects();
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        this.classList.remove('visible');
        renderProjects();
        if (searchInput) searchInput.focus();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        sortMode = this.value;
        renderProjects();
      });
    }
  }

  function sortList(list) {
    var copy = list.slice();
    var parseDate = function (p) {
      var d = p.date || p.year || '';
      var n = parseInt(String(d), 10);
      return isNaN(n) ? 0 : n;
    };
    switch (sortMode) {
      case 'date-desc':
        copy.sort(function (a, b) { return parseDate(b) - parseDate(a); });
        break;
      case 'date-asc':
        copy.sort(function (a, b) { return parseDate(a) - parseDate(b); });
        break;
      case 'alpha-asc':
        copy.sort(function (a, b) {
          return (a.title || '').localeCompare(b.title || '');
        });
        break;
      case 'alpha-desc':
        copy.sort(function (a, b) {
          return (b.title || '').localeCompare(a.title || '');
        });
        break;
      case 'featured':
        copy.sort(function (a, b) {
          if ((b.featured ? 1 : 0) !== (a.featured ? 1 : 0)) {
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          }
          return parseDate(b) - parseDate(a);
        });
        break;
      case 'order':
      default:
        // preserve default order (already sorted by sortProjectsByOrder or date desc)
        break;
    }
    return copy;
  }

  function getFilteredProjects() {
    var isHome = isHomePage();
    var list = isHome ? projectsData.filter(function (p) { return p.featured; }) : projectsData;
    list = list.filter(function (p) { return p.hidden !== true; });

    // Tag filter (OR logic)
    if (activeTags.length > 0) {
      list = list.filter(function (p) {
        if (!p.tags) return false;
        var names = p.tags.map(function (t) { return U.getTagName(t).toLowerCase(); });
        return activeTags.some(function (tag) { return names.indexOf(tag.toLowerCase()) !== -1; });
      });
    }

    // Search filter (matches title, description, tags, role, engine)
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function (p) {
        var haystack = [];
        haystack.push(p.title || '');
        haystack.push(p.description || '');
        haystack.push(p.descriptionLong || '');
        haystack.push(p.role || '');
        if (p.tags) {
          p.tags.forEach(function (t) { haystack.push(U.getTagName(t)); });
        }
        return haystack.join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }

    return list;
  }

  function isHomePage() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    return file === '' || file === 'index.html';
  }

  function buildFilterBar() {
    var bar = document.getElementById('filter-bar');
    if (!bar) return;

    var tagsByCategory = {};
    projectsData.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        var name = U.getTagName(t);
        var cat = U.getTagCategory(t);
        if (!name) return;
        if (!tagsByCategory[cat]) tagsByCategory[cat] = {};
        tagsByCategory[cat][name] = true;
      });
    });

    var categoryOrder = ['engine', 'language', 'role', 'genre', 'platform', 'tool', 'other'];
    var html = '<button class="filter-btn" data-tag="__clear" data-active="' + (activeTags.length === 0) + '">All</button>';
    categoryOrder.forEach(function (cat) {
      if (!tagsByCategory[cat]) return;
      Object.keys(tagsByCategory[cat]).sort().forEach(function (name) {
        var isActive = activeTags.indexOf(name) !== -1;
        html += '<button class="filter-btn" data-tag="' + U.escapeAttr(name) + '" data-active="' + isActive + '" style="border-color:' + U.getTagColor(cat) + '40;">' + U.escapeHtml(name) + '</button>';
      });
    });

    bar.innerHTML = html;
    bar.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = this.getAttribute('data-tag');
        if (tag === '__clear') {
          activeTags = [];
        } else {
          var idx = activeTags.indexOf(tag);
          if (idx === -1) activeTags.push(tag);
          else activeTags.splice(idx, 1);
        }
        buildFilterBar();
        renderProjects();
      });
    });

    bar.querySelectorAll('.filter-btn').forEach(function (btn) {
      if (btn.getAttribute('data-active') === 'true') btn.classList.add('active');
    });
  }

  function renderProjects() {
    var grid = document.getElementById('projects-list');
    if (!grid) return;

    if (!isHomePage()) buildFilterBar();

    var list = sortList(getFilteredProjects());

    if (!isHomePage()) {
      renderProjectsPage(list);
    } else {
      renderHomeList(grid, list);
    }
  }

  function renderHomeList(grid, list) {
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">No projects found</div>';
      return;
    }
    grid.innerHTML = list.map(function (p, i) { return renderCard(p, i); }).join('');
  }

  function renderProjectsPage(list) {
    var featuredWrap = document.getElementById('projects-featured-wrap');
    var featuredEl = document.getElementById('projects-featured');
    var gridLabel = document.getElementById('projects-grid-label');
    var gridLabelText = document.getElementById('projects-grid-label-text');
    var featuredCount = document.getElementById('featured-count');
    var gridCount = document.getElementById('grid-count');
    var grid = document.getElementById('projects-list');
    var countLine = document.getElementById('projects-count-line');

    var total = projectsData.filter(function (p) { return p.hidden !== true; }).length;
    if (countLine) {
      var labelText = total + ' project' + (total > 1 ? 's' : '') + ' // 2022 → ' + new Date().getFullYear();
      if (searchQuery) {
        labelText = list.length + ' match' + (list.length > 1 ? 'es' : '') + ' for "' + searchQuery + '"';
      } else if (activeTags.length > 0) {
        labelText = list.length + ' match' + (list.length > 1 ? 'es' : '') + ' // ' + activeTags.join(' + ');
      }
      countLine.textContent = labelText;
    }

    if (list.length === 0) {
      if (featuredWrap) featuredWrap.hidden = true;
      if (gridLabel) gridLabel.hidden = true;
      grid.innerHTML = '<div class="empty-state">No projects match your filters</div>';
      return;
    }

    // Split featured vs others (only when no search/tag filter active, to keep the section meaningful)
    var showFeaturedSplit = !searchQuery && activeTags.length === 0;
    var featured = showFeaturedSplit ? list.filter(function (p) { return p.featured; }) : [];
    var others = showFeaturedSplit ? list.filter(function (p) { return !p.featured; }) : list;

    if (featuredWrap && featuredEl) {
      if (featured.length > 0) {
        featuredWrap.hidden = false;
        if (featuredCount) featuredCount.textContent = featured.length;
        featuredEl.innerHTML = featured.map(function (p, i) { return renderFeaturedCard(p, i); }).join('');
        initFeaturedCarousel();
      } else {
        featuredWrap.hidden = true;
        featuredEl.innerHTML = '';
      }
    }

    if (gridLabel && gridLabelText && gridCount) {
      if (featured.length > 0) {
        gridLabel.hidden = false;
        gridLabelText.textContent = 'ALL PROJECTS';
        gridCount.textContent = others.length;
      } else {
        gridLabel.hidden = true;
      }
    }

    if (others.length === 0) {
      grid.innerHTML = '';
    } else {
      grid.innerHTML = others.map(function (p, i) { return renderCard(p, i); }).join('');
    }
  }

  // ========================================
  // Featured Carousel
  // ========================================

  function initFeaturedCarousel() {
    var track = document.getElementById('projects-featured');
    var prevBtn = document.getElementById('featured-prev');
    var nextBtn = document.getElementById('featured-next');
    var dotsEl = document.getElementById('featured-dots');
    if (!track) return;

    var cards = track.querySelectorAll('.featured-card');
    var total = cards.length;
    if (total === 0) {
      if (dotsEl) dotsEl.innerHTML = '';
      return;
    }

    // Build dots
    if (dotsEl) {
      var dotsHtml = '';
      for (var i = 0; i < total; i++) {
        dotsHtml += '<button type="button" class="featured-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" aria-label="Go to featured ' + (i + 1) + '"></button>';
      }
      dotsEl.innerHTML = dotsHtml;
      dotsEl.querySelectorAll('.featured-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-index'), 10) || 0;
          scrollToCard(idx);
        });
      });
    }

    function getStep() {
      if (!cards.length) return 0;
      var first = cards[0];
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function scrollToCard(idx) {
      var step = getStep();
      if (!step) return;
      track.scrollTo({ left: step * idx, behavior: 'smooth' });
    }

    function updateNav() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      var sl = track.scrollLeft;
      if (prevBtn) prevBtn.disabled = sl <= 2;
      if (nextBtn) nextBtn.disabled = sl >= maxScroll - 2;
      var edgeL = document.getElementById('featured-edge-left');
      var edgeR = document.getElementById('featured-edge-right');
      if (edgeL) edgeL.classList.toggle('visible', sl > 4);
      if (edgeR) edgeR.classList.toggle('visible', sl < maxScroll - 4);
      // Update dots based on closest card
      if (dotsEl && total > 0) {
        var step = getStep();
        var active = step > 0 ? Math.round(sl / step) : 0;
        active = Math.max(0, Math.min(total - 1, active));
        dotsEl.querySelectorAll('.featured-dot').forEach(function (d, i) {
          d.classList.toggle('active', i === active);
        });
      }
    }

    if (prevBtn) {
      prevBtn.onclick = function () {
        var step = getStep();
        track.scrollBy({ left: -step, behavior: 'smooth' });
      };
    }
    if (nextBtn) {
      nextBtn.onclick = function () {
        var step = getStep();
        track.scrollBy({ left: step, behavior: 'smooth' });
      };
    }

    track.onscroll = updateNav;
    window.addEventListener('resize', updateNav);

    // Keyboard arrows when hovering
    track.setAttribute('tabindex', '0');
    track.onkeydown = function (e) {
      if (e.key === 'ArrowRight') { track.scrollBy({ left: getStep(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { track.scrollBy({ left: -getStep(), behavior: 'smooth' }); e.preventDefault(); }
    };

    // Wheel: vertical scroll converted to horizontal when over carousel
    track.onwheel = function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    updateNav();
  }

  // ========================================
  // Card Renderers
  // ========================================

  function renderFeaturedCard(p, i) {
    var thumb = p.thumbnail
      ? '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="' + U.escapeAttr(p.title || 'Project') + '" class="featured-thumb-img" loading="lazy">'
      : '<div class="featured-thumb-img featured-thumb-empty">NO MEDIA</div>';

    var tagsHtml = '';
    if (p.tags && p.tags.length > 0) {
      tagsHtml = '<div class="featured-tags">';
      p.tags.slice(0, 5).forEach(function (t) {
        var name = U.getTagName(t);
        var cat = U.getTagCategory(t);
        tagsHtml += '<span class="featured-tag" style="color:' + U.getTagColor(cat) + ';border-color:' + U.getTagColor(cat) + '40;">' + U.escapeHtml(name) + '</span>';
      });
      tagsHtml += '</div>';
    }

    var metaBits = [];
    if (p.year || p.date) metaBits.push(U.escapeHtml(p.year || p.date));
    if (p.platform) metaBits.push(U.escapeHtml(p.platform));
    if (p.role) metaBits.push(U.escapeHtml(p.role));
    var metaLine = metaBits.join(' <span class="meta-sep">//</span> ');

    return '<a href="project.html?id=' + U.escapeAttr(p.id) + '" class="featured-card" style="animation-delay:' + (i * 0.08) + 's">' +
      '<div class="featured-thumb">' +
        thumb +
        '<div class="featured-overlay"></div>' +
        '<div class="featured-badge">★ FEATURED</div>' +
      '</div>' +
      '<div class="featured-body">' +
        '<div class="featured-meta">' + metaLine + '</div>' +
        '<h3 class="featured-title">' + U.escapeHtml(p.title || 'Untitled') + '</h3>' +
        '<p class="featured-desc">' + U.escapeHtml(p.description || '') + '</p>' +
        tagsHtml +
        '<div class="featured-cta">VIEW PROJECT <span>→</span></div>' +
      '</div>' +
    '</a>';
  }

  function renderCard(p, i) {
    var thumb = p.thumbnail
      ? '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="' + U.escapeAttr(p.title || 'Project') + '" class="project-thumb" loading="lazy">'
      : '<div class="project-thumb project-thumb-empty">NO MEDIA</div>';

    var tagsHtml = '';
    if (p.tags && p.tags.length > 0) {
      tagsHtml = '<div class="project-tags">';
      p.tags.slice(0, 4).forEach(function (t) {
        var name = U.getTagName(t);
        var cat = U.getTagCategory(t);
        tagsHtml += '<span class="project-tag" style="color:' + U.getTagColor(cat) + ';">' + U.escapeHtml(name) + '</span>';
      });
      tagsHtml += '</div>';
    }

    var yearLabel = (p.year || p.date) ? '<span class="project-card-year">' + U.escapeHtml(p.year || p.date) + '</span>' : '';
    var roleLabel = p.role ? '<span class="project-card-role">' + U.escapeHtml(p.role) + '</span>' : '';

    return '<a href="project.html?id=' + U.escapeAttr(p.id) + '" class="project-card" style="animation-delay:' + (i * 0.04) + 's">' +
      '<div class="project-card-media">' +
        thumb +
        (p.featured ? '<div class="project-card-star">★</div>' : '') +
      '</div>' +
      '<div class="card-info">' +
        '<div class="project-card-head">' +
          '<h3 class="project-title">' + U.escapeHtml(p.title || 'Untitled') + '</h3>' +
          yearLabel +
        '</div>' +
        roleLabel +
        '<p class="project-desc">' + U.escapeHtml(p.description || '') + '</p>' +
        tagsHtml +
      '</div>' +
    '</a>';
  }

  function updateStats() {
    var total = projectsData.length;
    var featured = projectsData.filter(function (p) { return p.featured; }).length;
    var years = Math.max(1, new Date().getFullYear() - 2022);

    setText('projects-count', total);
    setText('featured-count', featured);
    setText('years-experience', years);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      var loader = document.getElementById('loading-screen');
      if (loader) loader.classList.add('hidden');
    }, 600);
  });

  window.PortfolioApp = {
    getProjects: function () { return projectsData; },
    getActiveTags: function () { return activeTags.slice(); }
  };
})();
