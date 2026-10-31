/**
 * ==============================================================================
 * DIPLOY GAMES - CHALLENGER 1 AUTOMATED EMPIRICAL TEST SUITE
 * Milestone 1: Particles Engine (js/particles.js) & Halloween CSS (css/style.css)
 * ==============================================================================
 * Standalone Node.js test script verifying:
 * 1. Particle count is within [25, 35] (exactly 30).
 * 2. document.hidden triggers cancelAnimationFrame and halts animation loop.
 * 3. prefers-reduced-motion stops and prevents animation.
 * 4. Dynamic toggling, resize boundary stress, and error resistance.
 * 5. CSS variables, classes, and media query compliance.
 * 6. HTML integration across all 6 pages.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  MockElement,
  createTestEnv,
  readCss,
  readProjectFile,
  readAllHtmlFiles,
  projectFileExists,
  validateJsSyntax
} = require('./harness.js');

// Ensure MockElement caches context per standard HTML5 Canvas specification
const origGetContext = MockElement.prototype.getContext;
MockElement.prototype.getContext = function (type) {
  if (this.tagName === 'CANVAS') {
    if (!this._context2d) {
      this._context2d = origGetContext.call(this, type);
    }
    return this._context2d;
  }
  return origGetContext.call(this, type);
};

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
console.log('CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS (MILESTONE 1)');
console.log('='.repeat(80));

// -----------------------------------------------------------------------------
// 1. Particle Count & Budget Verification [25, 35]
// -----------------------------------------------------------------------------
console.log('\n--- 1. Particle Count & Budget Verification ---');

test('Particle count is strictly within range [25, 35]', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  assert.ok(env.window.DiployParticles, 'window.DiployParticles should be exported');
  const count = env.window.DiployParticles.getParticleCount();
  assert.ok(
    count >= 25 && count <= 35,
    `Particle count must be between 25 and 35, got: ${count}`
  );
  assert.equal(count, 30, 'Expected exact particle budget of 30 (18 leaves + 12 embers)');
});

test('CommonJS module export verifies leaf (18) and ember (12) allocation', () => {
  const particlesModule = require('../js/particles.js');
  assert.equal(particlesModule.TOTAL_LEAVES, 18, 'TOTAL_LEAVES must be 18');
  assert.equal(particlesModule.TOTAL_EMBERS, 12, 'TOTAL_EMBERS must be 12');
  assert.equal(
    particlesModule.TOTAL_LEAVES + particlesModule.TOTAL_EMBERS,
    30,
    'Sum of leaves and embers must equal 30'
  );
});

// -----------------------------------------------------------------------------
// 2. Lifecycle & VisibilityChange (document.hidden)
// -----------------------------------------------------------------------------
console.log('\n--- 2. VisibilityChange & document.hidden ---');

test('Animation starts running automatically in normal mode', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  assert.equal(env.window.DiployParticles.isRunning(), true, 'Engine must be running initially');
  assert.equal(env.hasPendingAnimation(), true, 'Animation frame must be scheduled');
});

test('document.hidden === true triggers cancelAnimationFrame and halts loop', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  assert.equal(env.hasPendingAnimation(), true, 'Should have pending frame before hide');

  // Trigger visibilitychange with hidden = true
  env.document.hidden = true;
  env.document.dispatchEvent({ type: 'visibilitychange' });

  assert.equal(
    env.window.DiployParticles.isRunning(),
    false,
    'isRunning() must be false when tab is hidden'
  );
  assert.equal(
    env.hasPendingAnimation(),
    false,
    'RAF callbacks must be cancelled when tab is hidden'
  );
});

test('document.hidden === false resumes animation loop', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  // Hide
  env.document.hidden = true;
  env.document.dispatchEvent({ type: 'visibilitychange' });
  assert.equal(env.hasPendingAnimation(), false);

  // Show
  env.document.hidden = false;
  env.document.dispatchEvent({ type: 'visibilitychange' });

  assert.equal(
    env.window.DiployParticles.isRunning(),
    true,
    'isRunning() must be true after returning to visible'
  );
  assert.equal(
    env.hasPendingAnimation(),
    true,
    'Animation frame must be scheduled after tab becomes visible'
  );
});

test('Stress-test: 50 consecutive visibility toggles do not cause state corruption', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  for (let i = 0; i < 50; i++) {
    const shouldHide = i % 2 === 0;
    env.document.hidden = shouldHide;
    env.document.dispatchEvent({ type: 'visibilitychange' });

    if (shouldHide) {
      assert.equal(env.window.DiployParticles.isRunning(), false);
      assert.equal(env.hasPendingAnimation(), false);
    } else {
      assert.equal(env.window.DiployParticles.isRunning(), true);
      assert.equal(env.hasPendingAnimation(), true);
      env.stepAnimation(); // step a frame
    }
  }
});

// -----------------------------------------------------------------------------
// 3. Prefers-Reduced-Motion Lifecycle
// -----------------------------------------------------------------------------
console.log('\n--- 3. Prefers-Reduced-Motion Lifecycle ---');

test('prefers-reduced-motion: reduce on startup prevents animation from ever starting', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>',
    reducedMotion: true
  });

  assert.equal(
    env.window.DiployParticles.isRunning(),
    false,
    'isRunning() must be false when prefers-reduced-motion is active'
  );
  assert.equal(
    env.hasPendingAnimation(),
    false,
    'No animation frames must be scheduled under reduced motion'
  );
});

test('Dynamic media query transition to reduced-motion halts running animation', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>',
    reducedMotion: false
  });

  assert.equal(env.window.DiployParticles.isRunning(), true);
  assert.equal(env.hasPendingAnimation(), true);

  // Trigger media query change to reduce
  env.triggerMediaChange(true);

  assert.equal(
    env.window.DiployParticles.isRunning(),
    false,
    'Animation must stop when prefers-reduced-motion becomes true'
  );
  assert.equal(
    env.hasPendingAnimation(),
    false,
    'RAF must be cancelled when prefers-reduced-motion becomes true'
  );
});

test('Returning from reduced-motion while tab is hidden does NOT resume animation', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>',
    reducedMotion: false
  });

  // Hide tab
  env.document.hidden = true;
  env.document.dispatchEvent({ type: 'visibilitychange' });

  // Switch to reduced motion and then back to normal while still hidden
  env.triggerMediaChange(true);
  env.triggerMediaChange(false);

  assert.equal(
    env.window.DiployParticles.isRunning(),
    false,
    'Animation must remain stopped because tab is hidden'
  );
  assert.equal(env.hasPendingAnimation(), false);
});

// -----------------------------------------------------------------------------
// 4. Edge Cases, Dimension Extremes & Fallbacks
// -----------------------------------------------------------------------------
console.log('\n--- 4. Edge Cases & Resilience ---');

test('Auto-creates #particles-canvas if absent from DOM', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '' // No canvas element initially
  });

  const canvas = env.document.getElementById('particles-canvas');
  assert.ok(canvas, 'Canvas element should be auto-created and appended to body');
  assert.equal(env.window.DiployParticles.getParticleCount(), 30);
});

test('Zero-dimension and 8K viewport resize do not throw or produce NaN coordinates', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  const canvas = env.document.getElementById('particles-canvas');

  // Test 0x0 canvas
  env.window.innerWidth = 0;
  env.window.innerHeight = 0;
  env.window.dispatchEvent({ type: 'resize' });
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);

  // Step 10 animation frames with 0x0
  for (let i = 0; i < 10; i++) {
    assert.doesNotThrow(() => {
      env.stepAnimation();
    }, 'Stepping frame with 0x0 canvas must not throw');
  }

  // Test 8K UHD canvas (7680x4320)
  env.window.innerWidth = 7680;
  env.window.innerHeight = 4320;
  env.window.dispatchEvent({ type: 'resize' });
  assert.equal(canvas.width, 7680);
  assert.equal(canvas.height, 4320);

  // Step 50 frames with 8K canvas
  for (let i = 0; i < 50; i++) {
    assert.doesNotThrow(() => {
      env.stepAnimation();
    }, 'Stepping frame with 8K canvas must not throw');
  }
});

test('100 frames simulation runs smoothly with active canvas drawing', () => {
  const env = createTestEnv({
    scripts: ['particles.js'],
    prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
  });

  const canvas = env.document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');

  for (let f = 0; f < 100; f++) {
    const executed = env.stepAnimation();
    assert.equal(executed, 1, `Frame ${f} must execute 1 RAF callback`);
  }

  assert.ok(ctx._calls.length > 500, `Context calls must be registered (got ${ctx._calls.length})`);
  const clearCalls = ctx._calls.filter(c => c.method === 'clearRect');
  assert.equal(clearCalls.length, 100, 'clearRect must be called exactly once each frame');
});

// -----------------------------------------------------------------------------
// 5. CSS Theming & Accessibility Rules
// -----------------------------------------------------------------------------
console.log('\n--- 5. CSS Theming & Accessibility Rules ---');

test('css/style.css defines all required Halloween color tokens', () => {
  const css = readCss();
  assert.ok(css, 'style.css must exist');
  assert.match(css, /--halloween-orange\s*:\s*#ff7a00/i);
  assert.match(css, /--halloween-purple\s*:\s*#8b5cf6/i);
  assert.match(css, /--halloween-amber\s*:\s*#f59e0b/i);
  assert.ok(css.includes('--halloween-gradient'));
  assert.ok(css.includes('--halloween-badge-bg'));
});

test('css/style.css contains discount badge classes with gradients', () => {
  const css = readCss();
  assert.match(css, /\.badge-discount\b/);
  assert.match(css, /\.badge-discount-mega\b/);
  assert.match(css, /\.btn-halloween\b/);
  assert.match(css, /\.autumn-sale-topbar\b/);
});

test('css/style.css styles #particles-canvas properly and disables via media query', () => {
  const css = readCss();
  assert.match(css, /#particles-canvas\s*\{[^}]*position\s*:\s*fixed/i);
  assert.match(css, /#particles-canvas\s*\{[^}]*pointer-events\s*:\s*none/i);
  assert.match(css, /#particles-canvas\s*\{[^}]*z-index\s*:\s*0/i);

  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[^}]*#particles-canvas\s*\{[^}]*display\s*:\s*none\s*!important/i,
    'CSS must force display: none !important on #particles-canvas under prefers-reduced-motion'
  );
});

// -----------------------------------------------------------------------------
// 6. HTML Pages Integration (All 6 Pages)
// -----------------------------------------------------------------------------
console.log('\n--- 6. HTML Pages Integration ---');

const htmlPages = ['index.html', 'catalog.html', 'product.html', 'cart.html', 'profile.html', 'admin.html'];

for (const page of htmlPages) {
  test(`Page ${page} includes autumn-sale-topbar, particles-canvas, and particles.js script`, () => {
    const html = readProjectFile(page);
    assert.ok(html, `${page} must exist`);
    assert.ok(
      html.includes('class="autumn-sale-topbar"') || html.includes("class='autumn-sale-topbar'"),
      `${page} must include .autumn-sale-topbar ribbon`
    );
    assert.ok(
      html.includes('id="particles-canvas"') || html.includes("id='particles-canvas'"),
      `${page} must include #particles-canvas`
    );
    assert.ok(
      html.includes('src="js/particles.js"') || html.includes("src='js/particles.js'"),
      `${page} must include js/particles.js script tag`
    );
  });
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(`CHALLENGER TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (${passCount + failCount} TOTAL)`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
