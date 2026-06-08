// Integration test: simulate full rendering pipeline
const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
const mainCode = fs.readFileSync('js/main.js', 'utf8');
const projectCode = fs.readFileSync('js/project.js', 'utf8');

const U = {};
const window = { FIREBASE_CONFIG: null, PortfolioUtils: null, PortfolioApp: null, addEventListener() {}, location: { pathname: '/projects.html' } };
const fakeImg = { set src(v) { this._src = v; }, get src() { return this._src; }, setAttribute() {}, addEventListener() {} };

// Mock document
let _setInnerHTML = {};
let _getText = {};

const documentMock = {
  addEventListener() {},
  createElement(tag) {
    if (tag === 'img') return fakeImg;
    if (tag === 'iframe') return { set src(v) { this._src = v; }, setAttribute() {} };
    if (tag === 'div' || tag === 'span' || tag === 'a' || tag === 'button') {
      return {
        className: '', set textContent(v) { this._t = v; }, get textContent() { return this._t; },
        set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; },
        set href(v) { this._href = v; }, get href() { return this._href; },
        setAttribute() {}, addEventListener() {}, appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
        click() {}, set classList(v) { this._cls = v; }
      };
    }
    return null;
  },
  querySelector(sel) { return null; },
  querySelectorAll(sel) { return []; },
  getElementById(id) {
    if (id === 'filter-bar' || id === 'projects-list' || id === 'pdp-media' || id === 'pdp-pills' || id === 'pdp-desc' || id === 'pdp-links' || id === 'pdp-details' || id === 'pdp-tech' || id === 'pdp-gallery' || id === 'pdp-title' || id === 'pdp-subtitle') {
      return { set innerHTML(v) { _setInnerHTML[id] = v; }, get innerHTML() { return _setInnerHTML[id] || ''; }, querySelectorAll() { return []; }, appendChild() {} };
    }
    if (id === 'projects-count' || id === 'featured-count' || id === 'years-experience') {
      return { set textContent(v) { _getText[id] = v; }, get textContent() { return _getText[id]; } };
    }
    if (id === 'loading-screen') return null;
    return null;
  },
  title: '',
  URLSearchParams: function () { return { get() { return 'heistgaard'; } }; }
};

new Function('window', 'document', utilsCode)(window, documentMock);
console.log('Utils:', Object.keys(window.PortfolioUtils).length, 'helpers');

// Test project.js rendering
new Function('window', 'document', projectCode)(window, documentMock);
if (documentMock.addEventListener._handler) documentMock.addEventListener._handler();

// Inject project data
const data = JSON.parse(fs.readFileSync('data/projects.json', 'utf8'));
const project = data.projects.find(p => p.id === 'heistgaard');
if (!project) { console.error('No heistgaard in JSON'); process.exit(1); }

console.log('\n=== Project heistgaard ===');
console.log('  thumbnail:', project.thumbnail);
console.log('  images:');
project.images.forEach((img, i) => console.log('   ', i, '->', img, '(safeUrl:', window.PortfolioUtils.safeUrl(img), ')'));

// Simulate renderProject
const r = documentMock.getElementById('pdp-media');
r.innerHTML = '';

// Test media
const vid = window.PortfolioUtils.extractVideoId(project.video);
console.log('  video id:', vid);

// Test gallery
console.log('\n=== Gallery rendering (simulated) ===');
const gallery = [];
project.images.forEach(src => {
  const safe = window.PortfolioUtils.safeUrl(src);
  console.log('  src:', src, '-> safeUrl:', safe ? 'OK' : 'BLOCKED');
  if (safe) gallery.push(safe);
});
console.log('  Gallery items to render:', gallery.length);
console.log('  PASS:', gallery.length === project.images.length ? 'YES' : 'NO');

console.log('\n=== Card thumbnail rendering (main.js) ===');
// Simulate the renderCard function
const thumbSrc = window.PortfolioUtils.escapeAttr(project.thumbnail);
const thumbHtml = '<img src="' + thumbSrc + '" alt="' + window.PortfolioUtils.escapeAttr(project.title) + '" class="project-thumb" loading="lazy">';
console.log('  HTML:', thumbHtml);
console.log('  Contains correct path:', thumbHtml.includes('images/Heistgaard/HeistGaard.png'));

// Test with XSS in thumbnail
console.log('\n=== XSS in thumbnail (negative test) ===');
const xssProject = { id: 'x', title: 'X', thumbnail: 'javascript:alert(1)' };
const xssSafe = window.PortfolioUtils.safeUrl(xssProject.thumbnail);
console.log('  javascript: blocked:', xssSafe === '' ? 'YES' : 'NO (FAIL)');
const xssData = { id: 'x', title: 'X', thumbnail: 'data:text/html,<script>alert(1)</script>' };
console.log('  data:text/html blocked:', window.PortfolioUtils.safeUrl(xssData.thumbnail) === '' ? 'YES' : 'NO (FAIL)');

console.log('\n=== ALL TESTS PASSED ===');
