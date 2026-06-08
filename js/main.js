// ========================================
// MAIN.JS - Portfolio public pages (home, projects)
// Firebase first, JSON fallback, dynamic tag filters
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;
  var projectsData = [];
  var activeTags = [];

  document.addEventListener('DOMContentLoaded', function () {
    loadData();
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
              projectsData = U.sortProjectsByDateDesc(out);
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
          projectsData = U.sortProjectsByDateDesc(data.projects);
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

  function getFilteredProjects() {
    var isHome = isHomePage();
    var list = isHome ? projectsData.filter(function (p) { return p.featured; }) : projectsData;
    if (activeTags.length > 0) {
      list = list.filter(function (p) {
        if (!p.tags) return false;
        var names = p.tags.map(function (t) { return U.getTagName(t).toLowerCase(); });
        return activeTags.some(function (tag) { return names.indexOf(tag.toLowerCase()) !== -1; });
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

    var list = getFilteredProjects();
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">No projects found</div>';
      return;
    }

    grid.innerHTML = list.map(function (p) { return renderCard(p); }).join('');
  }

  function renderCard(p) {
    var thumb = p.thumbnail
      ? '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="' + U.escapeAttr(p.title || 'Project') + '" class="project-thumb" loading="lazy">'
      : '<div class="project-thumb"></div>';

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

    return '<a href="project.html?id=' + U.escapeAttr(p.id) + '" class="project-card">' +
      thumb +
      '<div class="card-info">' +
        '<h3 class="project-title">' + U.escapeHtml(p.title || 'Untitled') + '</h3>' +
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
