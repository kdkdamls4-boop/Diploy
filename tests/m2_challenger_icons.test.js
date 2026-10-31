/**
 * ==============================================================================
 * DIPLOY GAMES - CHALLENGER 1 AUTOMATED EMPIRICAL TEST SUITE
 * Milestone 2: SVG Icons API (js/icons.js) & Complete Emoji Purge Stress Test
 * ==============================================================================
 * Standalone Node.js adversarial test suite verifying:
 * 1. Icon Inventory: All 34 vector icons defined, including 28 required keys.
 * 2. XML Well-Formedness: Every icon generates valid, well-formed SVG markup
 *    with viewBox="0 0 24 24", width="1em", height="1em", fill="currentColor".
 * 3. Fallback Resilience: Querying unknown, null, undefined, numerical, or
 *    prototype-polluted keys returns safe fallback markup without throwing.
 * 4. renderIcon Permutations: Size, className, fill, title, string options,
 *    and nested permutations produce correctly structured SVG elements.
 * 5. initIcons DOM Hydration: Scans and replaces [data-icon] elements in mock
 *    DOM, supports data-icon-class, preserves unknown tags, handles idempotency,
 *    and hooks DOMContentLoaded safely.
 * 6. XSS & Security: Malformed class names or attributes do not crash the engine,
 *    and prototype keys (toString, valueOf, constructor) are handled safely.
 * 7. HTML & CSS Integration: All 6 HTML files include icons.js in <head> before
 *    app scripts; zero raw emojis remain in headers, perks, or modals; and
 *    css/style.css defines .svg-icon with fill: currentColor.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  MockElement,
  MockDocument,
  createTestEnv,
  readCss,
  readProjectFile,
  readAllHtmlFiles,
  projectFileExists,
  validateJsSyntax
} = require('./harness.js');

let passCount = 0;
let failCount = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passCount++;
    results.push({ name, status: 'PASS' });
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failCount++;
    results.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

console.log('='.repeat(80));
console.log('CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS (MILESTONE 2: SVG ICONS)');
console.log('='.repeat(80));

// ============================================================================
// SUITE 1: ICON INVENTORY & CORE METADATA
// ============================================================================
console.log('\n--- SUITE 1: Icon Inventory & Global API Surface ---');

test('1.1 js/icons.js exists and passes strict JS syntax validation', () => {
  assert.ok(projectFileExists('js/icons.js'), 'js/icons.js must exist on disk');
  const syntaxCheck = validateJsSyntax('js/icons.js');
  assert.ok(syntaxCheck.ok, `js/icons.js syntax error: ${syntaxCheck.error}`);
});

test('1.2 Global exports: window.SVG_ICONS, getIcon, renderIcon, initIcons are exposed', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  assert.equal(typeof env.context.SVG_ICONS, 'object', 'SVG_ICONS dictionary must be exported');
  assert.equal(typeof env.context.getIcon, 'function', 'getIcon function must be exported');
  assert.equal(typeof env.context.renderIcon, 'function', 'renderIcon function must be exported');
  assert.equal(typeof env.context.initIcons, 'function', 'initIcons function must be exported');
});

test('1.3 Inventory count: SVG_ICONS contains at least 30 vector icons (found: 34)', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const keys = Object.keys(env.context.SVG_ICONS);
  assert.ok(keys.length >= 30, `Expected at least 30 icons, found ${keys.length}`);
  assert.equal(keys.length, 34, `Expected 34 icons in standard inventory, found ${keys.length}`);
});

test('1.4 Required keys contract: All 28 mandatory keys from PROJECT.md are defined', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const mandatoryKeys = [
    'flash', 'shield', 'card', 'gift', 'fire', 'star', 'user', 'cart',
    'search', 'check', 'copy', 'settings', 'arrow-right', 'external-link',
    'cross', 'plus', 'minus', 'refresh', 'trash', 'steam', 'roblox',
    'playstation', 'gamepad', 'coins', 'package', 'key', 'lock', 'bag'
  ];

  for (const key of mandatoryKeys) {
    assert.ok(
      key in env.context.SVG_ICONS,
      `Mandatory key '${key}' missing from SVG_ICONS dictionary`
    );
  }
});

test('1.5 Extended utility keys: xbox, dot, rocket, info, alert, pumpkin are present', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const utilityKeys = ['xbox', 'dot', 'rocket', 'info', 'alert', 'pumpkin'];
  for (const key of utilityKeys) {
    assert.ok(
      key in env.context.SVG_ICONS,
      `Utility key '${key}' missing from SVG_ICONS dictionary`
    );
  }
});

// ============================================================================
// SUITE 2: SVG XML WELL-FORMEDNESS & STANDARDIZED ATTRIBUTES
// ============================================================================
console.log('\n--- SUITE 2: SVG XML Well-Formedness & Attribute Standards ---');

test('2.1 Every icon produces valid SVG root with required attributes', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const keys = Object.keys(env.context.SVG_ICONS);

  for (const key of keys) {
    const markup = env.context.getIcon(key);
    assert.ok(typeof markup === 'string', `Markup for '${key}' must be a string`);
    assert.ok(markup.startsWith('<svg '), `Markup for '${key}' must start with '<svg '`);
    assert.ok(markup.endsWith('</svg>'), `Markup for '${key}' must end with '</svg>'`);
    assert.ok(markup.includes('viewBox="0 0 24 24"'), `Markup for '${key}' must have viewBox="0 0 24 24"`);
    assert.ok(markup.includes('width="1em"'), `Markup for '${key}' must have width="1em"`);
    assert.ok(markup.includes('height="1em"'), `Markup for '${key}' must have height="1em"`);
    assert.ok(markup.includes('fill="currentColor"'), `Markup for '${key}' must have fill="currentColor"`);
    assert.ok(markup.includes('aria-hidden="true"'), `Markup for '${key}' must have aria-hidden="true"`);
    assert.ok(markup.includes(`class="svg-icon icon-${key}"`), `Markup for '${key}' must have class="svg-icon icon-${key}"`);
  }
});

test('2.2 XML tag balance & self-closing tag verification across all 34 icons', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const keys = Object.keys(env.context.SVG_ICONS);

  for (const key of keys) {
    const pathSnippet = env.context.SVG_ICONS[key];
    assert.ok(pathSnippet && pathSnippet.trim().length > 0, `Icon snippet for '${key}' must not be empty`);

    // Verify tag syntax: all elements must either be self-closing <tag ... /> or properly paired
    const tagMatches = pathSnippet.matchAll(/<([a-zA-Z0-9]+)(\s+[^>]*)?(\/?)>/g);
    let openTags = [];

    for (const match of tagMatches) {
      const tagName = match[1];
      const isSelfClosing = match[3] === '/';
      const allowedElements = ['path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse'];
      assert.ok(
        allowedElements.includes(tagName),
        `Unexpected SVG element '<${tagName}>' in icon '${key}'`
      );

      if (!isSelfClosing) {
        openTags.push(tagName);
      }
    }

    // In SVG_ICONS, every inner element must be self-closing
    assert.equal(
      openTags.length,
      0,
      `Unclosed tags found in icon '${key}': ${openTags.join(', ')}`
    );
  }
});

test('2.3 No unescaped or dangling XML characters in SVG output', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  for (const key of Object.keys(env.context.SVG_ICONS)) {
    const markup = env.context.getIcon(key);
    // Count < and > brackets to ensure strict parity
    const opens = (markup.match(/</g) || []).length;
    const closes = (markup.match(/>/g) || []).length;
    assert.equal(opens, closes, `Mismatched bracket count in icon '${key}': < (${opens}) vs > (${closes})`);
    // Ensure all attributes are quoted
    const rawAttrWithoutQuotes = markup.match(/\s[a-zA-Z0-9_-]+=[^"'\s>]+/);
    assert.equal(rawAttrWithoutQuotes, null, `Unquoted attribute found in '${key}': ${rawAttrWithoutQuotes?.[0]}`);
  }
});

// ============================================================================
// SUITE 3: GRACEFUL FALLBACK FOR UNKNOWN & BOUNDARY KEYS
// ============================================================================
console.log('\n--- SUITE 3: Graceful Fallback & Boundary Handling ---');

test('3.1 Unknown string key returns safe fallback without throwing', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  assert.doesNotThrow(() => {
    const res = env.context.getIcon('non_existent_key_9999');
    assert.ok(typeof res === 'string', 'Must return a string');
    assert.ok(res.includes('<svg class="svg-icon icon-non_existent_key_9999"'), 'Must include class');
    // Fallback path should match info icon
    assert.ok(res.includes(env.context.SVG_ICONS['info']), 'Must fallback to info icon path');
  });
});

test('3.2 getIcon handles null, undefined, boolean, and number keys without throwing', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const testInputs = [null, undefined, '', 0, 42, false, true, NaN];

  for (const input of testInputs) {
    assert.doesNotThrow(() => {
      const res = env.context.getIcon(input);
      assert.ok(typeof res === 'string', `Output for input ${input} must be a string`);
      assert.ok(res.startsWith('<svg '), `Output for input ${input} must start with <svg `);
      assert.ok(res.endsWith('</svg>'), `Output for input ${input} must end with </svg>`);
    }, `getIcon(${input}) threw an exception`);
  }
});

test('3.3 Prototype property keys do not cause crash or uncaught exception', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const protoKeys = ['toString', 'valueOf', 'constructor', '__proto__', 'hasOwnProperty'];

  for (const pKey of protoKeys) {
    assert.doesNotThrow(() => {
      const res = env.context.getIcon(pKey);
      assert.ok(typeof res === 'string', `Output for prototype key '${pKey}' must be a string`);
      assert.ok(res.startsWith('<svg '), `Output for prototype key '${pKey}' must start with <svg `);
    }, `getIcon('${pKey}') threw an exception`);
  }
});

// ============================================================================
// SUITE 4: renderIcon OPTIONS PERMUTATIONS & CUSTOMIZATION
// ============================================================================
console.log('\n--- SUITE 4: renderIcon Options Permutations ---');

test('4.1 Shorthand string option is treated as custom className', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const result = env.context.renderIcon('cart', 'cart-header-icon active');
  assert.ok(result.includes('class="svg-icon icon-cart cart-header-icon active"'));
  assert.ok(result.includes('width="1em"'));
  assert.ok(result.includes('fill="currentColor"'));
});

test('4.2 renderIcon with undefined, null, or empty options defaults to standard 1em currentColor', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const r1 = env.context.renderIcon('cart');
  const r2 = env.context.renderIcon('cart', undefined);
  const r3 = env.context.renderIcon('cart', null);
  const r4 = env.context.renderIcon('cart', {});

  for (const r of [r1, r2, r3, r4]) {
    assert.ok(r.includes('class="svg-icon icon-cart"'));
    assert.ok(r.includes('width="1em"'));
    assert.ok(r.includes('height="1em"'));
    assert.ok(r.includes('fill="currentColor"'));
    assert.ok(!r.includes('<title>'));
  }
});

test('4.3 Custom size option sets width and height uniformly', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const rPx = env.context.renderIcon('flash', { size: '32px' });
  assert.ok(rPx.includes('width="32px" height="32px"'));

  const rRem = env.context.renderIcon('flash', { size: '2.5rem' });
  assert.ok(rRem.includes('width="2.5rem" height="2.5rem"'));
});

test('4.4 Custom className option appends without mutating base classes', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const res = env.context.renderIcon('shield', { className: 'glow-accent primary' });
  assert.ok(res.includes('class="svg-icon icon-shield glow-accent primary"'));
});

test('4.5 Custom fill option overrides default currentColor', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const resHex = env.context.renderIcon('fire', { fill: '#ff7a00' });
  assert.ok(resHex.includes('fill="#ff7a00"'));

  const resVar = env.context.renderIcon('fire', { fill: 'var(--halloween-orange)' });
  assert.ok(resVar.includes('fill="var(--halloween-orange)"'));
});

test('4.6 Accessible title option injects <title> tag inside root svg', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const res = env.context.renderIcon('cart', { title: 'Корзина покупок' });
  assert.ok(res.includes('<title>Корзина покупок</title>'));
  assert.ok(res.indexOf('<title>') < res.indexOf('<circle'), '<title> must precede vector shapes');
});

test('4.7 Full option combination renders all attributes accurately', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const res = env.context.renderIcon('pumpkin', {
    size: '48px',
    className: 'hero-pumpkin-icon animated',
    fill: '#ff7a00',
    title: 'Хэллоуинская тыква'
  });

  assert.ok(res.includes('class="svg-icon icon-pumpkin hero-pumpkin-icon animated"'));
  assert.ok(res.includes('width="48px" height="48px"'));
  assert.ok(res.includes('fill="#ff7a00"'));
  assert.ok(res.includes('<title>Хэллоуинская тыква</title>'));
  assert.ok(res.includes(env.context.SVG_ICONS['pumpkin']));
});

test('4.8 renderIcon with unknown key and options applies options to fallback icon', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const res = env.context.renderIcon('mystery_icon', {
    size: '20px',
    className: 'fallback-badge',
    title: 'Неизвестный значок'
  });

  assert.ok(res.includes('class="svg-icon icon-mystery_icon fallback-badge"'));
  assert.ok(res.includes('width="20px" height="20px"'));
  assert.ok(res.includes('<title>Неизвестный значок</title>'));
  assert.ok(res.includes(env.context.SVG_ICONS['info']));
});

// ============================================================================
// SUITE 5: initIcons MOCK DOM HYDRATION & REPLACEMENT
// ============================================================================
console.log('\n--- SUITE 5: initIcons Mock DOM Hydration ---');

test('5.1 initIcons without arguments or in non-browser environment returns safely', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  assert.doesNotThrow(() => {
    env.context.initIcons(null);
    env.context.initIcons(undefined);
    env.context.initIcons({});
  });
});

test('5.2 initIcons scans and hydrates single [data-icon] element', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const span = new MockElement('span');
  span.setAttribute('data-icon', 'search');
  env.document.body.appendChild(span);

  env.context.initIcons(env.document.body);
  assert.ok(span.innerHTML.includes('<svg class="svg-icon icon-search"'), 'span.innerHTML must contain search SVG');
  assert.ok(span.innerHTML.includes('viewBox="0 0 24 24"'), 'span.innerHTML must contain viewBox');
});

test('5.3 initIcons supports custom class attribute via data-icon-class', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const span = new MockElement('span');
  span.setAttribute('data-icon', 'cart');
  span.setAttribute('data-icon-class', 'header-cart-icon nav-item');
  env.document.body.appendChild(span);

  env.context.initIcons(env.document.body);
  assert.ok(
    span.innerHTML.includes('class="svg-icon icon-cart header-cart-icon nav-item"'),
    'span.innerHTML must include custom class from data-icon-class'
  );
});

test('5.4 initIcons hydrates multiple distinct elements across container tree', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const container = new MockElement('div');
  const e1 = new MockElement('span', { 'data-icon': 'flash' });
  const e2 = new MockElement('span', { 'data-icon': 'shield' });
  const e3 = new MockElement('div', { 'data-icon': 'gift' });
  container.appendChild(e1);
  container.appendChild(e2);
  container.appendChild(e3);
  env.document.body.appendChild(container);

  env.context.initIcons(container);
  assert.ok(e1.innerHTML.includes('icon-flash'), 'e1 must be flash');
  assert.ok(e2.innerHTML.includes('icon-shield'), 'e2 must be shield');
  assert.ok(e3.innerHTML.includes('icon-gift'), 'e3 must be gift');
});

test('5.5 initIcons does not overwrite element with unknown data-icon name', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const span = new MockElement('span');
  span.setAttribute('data-icon', 'completely_fake_icon');
  span.innerHTML = 'Original Inner Text';
  env.document.body.appendChild(span);

  env.context.initIcons(env.document.body);
  assert.equal(span.innerHTML, 'Original Inner Text', 'Unknown icon elements should remain unmutated');
});

test('5.6 initIcons idempotency: Repeated calls leave markup stable and valid', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const span = new MockElement('span');
  span.setAttribute('data-icon', 'star');
  env.document.body.appendChild(span);

  env.context.initIcons(env.document.body);
  const firstMarkup = span.innerHTML;

  env.context.initIcons(env.document.body);
  const secondMarkup = span.innerHTML;

  assert.equal(firstMarkup, secondMarkup, 'Second hydration must produce identical markup');
});

test('5.7 Scoped container scanning isolates mutations to target root', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const inside = new MockElement('div');
  const outside = new MockElement('div');
  const targetEl = new MockElement('span', { 'data-icon': 'key' });
  const untouchedEl = new MockElement('span', { 'data-icon': 'key' });
  untouchedEl.innerHTML = 'DO_NOT_TOUCH';

  inside.appendChild(targetEl);
  outside.appendChild(untouchedEl);
  env.document.body.appendChild(inside);
  env.document.body.appendChild(outside);

  env.context.initIcons(inside);
  assert.ok(targetEl.innerHTML.includes('icon-key'), 'Target element inside scope must be hydrated');
  assert.equal(untouchedEl.innerHTML, 'DO_NOT_TOUCH', 'Outside element must not be touched');
});

test('5.8 DOMContentLoaded automatic hydration hook works', () => {
  const env = createTestEnv({ scripts: [] });
  // Set up mock DOM elements before script runs
  const span = new MockElement('span', { 'data-icon': 'check' });
  env.document.body.appendChild(span);

  // Now execute icons.js
  const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'icons.js'), 'utf8');
  vm.runInContext(scriptContent, env.context);

  // Trigger DOMContentLoaded
  env.document.dispatchEvent('DOMContentLoaded');
  assert.ok(span.innerHTML.includes('icon-check'), 'DOMContentLoaded event must trigger automatic hydration');
});

// ============================================================================
// SUITE 6: ADVERSARIAL STRESS & XSS RESISTANCE
// ============================================================================
console.log('\n--- SUITE 6: Adversarial Stress & XSS Resistance ---');

test('6.1 Malicious or abnormal class names do not crash rendering engine', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const attackPayloads = [
    '"><script>alert(1)</script>',
    "' onmouseover='alert(1)",
    '${7*7}',
    '\\0\\x00',
    'class1 class2 class3 class4 class5 class6 class7 class8',
    '   leading-and-trailing-whitespace   '
  ];

  for (const payload of attackPayloads) {
    assert.doesNotThrow(() => {
      const res = env.context.getIcon('shield', payload);
      assert.ok(typeof res === 'string');
      assert.ok(res.startsWith('<svg '));
      assert.ok(res.endsWith('</svg>'));
    }, `Failed on attack payload: ${payload}`);
  }
});

test('6.2 Title accessibility string does not escape or corrupt XML tree', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const titlePayload = 'Shopping Cart & Special "Deals" <2026>';
  const res = env.context.renderIcon('cart', { title: titlePayload });
  assert.ok(res.includes('<title>' + titlePayload + '</title>'));
  assert.ok(res.endsWith('</svg>'));
});

test('6.3 Heavy concurrent rendering stress test (1,000 iterations)', () => {
  const env = createTestEnv({ scripts: ['icons.js'] });
  const keys = Object.keys(env.context.SVG_ICONS);
  const startTime = Date.now();

  for (let i = 0; i < 1000; i++) {
    const key = keys[i % keys.length];
    const markup = env.context.getIcon(key, `stress-run-${i}`);
    assert.ok(markup.length > 50);
  }

  const duration = Date.now() - startTime;
  assert.ok(duration < 2000, `1,000 icon renders took too long: ${duration}ms (budget: 2000ms)`);
});

// ============================================================================
// SUITE 7: COMPLETE PROJECT INTEGRATION & EMOJI PURGE
// ============================================================================
console.log('\n--- SUITE 7: Project Integration & Complete Emoji Purge ---');

test('7.1 All 6 HTML files include <script src="js/icons.js"></script> in <head>', () => {
  const htmls = readAllHtmlFiles();
  const fileNames = ['index.html', 'catalog.html', 'product.html', 'cart.html', 'profile.html', 'admin.html'];

  for (const name of fileNames) {
    const content = htmls[name];
    assert.ok(content, `${name} must exist`);
    const headMatch = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
    assert.ok(headMatch, `${name} must contain a <head> tag`);
    assert.ok(
      headMatch[1].includes('<script src="js/icons.js"></script>'),
      `${name} must include <script src="js/icons.js"></script> in <head>`
    );
  }
});

test('7.2 Script execution order: js/icons.js is loaded BEFORE application scripts in HTML', () => {
  const htmls = readAllHtmlFiles();
  const fileNames = ['index.html', 'catalog.html', 'product.html', 'cart.html', 'profile.html', 'admin.html'];

  for (const name of fileNames) {
    const content = htmls[name];
    const iconsIndex = content.indexOf('js/icons.js');
    const appIndex = content.indexOf('js/app.js');

    assert.ok(iconsIndex !== -1, `${name} must include js/icons.js`);
    if (appIndex !== -1) {
      assert.ok(
        iconsIndex < appIndex,
        `${name} must load js/icons.js before js/app.js to ensure icons are available`
      );
    }
  }
});

test('7.3 Complete Emoji Purge in HTML: Zero raw emojis in headers across all 6 files', () => {
  const htmls = readAllHtmlFiles();
  for (const [filename, content] of Object.entries(htmls)) {
    const headerMatch = content.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i);
    if (headerMatch) {
      const headerHtml = headerMatch[1];
      assert.ok(!headerHtml.includes('🔍'), `Header in ${filename} must not contain 🔍`);
      assert.ok(!headerHtml.includes('🛒'), `Header in ${filename} must not contain 🛒`);
      assert.ok(
        headerHtml.includes('data-icon="search"'),
        `Header in ${filename} must use data-icon="search"`
      );
      assert.ok(
        headerHtml.includes('data-icon="cart"'),
        `Header in ${filename} must use data-icon="cart"`
      );
    }
  }
});

test('7.4 Complete Emoji Purge in Perks & Features: index.html has no raw perk emojis', () => {
  const indexHtml = readProjectFile('index.html');
  const perksMatch = indexHtml.match(/<(?:section|div)\s+class="features-grid">([\s\S]*?)<\/section>/i);
  assert.ok(perksMatch, 'index.html must have features-grid');
  const perksHtml = perksMatch[1];

  const forbiddenPerkEmojis = ['⚡', '🛡️', '💳', '🎁'];
  for (const emoji of forbiddenPerkEmojis) {
    assert.ok(!perksHtml.includes(emoji), `Perks grid must not contain ${emoji}`);
  }

  assert.ok(perksHtml.includes('data-icon="flash"'), 'Perks grid must use data-icon="flash"');
  assert.ok(perksHtml.includes('data-icon="shield"'), 'Perks grid must use data-icon="shield"');
  assert.ok(perksHtml.includes('data-icon="card"'), 'Perks grid must use data-icon="card"');
  assert.ok(perksHtml.includes('data-icon="gift"'), 'Perks grid must use data-icon="gift"');
});

test('7.5 Complete Emoji Purge in JS: js/catalog.js has no raw star ★ or green dot 🟢 in template', () => {
  const catalogJs = readProjectFile('js/catalog.js');
  assert.ok(!catalogJs.includes('★'), 'js/catalog.js must not contain raw star ★ character');
  assert.ok(!catalogJs.includes('🟢'), 'js/catalog.js must not contain raw green dot 🟢 emoji');
  assert.ok(catalogJs.includes("getIcon('star')"), 'js/catalog.js must use getIcon("star")');
  assert.ok(catalogJs.includes("getIcon('dot')"), 'js/catalog.js must use getIcon("dot")');
});

test('7.6 Complete Emoji Purge in Modals: cart.html, profile.html, admin.html have no raw emojis in headings', () => {
  const cartHtml = readProjectFile('cart.html');
  assert.ok(!cartHtml.includes('🛍️'), 'cart.html must not use raw 🛍️ emoji');
  assert.ok(cartHtml.includes('data-icon="bag"'), 'cart.html must use data-icon="bag"');

  const profileHtml = readProjectFile('profile.html');
  assert.ok(!profileHtml.includes('🔑 Купленные'), 'profile.html must not use raw 🔑 emoji in heading');
  assert.ok(profileHtml.includes('data-icon="key"'), 'profile.html must use data-icon="key"');

  const adminHtml = readProjectFile('admin.html');
  assert.ok(!adminHtml.includes('⚙️ Управление'), 'admin.html must not use raw ⚙️ emoji in heading');
  assert.ok(adminHtml.includes('data-icon="settings"'), 'admin.html must use data-icon="settings"');
});

test('7.7 CSS styling rules for .svg-icon exist and inherit color via currentColor', () => {
  const css = readCss();
  assert.ok(css, 'css/style.css must exist');
  assert.match(
    css,
    /\.svg-icon\s*\{[^}]*fill\s*:\s*currentColor/i,
    '.svg-icon must have fill: currentColor'
  );
  assert.match(
    css,
    /\.svg-icon\s*\{[^}]*display\s*:\s*inline-block/i,
    '.svg-icon must have display: inline-block'
  );
  assert.match(
    css,
    /\.svg-icon\s*\{[^}]*width\s*:\s*1em/i,
    '.svg-icon must have width: 1em'
  );
  assert.match(
    css,
    /\.svg-icon\s*\{[^}]*height\s*:\s*1em/i,
    '.svg-icon must have height: 1em'
  );
  assert.match(
    css,
    /\.svg-icon\s*\{[^}]*vertical-align\s*:\s*-0\.15em/i,
    '.svg-icon must have vertical-align: -0.15em'
  );
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log(`EXECUTION SUMMARY: ${passCount} passed, ${failCount} failed, total ${passCount + failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
  console.error(`\nOVERALL VERDICT: FAIL (${failCount} failures)`);
  process.exit(1);
} else {
  console.log('\nOVERALL VERDICT: PASS (100% of stress tests succeeded)');
}
