// ========================================
// UTILS - Helpers partages (escape, tags, links)
// ========================================

(function (global) {
  'use strict';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function safeUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (!s) return '';
    // Reject dangerous schemes
    if (/^\s*(javascript|vbscript|file):/i.test(s)) return '';
    // Reject non-image data: URLs (data:image/* is OK)
    if (/^\s*data:/i.test(s) && !/^\s*data:image\//i.test(s)) return '';
    // Allow http(s), mailto, tel, root-relative, hash, and bare relative paths
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(s)) return s;
    // Bare relative path (e.g. "images/foo.png") - safe since same-origin
    if (/^[a-z0-9_\-./%?=&+#~@!$'*,;:\u00C0-\uFFFF]+$/i.test(s)) return s;
    return '';
  }

  function getTagName(tag) {
    if (!tag) return '';
    return typeof tag === 'object' ? (tag.name || '') : String(tag);
  }

  function getTagCategory(tag) {
    if (!tag) return 'other';
    return typeof tag === 'object' ? (tag.category || 'other') : 'other';
  }

  function normalizeLinks(links) {
    if (!links) return [];
    if (Array.isArray(links)) {
      return links
        .filter(function (l) { return l && l.url && String(l.url).trim() !== ''; })
        .map(function (l) { return { type: l.type || 'other', url: String(l.url).trim() }; });
    }
    if (typeof links === 'object') {
      return Object.keys(links)
        .filter(function (k) { return links[k] && String(links[k]).trim() !== ''; })
        .map(function (k) { return { type: k, url: String(links[k]).trim() }; });
    }
    return [];
  }

  function linkLabel(type) {
    var map = {
      googleplay: 'Google Play',
      steam: 'Steam',
      itchio: 'Itch.io',
      itch: 'Itch.io',
      github: 'GitHub',
      demo: 'Download Demo',
      other: 'Link'
    };
    return map[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Link');
  }

  function getTagColor(category) {
    var colors = {
      engine: '#3dff5e',
      language: '#4ecdc4',
      role: '#a855f7',
      genre: '#ef4444',
      platform: '#f59e0b',
      tool: '#10b981',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  }

  function formatDate(value) {
    if (!value) return '';
    var s = String(value);
    if (/^\d{4}$/.test(s)) return s;
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    return s;
  }

  function extractVideoId(video) {
    if (!video) return null;
    if (video.includes('youtube.com/watch?v=')) {
      var m = video.match(/v=([^&]+)/);
      return m ? m[1] : null;
    }
    if (video.includes('youtu.be/')) {
      var m = video.match(/youtu\.be\/([^?]+)/);
      return m ? m[1] : null;
    }
    if (video.includes('youtube.com/embed/')) {
      var m = video.match(/embed\/([^?]+)/);
      return m ? m[1] : null;
    }
    if (video.length === 11) return video;
    return null;
  }

  function sortProjectsByDateDesc(list) {
    return list.slice().sort(function (a, b) {
      return String(b.date || b.year || '').localeCompare(String(a.date || a.year || ''));
    });
  }

  global.PortfolioUtils = {
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    safeUrl: safeUrl,
    getTagName: getTagName,
    getTagCategory: getTagCategory,
    normalizeLinks: normalizeLinks,
    linkLabel: linkLabel,
    getTagColor: getTagColor,
    formatDate: formatDate,
    extractVideoId: extractVideoId,
    sortProjectsByDateDesc: sortProjectsByDateDesc
  };
})(window);
