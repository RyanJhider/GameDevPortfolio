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

  // Pre-charge le tag depuis l'URL des le top-level (avant meme le
  // DOMContentLoaded). Sert aussi de backup si jamais DOMContentLoaded
  // est en retard.
  (function captureTagAtTop() {
    try {
      var raw = new URLSearchParams(window.location.search).get('tag');
      if (raw && raw.trim() && activeTags.indexOf(raw.trim()) === -1) {
        activeTags.push(raw.trim());
      }
    } catch (e) { /* noop */ }
  })();

  document.addEventListener('DOMContentLoaded', function () {
    // Re-capture au cas ou la premiere capture avait echoue (race).
    applyInitialTagFromUrl();
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
    applyInitialTagFromUrl();
    renderProjects();
    if (typeof window.loadProfile === 'function') {
      try { window.loadProfile(); } catch (e) { /* noop */ }
    }
  }

  // Lit ?tag= dans l'URL et pousse dans activeTags. Tourne a
  // plusieurs moments pour resister a toute race DOM / async :
  // DOMContentLoaded (avant tout chargement data) ET apres les
  // donnees chargees via afterLoad.
  function applyInitialTagFromUrl() {
    var onProjects = !!document.querySelector('.projects-page');
    if (!onProjects) return;
    var raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('tag');
    } catch (e) { /* noop */ }
    if (!raw || !raw.trim()) return;
    var needle = raw.trim();
    // Evite de doubler si deja applique
    if (activeTags.indexOf(needle) !== -1) return;
    activeTags.push(needle);
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

    // Tag filter (OR logic). Match exact sur nom de tag OU presence du
    // terme dans titre / description / role (pour les skills cliques
    // depuis la home qui ne sont pas des tags formels).
    if (activeTags.length > 0) {
      list = list.filter(function (p) {
        var haystack = [];
        haystack.push(p.title || '');
        haystack.push(p.description || '');
        haystack.push(p.descriptionLong || '');
        haystack.push(p.role || '');
        haystack.push(U.getProjectPlatform(p, ''));
        if (p.tags) {
          p.tags.forEach(function (t) { haystack.push(U.getTagName(t)); });
        }
        return activeTags.some(function (tag) {
          var t = tag.toLowerCase();
          // Match exact dans tags (categorie formelle)
          if (p.tags && p.tags.some(function (x) { return U.getTagName(x).toLowerCase() === t; })) return true;
          // Fallback: presence du terme dans le haystack (skills non-tag)
          return haystack.join(' ').toLowerCase().indexOf(t) !== -1;
        });
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

  // Vrai si on est sur la page projets (et non la home). Utilise le
  // DOM comme source de verite, plus fiable que pathname (cas d'une URL
  // type file:///.../index.html?tag=Unity passee a isHomePage()).
  function isProjectsPage() {
    var list = document.getElementById('projects-list');
    if (!list) return false;
    var sec = document.querySelector('.projects-page');
    return !!sec && !isHomePage();
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
        if (!tagsByCategory[cat][name]) tagsByCategory[cat][name] = { count: 0 };
        tagsByCategory[cat][name].count += 1;
      });
    });

    var categoryOrder = ['engine', 'language', 'role', 'genre', 'platform', 'tool', 'other'];
    var html = '<button class="filter-btn" data-tag="__clear" data-active="' + (activeTags.length === 0) + '">All</button>';

    // Injecter les activeTags qui n'existent pas comme tag reel
    // (ex: skill "Unreal Engine" clique depuis la home) pour qu'ils
    // apparaissent visuellement actifs dans la barre.
    var existingNames = {};
    categoryOrder.forEach(function (cat) {
      if (!tagsByCategory[cat]) return;
      Object.keys(tagsByCategory[cat]).forEach(function (n) { existingNames[n.toLowerCase()] = true; });
    });
    var ghostTags = activeTags.filter(function (t) { return !existingNames[t.toLowerCase()]; });
    if (ghostTags.length > 0) {
      if (!tagsByCategory.other) tagsByCategory.other = {};
      ghostTags.forEach(function (t) {
        if (!tagsByCategory.other[t]) tagsByCategory.other[t] = { count: 0 };
      });
    }

    var visibleLimit = 4;
    var overflowCount = 0;
    var hasOverflow = false;

    // If the user has any active tag that's normally hidden, force-open
    // the overflow so the active state stays visible after re-render.
    var activeForcesOpen = false;
    categoryOrder.forEach(function (cat) {
      if (!tagsByCategory[cat]) return;
      var tagsArr = Object.keys(tagsByCategory[cat]).map(function (n) {
        return { name: n, count: tagsByCategory[cat][n].count };
      }).sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
      tagsArr.forEach(function (t, idx) {
        if (idx >= visibleLimit && activeTags.indexOf(t.name) !== -1) activeForcesOpen = true;
      });
    });

    categoryOrder.forEach(function (cat) {
      if (!tagsByCategory[cat]) return;
      var tagsArr = Object.keys(tagsByCategory[cat]).map(function (n) {
        return { name: n, count: tagsByCategory[cat][n].count };
      }).sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      var overflowOpen = false;
      tagsArr.forEach(function (t, idx) {
        var isActive = activeTags.indexOf(t.name) !== -1;
        var needsOverflow = idx >= visibleLimit;
        if (needsOverflow && !overflowOpen) {
          html += '<span class="filter-bar-overflow" data-cat="' + U.escapeAttr(cat) + '">';
          overflowOpen = true;
          hasOverflow = true;
        }
        html += '<button class="filter-btn" data-tag="' + U.escapeAttr(t.name) + '" data-active="' + isActive + '" data-overflow="' + needsOverflow + '" style="border-color:' + U.getTagColor(cat) + '40;">' + U.escapeHtml(t.name) + '</button>';
        if (needsOverflow) overflowCount++;
      });
      if (overflowOpen) html += '</span>';
    });

    // Force-open the overflow if an active tag lives there.
    if (activeForcesOpen) {
      var _b = document.getElementById('filter-bar');
      if (_b) _b.classList.add('is-overflow-open');
    }

    if (hasOverflow) {
      html += '<button type="button" class="filter-btn filter-btn-toggle" data-action="toggle-overflow" aria-expanded="' + (activeForcesOpen ? 'true' : 'false') + '">Show more (+' + overflowCount + ')</button>';
    }

    bar.innerHTML = html;

    bar.querySelectorAll('.filter-btn').forEach(function (btn) {
      if (btn.getAttribute('data-action') === 'toggle-overflow') return;
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

    var toggleBtn = bar.querySelector('[data-action="toggle-overflow"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var opened = bar.classList.toggle('is-overflow-open');
        this.setAttribute('aria-expanded', opened ? 'true' : 'false');
        var hiddenCount = bar.querySelectorAll('.filter-btn[data-overflow="true"]').length;
        this.textContent = opened ? 'Show less (' + hiddenCount + ')' : 'Show more (+' + hiddenCount + ')';
      });
    }

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
    var activeWrap = document.getElementById('active-filters');
    var activePills = document.getElementById('active-filters-pills');
    var activeClear = document.getElementById('active-filters-clear');

    if (activeWrap && activePills) {
      if (activeTags.length > 0) {
        activeWrap.hidden = false;
        activePills.innerHTML = activeTags.map(function (t) {
          return '<span class="active-filter-pill" data-tag="' + U.escapeAttr(t) + '">' +
            U.escapeHtml(t) +
            '<button type="button" class="active-filter-remove" data-remove="' + U.escapeAttr(t) + '" aria-label="Retirer ' + U.escapeAttr(t) + '">×</button>' +
          '</span>';
        }).join('');
        activePills.querySelectorAll('.active-filter-remove').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var t = this.getAttribute('data-remove');
            var idx = activeTags.indexOf(t);
            if (idx !== -1) activeTags.splice(idx, 1);
            buildFilterBar();
            renderProjects();
          });
        });
      } else {
        activeWrap.hidden = true;
        activePills.innerHTML = '';
      }
    }

    if (activeClear && !activeClear._wired) {
      activeClear._wired = true;
      activeClear.addEventListener('click', function () {
        activeTags = [];
        searchQuery = '';
        var si = document.getElementById('projects-search-input');
        if (si) si.value = '';
        var sc = document.getElementById('projects-search-clear');
        if (sc) sc.classList.remove('visible');
        buildFilterBar();
        renderProjects();
      });
    }

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

    // En mode "All" : tous les featured restent dans le carousel, ET
    // ils reapparaissent aussi dans la grille "Other projects" avec le
    // reste (les non-featured) pour qu'aucun projet ne soit cache.
    var showFeaturedSplit = !searchQuery && activeTags.length === 0;
    var featured = showFeaturedSplit ? list.filter(function (p) { return p.featured; }) : [];
    var others = list.slice();

    if (featuredWrap && featuredEl) {
      if (featured.length > 0) {
        featuredWrap.hidden = false;
        if (featuredCount) featuredCount.textContent = featured.length;
        featuredEl.innerHTML = featured.map(function (p, i) { return renderFeaturedCard(p, i); }).join('');
        initFeaturedCarousel();
      } else {
        featuredWrap.hidden = true;
        featuredEl.innerHTML = '';
        destroyFeaturedCarousel();
      }
    }

    if (gridLabel && gridLabelText && gridCount) {
      var isFiltered = activeTags.length > 0 || searchQuery.length > 0;
      var hasContent = isFiltered ? list.length > 0 : others.length > 0;
      if (hasContent) {
        gridLabel.hidden = false;
        gridLabelText.textContent = isFiltered ? 'MATCHES' : 'OTHER PROJECTS';
        gridCount.textContent = isFiltered ? list.length : others.length;
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
  // Featured Carousel - scroll-snap based, autoplay + loop
  // ========================================

  var featuredCarousel = null;

  function initFeaturedCarouselOnce() {
    if (featuredCarousel) return featuredCarousel;

    var wrap = document.getElementById('projects-featured-wrap');
    var grid = document.getElementById('projects-featured');
    var prevBtn = document.getElementById('featured-prev');
    var nextBtn = document.getElementById('featured-next');
    var dotsEl = document.getElementById('featured-dots');
    if (!grid) return null;

    var state = {
      index: 0,
      autoMs: 5000,
      timer: null,
      paused: false,
      resizeTimer: null,
      suppressScrollEvt: false
    };

    function getCards() {
      return Array.prototype.slice.call(grid.querySelectorAll('.featured-card'));
    }

    function buildDots(total) {
      if (!dotsEl) return;
      var html = '';
      for (var i = 0; i < total; i++) {
        html += '<button type="button" class="featured-dot' + (i === state.index ? ' active' : '') + '" data-index="' + i + '" aria-label="Go to featured ' + (i + 1) + '"></button>';
      }
      dotsEl.innerHTML = html;
      dotsEl.querySelectorAll('.featured-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-index'), 10) || 0;
          goTo(idx);
          restartAuto();
        });
      });
    }

    function updateDots() {
      if (!dotsEl) return;
      dotsEl.querySelectorAll('.featured-dot').forEach(function (d, j) {
        d.classList.toggle('active', j === state.index);
      });
    }

    function goTo(i) {
      var cards = getCards();
      var total = cards.length;
      if (total === 0) return;
      if (i < 0) i = total - 1;
      if (i >= total) i = 0;
      state.index = i;
      var target = cards[i];
      if (!target) return;
      // Use scrollIntoView for reliable native centering with scroll-snap-align
      var left = target.offsetLeft;
      state.suppressScrollEvt = true;
      grid.scrollTo({ left: left, behavior: 'smooth' });
      setTimeout(function () { state.suppressScrollEvt = false; }, 700);
      updateDots();
    }

    function next() { goTo(state.index + 1); }
    function prev() { goTo(state.index - 1); }

    function startAuto() {
      stopAuto();
      state.timer = setInterval(function () {
        if (!state.paused) next();
      }, state.autoMs);
    }

    function stopAuto() {
      if (state.timer) { clearInterval(state.timer); state.timer = null; }
    }

    function restartAuto() { startAuto(); }

    function onScroll() {
      if (state.suppressScrollEvt) return;
      var cards = getCards();
      if (!cards.length) return;
      var scrollLeft = grid.scrollLeft;
      var closest = 0;
      var closestDist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var d = Math.abs(cards[i].offsetLeft - scrollLeft);
        if (d < closestDist) { closestDist = d; closest = i; }
      }
      if (closest !== state.index) {
        state.index = closest;
        updateDots();
      }
    }

    function onPrev() { prev(); restartAuto(); }
    function onNext() { next(); restartAuto(); }

    function onKeyDown(e) {
      if (e.key === 'ArrowRight') { onNext(); }
      if (e.key === 'ArrowLeft') { onPrev(); }
    }

    function onResize() {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(function () {
        var cards = getCards();
        if (cards[state.index]) {
          grid.scrollTo({ left: cards[state.index].offsetLeft, behavior: 'auto' });
        }
      }, 100);
    }

    // Bind once
    if (prevBtn) prevBtn.addEventListener('click', onPrev);
    if (nextBtn) nextBtn.addEventListener('click', onNext);
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { state.paused = true; });
      wrap.addEventListener('mouseleave', function () { state.paused = false; });
      wrap.setAttribute('tabindex', '0');
      wrap.addEventListener('keydown', onKeyDown);
    }
    grid.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    featuredCarousel = {
      state: state,
      refresh: function () {
        var cards = getCards();
        var total = cards.length;
        if (prevBtn) prevBtn.style.display = (total <= 1) ? 'none' : '';
        if (nextBtn) nextBtn.style.display = (total <= 1) ? 'none' : '';
        if (state.index >= total) state.index = 0;
        if (state.index < 0) state.index = 0;
        buildDots(total);
        // After layout, jump to current index without animation
        requestAnimationFrame(function () {
          var c = getCards();
          if (c[state.index]) {
            grid.scrollTo({ left: c[state.index].offsetLeft, behavior: 'auto' });
          }
          updateDots();
        });
        if (!state.timer) startAuto();
      },
      destroy: function () {
        stopAuto();
        if (prevBtn) prevBtn.style.display = '';
        if (nextBtn) nextBtn.style.display = '';
        if (dotsEl) dotsEl.innerHTML = '';
        grid.scrollTo({ left: 0, behavior: 'auto' });
      }
    };
    return featuredCarousel;
  }

  function refreshFeaturedCarousel() {
    var c = initFeaturedCarouselOnce();
    if (c) c.refresh();
  }

  function initFeaturedCarousel() {
    return initFeaturedCarouselOnce();
  }

  function destroyFeaturedCarousel() {
    if (featuredCarousel) {
      featuredCarousel.destroy();
    }
  }

  // ========================================
  // Card Renderers
  // ========================================

  function renderFeaturedCard(p, i) {
    // Legacy carousel card (non utilise en mode hero, garde pour compat)
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
    var platformName = U.getProjectPlatform(p, '');
    if (platformName) metaBits.push(U.escapeHtml(platformName));
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

  function renderFeaturedHero(p) {
    // Format "stage hero" : un seul featured project, en grand (2 colonnes)
    // Video/image a gauche, contenu a droite.
    var hero = p.video
      ? '<div class="featured-hero-media">' +
          '<iframe src="' + U.escapeAttr(p.video) +
            '" frameborder="0" allowfullscreen loading="lazy"></iframe>' +
        '</div>'
      : (p.thumbnail
        ? '<div class="featured-hero-media">' +
            '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="' + U.escapeAttr(p.title || 'Project') + '" loading="lazy">' +
          '</div>'
        : '<div class="featured-hero-media featured-hero-media--empty">NO MEDIA</div>');

    var metaBits = [];
    if (p.year || p.date) metaBits.push(U.escapeHtml(p.year || p.date));
    var platformName = U.getProjectPlatform(p, '');
    if (platformName) metaBits.push(U.escapeHtml(platformName));
    if (p.role) metaBits.push(U.escapeHtml(p.role));
    var metaLine = metaBits.join(' <span class="featured-hero-sep">//</span> ');

    var tagsHtml = '';
    if (p.tags && p.tags.length > 0) {
      tagsHtml = '<div class="featured-hero-tags">';
      p.tags.slice(0, 6).forEach(function (t) {
        var name = U.getTagName(t);
        var cat = U.getTagCategory(t);
        tagsHtml += '<span class="featured-hero-tag" style="color:' + U.getTagColor(cat) + ';border-color:' + U.getTagColor(cat) + '40;">' + U.escapeHtml(name) + '</span>';
      });
      tagsHtml += '</div>';
    }

    var linksHtml = '';
    if (p.links && p.links.length) {
      linksHtml = '<div class="featured-hero-links">';
      p.links.slice(0, 3).forEach(function (l) {
        var url = (typeof l === 'string') ? l : (l.url || l.href || '');
        var type = (typeof l === 'string') ? 'link' : (l.type || 'link');
        var label = U.linkLabel(type);
        if (url) {
          linksHtml += '<a class="featured-hero-link" href="' + U.escapeAttr(url) + '" target="_blank" rel="noopener noreferrer">' + U.escapeHtml(label) + ' ↗</a>';
        }
      });
      linksHtml += '</div>';
    }

    return '<a class="featured-hero-card" href="project.html?id=' + U.escapeAttr(p.id) + '">' +
      hero +
      '<div class="featured-hero-body">' +
        '<div class="featured-hero-eyebrow">★ FEATURED PROJECT</div>' +
        '<h2 class="featured-hero-title">' + U.escapeHtml(p.title || 'Untitled') + '</h2>' +
        (metaLine ? '<div class="featured-hero-meta">' + metaLine + '</div>' : '') +
        '<p class="featured-hero-desc">' + U.escapeHtml(p.description || p.descriptionLong || '') + '</p>' +
        tagsHtml +
        linksHtml +
        '<div class="featured-hero-cta">VIEW PROJECT DETAILS <span>→</span></div>' +
      '</div>' +
    '</a>';
  }

  function renderCard(p, i) {
    var title = U.escapeHtml(p.title || 'Untitled');
    var desc = U.escapeHtml(p.description || '');
    var href = 'project.html?id=' + U.escapeAttr(p.id);

    // Media : image fixe + video en overlay (crossfade au hover hezaerd-style).
    // La video peut etre une URL .mp4 externe (rare) ou une URL YouTube
    // convertie en embed iframe via U.extractVideoId.
    var mediaInner = '';
    if (p.thumbnail) {
      mediaInner += '<img class="project-media-img" src="' + U.escapeAttr(p.thumbnail) + '" alt="' + title + '" loading="lazy">';
    } else {
      mediaInner += '<div class="project-media-img project-media-empty">🎮</div>';
    }
    var videoEmbedUrl = '';
    if (p.video) {
      var vid = U.extractVideoId(p.video);
      if (vid) videoEmbedUrl = 'https://www.youtube.com/embed/' + U.escapeAttr(vid) + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + U.escapeAttr(vid) + '&showinfo=0&rel=0&playsinline=1';
    }
    if (videoEmbedUrl) {
      mediaInner += '<iframe class="project-media-video" src="' + videoEmbedUrl + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy" tabindex="-1"></iframe>';
    }

    // Tags : hezaerd affiche 1 pill "categorie" + 1 pill "engine+user" max.
    // On prend la categorie de genre/role du projet + l'engine principal.
    var tagsHtml = '';
    var firstCat = null;
    var engine = null;
    (p.tags || []).forEach(function (t) {
      var cat = U.getTagCategory(t);
      var name = U.getTagName(t);
      if (!name) return;
      if (!firstCat && (cat === 'genre' || cat === 'role')) firstCat = name;
      if (!engine && cat === 'engine') engine = name;
    });
    if (firstCat) tagsHtml += '<span class="project-tag">' + U.escapeHtml(firstCat) + '</span>';
    if (engine) {
      tagsHtml += '<span class="project-tag project-tag--engine">' +
        '<svg class="project-tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
          '<circle cx="12" cy="7" r="4"/>' +
        '</svg>' +
        U.escapeHtml(engine) +
      '</span>';
    }

    var ribbon = p.featured
      ? '<span class="project-card-ribbon" aria-label="Featured project">★ FEATURED</span>'
      : '';

    return '<a href="' + href + '" class="project-card' + (p.featured ? ' is-featured' : '') + '">' +
      '<div class="project-card-media">' +
        mediaInner +
        ribbon +
      '</div>' +
      '<div class="project-card-body">' +
        '<h3 class="project-card-title">' +
          '<svg class="project-card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>' +
            '<circle cx="12" cy="13" r="2"/>' +
          '</svg>' +
          title +
        '</h3>' +
        '<p class="project-card-desc">' + desc + '</p>' +
        (tagsHtml ? '<div class="project-card-tags">' + tagsHtml + '</div>' : '') +
        '<span class="project-card-cta">Click to view details <span class="project-card-cta-arrow" aria-hidden="true">→</span></span>' +
      '</div>' +
    '</a>';
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
