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
    applyTitle('.profile-title', p.title);
    applyText('.profile-school', p.school);
    applyText('.profile-location', p.location);
    applyText('.profile-bio', p.bio);
    applyText('.profile-description', p.description);

    applySocial('.social-github', p.social && p.social.github);
    applySocial('.social-linkedin', p.social && p.social.linkedin);
    applySocial('.social-itchio', p.social && p.social.itchio);
    applySocial('.social-email', p.social && p.social.email, true);

    applyShowWhen('school', p.school);
    applyShowWhen('location', p.location);
    applyAvatar(p.avatar);
    applySkillsSection(p.skills);
    applyEducation(p.education);
    applyCv(p);
  }

  function applyShowWhen(field, value) {
    var sel = '[data-show-when="' + field + '"]';
    var els = document.querySelectorAll(sel);
    els.forEach(function (el) {
      if (value) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function applyAvatar(value) {
    var wrap = document.getElementById('about-avatar-wrap');
    var img = document.querySelector('.profile-avatar');
    if (!img) return;
    if (!value) {
      if (wrap) wrap.setAttribute('hidden', '');
      img.removeAttribute('src');
      return;
    }
    img.setAttribute('src', U.escapeAttr(value));
    if (wrap) wrap.removeAttribute('hidden');
  }

  function applySkillsSection(skills) {
    var section = document.getElementById('about-skills-section');
    if (!section) return;
    var groups = ['engines', 'languages', 'tools', 'softSkills'];
    var hasAny = false;
    groups.forEach(function (key) {
      var list = skills && skills[key];
      var group = section.querySelector('[data-skills-group="' + key + '"]');
      if (!group) return;
      var items = Array.isArray(list) ? list.filter(Boolean) : [];
      if (items.length === 0) {
        group.setAttribute('hidden', '');
        return;
      }
      hasAny = true;
      group.removeAttribute('hidden');
      var container = group.querySelector('.skills-list');
      container.innerHTML = items.map(function (s) {
        return '<div class="skill-item">' + U.escapeHtml(s) + '</div>';
      }).join('');
    });
    if (hasAny) section.removeAttribute('hidden');
    else section.setAttribute('hidden', '');
  }

  function applyEducation(list) {
    var root = document.getElementById('education-timeline');
    if (!root) return;
    if (!Array.isArray(list) || list.length === 0) { root.innerHTML = ''; return; }
    var items = list
      .filter(function (e) { return e && (e.year || e.label); })
      .sort(function (a, b) { return String(b.year || '').localeCompare(String(a.year || '')); });
    root.innerHTML = items.map(function (e) {
      var year = U.escapeHtml(String(e.year || ''));
      var label = e.label ? U.escapeHtml(String(e.label)) : '';
      var meta = e.meta ? '<span class="timeline-meta">' + U.escapeHtml(String(e.meta)) + '</span>' : '';
      var isCurrent = e.current === true;
      var itemClass = 'timeline-item' + (isCurrent ? ' timeline-item-current' : '');
      var badge = isCurrent ? '<span class="timeline-badge">// NOW</span>' : '';
      return (
        '<li class="' + itemClass + '">' +
          '<span class="timeline-dot" aria-hidden="true"></span>' +
          '<span class="timeline-year">' + year + badge + '</span>' +
          '<span class="timeline-body">' +
            '<span class="timeline-label">' + label + '</span>' +
            meta +
          '</span>' +
        '</li>'
      );
    }).join('');
  }

  function applyCv(p) {
    var section = document.getElementById('about-cv-section');
    var root = document.getElementById('cv-viewer');
    if (!root) return;
    var source = p.cvData || p.cvUrl;
    if (!source) {
      if (section) section.hidden = true;
      return;
    }
    if (p.cvData && p.cvData.length < 200) {
      console.warn('[CV] cvData trop court (' + p.cvData.length + ' chars), probablement corrompu');
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;
    var sourceEl = document.getElementById('cv-source');
    if (sourceEl) sourceEl.value = source;
    var titleEl = root.querySelector('.cv-viewer-title');
    if (titleEl) titleEl.textContent = p.cvLabel || 'Curriculum Vitae';
    var dlHref = U.safeUrl(source) || '#';
    var dlName = (p.name || 'cv') + '.pdf';
    setDownload('cv-download', dlHref, dlName);
    setDownload('cv-modal-download', dlHref, dlName);
    if (typeof window.initCvViewer === 'function') window.initCvViewer();
  }

  function setDownload(id, href, name) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('href', href);
    el.setAttribute('download', name);
  }

  function applyText(selector, value) {
    if (value == null) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function applyTitle(selector, value) {
    if (value == null) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
      var pattern = /Game Design & Programming/i;
      var match = pattern.exec(el.textContent);
      if (match) {
        var before = el.textContent.slice(0, match.index);
        var matchText = el.textContent.slice(match.index, match.index + match[0].length);
        var after = el.textContent.slice(match.index + match[0].length);
        el.textContent = before;
        var span = document.createElement('span');
        span.className = 'accent';
        span.textContent = matchText;
        el.appendChild(span);
        el.appendChild(document.createTextNode(after));
      }
    });
  }

  function applyDescription(selector, value) {
    if (value == null) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
      var pattern = /Game Design & Programming/i;
      var match = pattern.exec(el.textContent);
      if (match) {
        var before = el.textContent.slice(0, match.index);
        var matchText = el.textContent.slice(match.index, match.index + match[0].length);
        var after = el.textContent.slice(match.index + match[0].length);
        el.textContent = before;
        var span = document.createElement('span');
        span.className = 'accent';
        span.textContent = matchText;
        el.appendChild(span);
        el.appendChild(document.createTextNode(after));
      }
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

  document.addEventListener('DOMContentLoaded', window.loadProfile);
})();
