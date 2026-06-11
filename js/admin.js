// ========================================
// ADMIN.JS - Admin dashboard
// Firebase Auth + Firestore. Images as compressed base64.
// Links format: ARRAY of {type, url} (matches data/projects.json).
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;

  var projects = [];
  var existingTags = [];
  var uploadedFiles = { thumbnail: null, gallery: [] };
  var uploadedAvatar = null;
  var currentEditId = null;
  var isInitialized = false;

  document.addEventListener('DOMContentLoaded', initAdmin);

  function initAdmin() {
    if (!isInitialized) {
      isInitialized = true;
      if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && typeof firebase !== 'undefined') {
        try {
          if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        } catch (e) {
          console.warn('Firebase init:', e);
        }
      }
    }

    setupLoginForm();
    setupNav();
    setupProjectFilters();
    setupProjectForm();
    setupFileUploads();
    setupProfileForm();
    checkAuth();
  }

  // ============== AUTH ==============

  function setupLoginForm() {
    var form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); doLogin(); });
    var googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) googleBtn.addEventListener('click', function (e) { e.preventDefault(); doGoogleLogin(); });
  }

  function doLogin() {
    var email = (document.getElementById('email') || {}).value;
    var password = (document.getElementById('password') || {}).value;
    var errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';

    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
      setError(errorEl, 'Config Firebase manquante');
      showConfigHelp(true);
      return;
    }
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setError(errorEl, 'Firebase SDK non charge (verifiez votre connexion internet)');
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(function () { showDashboard(); })
      .catch(function (error) { setError(errorEl, getErrorMessage(error.code)); });
  }

  function doGoogleLogin() {
    var errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';

    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
      setError(errorEl, 'Config Firebase manquante');
      showConfigHelp(true);
      return;
    }
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setError(errorEl, 'Firebase SDK non charge (verifiez votre connexion internet)');
      return;
    }

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(function (result) {
        var user = result.user;
        if (!isAuthorizedEmail(user.email)) {
          firebase.auth().signOut();
          setError(errorEl, 'Acces refuse: ' + user.email + ' n\'est pas autorise');
          return;
        }
        showDashboard();
      })
      .catch(function (error) { setError(errorEl, getErrorMessage(error.code)); });
  }

  function isAuthorizedEmail(email) {
    if (!email) return false;
    var allowed = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.adminEmails) || [];
    if (allowed.length === 0) return true;
    for (var i = 0; i < allowed.length; i++) {
      if (allowed[i].toLowerCase() === email.toLowerCase()) return true;
    }
    return false;
  }

  function showConfigHelp(show) {
    var el = document.getElementById('config-help');
    if (!el) return;
    if (show) el.classList.remove('hidden'); else el.classList.add('hidden');
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/user-not-found': return 'Utilisateur non trouve';
      case 'auth/wrong-password': return 'Mot de passe incorrect';
      case 'auth/invalid-email': return 'Email invalide';
      case 'auth/too-many-requests': return 'Trop de tentatives';
      case 'auth/network-request-failed': return 'Erreur reseau';
      default: return 'Erreur: ' + code;
    }
  }

  function setError(el, msg) { if (el) el.textContent = msg; }

  function doLogout() {
    if (typeof firebase === 'undefined' || !firebase.auth) { showLoginScreen(); return; }
    firebase.auth().signOut().then(showLoginScreen).catch(showLoginScreen);
  }

  function checkAuth() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) { showLoginScreen(); return; }
    if (typeof firebase === 'undefined' || !firebase.auth) { showLoginScreen(); return; }
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        if (!isAuthorizedEmail(user.email)) {
          firebase.auth().signOut();
          var errorEl = document.getElementById('login-error');
          setError(errorEl, 'Acces refuse: ' + (user.email || 'email inconnu') + ' n\'est pas autorise');
          showLoginScreen();
          return;
        }
        showDashboard();
      } else {
        showLoginScreen();
      }
    }, function () { showLoginScreen(); });
  }

  function showLoginScreen() {
    toggle('login-screen', false);
    toggle('admin-dashboard', true);
  }

  function showDashboard() {
    toggle('login-screen', true);
    toggle('admin-dashboard', false);
    var emailEl = document.getElementById('user-email');
    if (emailEl && firebase.auth().currentUser) emailEl.textContent = firebase.auth().currentUser.email || '';
    loadProjects();
    loadExistingTags();
  }

  function toggle(id, hidden) {
    var el = document.getElementById(id);
    if (!el) return;
    if (hidden) el.classList.add('hidden'); else el.classList.remove('hidden');
  }

  // ============== NAV ==============

  function setupNav() {
    var navItems = document.querySelectorAll('.admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', function (e) {
        e.preventDefault();
        goToView(this.getAttribute('data-view'));
      });
    }
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
  }

  function goToView(view) {
    var navItems = document.querySelectorAll('.admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      var item = navItems[i];
      if (item.getAttribute('data-view') === view) item.classList.add('active');
      else item.classList.remove('active');
    }
    var views = document.querySelectorAll('.admin-view');
    for (var j = 0; j < views.length; j++) {
      views[j].classList.add('hidden');
      views[j].classList.remove('active');
    }
    var target = document.getElementById('view-' + view);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
    if (view === 'profile') loadProfile();
  }

  window.goToView = goToView;
  window.showProjectsView = function () { goToView('projects'); };
  window.showCreateForm = showCreateForm;

  // ============== PROJECTS ==============

  function loadProjects() {
    if (!firebaseReady()) { renderProjects([]); return; }
    firebase.firestore().collection('projects').get()
      .then(function (snapshot) {
        projects = [];
        snapshot.forEach(function (doc) {
          var data = doc.data();
          data.id = data.id || doc.id;
          projects.push(data);
        });
        renderProjects(projects);
      })
      .catch(function (error) {
        console.warn('Firestore:', error);
        renderProjects([]);
      });
  }

  function firebaseReady() {
    return window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && typeof firebase !== 'undefined' && firebase.firestore;
  }

  function renderProjects(list) {
    var grid = document.getElementById('projects-list');
    if (!grid) return;
    if (!list || list.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Aucun projet</p>';
      return;
    }
    grid.innerHTML = list.map(function (p) { return renderProjectCard(p); }).join('');
  }

  function renderProjectCard(p) {
    var thumb = p.thumbnail
      ? '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="">'
      : '<div class="thumbnail-placeholder">?</div>';
    var featured = p.featured ? '<span class="badge">Featured</span>' : '';
    var draft = p.status === 'draft' ? '<span class="badge badge-draft">Brouillon</span>' : '';
    var safeId = U.escapeAttr(p.id);

    return '<div class="admin-project-card">' +
      '<div class="thumbnail">' + thumb + '</div>' +
      '<div class="info">' +
        '<h3>' + U.escapeHtml(p.title || 'Sans titre') + '</h3>' +
        '<p>' + U.escapeHtml(p.description || '') + '</p>' +
        '<div class="tags-row">' + featured + draft + '</div>' +
        '<div class="actions">' +
          '<button class="btn btn-primary btn-sm" data-action="edit" data-id="' + safeId + '">Editer</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + safeId + '">Supprimer</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    if (!id) return;
    if (btn.getAttribute('data-action') === 'edit') editProject(id);
    else if (btn.getAttribute('data-action') === 'delete') deleteProject(id);
  });

  function setupProjectFilters() {
    var btns = document.querySelectorAll('.admin-filters .filter-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');
        var allBtns = document.querySelectorAll('.admin-filters .filter-btn');
        for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
        this.classList.add('active');

        var filtered = projects;
        if (filter === 'featured') filtered = projects.filter(function (p) { return p.featured; });
        else if (filter === 'published') filtered = projects.filter(function (p) { return p.status !== 'draft'; });
        else if (filter === 'draft') filtered = projects.filter(function (p) { return p.status === 'draft'; });
        renderProjects(filtered);
      });
    }
  }

  function editProject(id) {
    var p = projects.find(function (x) { return x.id === id; });
    if (p) showCreateForm(p);
  }

  function deleteProject(id) {
    if (!confirm('Supprimer ce projet?')) return;
    if (!firebaseReady()) return;
    firebase.firestore().collection('projects').doc(id).delete()
      .then(function () { showToast('Projet supprime'); loadProjects(); })
      .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
  }

  // ============== PROJECT FORM ==============

  function setupProjectForm() {
    var form = document.getElementById('project-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); saveProject(); });
  }

  function showCreateForm(project) {
    currentEditId = project ? project.id : null;
    var form = document.getElementById('project-form');
    if (form) form.reset();
    var titleEl = document.getElementById('form-title');
    if (titleEl) titleEl.textContent = project ? 'Editer le projet' : 'Nouveau projet';

    uploadedFiles = { thumbnail: null, gallery: [] };
    renderGalleryPreview();
    renderTags([]);
    renderLinks([]);

    if (project) {
      setVal('project-id', project.id);
      setVal('project-title', project.title);
      setVal('project-description', project.description);
      setVal('project-description-long', project.descriptionLong);
      setVal('project-date', project.date);
      setVal('project-year', project.year);
      setVal('project-platform', project.platform);
      var statusEl = document.getElementById('project-status');
      if (statusEl) statusEl.value = project.status || 'published';
      setVal('project-video', project.video);
      var featEl = document.getElementById('project-featured');
      if (featEl) featEl.checked = !!project.featured;
      setVal('project-team', project.team);
      var ctxEl = document.getElementById('project-context');
      if (ctxEl) ctxEl.value = project.context || '';
      setVal('project-duration', project.duration);
      setVal('project-role', project.role);

      if (project.thumbnail) {
        uploadedFiles.thumbnail = project.thumbnail;
        var tp = document.getElementById('thumbnail-preview');
        if (tp) tp.innerHTML = '<img src="' + U.escapeAttr(project.thumbnail) + '">';
      }
      if (project.images) {
        uploadedFiles.gallery = project.images.slice();
        renderGalleryPreview();
      }
      if (project.tags) renderTags(project.tags);
      if (project.links) renderLinks(project.links);
    }

    goToView('create');
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  function loadExistingTags() {
    fetch('data/projects.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.projects) return;
        var map = {};
        data.projects.forEach(function (p) {
          (p.tags || []).forEach(function (t) {
            var name = U.getTagName(t);
            var cat = U.getTagCategory(t);
            if (name) map[name.toLowerCase()] = { name: name, category: cat };
          });
        });
        existingTags = Object.keys(map).map(function (k) { return map[k]; });
        renderExistingTags();
      })
      .catch(function () {});
  }

  function renderExistingTags() {
    var container = document.getElementById('existing-tags-list');
    if (!container || existingTags.length === 0) return;
    container.innerHTML = existingTags.map(function (t) {
      return '<span class="existing-tag" data-name="' + U.escapeAttr(t.name) + '" data-cat="' + U.escapeAttr(t.category) + '">' + U.escapeHtml(t.name) + '</span>';
    }).join('');
    container.querySelectorAll('.existing-tag').forEach(function (el) {
      el.addEventListener('click', function () {
        addTagFromExisting(this.getAttribute('data-name'), this.getAttribute('data-cat'));
      });
    });
  }

  window.addTagFromExisting = function (name, category) {
    var container = document.getElementById('tags-container');
    if (!container) return;
    var existing = container.querySelectorAll('.tag-name');
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].value.toLowerCase() === name.toLowerCase()) {
        showToast('Tag deja ajoute', 'error');
        return;
      }
    }
    container.insertAdjacentHTML('beforeend', buildTagRowHTML(name, category));
    showToast('Tag ajoute: ' + name);
  };

  window.addNewTag = function () {
    var container = document.getElementById('tags-container');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', buildTagRowHTML('', 'other'));
  };

  function buildTagRowHTML(name, category) {
    return '<div class="tag-row">' +
      '<input type="text" class="tag-name" value="' + U.escapeAttr(name) + '" placeholder="Nom du tag">' +
      '<select class="tag-category">' + buildCategoryOptions(category) + '</select>' +
      '<button type="button" class="btn btn-danger btn-sm" data-action="remove-row">X</button>' +
    '</div>';
  }

  function buildCategoryOptions(selected) {
    var opts = [
      { v: 'engine', l: 'Moteur' },
      { v: 'language', l: 'Langage' },
      { v: 'role', l: 'Role' },
      { v: 'genre', l: 'Genre' },
      { v: 'platform', l: 'Plateforme' },
      { v: 'tool', l: 'Outil' },
      { v: 'other', l: 'Autre' }
    ];
    return opts.map(function (o) {
      return '<option value="' + o.v + '"' + (o.v === selected ? ' selected' : '') + '>' + o.l + '</option>';
    }).join('');
  }

  function renderTags(tags) {
    var container = document.getElementById('tags-container');
    if (!container) return;
    container.innerHTML = '';
    (tags || []).forEach(function (t) {
      container.insertAdjacentHTML('beforeend', buildTagRowHTML(t.name || '', t.category || 'other'));
    });
  }

  function renderLinks(links) {
    var container = document.getElementById('links-container');
    if (!container) return;
    container.innerHTML = '';
    U.normalizeLinks(links).forEach(function (l) {
      container.insertAdjacentHTML('beforeend', buildLinkRowHTML(l.type, l.url));
    });
  }

  function buildLinkRowHTML(type, url) {
    return '<div class="link-row">' +
      '<select class="link-type">' + buildLinkTypeOptions(type) + '</select>' +
      '<input type="url" class="link-url" value="' + U.escapeAttr(url || '') + '" placeholder="https://...">' +
      '<button type="button" class="btn btn-danger btn-sm" data-action="remove-row">X</button>' +
    '</div>';
  }

  function buildLinkTypeOptions(selected) {
    var opts = [
      { v: 'itch', l: 'Itch.io' },
      { v: 'itchio', l: 'Itch.io (alt)' },
      { v: 'steam', l: 'Steam' },
      { v: 'github', l: 'GitHub' },
      { v: 'googleplay', l: 'Google Play' },
      { v: 'demo', l: 'Demo' },
      { v: 'other', l: 'Autre' }
    ];
    return opts.map(function (o) {
      return '<option value="' + o.v + '"' + (o.v === selected ? ' selected' : '') + '>' + o.l + '</option>';
    }).join('');
  }

  window.addNewLink = function () {
    var container = document.getElementById('links-container');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', buildLinkRowHTML('itch', ''));
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="remove-row"]');
    if (btn && btn.parentElement) btn.parentElement.remove();
  });

  function saveProject() {
    var id = (document.getElementById('project-id') || {}).value;
    if (!id || !id.trim()) { showToast('ID requis', 'error'); return; }
    id = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    var data = {
      id: id,
      title: (getVal('project-title') || '').trim(),
      description: (getVal('project-description') || '').trim(),
      descriptionLong: (getVal('project-description-long') || '').trim(),
      year: (getVal('project-year') || '').trim(),
      date: (getVal('project-date') || '').trim(),
      platform: (getVal('project-platform') || '').trim(),
      status: getVal('project-status') || 'published',
      video: (getVal('project-video') || '').trim(),
      featured: !!(document.getElementById('project-featured') || {}).checked,
      team: (getVal('project-team') || '').trim(),
      context: getVal('project-context') || '',
      duration: (getVal('project-duration') || '').trim(),
      role: (getVal('project-role') || '').trim(),
      thumbnail: uploadedFiles.thumbnail,
      images: uploadedFiles.gallery.slice(),
      tags: getTags(),
      links: getLinks()
    };

    if (data.title.length > 200) { showToast('Titre trop long (max 200)', 'error'); return; }
    if (data.description.length > 500) { showToast('Description courte trop longue (max 500)', 'error'); return; }

    if (!firebaseReady()) { showToast('Firebase non configure', 'error'); return; }

    if (currentEditId && currentEditId !== id) {
      firebase.firestore().collection('projects').doc(currentEditId).delete()
        .then(function () { return firebase.firestore().collection('projects').doc(id).set(data); })
        .then(function () { onSaveSuccess(); })
        .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
    } else {
      firebase.firestore().collection('projects').doc(id).set(data)
        .then(onSaveSuccess)
        .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
    }
  }

  function onSaveSuccess() {
    showToast('Projet enregistre!');
    loadProjects();
    goToView('projects');
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function getTags() {
    var tags = [];
    var rows = document.querySelectorAll('#tags-container .tag-row');
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
      var nameEl = rows[i].querySelector('.tag-name');
      var catEl = rows[i].querySelector('.tag-category');
      if (!nameEl || !catEl) continue;
      var name = nameEl.value.trim();
      var cat = catEl.value;
      if (!name) continue;
      var key = name.toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      tags.push({ name: name, category: cat });
    }
    return tags;
  }

  function getLinks() {
    var links = [];
    var rows = document.querySelectorAll('#links-container .link-row');
    for (var i = 0; i < rows.length; i++) {
      var typeEl = rows[i].querySelector('.link-type');
      var urlEl = rows[i].querySelector('.link-url');
      if (!typeEl || !urlEl) continue;
      var url = urlEl.value.trim();
      if (!url) continue;
      var safe = U.safeUrl(url);
      if (!safe) continue;
      var type = typeEl.value;
      if (type === 'itch') type = 'itchio';
      links.push({ type: type, url: safe });
    }
    return links;
  }

  // ============== FILE UPLOADS (with compression) ==============

  function setupFileUploads() {
    var thumbInput = document.getElementById('project-thumbnail-file');
    if (thumbInput) thumbInput.addEventListener('change', function () { handleImage(this.files[0], 'thumbnail'); });
    var galleryInput = document.getElementById('project-gallery-files');
    if (galleryInput) galleryInput.addEventListener('change', function () { handleImages(this.files, 'gallery'); });
  }

  function handleImage(file, target) {
    if (!file || !file.type.startsWith('image/')) { showToast('Selectionnez une image', 'error'); return; }
    compressImage(file, { maxWidth: 600, quality: 0.7 })
      .then(function (base64) { assignImage(base64, target, file.name); })
      .catch(function (e) { showToast('Erreur compression: ' + e.message, 'error'); });
  }

  function handleImages(files, target) {
    if (!files || files.length === 0) return;
    var pending = files.length;
    var done = 0;
    Array.prototype.forEach.call(files, function (file) {
      if (!file.type.startsWith('image/')) { pending--; return; }
      compressImage(file, { maxWidth: 1280, quality: 0.75 })
        .then(function (base64) { uploadedFiles.gallery.push(base64); done++; renderGalleryPreview(); if (done === pending) showToast(done + ' images ajoutees'); })
        .catch(function (e) { showToast('Erreur ' + file.name + ': ' + e.message, 'error'); pending--; });
    });
  }

  function assignImage(base64, target, name) {
    if (target === 'thumbnail') {
      uploadedFiles.thumbnail = base64;
      var tp = document.getElementById('thumbnail-preview');
      if (tp) tp.innerHTML = '<img src="' + U.escapeAttr(base64) + '">';
      showToast('Thumbnail compresse');
    }
  }

  function compressImage(file, opts) {
    opts = opts || {};
    var maxWidth = opts.maxWidth || 1280;
    var quality = opts.quality || 0.75;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Lecture impossible')); };
      reader.onload = function (e) {
        var img = new Image();
        img.onerror = function () { reject(new Error('Image invalide')); };
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          if (w > maxWidth) {
            h = Math.round(h * (maxWidth / w));
            w = maxWidth;
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          try {
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderGalleryPreview() {
    var container = document.getElementById('gallery-preview');
    if (!container) return;
    if (uploadedFiles.gallery.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = uploadedFiles.gallery.map(function (img, i) {
      return '<div class="gallery-item"><img src="' + U.escapeAttr(img) + '"><button type="button" data-gallery-remove="' + i + '">X</button></div>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gallery-remove]');
    if (!btn) return;
    var idx = parseInt(btn.getAttribute('data-gallery-remove'), 10);
    if (!isNaN(idx)) {
      uploadedFiles.gallery.splice(idx, 1);
      renderGalleryPreview();
    }
  });

  // ============== IMPORT ==============

  window.importProjectsFromJSON = function () {
    if (!firebaseReady()) { showToast('Config Firebase manquante!', 'error'); return; }
    showToast('Import en cours vers Firestore...');
    fetch('data/projects.json?t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('Fichier non trouve: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.projects || data.projects.length === 0) { showToast('Aucun projet trouve', 'error'); return; }
        var imported = 0;
        var total = data.projects.length;
        data.projects.forEach(function (project) {
          firebase.firestore().collection('projects').doc(project.id).set(project)
            .then(function () { imported++; if (imported === total) { showToast(total + ' projets importes dans Firestore!'); loadProjects(); } })
            .catch(function (err) { showToast('Erreur import: ' + err.message, 'error'); });
        });
      })
      .catch(function (err) { showToast('Erreur: ' + err.message, 'error'); });
  };

  // ============== PROFILE ==============

  function setupProfileForm() {
    var form = document.getElementById('profile-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); saveProfile(); });
    var avatarInput = document.getElementById('profile-avatar-file');
    if (avatarInput) avatarInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      compressImage(file, { maxWidth: 400, quality: 0.75 })
        .then(function (base64) { uploadedAvatar = base64; var p = document.getElementById('avatar-preview'); if (p) p.innerHTML = '<div class="preview-item"><img src="' + U.escapeAttr(base64) + '"></div>'; showToast('Avatar compresse'); })
        .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
    });
  }

  function loadProfile() {
    if (!firebaseReady()) { populateProfileForm({}); return; }
    firebase.firestore().collection('profile').doc('main').get()
      .then(function (doc) { populateProfileForm(doc.exists ? doc.data() : {}); })
      .catch(function () { populateProfileForm({}); });
  }

  function populateProfileForm(data) {
    data = data || {};
    if (data.avatar) {
      var preview = document.getElementById('avatar-preview');
      if (preview) preview.innerHTML = '<div class="preview-item"><img src="' + U.escapeAttr(data.avatar) + '"></div>';
    }
    var fields = ['profile-name', 'profile-title', 'profile-school', 'profile-location', 'profile-bio', 'profile-description'];
    var dataFields = ['name', 'title', 'school', 'location', 'bio', 'description'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el && data[dataFields[i]]) el.value = data[dataFields[i]];
    }
    if (data.skills) {
      var skillFields = ['skills-engines', 'skills-languages', 'skills-tools', 'skills-soft'];
      var skillData = ['engines', 'languages', 'tools', 'softSkills'];
      for (var j = 0; j < skillFields.length; j++) {
        var skillEl = document.getElementById(skillFields[j]);
        if (skillEl && data.skills[skillData[j]]) skillEl.value = data.skills[skillData[j]].join(', ');
      }
    }
    if (data.social) {
      var socialFields = ['social-github', 'social-linkedin', 'social-itchio', 'social-email'];
      var socialData = ['github', 'linkedin', 'itchio', 'email'];
      for (var k = 0; k < socialFields.length; k++) {
        var socialEl = document.getElementById(socialFields[k]);
        if (socialEl && data.social[socialData[k]]) socialEl.value = data.social[socialData[k]];
      }
    }
  }

  function saveProfile() {
    var data = {
      name: (getVal('profile-name') || '').trim(),
      title: (getVal('profile-title') || '').trim(),
      school: (getVal('profile-school') || '').trim(),
      location: (getVal('profile-location') || '').trim(),
      bio: (getVal('profile-bio') || '').trim(),
      description: (getVal('profile-description') || '').trim(),
      avatar: uploadedAvatar || '',
      skills: {
        engines: parseList('skills-engines'),
        languages: parseList('skills-languages'),
        tools: parseList('skills-tools'),
        softSkills: parseList('skills-soft')
      },
      social: {
        github: (getVal('social-github') || '').trim(),
        linkedin: (getVal('social-linkedin') || '').trim(),
        itchio: (getVal('social-itchio') || '').trim(),
        email: (getVal('social-email') || '').trim()
      }
    };
    if (!firebaseReady()) { showToast('Firebase non configure', 'error'); return; }
    firebase.firestore().collection('profile').doc('main').set(data)
      .then(function () { showToast('Profil enregistre!'); })
      .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
  }

  function parseList(id) {
    var el = document.getElementById(id);
    if (!el || !el.value) return [];
    return el.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
  }

  window.importProfileFromJSON = function () {
    if (!firebaseReady()) { showToast('Firebase non configure', 'error'); return; }
    fetch('data/projects.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.profile) { showToast('Pas de profil dans le fichier', 'error'); return; }
        return firebase.firestore().collection('profile').doc('main').set(data.profile);
      })
      .then(function () { showToast('Profil importe!', 'success'); loadProfile(); })
      .catch(function (err) { showToast('Erreur: ' + err.message, 'error'); });
  };

  // ============== TOAST ==============

  function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  // ============== EXPORTS ==============

  window.editProject = editProject;
  window.deleteProject = deleteProject;
})();
