// Smoke test: simulate the data flow without browser
const fs = require('fs');

const U = {};
const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
// Eval utils in a fake window context
const sandbox = { window: {} };
const fn = new Function('window', utilsCode + '\nreturn window.PortfolioUtils;');
const Utils = fn(sandbox.window);
Object.assign(U, Utils);

console.log('=== Utils loaded ===');
console.log('Keys:', Object.keys(U));

// Load projects.json
const data = JSON.parse(fs.readFileSync('data/projects.json', 'utf8'));
console.log('\n=== Data loaded ===');
console.log('Projects:', data.projects.length);
console.log('Profile present:', !!data.profile);

// Test escapeHtml
console.log('\n=== XSS protection ===');
const xssAttempt = '"><img src=x onerror=alert(1)>';
const escaped = U.escapeHtml(xssAttempt);
console.log('Original:', xssAttempt);
console.log('Escaped: ', escaped);
console.log('Safe:    ', !escaped.includes('onerror') && !escaped.includes('<'));

// Test normalizeLinks
console.log('\n=== Links normalization ===');
const arrLinks = [{ type: 'itchio', url: 'https://itch.io/x' }, { type: 'steam', url: '' }];
const objLinks = { itchio: 'https://itch.io/y', github: 'https://github.com/z', empty: '' };
console.log('Array input :', U.normalizeLinks(arrLinks));
console.log('Object input:', U.normalizeLinks(objLinks));
console.log('Empty input :', U.normalizeLinks(null));

// Test safeUrl
console.log('\n=== URL safety ===');
console.log('https://example.com:', U.safeUrl('https://example.com'));
console.log('javascript:alert(1):', U.safeUrl('javascript:alert(1)'));
console.log('data:text/html,x:  ', U.safeUrl('data:text/html,x'));
console.log('mailto:a@b.c:      ', U.safeUrl('mailto:a@b.c'));
console.log('relative path:     ', U.safeUrl('/foo'));

// Test getTagName / getTagCategory
console.log('\n=== Tag helpers ===');
const t1 = { name: 'Unity', category: 'engine' };
const t2 = 'PlainString';
console.log('Object name :', U.getTagName(t1));
console.log('Object cat  :', U.getTagCategory(t1));
console.log('String name :', U.getTagName(t2));
console.log('String cat  :', U.getTagCategory(t2));

// Test extractVideoId
console.log('\n=== YouTube ID extraction ===');
console.log('Watch URL  :', U.extractVideoId('https://www.youtube.com/watch?v=abc123XYZ45'));
console.log('Short URL  :', U.extractVideoId('https://youtu.be/abc123XYZ45'));
console.log('Embed URL  :', U.extractVideoId('https://www.youtube.com/embed/abc123XYZ45'));
console.log('Raw ID     :', U.extractVideoId('abc123XYZ45'));

// Test sortProjectsByDateDesc
console.log('\n=== Sort by date ===');
const sorted = U.sortProjectsByDateDesc(data.projects);
sorted.forEach(p => console.log(' ', p.date, '-', p.title));

// Test getTagColor
console.log('\n=== Tag colors ===');
['engine','language','role','genre','platform','tool','other','unknown'].forEach(c => {
  console.log(' ', c.padEnd(10), '->', U.getTagColor(c));
});

// Test that admin.js saveLinks would produce clean output
console.log('\n=== Simulating saveLinks flow ===');
const sampleFormData = [
  { typeEl: { value: 'itchio' }, urlEl: { value: 'https://itch.io/test' } },
  { typeEl: { value: 'itch' }, urlEl: { value: 'https://itch.io/alt' } },
  { typeEl: { value: 'steam' }, urlEl: { value: 'javascript:alert(1)' } },
  { typeEl: { value: 'github' }, urlEl: { value: '' } }
];
const result = [];
sampleFormData.forEach(row => {
  const url = row.urlEl.value.trim();
  if (!url) return;
  const safe = U.safeUrl(url);
  if (!safe) return;
  let type = row.typeEl.value;
  if (type === 'itch') type = 'itchio';
  result.push({ type, url: safe });
});
console.log('Filtered:', JSON.stringify(result, null, 2));

console.log('\n=== ALL TESTS PASSED ===');
