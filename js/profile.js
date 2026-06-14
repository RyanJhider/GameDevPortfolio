// ========================================
// PROFILE.JS - Charge le profil Firestore et peuple la home + about
// Source de verite : collection 'profile' (doc 'main')
// Fallback : data/projects.json (champ 'profile')
// ========================================

(function () {
  'use strict';

  var U = window.PortfolioUtils;

  window.loadProfile = function () {
    var config = window.FIREBASE_CONFIG;
    if (config && config.apiKey && typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) firebase.initializeApp(config);
        firebase.firestore().collection('profile').doc('main').get()
          .then(function (doc) {
            if (doc.exists) { applyProfile(doc.data()); return; }
            loadProfileFromJSON();
          })
          .catch(function () { loadProfileFromJSON(); });
      } catch (e) { loadProfileFromJSON(); }
    } else {
      loadProfileFromJSON();
    }
  };

  function loadProfileFromJSON() {
    fetch('data/projects.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { if (data.profile) applyProfile(data.profile); })
      .catch(function () { /* no profile available, keep hardcoded */ });
  }

  function applyProfile(p) {
    if (!p) return;
    applyText('.profile-name', p.name);
    applyText('.profile-title', p.title);
    applyText('.profile-school', p.school);
    applyText('.profile-location', p.location);
    applyText('.profile-bio', p.bio);
    applyText('.profile-description', p.description);
    applyAttr('.profile-avatar', 'src', p.avatar);
    applySocial('.social-github', p.social && p.social.github);
    applySocial('.social-linkedin', p.social && p.social.linkedin);
    applySocial('.social-itchio', p.social && p.social.itchio);
    applySocial('.social-email', p.social && p.social.email, true);
    applySkills('.skills-engines', p.skills && p.skills.engines);
    applySkills('.skills-languages', p.skills && p.skills.languages);
    applySkills('.skills-tools', p.skills && p.skills.tools);
    applySkills('.skills-soft', p.skills && p.skills.softSkills);
    applyCv(p);
  }

  function applyCv(p) {
    var root = document.getElementById('cv-viewer');
    if (!root) return;
    var source = p.cvData || p.cvUrl;
    if (!source) {
      console.info('[CV] aucune source (cvData et cvUrl vides)');
      root.classList.add('cv-viewer-empty');
      return;
    }
    if (p.cvData && p.cvData.length < 200) {
      console.warn('[CV] cvData trop court (' + p.cvData.length + ' chars), probablement corrompu');
      root.classList.add('cv-viewer-empty');
      return;
    }
    console.info('[CV] source:', source.slice(0, 60) + '...', '|', Math.round(source.length / 1024) + ' KB', '|', p.cvData ? 'cvData (base64)' : 'cvUrl');
    root.classList.remove('cv-viewer-empty');
    var sourceEl = document.getElementById('cv-source');
    if (sourceEl) sourceEl.value = source;
    var titleEl = root.querySelector('.cv-viewer-title');
    if (titleEl) titleEl.textContent = p.cvLabel || 'Curriculum Vitae';
    var dlHref = U.safeUrl(source) || '#';
    var dlName = (p.name || 'cv') + '.pdf';
    var downloadEl = document.getElementById('cv-download');
    if (downloadEl) { downloadEl.setAttribute('href', dlHref); downloadEl.setAttribute('download', dlName); }
    var modalDl = document.getElementById('cv-modal-download');
    if (modalDl) { modalDl.setAttribute('href', dlHref); modalDl.setAttribute('download', dlName); }
    if (typeof window.initCvViewer === 'function') window.initCvViewer();
  }

  function applyText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function applyAttr(selector, attr, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.setAttribute(attr, U.escapeAttr(value));
    });
  }

  function applySocial(selector, value, isEmail) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) {
        el.setAttribute('href', isEmail ? 'mailto:' + value : U.escapeAttr(value));
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  function applySkills(selector, list) {
    if (!Array.isArray(list) || list.length === 0) return;
    var container = document.querySelector(selector);
    if (!container) return;
    var skills = list.filter(Boolean);
    if (skills.length === 0) return;
    container.innerHTML = skills.map(function (s) {
      return '<div class="skill-item">' + U.escapeHtml(s) + '</div>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', window.loadProfile);
})();
