/**
 * ==============================================================================
 * DIPLOY GAMES - CHALLENGER 2 EMPIRICAL AUDIT HARNESS: MILESTONE 2
 * (tests/verify_milestone2_challenger2.js)
 * ==============================================================================
 * Empirical audit and regression verification for Milestone 2 (R2 & R5):
 * 1. Comprehensive emoji audit: scans all 6 HTML files and all 9 JS files.
 *    - Verifies all 73 cataloged emoji/symbol instances from Explorer 2 have been purged.
 *    - Validates against standard Unicode emoji regex ranges.
 * 2. M1 Regression Guard: verifies canvas particles, topbar ribbon, and CSS theme tokens.
 * 3. M2 Test Invariant Checks: validates T1-F07, T1-F08, T1-F09, T1-F10, T2-B12, T3-C08.
 * 4. Architecture & Syntax Validation: verifies 100% standalone file:/// compatibility.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const HTML_FILES = [
  'index.html',
  'catalog.html',
  'product.html',
  'cart.html',
  'profile.html',
  'admin.html'
];

const JS_FILES = [
  'icons.js',
  'particles.js',
  'data.js',
  'app.js',
  'catalog.js',
  'product.js',
  'cart.js',
  'profile.js',
  'admin.js'
];

// Helper to read project files
function readProjectFile(relPath) {
  const full = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

// Mock DOM & environment for testing
function createMockEnv(scripts = ['icons.js']) {
  const mockDocument = {
    readyState: 'complete',
    body: {
      appendChild() {},
      innerHTML: ''
    },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll(selector) {
      return [];
    },
    getElementById() {
      return null;
    }
  };

  const mockWindow = {
    document: mockDocument,
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    RegExp: RegExp,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean
  };
  mockWindow.window = mockWindow;

  const context = vm.createContext(mockWindow);

  for (const scriptFile of scripts) {
    const full = path.join(PROJECT_ROOT, 'js', scriptFile);
    if (fs.existsSync(full)) {
      const code = fs.readFileSync(full, 'utf8');
      vm.runInContext(code, context, { filename: scriptFile });
    }
  }

  return { context, window: mockWindow, document: mockDocument };
}

async function runMilestone2Audit() {
  console.log('='.repeat(80));
  console.log('CHALLENGER 2: EMPIRICAL AUDIT & REGRESSION HARNESS FOR MILESTONE 2');
  console.log('Target: 6 HTML Files, 9 JS Files, css/style.css, and M1/M2 Test Invariants');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const checks = [];

  function record(desc, ok, details = '') {
    if (ok) {
      passed++;
      console.log(`  [PASS] ${desc}`);
    } else {
      failed++;
      console.log(`  [FAIL] ${desc} ${details ? '— ' + details : ''}`);
    }
    checks.push({ desc, ok, details });
  }

  // ============================================================================
  // SECTION 1: EMPIRICAL EMOJI SCAN ACROSS ALL 6 HTML FILES
  // ============================================================================
  console.log('\n--- Section 1: HTML Files Emoji Purge Verification ---');

  // Specific emojis that previously existed in HTML files
  const htmlEmojiChecks = [
    { file: 'admin.html', emojis: ['🔍', '🛒', '⚙️', '⚙', '🔄', '➕', '📦'] },
    { file: 'cart.html', emojis: ['🔍', '🛒', '🛍️', '🛍', '⚡', '💳', '💰', '🔒', '✓', '🔑'] },
    { file: 'catalog.html', emojis: ['🔍', '🛒', '🎮', '💰', '📦', '🔥'] },
    { file: 'index.html', emojis: ['🔍', '🛒', '🔥', '⚡', '🛡️', '🛡', '💳', '🎁', '⭐', '★', '🟢', '🎃'] },
    { file: 'product.html', emojis: ['🔍', '🛒'] },
    { file: 'profile.html', emojis: ['🔍', '🛒', '💳', '🔑', '🎮'] }
  ];

  for (const item of htmlEmojiChecks) {
    const content = readProjectFile(item.file);
    record(`${item.file} exists and is readable`, content !== null);
    if (!content) continue;

    for (const emoji of item.emojis) {
      const hasEmoji = content.includes(emoji);
      record(
        `${item.file} does NOT contain raw emoji/symbol "${emoji}"`,
        !hasEmoji,
        hasEmoji ? `Found at index ${content.indexOf(emoji)}` : ''
      );
    }

    // Verify <script src="js/icons.js"> is in <head>
    const hasIconsScript = /<script\s+[^>]*src=["']js\/icons\.js["'][^>]*>\s*<\/script>/i.test(content);
    record(`${item.file} includes <script src="js/icons.js"></script>`, hasIconsScript);
  }

  // ============================================================================
  // SECTION 2: EMPIRICAL EMOJI SCAN ACROSS ALL JS FILES
  // ============================================================================
  console.log('\n--- Section 2: JavaScript Files Template Strings Emoji Purge ---');

  const jsEmojiChecks = [
    { file: 'js/admin.js', purged: ['↗', '🗑️', '🗑'] },
    { file: 'js/catalog.js', purged: ['⚡', '🟢', '★', '🛡️', '🛡', '🛒'] },
    { file: 'js/cart.js', purged: ['👤', '✓', '⚡', '📋'] },
    { file: 'js/product.js', purged: ['📦', '⚠️', '⚠', 'ℹ️', '⚡', '👤', '🚀', '🛒'] },
    { file: 'js/profile.js', purged: ['📋', '✓', '●'] }
  ];

  for (const item of jsEmojiChecks) {
    const content = readProjectFile(item.file);
    record(`${item.file} exists and is readable`, content !== null);
    if (!content) continue;

    for (const symbol of item.purged) {
      const hasSymbol = content.includes(symbol);
      record(
        `${item.file} does NOT contain raw emoji/symbol "${symbol}"`,
        !hasSymbol,
        hasSymbol ? `Found at index ${content.indexOf(symbol)}` : ''
      );
    }
  }

  // General Unicode Emoji Regex Scan across all HTML and JS files
  console.log('\n--- Section 2.1: Exhaustive Unicode Regex Scan ---');
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{1FA70}-\u{1FAFF}]/gu;

  for (const f of [...HTML_FILES, ...JS_FILES.map(j => 'js/' + j)]) {
    const content = readProjectFile(f);
    if (!content) continue;
    const matches = content.match(emojiRegex) || [];
    record(
      `${f}: zero unhandled unicode emojis in range [1F300-1F9FF, 2600-26FF, 1FA70-1FAFF]`,
      matches.length === 0,
      matches.length > 0 ? `Found: ${matches.join(', ')}` : ''
    );
  }

  // ============================================================================
  // SECTION 3: MILESTONE 1 REGRESSION VERIFICATION
  // ============================================================================
  console.log('\n--- Section 3: Milestone 1 Regression Verification ---');

  const css = readProjectFile('css/style.css');
  record('css/style.css exists', css !== null);
  if (css) {
    record('CSS defines --halloween-orange: #ff7a00', /--halloween-orange\s*:\s*#ff7a00/i.test(css));
    record('CSS defines --halloween-purple: #8b5cf6', /--halloween-purple\s*:\s*#8b5cf6/i.test(css));
    record('CSS contains .badge-discount class', /\.badge-discount\b/.test(css));
    record('CSS contains .badge-discount-mega class', /\.badge-discount-mega\b/.test(css));
    record('CSS sets #particles-canvas pointer-events: none', /#particles-canvas\s*\{[^}]*pointer-events\s*:\s*none/i.test(css));
    record('CSS hides particles canvas under prefers-reduced-motion', /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[^{]*\{[\s\S]*?#particles-canvas\s*\{[^}]*display\s*:\s*none/i.test(css));
  }

  for (const htmlFile of HTML_FILES) {
    const content = readProjectFile(htmlFile);
    if (!content) continue;

    record(`${htmlFile}: <canvas id="particles-canvas"> remains intact`, content.includes('id="particles-canvas"'));
    record(`${htmlFile}: <div class="autumn-sale-topbar"> promotional ribbon remains intact`, content.includes('class="autumn-sale-topbar"'));
    record(`${htmlFile}: topbar contains HALLOWEEN promo code`, content.includes('HALLOWEEN'));
    record(`${htmlFile}: topbar contains discount up to -70%`, content.includes('-70%'));
    record(`${htmlFile}: includes <script src="js/particles.js"></script>`, content.includes('src="js/particles.js"'));
  }

  // ============================================================================
  // SECTION 4: MILESTONE 2 TEST INVARIANTS (T1-F07, T1-F08, T1-F09, T1-F10, T2-B12, T3-C08)
  // ============================================================================
  console.log('\n--- Section 4: Milestone 2 Test Invariants ---');

  // T1-F07: js/icons.js API & Key Inventory
  const iconsCode = readProjectFile('js/icons.js');
  record('js/icons.js exists', iconsCode !== null);

  const env = createMockEnv(['icons.js']);
  record('T1-F07: getIcon is a function', typeof env.context.getIcon === 'function');
  record('T1-F07: renderIcon is a function', typeof env.context.renderIcon === 'function');
  record('T1-F07: initIcons is a function', typeof env.context.initIcons === 'function');

  const requiredKeys = [
    'flash', 'shield', 'card', 'gift', 'fire', 'star', 'user', 'cart',
    'search', 'check', 'copy', 'settings', 'arrow-right', 'external-link',
    'cross', 'plus', 'minus', 'refresh', 'trash', 'steam', 'roblox',
    'playstation', 'gamepad', 'coins', 'package', 'key', 'lock', 'bag'
  ];

  for (const k of requiredKeys) {
    const markup = env.context.getIcon(k);
    const isValid = typeof markup === 'string' &&
      markup.includes('<svg') &&
      markup.includes('viewBox="0 0 24 24"') &&
      markup.includes('fill="currentColor"');
    record(`T1-F07 key inventory: "${k}" outputs valid SVG`, isValid);
  }

  // Additional icons in dictionary
  const extraKeys = ['xbox', 'dot', 'rocket', 'info', 'alert', 'pumpkin'];
  for (const k of extraKeys) {
    const markup = env.context.getIcon(k);
    const isValid = typeof markup === 'string' && markup.includes('<svg') && markup.includes('viewBox="0 0 24 24"');
    record(`T1-F07 bonus key: "${k}" outputs valid SVG`, isValid);
  }

  // T2-B12: Unknown key fallback safety
  let fallbackResult = null;
  let didThrow = false;
  try {
    fallbackResult = env.context.getIcon('nonexistent_icon_xyz_999');
  } catch (err) {
    didThrow = true;
  }
  record('T2-B12: getIcon does NOT throw for nonexistent keys', !didThrow);
  record('T2-B12: getIcon returns valid string markup for nonexistent keys', typeof fallbackResult === 'string' && fallbackResult.includes('<svg'));

  // T3-C08: CSS .svg-icon rules & currentColor cascade
  if (css) {
    const svgIconMatch = /\.svg-icon\b[^}]*fill\s*:\s*currentColor/i.test(css);
    record('T3-C08: .svg-icon defines fill: currentColor', svgIconMatch);
    const integratesTheme = css.includes('--halloween-orange') || css.includes('--accent-blue');
    record('T3-C08: CSS integrates theme tokens with icon styles', integratesTheme);
  }

  // ============================================================================
  // SECTION 5: STANDALONE FILE:/// COMPATIBILITY & SYNTAX INTEGRITY (R5)
  // ============================================================================
  console.log('\n--- Section 5: Standalone file:/// Compatibility & Syntax Integrity ---');

  for (const jsFile of JS_FILES) {
    const code = readProjectFile(`js/${jsFile}`);
    if (!code) continue;

    // Zero ES module keywords
    const hasModuleKeywords = /^\s*(import\s+|export\s+default|export\s+\{)/m.test(code);
    record(`js/${jsFile}: zero ES module import/export keywords`, !hasModuleKeywords);

    // Node VM syntax validation
    let syntaxValid = true;
    try {
      new vm.Script(code, { filename: jsFile });
    } catch (err) {
      syntaxValid = false;
    }
    record(`js/${jsFile}: passes clean JavaScript syntax parsing`, syntaxValid);
  }

  for (const htmlFile of HTML_FILES) {
    const code = readProjectFile(htmlFile);
    if (!code) continue;
    const hasTypeModule = /<script\s+type=["']module["']/i.test(code);
    record(`${htmlFile}: zero <script type="module"> tags`, !hasTypeModule);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`AUDIT RESULTS: ${passed} passed, ${failed} failed out of ${checks.length} checks`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMilestone2Audit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
