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

  // Sort by manual `order` first (lower = first), then fall back to date desc.
  // Projects without an explicit `order` are placed at the end, sorted by date.
  function sortProjectsByOrder(list) {
    return list.slice().sort(function (a, b) {
      var ao = (typeof a.order === 'number' && !isNaN(a.order)) ? a.order : null;
      var bo = (typeof b.order === 'number' && !isNaN(b.order)) ? b.order : null;
      if (ao !== null && bo !== null) return ao - bo;
      if (ao !== null) return -1;
      if (bo !== null) return 1;
      return String(b.date || b.year || '').localeCompare(String(a.date || a.year || ''));
    });
  }

  // Kept for backward compatibility (alias of the date-only fallback path).
  function sortProjectsByDateDesc(list) {
    return list.slice().sort(function (a, b) {
      return String(b.date || b.year || '').localeCompare(String(a.date || a.year || ''));
    });
  }

  // Tiny safe Markdown -> HTML for contribution descriptions.
  // Input is assumed to be plain text (NOT pre-escaped). Output is HTML.
  // Supported: **bold**, *italic*, `code`, [text](url), bullet lists (- or *),
  // numbered lists (1. 2.), and single newlines for line breaks.
  // Everything is escaped first to neutralize any user-provided tags.
  function renderMarkdown(text) {
    if (text === null || text === undefined) return '';
    var s = String(text);

    // 1) Escape the whole thing first (XSS-safe baseline)
    s = escapeHtml(s);

    // 2) Extract inline links into placeholders so further regex passes
    //    don't mangle the href content.
    var links = [];
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
      var safe = safeUrl(url);
      var placeholder = '\u0000LINK' + links.length + '\u0000';
      if (safe) {
        links.push('<a href="' + escapeAttr(safe) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>');
      } else {
        links.push(label); // unsafe URL: render plain text
      }
      return placeholder;
    });

    // 3) Inline formatting
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

    // 4) Block-level: lists (must run before line-break pass)
    var lines = s.split(/\r?\n/);
    var out = [];
    var i = 0;
    function flushParagraph(buf) {
      if (buf.length === 0) return;
      var joined = buf.join(' ').trim();
      if (joined) out.push('<p>' + joined + '</p>');
    }
    while (i < lines.length) {
      var line = lines[i];
      var ulMatch = /^[\s]*[-*]\s+(.+)$/.exec(line);
      var olMatch = /^[\s]*\d+\.\s+(.+)$/.exec(line);
      if (ulMatch || olMatch) {
        var ordered = !!olMatch;
        var tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + '>');
        while (i < lines.length) {
          var cur = lines[i];
          var u = /^[\s]*[-*]\s+(.+)$/.exec(cur);
          var o = /^[\s]*\d+\.\s+(.+)$/.exec(cur);
          if (ordered && o) { out.push('<li>' + o[1] + '</li>'); i++; }
          else if (!ordered && u) { out.push('<li>' + u[1] + '</li>'); i++; }
          else { break; }
        }
        out.push('</' + tag + '>');
        continue;
      }
      if (line.trim() === '') {
        // paragraph break
        i++;
        continue;
      }
      // collect paragraph lines until blank/list
      var para = [line];
      i++;
      while (i < lines.length) {
        var next = lines[i];
        if (next.trim() === '') break;
        if (/^[\s]*[-*]\s+/.test(next)) break;
        if (/^[\s]*\d+\.\s+/.test(next)) break;
        para.push(next);
        i++;
      }
      out.push('<p>' + para.join('<br>') + '</p>');
    }

    var html = out.join('');

    // 5) Restore link placeholders
    html = html.replace(/\u0000LINK(\d+)\u0000/g, function (m, idx) {
      return links[parseInt(idx, 10)] || '';
    });

    return html;
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
    sortProjectsByDateDesc: sortProjectsByDateDesc,
    sortProjectsByOrder: sortProjectsByOrder,
    renderMarkdown: renderMarkdown
  };
})(window);
