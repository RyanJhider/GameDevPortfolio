// Simulate main.js filter logic against fake DOM
const fs = require('fs');

const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
const mainCode = fs.readFileSync('js/main.js', 'utf8');

const window = { FIREBASE_CONFIG: null, PortfolioUtils: null, PortfolioApp: null, addEventListener() {}, location: { pathname: '/projects.html' } };
let clickLog = [];
let filterBarHTML = '';
let projectsListHTML = '';
const buttonClickHandlers = new Map(); // tag -> click handler

// Mock DOM
const mockFilterBar = {
  _html: '',
  set innerHTML(v) { filterBarHTML = v; this._html = v; },
  get innerHTML() { return this._html; },
  querySelectorAll(sel) {
    const buttons = [];
    const re = /<button class="filter-btn[^"]*" data-tag="([^"]+)"[^>]*data-active="([^"]+)"[^>]*>([^<]+)<\/button>/g;
    let m;
    while ((m = re.exec(this._html)) !== null) {
      const tag = m[1], active = m[2] === 'true', label = m[3].trim();
      const obj = {
        _tag: tag,
        _active: active,
        getAttribute(k) { return k === 'data-tag' ? tag : null; },
        classList: {
          add(c) { if (c === 'active') this._active = true; },
          remove(c) { if (c === 'active') this._active = false; },
          contains(c) { return c === 'active' ? this._active : false; }
        },
        textContent: label,
        addEventListener(ev, fn) { if (ev === 'click') buttonClickHandlers.set(tag, fn); },
        click() {
          const handler = buttonClickHandlers.get(this._tag);
          // Build a synthetic event-like object that the handler closure can use
          const fakeThis = this;
          if (handler) handler.call(fakeThis);
        }
      };
      buttons.push(obj);
    }
    return buttons;
  }
};

const mockGrid = { set innerHTML(v) { projectsListHTML = v; }, get innerHTML() { return projectsListHTML; } };

const documentMock = {
  addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') this._domReady = fn; },
  getElementById(id) {
    if (id === 'filter-bar') return mockFilterBar;
    if (id === 'projects-list') return mockGrid;
    if (id === 'projects-count' || id === 'featured-count' || id === 'years-experience') return { textContent: '' };
    if (id === 'loading-screen') return null;
    return null;
  }
};

new Function('window', 'document', utilsCode)(window, documentMock);
new Function('window', 'document', mainCode)(window, documentMock);

// Trigger DOMContentLoaded
if (documentMock._domReady) documentMock._domReady();

// Manually load JSON (no Firebase)
const data = JSON.parse(fs.readFileSync('data/projects.json', 'utf8'));
window.PortfolioApp.getProjects = () => data.projects;

// Trigger loadFromJSON
// Access internal via PortfolioApp? No, need a different approach. Let me eval main with exposed loadData.
const mainCodeExposed = mainCode.replace(
  'document.addEventListener(\'DOMContentLoaded\', function () { loadData(); });',
  'window.__loadData = loadData; document.addEventListener("DOMContentLoaded", function () { loadData(); });'
);
new Function('window', 'document', mainCodeExposed)(window, documentMock);
if (documentMock._domReady) documentMock._domReady();

// Now we need to inject the JSON load. The original loadData tries Firebase first. Since FIREBASE_CONFIG is null, it goes to loadFromJSON which uses fetch. fetch doesn't exist in Node, so it errors silently.
// We need to inject projects directly. Let me use a different approach: monkey-patch loadFromJSON.

const mainCodeMonkey = mainCodeExposed.replace(
  'function loadFromJSON() {',
  'function loadFromJSON() { if (window.__injectProjects) { var data = { projects: window.__injectProjects }; projectsData = U.sortProjectsByDateDesc(data.projects); afterLoad(); return; }'
);
new Function('window', 'document', mainCodeMonkey)(window, documentMock);
window.__injectProjects = data.projects;
if (documentMock._domReady) documentMock._domReady();

console.log('=== Filter bar built ===');
const buttonMatches = [...filterBarHTML.matchAll(/<button class="filter-btn[^"]*" data-tag="([^"]+)"[^>]*>([^<]+)<\/button>/g)];
console.log('Filter buttons rendered:', buttonMatches.length);
buttonMatches.forEach(m => console.log('  -', m[1].padEnd(20), '|', m[2]));

console.log('\n=== Default state (no filter) ===');
const cardMatches = [...projectsListHTML.matchAll(/href="project\.html\?id=([^"]+)"/g)];
console.log('Projects shown:', cardMatches.length);
cardMatches.forEach(m => console.log('  -', m[1]));

console.log('\n=== Click filter "Mobile Development" (should show 1) ===');
let btns = mockFilterBar.querySelectorAll('.filter-btn');
let mobileBtn = btns.find(b => b.getAttribute('data-tag') === 'Mobile Development');
if (mobileBtn) {
  mobileBtn.click();
  const filtered = [...projectsListHTML.matchAll(/href="project\.html\?id=([^"]+)"/g)];
  console.log('Projects shown:', filtered.length);
  filtered.forEach(m => console.log('  -', m[1]));
}

console.log('\n=== Add filter "Shader Graph" (OR logic, should add Silent Pit) ===');
btns = mockFilterBar.querySelectorAll('.filter-btn');
let shaderBtn = btns.find(b => b.getAttribute('data-tag') === 'Shader Graph');
if (shaderBtn) {
  shaderBtn.click();
  const filtered = [...projectsListHTML.matchAll(/href="project\.html\?id=([^"]+)"/g)];
  console.log('Projects shown:', filtered.length);
  filtered.forEach(m => console.log('  -', m[1]));
}

console.log('\n=== Click "All" to clear ===');
btns = mockFilterBar.querySelectorAll('.filter-btn');
let allBtn = btns.find(b => b.getAttribute('data-tag') === '__clear');
if (allBtn) {
  allBtn.click();
  const filtered = [...projectsListHTML.matchAll(/href="project\.html\?id=([^"]+)"/g)];
  console.log('Projects shown:', filtered.length);
}

console.log('\n=== PHASE 6 TESTS COMPLETED ===');
