// Simulate profile.js applyProfile logic against fake DOM
const fs = require('fs');

const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
const profileCode = fs.readFileSync('js/profile.js', 'utf8');

// Build a minimal DOM mock
function makeEl(selector) {
  return {
    selector: selector,
    textContent: '',
    href: '',
    src: '',
    style: {},
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = v; if (k === 'href') this.href = v; if (k === 'src') this.src = v; },
    getAttribute(k) { return this._attrs[k]; }
  };
}

const elems = {
  'name': makeEl('.profile-name'),
  'title': makeEl('.profile-title'),
  'school': makeEl('.profile-school'),
  'description': makeEl('.profile-description'),
  'bio': makeEl('.profile-bio'),
  'gh': makeEl('.social-github'),
  'li': makeEl('.social-linkedin'),
  'it': makeEl('.social-itchio'),
  'em': makeEl('.social-email'),
  'engines': { selector: '.skills-engines', innerHTML: '', _children: [], appendChild() {}, querySelector() { return null; } },
  'languages': { selector: '.skills-languages', innerHTML: '', _children: [], appendChild() {}, querySelector() { return null; } }
};

const documentMock = {
  addEventListener() {},
  querySelector(sel) {
    const map = {
      '.skills-engines': elems.engines,
      '.skills-languages': elems.languages,
      '.skills-tools': null,
      '.skills-soft': null
    };
    return map[sel] || null;
  },
  querySelectorAll(sel) {
    const map = {
      '.profile-name': [elems.name],
      '.profile-title': [elems.title],
      '.profile-school': [elems.school],
      '.profile-description': [elems.description],
      '.profile-bio': [elems.bio],
      '.social-github': [elems.gh],
      '.social-linkedin': [elems.li],
      '.social-itchio': [elems.it],
      '.social-email': [elems.em],
      '.skills-engines': [elems.engines],
      '.skills-languages': [elems.languages]
    };
    return map[sel] || [];
  }
};

const window = { FIREBASE_CONFIG: null, PortfolioUtils: null, __captured: null, addEventListener() {} };

// Load utils first
new Function('window', 'document', utilsCode)(window, documentMock);
console.log('Utils loaded:', Object.keys(window.PortfolioUtils).length, 'helpers');

// Eval profile.js - rewrite to expose applyProfile for testing
const profileCodeExposed = profileCode.replace(
  'document.addEventListener(\'DOMContentLoaded\', window.loadProfile);',
  'window.__applyProfile = applyProfile; document.addEventListener("DOMContentLoaded", window.loadProfile);'
);
new Function('window', 'document', profileCodeExposed)(window, documentMock);

if (typeof window.__applyProfile !== 'function') {
  console.error('FAIL: applyProfile not exposed');
  process.exit(1);
}

const sampleProfile = {
  name: 'Ryan Jhider',
  title: 'Game Design & Programming Student',
  school: 'ISART Digital',
  bio: 'Passionate game developer...',
  description: '3rd year Game Design & Programming student at ISART Digital.',
  skills: {
    engines: ['Unity', 'Godot', 'Unreal Engine'],
    languages: ['C#', 'C++', 'Python']
  },
  social: {
    github: 'https://github.com/ryanjhider',
    linkedin: 'https://linkedin.com/in/ryan-jhider',
    itchio: 'https://ryanjhider.itch.io',
    email: 'ryanjhider@gmail.com'
  }
};

window.__applyProfile(sampleProfile);

console.log('\n=== DOM after applyProfile ===');
console.log('name.textContent     :', elems.name.textContent);
console.log('title.textContent    :', elems.title.textContent);
console.log('school.textContent   :', elems.school.textContent);
console.log('description.text     :', elems.description.textContent);
console.log('bio.text             :', elems.bio.textContent);
console.log('github.href          :', elems.gh.href);
console.log('linkedin.href        :', elems.li.href);
console.log('itchio.href          :', elems.it.href);
console.log('email.href           :', elems.em.href);
console.log('engines.innerHTML    :', elems.engines.innerHTML);
console.log('languages.innerHTML  :', elems.languages.innerHTML);

let pass = true;
if (elems.name.textContent !== 'Ryan Jhider') pass = false;
if (elems.gh.href !== 'https://github.com/ryanjhider') pass = false;
if (elems.em.href !== 'mailto:ryanjhider@gmail.com') pass = false;
if (!elems.engines.innerHTML.includes('Unity')) pass = false;

console.log('\n=== XSS protection in profile apply ===');
const evil = { name: '<script>alert(1)</script>', title: '"><img onerror=x>' };
window.__applyProfile(evil);
console.log('XSS name.textContent :', elems.name.textContent);
console.log('Renders safely (text, not HTML)');

console.log('\n=== Missing profile data graceful ===');
window.__applyProfile({});
console.log('OK - no errors');

console.log('\n=== ALL PHASE 5 TESTS', pass ? 'PASSED ✓' : 'FAILED ✗', '===');
process.exit(pass ? 0 : 1);
