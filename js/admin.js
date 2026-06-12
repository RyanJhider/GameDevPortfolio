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
          // Normalize order: Firestore returns numbers as-is, but be defensive
          if (typeof data.order !== 'undefined' && typeof data.order !== 'number') {
            var n = parseInt(data.order, 10);
            data.order = isNaN(n) ? undefined : n;
          }
          // Normalize hidden: must be a strict boolean
          data.hidden = data.hidden === true;
          projects.push(data);
        });
        // Apply the same sort as the public site so the admin view matches
        projects = U.sortProjectsByOrder(projects);
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
    wireDragAndDrop();
  }

  function renderProjectCard(p) {
    var thumb = p.thumbnail
      ? '<img src="' + U.escapeAttr(p.thumbnail) + '" alt="">'
      : '<div class="thumbnail-placeholder">?</div>';
    var featured = p.featured ? '<span class="badge">Featured</span>' : '';
    var draft = p.status === 'draft' ? '<span class="badge badge-draft">Brouillon</span>' : '';
    var hidden = !!p.hidden;
    var hiddenBadge = hidden ? '<span class="badge badge-hidden" title="Cache du public">Cache</span>' : '';
    var safeId = U.escapeAttr(p.id);
    var orderedClass = (typeof p.order === 'number' && !isNaN(p.order)) ? ' has-order' : '';
    var orderBadge = (typeof p.order === 'number' && !isNaN(p.order))
      ? '<span class="badge" title="Ordre personnalise">#' + p.order + '</span>'
      : '';
    var cardHiddenClass = hidden ? ' is-hidden' : '';
    var visibilityIcon = hidden ? '&#128065;' : '&#128064;';
    var visibilityLabel = hidden ? 'Afficher' : 'Masquer';
    var visibilityTitle = hidden ? 'Rendre visible sur le site public' : 'Cacher du site public';

    return '<div class="admin-project-card' + orderedClass + cardHiddenClass + '" data-project-id="' + safeId + '">' +
      '<div class="admin-drag-handle" draggable="true" title="Glisser pour reordonner" aria-label="Reordonner">&#8801;</div>' +
      '<div class="thumbnail">' + thumb + '</div>' +
      '<div class="info">' +
        '<h3>' + U.escapeHtml(p.title || 'Sans titre') + '</h3>' +
        '<p>' + U.escapeHtml(p.description || '') + '</p>' +
        '<div class="tags-row">' + featured + draft + hiddenBadge + orderBadge + '</div>' +
        '<div class="actions">' +
          '<button class="btn btn-secondary btn-sm" data-action="toggle-visibility" data-id="' + safeId + '" title="' + visibilityTitle + '" aria-label="' + visibilityLabel + '"><span class="visibility-icon">' + visibilityIcon + '</span> ' + visibilityLabel + '</button>' +
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
    var action = btn.getAttribute('data-action');
    if (action === 'edit') editProject(id);
    else if (action === 'delete') deleteProject(id);
    else if (action === 'toggle-visibility') toggleProjectVisibility(id);
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
        else if (filter === 'hidden') filtered = projects.filter(function (p) { return !!p.hidden; });
        else if (filter === 'visible') filtered = projects.filter(function (p) { return !p.hidden; });
        renderProjects(filtered);
      });
    }
  }

  function toggleProjectVisibility(id) {
    var p = projects.find(function (x) { return x.id === id; });
    if (!p) return;
    var newHidden = !p.hidden;
    if (!firebaseReady()) { showToast('Firebase non configure', 'error'); return; }
    firebase.firestore().collection('projects').doc(id)
      .update({ hidden: newHidden })
      .then(function () {
        p.hidden = newHidden;
        showToast(newHidden ? 'Projet cache du public' : 'Projet visible sur le site');
        // Re-render the visible list, preserving the active filter
        var activeFilter = document.querySelector('.admin-filters .filter-btn.active');
        var filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        var filtered = projects;
        if (filter === 'featured') filtered = projects.filter(function (x) { return x.featured; });
        else if (filter === 'published') filtered = projects.filter(function (x) { return x.status !== 'draft'; });
        else if (filter === 'draft') filtered = projects.filter(function (x) { return x.status === 'draft'; });
        else if (filter === 'hidden') filtered = projects.filter(function (x) { return !!x.hidden; });
        else if (filter === 'visible') filtered = projects.filter(function (x) { return !x.hidden; });
        renderProjects(filtered);
        wireDragAndDrop();
      })
      .catch(function (e) { showToast('Erreur: ' + e.message, 'error'); });
  }

  // ============== DRAG & DROP REORDER ==============

  function wireDragAndDrop() {
    var grid = document.getElementById('projects-list');
    if (!grid) return;
    var cards = grid.querySelectorAll('.admin-project-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      // Only the handle starts the drag (cleaner UX than the whole card)
      var handle = card.querySelector('.admin-drag-handle');
      if (handle) {
        handle.setAttribute('draggable', 'true');
        handle.addEventListener('dragstart', onHandleDragStart);
        handle.addEventListener('dragend', onHandleDragEnd);
      }
      // The card itself receives drop events
      card.addEventListener('dragover', onCardDragOver);
      card.addEventListener('dragleave', onCardDragLeave);
      card.addEventListener('drop', onCardDrop);
    }
    var resetBtn = document.getElementById('reset-order-btn');
    if (resetBtn && !resetBtn.dataset.wired) {
      resetBtn.dataset.wired = '1';
      resetBtn.addEventListener('click', resetAllOrders);
    }
  }

  var draggedProjectId = null;

  function onHandleDragStart(e) {
    var card = this.closest('.admin-project-card');
    if (!card) return;
    draggedProjectId = card.getAttribute('data-project-id');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Some browsers require setData to actually start the drag
      try { e.dataTransfer.setData('text/plain', draggedProjectId); } catch (err) { /* noop */ }
    }
    card.classList.add('dragging');
  }

  function onHandleDragEnd() {
    var card = this.closest('.admin-project-card');
    if (card) card.classList.remove('dragging');
    // Clear all drag-over highlights
    var grid = document.getElementById('projects-list');
    if (grid) {
      var over = grid.querySelectorAll('.drag-over');
      for (var i = 0; i < over.length; i++) over[i].classList.remove('drag-over');
    }
    draggedProjectId = null;
  }

  function onCardDragOver(e) {
    if (!draggedProjectId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (this.getAttribute('data-project-id') !== draggedProjectId) {
      this.classList.add('drag-over');
    }
  }

  function onCardDragLeave() {
    this.classList.remove('drag-over');
  }

  function onCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    var targetId = this.getAttribute('data-project-id');
    if (!draggedProjectId || !targetId || targetId === draggedProjectId) return;
    reorderProjects(draggedProjectId, targetId);
  }

  // Move `sourceId` to the position of `targetId` in the current visible list,
  // then assign a sequential `order` (0,1,2,...) to every visible project and
  // persist to Firestore.
  function reorderProjects(sourceId, targetId) {
    // Reorder the in-memory `projects` array (which is the master list of ALL
    // projects; the visible sub-list is just a filtered view). We compute the
    // new index based on the visible order, then apply it to the master list.
    var grid = document.getElementById('projects-list');
    if (!grid) return;
    var visibleCards = grid.querySelectorAll('.admin-project-card');
    var visibleOrder = [];
    for (var i = 0; i < visibleCards.length; i++) {
      var pid = visibleCards[i].getAttribute('data-project-id');
      if (pid) visibleOrder.push(pid);
    }

    var srcIdx = visibleOrder.indexOf(sourceId);
    var tgtIdx = visibleOrder.indexOf(targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    // Remove source from visible order, then insert it at target's position
    visibleOrder.splice(srcIdx, 1);
    visibleOrder.splice(tgtIdx, 0, sourceId);

    // Rebuild the full `projects` array so the new visible order is reflected
    // for both filtered and unfiltered views. Items not currently visible keep
    // their existing position relative to each other.
    var visibleSet = {};
    for (var j = 0; j < visibleOrder.length; j++) visibleSet[visibleOrder[j]] = visibleOrder[j];
    var visibleItems = [];
    var hiddenItems = [];
    for (var k = 0; k < projects.length; k++) {
      if (visibleSet[projects[k].id]) visibleItems.push(projects[k]);
      else hiddenItems.push(projects[k]);
    }
    // Re-order visibleItems to match visibleOrder
    var byId = {};
    for (var m = 0; m < visibleItems.length; m++) byId[visibleItems[m].id] = visibleItems[m];
    var reorderedVisible = [];
    for (var n = 0; n < visibleOrder.length; n++) {
      if (byId[visibleOrder[n]]) reorderedVisible.push(byId[visibleOrder[n]]);
    }
    projects = reorderedVisible.concat(hiddenItems);

    // Assign sequential `order` to ALL projects (so hidden ones also get a
    // defined position; this prevents date-only fallback from reshuffling
    // them unpredictably). User-initiated reorder sets the manual order.
    for (var p = 0; p < projects.length; p++) {
      projects[p].order = p;
    }

    // Re-render with the current filter still active
    var activeFilter = document.querySelector('.admin-filters .filter-btn.active');
    var filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    var filtered = projects;
    if (filter === 'featured') filtered = projects.filter(function (x) { return x.featured; });
    else if (filter === 'published') filtered = projects.filter(function (x) { return x.status !== 'draft'; });
    else if (filter === 'draft') filtered = projects.filter(function (x) { return x.status === 'draft'; });
    else if (filter === 'hidden') filtered = projects.filter(function (x) { return !!x.hidden; });
    else if (filter === 'visible') filtered = projects.filter(function (x) { return !x.hidden; });
    renderProjects(filtered);
    wireDragAndDrop();

    // Persist the new order to Firestore
    persistOrder();
  }

  function resetAllOrders() {
    if (!confirm('Reinitialiser l\'ordre ? Les projets seront retries par date (le plus recent en premier).')) return;
    // Strip the `order` field on every project (sortProjectsByOrder will then
    // fall back to date desc for these).
    for (var i = 0; i < projects.length; i++) {
      delete projects[i].order;
    }
    projects = U.sortProjectsByDateDesc(projects);
    renderProjects(projects);
    wireDragAndDrop();
    persistOrder(/* clearOnly */ true);
  }

  function persistOrder(clearOnly) {
    if (!firebaseReady()) { showToast('Firebase non configure', 'error'); return; }
    var batch = firebase.firestore().batch();
    var count = 0;
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var ref = firebase.firestore().collection('projects').doc(p.id);
      if (clearOnly && typeof p.order === 'undefined') continue; // already cleared in memory, nothing to write
      var update = clearOnly
        ? { order: firebase.firestore.FieldValue.delete() }
        : { order: p.order };
      batch.update(ref, update);
      count++;
    }
    if (count === 0) { showToast('Ordre enregistre'); return; }
    batch.commit()
      .then(function () {
        showToast(clearOnly ? 'Ordre reinitialise' : 'Ordre enregistre');
        // Reload so the local state matches Firestore exactly
        loadProjects();
      })
      .catch(function (e) {
        showToast('Erreur sauvegarde ordre: ' + e.message, 'error');
      });
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

    // Auto-slug from title (only if id field is empty or matches previous auto-gen)
    var titleEl = document.getElementById('project-title');
    var idEl = document.getElementById('project-id');
    if (titleEl && idEl) {
      titleEl.addEventListener('input', function () {
        if (!idEl.dataset.manual) {
          idEl.value = slugify(titleEl.value);
        }
      });
      idEl.addEventListener('input', function () {
        idEl.dataset.manual = idEl.value.trim() ? '1' : '';
      });
    }

    // Tag input
    var tagInput = document.getElementById('tag-input');
    var tagCat = document.getElementById('tag-category');
    var addTagBtn = document.getElementById('add-tag-btn');
    function addTagFromInput() {
      var name = tagInput.value.trim();
      if (!name) return;
      addTag(name, tagCat.value);
      tagInput.value = '';
      tagInput.focus();
    }
    if (addTagBtn) addTagBtn.addEventListener('click', addTagFromInput);
    if (tagInput) {
      tagInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); }
      });
    }

    // Link input
    var linkTypeSel = document.getElementById('link-type-select');
    var linkUrlInput = document.getElementById('link-url-input');
    var addLinkBtn = document.getElementById('add-link-btn');
    function addLinkFromInput() {
      var url = linkUrlInput.value.trim();
      if (!url) return;
      addLink(linkTypeSel.value, url);
      linkUrlInput.value = '';
      linkUrlInput.focus();
    }
    if (addLinkBtn) addLinkBtn.addEventListener('click', addLinkFromInput);
    if (linkUrlInput) {
      linkUrlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addLinkFromInput(); }
      });
    }

    // Contribution input
    var contribTitleInput = document.getElementById('contribution-title-input');
    var contribDescInput = document.getElementById('contribution-desc-input');
    var addContribBtn = document.getElementById('add-contribution-btn');
    function addContributionFromInput() {
      var title = contribTitleInput.value.trim();
      var desc = contribDescInput.value.trim();
      if (!title) { showToast('Titre requis', 'error'); return; }
      addContribution(title, desc);
      contribTitleInput.value = '';
      contribDescInput.value = '';
      contribTitleInput.focus();
    }
    if (addContribBtn) addContribBtn.addEventListener('click', addContributionFromInput);
    if (contribTitleInput) {
      contribTitleInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addContributionFromInput(); }
      });
    }
    if (contribDescInput) {
      contribDescInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          addContributionFromInput();
        }
      });
    }

    // Markdown editor tabs (Edition / Apercu)
    var mdTabs = document.querySelectorAll('.md-editor .md-tab');
    mdTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var mode = this.getAttribute('data-md-tab');
        var editor = this.closest('.md-editor');
        if (!editor) return;
        var tabs = editor.querySelectorAll('.md-tab');
        tabs.forEach(function (t) { t.classList.toggle('md-tab-active', t === tab); });
        var textarea = editor.querySelector('.md-textarea');
        var preview = editor.querySelector('.md-preview');
        if (mode === 'preview') {
          if (preview && textarea) {
            preview.innerHTML = U.renderMarkdown(textarea.value);
            preview.style.display = '';
          }
          if (textarea) textarea.style.display = 'none';
        } else {
          if (preview) preview.style.display = 'none';
          if (textarea) { textarea.style.display = ''; textarea.focus(); }
        }
      });
    });

    // Floating markdown toolbar (top-level description textarea)
    setupFloatingToolbar(contribDescInput);

    // Dropzone for thumbnail (click + drag)
    setupDropzone('thumbnail-dropzone', 'project-thumbnail-file', function (file) {
      handleImage(file, 'thumbnail');
    });
    // Gallery
    setupDropzone('gallery-dropzone', 'project-gallery-files', function (file) {
      handleImage(file, 'gallery');
    }, true);

    // Live preview
    var previewFields = ['project-title', 'project-description', 'project-date', 'project-platform', 'project-status', 'project-video', 'project-role'];
    previewFields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateLivePreview);
      if (el) el.addEventListener('change', updateLivePreview);
    });
    var feat = document.getElementById('project-featured');
    if (feat) feat.addEventListener('change', updateLivePreview);

    // Accordion
    var acc = document.querySelectorAll('.accordion-header');
    acc.forEach(function (h) {
      h.addEventListener('click', function () {
        var body = document.getElementById(h.getAttribute('data-accordion') + '-body');
        if (body) body.classList.toggle('open');
        h.classList.toggle('open');
      });
    });
  }

  function slugify(s) {
    return (s || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function setupDropzone(zoneId, inputId, onFile, multi) {
    var zone = document.getElementById(zoneId);
    var input = document.getElementById(inputId);
    if (!zone || !input) return;
    zone.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      input.click();
    });
    input.addEventListener('change', function () {
      if (multi) {
        handleImages(this.files, 'gallery');
        this.value = '';
      } else {
        if (this.files[0]) onFile(this.files[0]);
        this.value = '';
      }
    });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      var files = e.dataTransfer.files;
      if (multi) {
        handleImages(files, 'gallery');
      } else if (files[0]) {
        onFile(files[0]);
      }
    });
  }

  function showCreateForm(project) {
    currentEditId = project ? project.id : null;
    var form = document.getElementById('project-form');
    if (form) form.reset();
    var titleEl = document.getElementById('form-title');
    if (titleEl) titleEl.textContent = project ? 'Editer le projet' : 'Nouveau projet';
    var subEl = document.getElementById('form-subtitle');
    if (subEl) subEl.textContent = project ? 'Modifiez les champs ci-dessous' : 'Remplissez les informations essentielles, le reste est optionnel';
    var idEl = document.getElementById('project-id');
    if (idEl) delete idEl.dataset.manual;

    uploadedFiles = { thumbnail: null, gallery: [] };
    currentTags = [];
    currentLinks = [];
    currentContributions = [];
    renderGalleryPreview();
    renderTagChips();
    renderLinkChips();
    renderContributionCards();
    updateThumbnailPreview();
    updateLivePreview();

    if (project) {
      setVal('project-id', project.id);
      if (idEl && project.id) idEl.dataset.manual = '1';
      setVal('project-title', project.title);
      setVal('project-description', project.description);
      setVal('project-description-long', project.descriptionLong);
      setVal('project-date', project.date || project.year);
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
        updateThumbnailPreview();
      }
      if (project.images) {
        uploadedFiles.gallery = project.images.slice();
        renderGalleryPreview();
      }
      if (project.tags) {
        currentTags = (project.tags || []).map(function (t) {
          return { name: U.getTagName(t), category: U.getTagCategory(t) || 'other' };
        });
        renderTagChips();
      }
      if (project.links) {
        currentLinks = U.normalizeLinks(project.links);
        renderLinkChips();
      }
      if (Array.isArray(project.contributions)) {
        currentContributions = project.contributions
          .map(function (c) {
            if (typeof c === 'string') return { title: c, description: '' };
            return {
              title: (c && c.title) ? String(c.title) : '',
              description: (c && c.description) ? String(c.description) : ''
            };
          })
          .filter(function (c) { return c.title; });
        renderContributionCards();
      }
    }

    // Reset advanced accordion
    var advBody = document.getElementById('advanced-body');
    var advHeader = document.querySelector('.accordion-header[data-accordion="advanced"]');
    if (advBody) advBody.classList.remove('open');
    if (advHeader) advHeader.classList.remove('open');

    goToView('create');
    updateLivePreview();
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
    if (!container) return;
    if (existingTags.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = '<span class="existing-tags-label">Suggestions :</span>' +
      existingTags.map(function (t) {
        return '<button type="button" class="suggest-tag" data-name="' + U.escapeAttr(t.name) + '" data-cat="' + U.escapeAttr(t.category) + '">' + U.escapeHtml(t.name) + '</button>';
      }).join('');
    container.querySelectorAll('.suggest-tag').forEach(function (el) {
      el.addEventListener('click', function () {
        addTag(this.getAttribute('data-name'), this.getAttribute('data-cat'));
      });
    });
  }

  // ---- TAGS : chip system ----

  var currentTags = [];
  var currentLinks = [];
  var currentContributions = [];

  function addTag(name, category) {
    name = (name || '').trim();
    if (!name) return;
    var key = name.toLowerCase();
    for (var i = 0; i < currentTags.length; i++) {
      if (currentTags[i].name.toLowerCase() === key) {
        showToast('Tag deja ajoute', 'error');
        return;
      }
    }
    currentTags.push({ name: name, category: category || 'other' });
    renderTagChips();
    updateLivePreview();
  }

  function removeTag(idx) {
    currentTags.splice(idx, 1);
    renderTagChips();
    updateLivePreview();
  }

  function renderTagChips() {
    var container = document.getElementById('tags-display');
    if (!container) return;
    if (currentTags.length === 0) {
      container.innerHTML = '<span class="chips-empty">Aucun tag. Ajoutez-en ci-dessous.</span>';
      return;
    }
    container.innerHTML = currentTags.map(function (t, i) {
      var color = U.getTagColor(t.category);
      return '<span class="chip" style="--chip-color:' + color + '">' +
        '<span class="chip-dot"></span>' +
        U.escapeHtml(t.name) +
        '<button type="button" class="chip-x" data-tag-remove="' + i + '" aria-label="Retirer">&times;</button>' +
      '</span>';
    }).join('');
  }

  // ---- LINKS : chip system ----

  function addLink(type, url) {
    url = (url || '').trim();
    if (!url) return;
    var safe = U.safeUrl(url);
    if (!safe) { showToast('URL invalide', 'error'); return; }
    if (type === 'itch') type = 'itchio';
    currentLinks.push({ type: type, url: safe });
    renderLinkChips();
    updateLivePreview();
  }

  function removeLink(idx) {
    currentLinks.splice(idx, 1);
    renderLinkChips();
    updateLivePreview();
  }

  function renderLinkChips() {
    var container = document.getElementById('links-display');
    if (!container) return;
    if (currentLinks.length === 0) {
      container.innerHTML = '<span class="chips-empty">Aucun lien. Ajoutez-en ci-dessous.</span>';
      return;
    }
    container.innerHTML = currentLinks.map(function (l, i) {
      var label = U.linkLabel(l.type);
      var shortUrl = l.url.replace(/^https?:\/\//, '').slice(0, 30);
      return '<span class="chip chip-link">' +
        '<span class="chip-type">' + U.escapeHtml(label) + '</span>' +
        '<span class="chip-url">' + U.escapeHtml(shortUrl) + '</span>' +
        '<button type="button" class="chip-x" data-link-remove="' + i + '" aria-label="Retirer">&times;</button>' +
      '</span>';
    }).join('');
  }

  // ---- CONTRIBUTIONS : card system ----

  function addContribution(title, description) {
    title = (title || '').trim();
    description = (description || '').trim();
    if (!title) return;
    var key = title.toLowerCase();
    for (var i = 0; i < currentContributions.length; i++) {
      if (currentContributions[i].title.toLowerCase() === key) {
        showToast('Contribution deja ajoutee', 'error');
        return;
      }
    }
    currentContributions.push({ title: title, description: description });
    renderContributionCards();
  }

  function removeContribution(idx) {
    currentContributions.splice(idx, 1);
    renderContributionCards();
  }

  function editContribution(idx) {
    if (idx < 0 || idx >= currentContributions.length) return;
    renderContributionCards(idx);
  }

  function saveContribution(idx) {
    if (idx < 0 || idx >= currentContributions.length) return;
    var card = document.querySelector('[data-contrib-card="' + idx + '"]');
    if (!card) return;
    var titleInput = card.querySelector('.contrib-edit-title');
    var descInput = card.querySelector('.contrib-edit-desc');
    var newTitle = (titleInput.value || '').trim();
    var newDesc = (descInput.value || '').trim();
    if (!newTitle) { showToast('Titre requis', 'error'); return; }
    var key = newTitle.toLowerCase();
    for (var i = 0; i < currentContributions.length; i++) {
      if (i !== idx && currentContributions[i].title.toLowerCase() === key) {
        showToast('Une autre contribution a deja ce titre', 'error');
        return;
      }
    }
    currentContributions[idx] = { title: newTitle, description: newDesc };
    renderContributionCards();
  }

  function cancelEditContribution(idx) {
    renderContributionCards();
  }

  function renderContributionCards(editIdx) {
    var container = document.getElementById('contributions-display');
    if (!container) return;
    if (currentContributions.length === 0) {
      container.innerHTML = '<span class="chips-empty">Aucune contribution ajoutee.</span>';
      return;
    }
    container.innerHTML = currentContributions.map(function (c, i) {
      var isEditing = (editIdx === i);
      var body;
      if (isEditing) {
        body =
          '<div class="contrib-edit-fields">' +
            '<input type="text" class="contrib-edit-title" value="' + U.escapeAttr(c.title) + '" maxlength="80" autocomplete="off">' +
            '<textarea class="contrib-edit-desc md-textarea" data-contrib-edit-ta="' + i + '" rows="4" maxlength="2000" placeholder="Selectionnez du texte pour les options de formatage...">' + U.escapeHtml(c.description) + '</textarea>' +
            '<div class="contrib-edit-actions">' +
              '<button type="button" class="btn btn-primary btn-sm" data-contrib-save="' + i + '">Enregistrer</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-contrib-cancel="' + i + '">Annuler</button>' +
            '</div>' +
          '</div>';
      } else {
        var descHtml = c.description
          ? '<div class="contrib-card-desc markdown-body">' + U.renderMarkdown(c.description) + '</div>'
          : '';
        body =
          '<h4 class="contrib-card-title">' + U.escapeHtml(c.title) + '</h4>' +
          descHtml;
      }
      var actions =
        '<div class="contrib-card-actions">' +
          (isEditing ? '' : '<button type="button" class="contrib-card-edit" data-contrib-edit="' + i + '" aria-label="Modifier">Editer</button>') +
          '<button type="button" class="contrib-card-remove" data-contrib-remove="' + i + '" aria-label="Retirer">&times;</button>' +
        '</div>';
      var editingClass = isEditing ? ' contrib-card-editing' : '';
      return '<div class="contrib-card-admin' + editingClass + '" data-contrib-card="' + i + '">' +
        '<div class="contrib-card-body">' + body + '</div>' +
        actions +
      '</div>';
    }).join('');

    if (editIdx !== undefined && editIdx !== null) {
      var editing = document.querySelector('[data-contrib-card="' + editIdx + '"] .contrib-edit-title');
      if (editing) { editing.focus(); editing.select(); }
      // Wire the floating toolbar for the inline edit textarea
      var ta = document.querySelector('[data-contrib-card="' + editIdx + '"] .contrib-edit-desc');
      if (ta) setupFloatingToolbar(ta);
    }
  }

  // ---- THUMBNAIL preview ----

  function updateThumbnailPreview() {
    var empty = document.getElementById('thumbnail-empty');
    var filled = document.getElementById('thumbnail-filled');
    var img = document.getElementById('thumbnail-preview-img');
    if (!empty || !filled || !img) return;
    if (uploadedFiles.thumbnail) {
      img.src = uploadedFiles.thumbnail;
      empty.classList.add('hidden');
      filled.classList.remove('hidden');
    } else {
      img.src = '';
      empty.classList.remove('hidden');
      filled.classList.add('hidden');
    }
  }

  // Remove thumbnail
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove="thumbnail"]');
    if (rm) {
      uploadedFiles.thumbnail = null;
      updateThumbnailPreview();
      updateLivePreview();
    }
  });

  // Remove tag/link via event delegation
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tag-remove]');
    if (t) { removeTag(parseInt(t.getAttribute('data-tag-remove'), 10)); return; }
    var l = e.target.closest('[data-link-remove]');
    if (l) { removeLink(parseInt(l.getAttribute('data-link-remove'), 10)); return; }
    var c = e.target.closest('[data-contrib-remove]');
    if (c) { removeContribution(parseInt(c.getAttribute('data-contrib-remove'), 10)); return; }
    var ce = e.target.closest('[data-contrib-edit]');
    if (ce) { editContribution(parseInt(ce.getAttribute('data-contrib-edit'), 10)); return; }
    var cs = e.target.closest('[data-contrib-save]');
    if (cs) { saveContribution(parseInt(cs.getAttribute('data-contrib-save'), 10)); return; }
    var cc = e.target.closest('[data-contrib-cancel]');
    if (cc) { cancelEditContribution(parseInt(cc.getAttribute('data-contrib-cancel'), 10)); return; }
  });

  // Keyboard support inside edit fields: Escape cancels, Ctrl/Cmd+Enter saves
  document.addEventListener('keydown', function (e) {
    var card = e.target.closest && e.target.closest('.contrib-card-editing');
    if (!card) return;
    var idx = parseInt(card.getAttribute('data-contrib-card'), 10);
    if (isNaN(idx)) return;
    if (e.key === 'Escape') { e.preventDefault(); cancelEditContribution(idx); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveContribution(idx); }
  });

  // Markdown tabs delegated (covers tabs inside re-rendered cards)
  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.md-tab');
    if (!tab) return;
    // Skip tabs that are already wired by setupProjectForm (top-level editor).
    // We detect this by checking if the tab lives inside a contrib-card-editing.
    var inCard = !!tab.closest('.contrib-card-editing');
    if (!inCard) return;
    var editor = tab.closest('.md-editor');
    if (!editor) return;
    var tabs = editor.querySelectorAll('.md-tab');
    tabs.forEach(function (t) { t.classList.toggle('md-tab-active', t === tab); });
    var mode = tab.getAttribute('data-md-tab');
    var textarea = editor.querySelector('.contrib-edit-desc');
    var preview = editor.querySelector('.contrib-edit-preview');
    if (mode === 'preview') {
      if (preview && textarea) {
        preview.innerHTML = U.renderMarkdown(textarea.value);
        preview.style.display = '';
      }
      if (textarea) textarea.style.display = 'none';
    } else {
      if (preview) preview.style.display = 'none';
      if (textarea) { textarea.style.display = ''; textarea.focus(); }
    }
  });

  // Floating toolbar action button -> apply markdown formatting
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.md-toolbar-btn');
    if (!btn) return;
    e.preventDefault();
    var toolbar = btn.closest('.md-toolbar');
    if (!toolbar) return;
    var targetKey = toolbar.getAttribute('data-target');
    var textarea;
    if (targetKey && /^contrib-edit-\d+$/.test(targetKey)) {
      var idx = targetKey.replace('contrib-edit-', '');
      textarea = document.querySelector('[data-contrib-edit-ta="' + idx + '"]');
    } else {
      textarea = targetKey ? document.getElementById(targetKey) : toolbar.previousElementSibling;
    }
    if (!textarea || typeof textarea.selectionStart !== 'number') return;
    var action = btn.getAttribute('data-md-action');
    applyMarkdownAction(textarea, action);
    // Refresh toolbar position after the textarea content changes
    positionToolbar(toolbar, textarea);
  });

  // ---- Markdown floating toolbar ----

  function ensureToolbar(textarea) {
    if (!textarea) return null;
    // Use the textarea's id, or fall back to a generated key (for inline card edit textareas)
    var key = textarea.id ? textarea.id : (textarea.getAttribute('data-contrib-edit-ta') ? 'contrib-edit-' + textarea.getAttribute('data-contrib-edit-ta') : '');
    if (!key) return null;
    var toolbarId = 'md-toolbar-' + key;
    var toolbar = document.getElementById(toolbarId);
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.id = toolbarId;
    toolbar.className = 'md-toolbar';
    toolbar.setAttribute('data-target', key);
    toolbar.innerHTML =
      '<button type="button" class="md-toolbar-btn" data-md-action="bold" title="Gras (**)"><strong>B</strong></button>' +
      '<button type="button" class="md-toolbar-btn" data-md-action="italic" title="Italique (*)"><em>I</em></button>' +
      '<button type="button" class="md-toolbar-btn" data-md-action="list" title="Liste a puces (-)">&#8226; List</button>' +
      '<button type="button" class="md-toolbar-btn" data-md-action="link" title="Lien [texte](url)">&#128279;</button>';
    document.body.appendChild(toolbar);
    return toolbar;
  }

  function positionToolbar(toolbar, textarea) {
    if (!toolbar || !textarea) return;
    // Only show when there's a non-empty selection
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    if (start === end) {
      toolbar.classList.remove('md-toolbar-visible');
      return;
    }
    // Position above the textarea, centered. Uses fixed positioning so it's
    // independent of document scroll and parent overflow.
    var rect = textarea.getBoundingClientRect();
    var top = rect.top - 44;
    var left = rect.left + (rect.width / 2);
    var halfWidth = 110;
    if (left - halfWidth < 8) left = 8 + halfWidth;
    if (left + halfWidth > window.innerWidth - 8) {
      left = window.innerWidth - 8 - halfWidth;
    }
    toolbar.style.top = top + 'px';
    toolbar.style.left = left + 'px';
    toolbar.classList.add('md-toolbar-visible');
  }

  function setupFloatingToolbar(textarea) {
    if (!textarea) return;
    var toolbar = ensureToolbar(textarea);
    if (!toolbar) return;
    if (window.console && console.log) {
      console.log('[md-toolbar] wired for #' + textarea.id);
    }

    function refresh() {
      if (document.activeElement !== textarea) {
        toolbar.classList.remove('md-toolbar-visible');
        return;
      }
      positionToolbar(toolbar, textarea);
    }
    function hide() { toolbar.classList.remove('md-toolbar-visible'); }
    function hideIfFocusLost() {
      // After blur, check where the focus is going. If it's the toolbar
      // (or a child of it), keep the toolbar visible.
      setTimeout(function () {
        var active = document.activeElement;
        if (active === textarea) return;
        if (toolbar.contains(active)) return;
        hide();
      }, 0);
    }

    // selectionchange is the most reliable cross-browser way to react to
    // a selection change in a textarea. We filter to the active textarea.
    var onSelChange = function () {
      if (document.activeElement === textarea) {
        // Defer to next tick so selectionStart/End are up to date.
        setTimeout(refresh, 0);
      }
    };
    document.addEventListener('selectionchange', onSelChange);

    textarea.addEventListener('focus', refresh);
    textarea.addEventListener('blur', hideIfFocusLost);
    textarea.addEventListener('scroll', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
  }

  function applyMarkdownAction(textarea, action) {
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var value = textarea.value;

    function replaceSelection(before, sel, after) {
      var newValue = value.substring(0, start) + before + sel + after + value.substring(end);
      textarea.value = newValue;
      var newStart = start + before.length;
      var newEnd = newStart + sel.length;
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }

    var sel = value.substring(start, end);
    var selected = sel.length > 0;

    if (action === 'bold') {
      if (selected) replaceSelection('**', sel, '**');
      else { replaceSelection('**', 'texte en gras', '**'); }
    } else if (action === 'italic') {
      if (selected) replaceSelection('*', sel, '*');
      else { replaceSelection('*', 'italique', '*'); }
    } else if (action === 'list') {
      // Add "- " at the start of each selected line
      var block = selected ? sel : 'Premier element';
      var lines = block.split(/\r?\n/);
      var allBullet = lines.length > 0 && lines.every(function (l) { return /^\s*[-*]\s+/.test(l) || l.trim() === ''; }) && lines.some(function (l) { return /^\s*[-*]\s+/.test(l); });
      var transformed;
      if (allBullet) {
        // Toggle off: strip bullet
        transformed = lines.map(function (l) { return l.replace(/^(\s*)[-*]\s+/, '$1'); }).join('\n');
      } else {
        // Toggle on: add "- "
        transformed = lines.map(function (l) {
          if (l.trim() === '') return l;
          return '- ' + l.replace(/^\s+/, '');
        }).join('\n');
      }
      replaceSelection('', transformed, '');
    } else if (action === 'link') {
      if (selected) {
        var url = window.prompt('URL du lien :', 'https://');
        if (url === null) return;
        var safe = U.safeUrl(url);
        if (!safe) { showToast('URL invalide', 'error'); return; }
        replaceSelection('[', sel, '](' + safe + ')');
      } else {
        var url2 = window.prompt('URL du lien :', 'https://');
        if (url2 === null) return;
        var safe2 = U.safeUrl(url2);
        if (!safe2) { showToast('URL invalide', 'error'); return; }
        replaceSelection('[', 'texte du lien', '](' + safe2 + ')');
      }
    }
  }

  // ---- LIVE PREVIEW ----

  function updateLivePreview() {
    var title = getVal('project-title') || 'Titre du projet';
    var desc = getVal('project-description') || 'Description courte';
    var date = getVal('project-date') || '';
    var platform = getVal('project-platform') || '';
    var status = getVal('project-status') || 'published';
    var featured = !!(document.getElementById('project-featured') || {}).checked;
    var role = getVal('project-role') || '';

    var titleEl = document.getElementById('preview-title');
    var subEl = document.getElementById('preview-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = desc;

    // Hero
    var hero = document.getElementById('preview-hero');
    if (hero) {
      if (uploadedFiles.thumbnail) {
        hero.innerHTML = '<img src="' + U.escapeAttr(uploadedFiles.thumbnail) + '" alt="">' +
          (featured ? '<span class="preview-featured">FEATURED</span>' : '');
      } else {
        hero.innerHTML = '<div class="preview-hero-placeholder">Thumbnail</div>' +
          (featured ? '<span class="preview-featured">FEATURED</span>' : '');
      }
    }

    // Meta
    var meta = document.getElementById('preview-meta');
    if (meta) {
      var parts = [];
      if (date) parts.push('<span>' + U.escapeHtml(date) + '</span>');
      if (platform) parts.push('<span>' + U.escapeHtml(platform) + '</span>');
      parts.push('<span class="preview-status status-' + U.escapeAttr(status) + '">' + (status === 'draft' ? 'Brouillon' : 'Public') + '</span>');
      if (role) parts.push('<span class="preview-role">' + U.escapeHtml(role) + '</span>');
      meta.innerHTML = parts.join('<span class="meta-sep">//</span>');
    }

    // Pills (engine + genre from tags)
    var pills = document.getElementById('preview-pills');
    if (pills) {
      var engines = currentTags.filter(function (t) { return t.category === 'engine'; }).map(function (t) { return t.name; });
      var genres = currentTags.filter(function (t) { return t.category === 'genre'; }).map(function (t) { return t.name; });
      var pHtml = '';
      engines.forEach(function (e) { pHtml += '<span class="preview-pill pill-engine">' + U.escapeHtml(e) + '</span>'; });
      genres.forEach(function (g) { pHtml += '<span class="preview-pill pill-genre">' + U.escapeHtml(g) + '</span>'; });
      pills.innerHTML = pHtml;
    }

    // Tags
    var tagBox = document.getElementById('preview-tags');
    if (tagBox) {
      if (currentTags.length === 0) {
        tagBox.innerHTML = '<span class="preview-empty">Aucun tag</span>';
      } else {
        tagBox.innerHTML = currentTags.map(function (t) {
          var color = U.getTagColor(t.category);
          return '<span class="preview-tag" style="--tag-color:' + color + '">' + U.escapeHtml(t.name) + '</span>';
        }).join('');
      }
    }

    // Links
    var linkBox = document.getElementById('preview-links');
    if (linkBox) {
      if (currentLinks.length === 0) {
        linkBox.innerHTML = '<span class="preview-empty">Aucun lien</span>';
      } else {
        linkBox.innerHTML = currentLinks.map(function (l) {
          return '<a class="preview-link" href="' + U.escapeAttr(l.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="preview-link-type">' + U.escapeHtml(U.linkLabel(l.type)) + '</span>' +
            '<span class="preview-link-arrow">&#8599;</span>' +
          '</a>';
        }).join('');
      }
    }
  }

  function saveProject() {
    var id = (document.getElementById('project-id') || {}).value;
    if (!id || !id.trim()) { showToast('ID requis', 'error'); return; }
    id = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!id) { showToast('ID invalide', 'error'); return; }

    var dateVal = (getVal('project-date') || '').trim();

    var data = {
      id: id,
      title: (getVal('project-title') || '').trim(),
      description: (getVal('project-description') || '').trim(),
      descriptionLong: (getVal('project-description-long') || '').trim(),
      date: dateVal,
      year: dateVal,
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
      tags: currentTags.slice(),
      links: currentLinks.slice(),
      contributions: currentContributions.slice()
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

  // ============== FILE UPLOADS (with compression) ==============

  function setupFileUploads() {
    var thumbInput = document.getElementById('project-thumbnail-file');
    if (thumbInput) thumbInput.addEventListener('change', function () { handleImage(this.files[0], 'thumbnail'); });
    var galleryInput = document.getElementById('project-gallery-files');
    if (galleryInput) galleryInput.addEventListener('change', function () { handleImages(this.files, 'gallery'); });
  }

  function handleImage(file, target) {
    if (!file || !file.type.startsWith('image/')) { showToast('Selectionnez une image', 'error'); return; }
    if (target === 'thumbnail') {
      compressImage(file, { maxWidth: 600, quality: 0.7 })
        .then(function (base64) {
          uploadedFiles.thumbnail = base64;
          updateThumbnailPreview();
          updateLivePreview();
          showToast('Thumbnail compresse');
        })
        .catch(function (e) { showToast('Erreur compression: ' + e.message, 'error'); });
    } else if (target === 'gallery') {
      compressImage(file, { maxWidth: 1280, quality: 0.75 })
        .then(function (base64) { uploadedFiles.gallery.push(base64); renderGalleryPreview(); })
        .catch(function (e) { showToast('Erreur compression: ' + e.message, 'error'); });
    }
  }

  function handleImages(files, target) {
    if (!files || files.length === 0) return;
    var arr = Array.prototype.slice.call(files);
    var done = 0;
    arr.forEach(function (file) {
      if (!file.type.startsWith('image/')) { done++; return; }
      compressImage(file, { maxWidth: 1280, quality: 0.75 })
        .then(function (base64) { uploadedFiles.gallery.push(base64); renderGalleryPreview(); done++; if (done === arr.length) showToast(done + ' images ajoutees'); })
        .catch(function (e) { showToast('Erreur ' + file.name + ': ' + e.message, 'error'); done++; });
    });
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

  function isAlreadyBase64(str) {
    return typeof str === 'string' && /^data:image\//i.test(str);
  }

  function isRelativeImagePath(str) {
    return typeof str === 'string' && /^(images\/|\.\/|\.\.\/|[^a-z]+:)/i.test(str) === false
      && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(str);
  }

  function compressImageUrl(url, opts) {
    opts = opts || {};
    var maxWidth = opts.maxWidth || 1280;
    var quality = opts.quality || 0.75;
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' sur ' + url);
        return r.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onerror = function () { reject(new Error('Lecture impossible: ' + url)); };
          reader.onload = function (e) {
            var img = new Image();
            img.onerror = function () { reject(new Error('Image invalide: ' + url)); };
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
                resolve(canvas.toDataURL('image/jpeg', quality));
              } catch (err) {
                reject(err);
              }
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);
        });
      });
  }

  function convertProjectImages(project) {
    var errors = [];
    var tasks = [];
    var needsThumb = project.thumbnail && !isAlreadyBase64(project.thumbnail);
    if (needsThumb) {
      tasks.push(
        compressImageUrl(project.thumbnail, { maxWidth: 600, quality: 0.7 })
          .then(function (b64) { project.thumbnail = b64; })
          .catch(function (e) {
            errors.push('Thumbnail "' + project.thumbnail + '": ' + e.message);
            project.thumbnail = '';
          })
      );
    }
    if (Array.isArray(project.images)) {
      project.images.forEach(function (src, i) {
        if (isAlreadyBase64(src)) return;
        tasks.push(
          compressImageUrl(src, { maxWidth: 800, quality: 0.6 })
            .then(function (b64) { project.images[i] = b64; })
            .catch(function (e) {
              errors.push('Image ' + i + ' "' + src + '": ' + e.message);
              project.images[i] = '';
            })
        );
      });
    }
    return Promise.all(tasks).then(function () {
      if (Array.isArray(project.images)) {
        project.images = project.images.filter(function (s) { return s; });
      }
      if (errors.length > 0) {
        console.warn('Import "' + project.id + '" images partielles:', errors);
      }
    });
  }

  window.importProjectsFromJSON = function () {
    if (!firebaseReady()) { showToast('Config Firebase manquante!', 'error'); return; }
    showToast('Import en cours vers Firestore (conversion images)...');
    fetch('data/projects.json?t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('Fichier non trouve: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.projects || data.projects.length === 0) { showToast('Aucun projet trouve', 'error'); return; }
        var total = data.projects.length;
        var imported = 0;
        var failed = 0;
        var projects = data.projects.slice();

        function processNext() {
          if (projects.length === 0) {
            if (failed === 0) showToast(total + ' projets importes dans Firestore!');
            else showToast(imported + '/' + total + ' importes, ' + failed + ' echoues');
            loadProjects();
            return;
          }
          var project = projects.shift();
          convertProjectImages(project)
            .then(function () {
              return firebase.firestore().collection('projects').doc(project.id).set(project);
            })
            .then(function () {
              imported++;
              showToast('Import ' + imported + '/' + total + ': ' + project.title);
              processNext();
            })
            .catch(function (err) {
              failed++;
              console.error('Import "' + project.id + '" failed:', err);
              showToast('Erreur "' + project.id + '": ' + err.message, 'error');
              processNext();
            });
        }
        processNext();
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
  window.toggleProjectVisibility = toggleProjectVisibility;
})();
