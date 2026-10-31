/**
 * ==============================================================================
 * DIPLOY GAMES - CHALLENGER 2 AUDIT HARNESS: MILESTONE 1
 * (tests/verify_milestone1_challenger2.js)
 * ==============================================================================
 * Empirical inspection of all 6 HTML files and css/style.css:
 * - Canvas presence, placement, and non-blocking pointer events
 * - Autumn sale topbar presence, content, and z-index
 * - particles.js script tags, relative paths, ordering, and zero ES module usage
 * - CSS tokens (#ff7a00, #8b5cf6), gradients, glow effects
 * - Badge discount styling (standard and mega up to -70%)
 * - WCAG color contrast verification
 * - Z-index layer stack hierarchy
 */

const fs = require('node:fs');
const path = require('node:path');
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

// Helper to calculate relative luminance for WCAG contrast
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

async function runEmpiricalAudit() {
  console.log('='.repeat(80));
  console.log('CHALLENGER 2: EMPIRICAL AUDIT REPORT FOR MILESTONE 1');
  console.log('Target: 6 HTML Files & css/style.css');
  console.log('='.repeat(80));

  const results = {
    passed: 0,
    failed: 0,
    checks: []
  };

  function record(title, passed, details = '') {
    results.checks.push({ title, passed, details });
    if (passed) {
      results.passed++;
      console.log(`[PASS] ${title}`);
    } else {
      results.failed++;
      console.error(`[FAIL] ${title} - ${details}`);
    }
  }

  // ============================================================================
  // SECTION 1: HTML FILES AUDIT (ALL 6 FILES)
  // ============================================================================
  console.log('\n--- SECTION 1: HTML Files Audit ---');

  for (const filename of HTML_FILES) {
    const filePath = path.join(PROJECT_ROOT, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1.1 Canvas presence
    const hasCanvas = /<canvas\s+id=["']particles-canvas["']\s*>\s*<\/canvas>/i.test(content) ||
                      /<canvas\s+id=["']particles-canvas["']\s*\/>/i.test(content);
    record(`${filename}: <canvas id="particles-canvas"> element is present in body`, hasCanvas);

    // 1.2 Canvas placement: inside <body>
    const bodyIndex = content.indexOf('<body');
    const canvasIndex = content.indexOf('id="particles-canvas"');
    const isCanvasInBody = bodyIndex !== -1 && canvasIndex > bodyIndex;
    record(`${filename}: canvas is located inside <body>`, isCanvasInBody);

    // 1.3 Topbar presence
    const hasTopbar = /<div\s+class=["'][^"']*autumn-sale-topbar[^"']*["']>/i.test(content);
    record(`${filename}: <div class="autumn-sale-topbar"> promotional ribbon is present`, hasTopbar);

    // 1.4 Topbar copy checks
    const topbarMatch = content.match(/<div class="autumn-sale-topbar">([\s\S]*?)<\/div>/i);
    const topbarContent = topbarMatch ? topbarMatch[1] : '';
    const hasHalloweenPromo = /HALLOWEEN/i.test(topbarContent);
    const hasDiscountClaim = /-70%/i.test(topbarContent) || /70%/i.test(topbarContent);
    const hasSaleTitle = /Осенняя распродажа|Halloween Sale/i.test(topbarContent);
    record(`${filename}: topbar mentions 'HALLOWEEN' promo code`, hasHalloweenPromo);
    record(`${filename}: topbar mentions discount up to -70%`, hasDiscountClaim);
    record(`${filename}: topbar has Autumn Sale / Halloween headline`, hasSaleTitle);

    // 1.5 Script inclusion: particles.js
    const scriptRegex = /<script\s+[^>]*src=["']js\/particles\.js["'][^>]*>\s*<\/script>/i;
    const hasParticlesScript = scriptRegex.test(content);
    record(`${filename}: includes <script src="js/particles.js"></script>`, hasParticlesScript);

    // 1.6 Script must NOT have type="module"
    const moduleScriptRegex = /<script\s+[^>]*type=["']module["'][^>]*src=["']js\/particles\.js["']/i;
    const isModule = moduleScriptRegex.test(content);
    record(`${filename}: particles.js loaded as standard script (NO type="module")`, !isModule);

    // 1.7 Script load order: particles.js must be loaded before page controller
    // Page controllers: app.js, catalog.js, product.js, cart.js, profile.js, admin.js
    const particlesScriptIdx = content.indexOf('src="js/particles.js"');
    const appScriptIdx = content.indexOf('src="js/app.js"');
    const dataScriptIdx = content.indexOf('src="js/data.js"');

    const loadedAfterData = dataScriptIdx === -1 || particlesScriptIdx > dataScriptIdx;
    const loadedBeforeOrWithApp = appScriptIdx === -1 || particlesScriptIdx < appScriptIdx;
    record(`${filename}: script order: data.js -> particles.js -> app.js / page scripts`, loadedAfterData && loadedBeforeOrWithApp);
  }

  // ============================================================================
  // SECTION 2: CSS / STYLE.CSS AUDIT
  // ============================================================================
  console.log('\n--- SECTION 2: css/style.css Audit ---');
  const cssPath = path.join(PROJECT_ROOT, 'css', 'style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // 2.1 CSS Variables & Hex Values
  const hasOrangeHex = /--halloween-orange\s*:\s*#ff7a00\b/i.test(css);
  record('CSS defines --halloween-orange: #ff7a00', hasOrangeHex);

  const hasPurpleHex = /--halloween-purple\s*:\s*#8b5cf6\b/i.test(css);
  record('CSS defines --halloween-purple: #8b5cf6', hasPurpleHex);

  const hasOrangeGlow = /--halloween-orange-glow\s*:\s*rgba\(255,\s*122,\s*0,\s*0\.45\)/i.test(css);
  record('CSS defines --halloween-orange-glow token', hasOrangeGlow);

  const hasPurpleGlow = /--halloween-purple-glow\s*:\s*rgba\(139,\s*92,\s*246,\s*0\.35\)/i.test(css);
  record('CSS defines --halloween-purple-glow token', hasPurpleGlow);

  const hasHalloweenGradient = /--halloween-gradient\s*:\s*linear-gradient/i.test(css);
  record('CSS defines --halloween-gradient token', hasHalloweenGradient);

  // 2.2 Discount Badges
  const hasBadgeDiscount = /\.badge-discount\s*\{[^}]*\}/s.test(css);
  record('CSS contains .badge-discount rule definition', hasBadgeDiscount);

  const badgeDiscountBlock = (css.match(/\.badge-discount\s*\{([^}]*)\}/s) || [])[1] || '';
  const badgeUsesHalloween = /--halloween-badge-bg|#ff7a00|#ea580c/i.test(badgeDiscountBlock);
  record('.badge-discount uses Halloween orange gradient or color token', badgeUsesHalloween);

  const hasMegaDiscountBadge = /\.badge-discount-mega\s*\{[^}]*\}/s.test(css);
  record('CSS contains .badge-discount-mega rule definition for extreme discounts up to -70%', hasMegaDiscountBadge);

  const megaBadgeBlock = (css.match(/\.badge-discount-mega\s*\{([^}]*)\}/s) || [])[1] || '';
  const megaBadgeHasGlow = /box-shadow/i.test(megaBadgeBlock) && /255,\s*122,\s*0/i.test(megaBadgeBlock);
  record('.badge-discount-mega has energetic glow box-shadow', megaBadgeHasGlow);

  // 2.3 Canvas Non-Blocking & Z-Index
  const canvasRuleMatch = css.match(/#particles-canvas\s*\{([^}]*)\}/s);
  record('CSS contains #particles-canvas rule definition', !!canvasRuleMatch);

  const canvasRule = canvasRuleMatch ? canvasRuleMatch[1] : '';
  const hasPointerEventsNone = /pointer-events\s*:\s*none\b/i.test(canvasRule);
  record('#particles-canvas has pointer-events: none (will not block clicks or inputs)', hasPointerEventsNone);

  const hasFixedPosition = /position\s*:\s*fixed\b/i.test(canvasRule);
  record('#particles-canvas has position: fixed (stays in background during scroll)', hasFixedPosition);

  const zIndexMatch = canvasRule.match(/z-index\s*:\s*(-?\d+)/i);
  const canvasZIndex = zIndexMatch ? parseInt(zIndexMatch[1], 10) : null;
  const isNonBlockingZIndex = canvasZIndex !== null && canvasZIndex <= 0;
  record(`#particles-canvas has non-blocking background z-index (found ${canvasZIndex})`, isNonBlockingZIndex);

  // 2.4 Topbar Styling and Layering
  const topbarRuleMatch = css.match(/\.autumn-sale-topbar\s*\{([^}]*)\}/s);
  record('CSS contains .autumn-sale-topbar rule definition', !!topbarRuleMatch);

  const topbarRule = topbarRuleMatch ? topbarRuleMatch[1] : '';
  const topbarZIndexMatch = topbarRule.match(/z-index\s*:\s*(\d+)/i);
  const topbarZIndex = topbarZIndexMatch ? parseInt(topbarZIndexMatch[1], 10) : null;
  const topbarAboveCanvas = topbarZIndex !== null && topbarZIndex > (canvasZIndex || 0);
  record(`.autumn-sale-topbar has z-index higher than canvas (${topbarZIndex} > ${canvasZIndex})`, topbarAboveCanvas);

  // 2.5 Reduced Motion media query
  const reducedMotionMatch = css.match(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([\s\S]*?)\}/i);
  record('CSS contains @media (prefers-reduced-motion: reduce) rule', !!reducedMotionMatch);

  const reducedMotionContent = reducedMotionMatch ? reducedMotionMatch[1] : '';
  const hidesCanvas = /#particles-canvas\s*\{[^}]*display\s*:\s*none/i.test(reducedMotionContent);
  record('prefers-reduced-motion hides #particles-canvas with display: none', hidesCanvas);

  // 2.6 Card hover glow
  const cardHoverMatch = css.match(/\.product-card:hover\s*\{([^}]*)\}/s);
  const cardHoverRule = cardHoverMatch ? cardHoverMatch[1] : '';
  const hasHalloweenCardHover = /139,\s*92,\s*246/i.test(cardHoverRule) && /255,\s*122,\s*0/i.test(cardHoverRule);
  record('.product-card:hover features dual purple & orange ambient glow', hasHalloweenCardHover);

  // ============================================================================
  // SECTION 3: WCAG CONTRAST & ACCESSIBILITY AUDIT
  // ============================================================================
  console.log('\n--- SECTION 3: WCAG Contrast Calculations ---');

  // White text (#ffffff) on Halloween Orange (#ff7a00)
  const white = [255, 255, 255];
  const orange = hexToRgb('#ff7a00');
  const orangeDark = hexToRgb('#ea580c');
  const purpleDark = hexToRgb('#2a0845');

  const contrastWhiteOnOrange = getContrastRatio(white, orange);
  const contrastWhiteOnOrangeDark = getContrastRatio(white, orangeDark);
  const contrastWhiteOnPurpleDark = getContrastRatio(white, purpleDark);

  console.log(`  Contrast White on #ff7a00: ${contrastWhiteOnOrange.toFixed(2)}:1`);
  console.log(`  Contrast White on #ea580c: ${contrastWhiteOnOrangeDark.toFixed(2)}:1`);
  console.log(`  Contrast White on #2a0845 (topbar base): ${contrastWhiteOnPurpleDark.toFixed(2)}:1`);

  // WCAG AA requires 3.0:1 for large/bold text, 4.5:1 for normal text
  record(
    'Badge discount gradient end (#ea580c) meets WCAG AA contrast for bold text (>= 3.0:1)',
    contrastWhiteOnOrangeDark >= 3.0,
    `Ratio: ${contrastWhiteOnOrangeDark.toFixed(2)}:1`
  );
  record(
    'Topbar dark purple base (#2a0845) meets WCAG AAA contrast (>= 7.0:1)',
    contrastWhiteOnPurpleDark >= 7.0,
    `Ratio: ${contrastWhiteOnPurpleDark.toFixed(2)}:1`
  );

  // ============================================================================
  // SECTION 4: PARTICLES.JS ENGINE STATIC & RUNTIME INTEGRITY
  // ============================================================================
  console.log('\n--- SECTION 4: js/particles.js Syntax & Logic ---');
  const particlesJsPath = path.join(PROJECT_ROOT, 'js', 'particles.js');
  const particlesCode = fs.readFileSync(particlesJsPath, 'utf8');

  // Zero ES module keywords
  const hasEsImport = /^\s*import\s+/m.test(particlesCode);
  const hasEsExport = /^\s*export\s+/m.test(particlesCode);
  record('js/particles.js has NO ES module import statements', !hasEsImport);
  record('js/particles.js has NO ES module export statements', !hasEsExport);

  // Particle counts
  const leavesCountMatch = particlesCode.match(/(?:TOTAL_LEAVES|MAX_LEAVES)\s*=\s*(\d+)/);
  const embersCountMatch = particlesCode.match(/(?:TOTAL_EMBERS|MAX_EMBERS)\s*=\s*(\d+)/);
  const leavesCount = leavesCountMatch ? parseInt(leavesCountMatch[1], 10) : 0;
  const embersCount = embersCountMatch ? parseInt(embersCountMatch[1], 10) : 0;
  const totalBudget = leavesCount + embersCount;

  record(`Particle budget is between 25 and 35 (found ${leavesCount} leaves + ${embersCount} embers = ${totalBudget})`,
    totalBudget >= 25 && totalBudget <= 35
  );

  // VisibilityChange and matchMedia presence
  record('js/particles.js contains visibilitychange event listener', /visibilitychange/i.test(particlesCode));
  record('js/particles.js contains matchMedia prefers-reduced-motion listener', /prefers-reduced-motion/i.test(particlesCode));

  // ============================================================================
  // SECTION 5: DYNAMIC RUNTIME SIMULATION ON ALL 6 PAGES
  // ============================================================================
  console.log('\n--- SECTION 5: Dynamic Runtime Simulation Across All 6 Pages ---');
  const { createTestEnv } = require('./harness.js');

  for (const filename of HTML_FILES) {
    const rawHtml = fs.readFileSync(path.join(PROJECT_ROOT, filename), 'utf8');

    // Create sandbox environment simulating loading this HTML file
    const env = createTestEnv({
      scripts: ['particles.js'],
      prepopulateHtml: rawHtml
    });

    const particlesApi = env.window.DiployParticles;
    record(`${filename} runtime: DiployParticles global API is exposed`, !!particlesApi);

    if (particlesApi) {
      const count = particlesApi.getParticleCount();
      record(`${filename} runtime: generates exactly 30 particles (got ${count})`, count === 30);

      const isRunning = particlesApi.isRunning();
      record(`${filename} runtime: animation loop is running initially`, isRunning === true);

      // Verify RAF stepping
      const steps = env.stepAnimation();
      record(`${filename} runtime: stepAnimation executes RAF callback`, steps > 0);

      // Test visibilitychange (hide)
      env.document.hidden = true;
      env.document.dispatchEvent({ type: 'visibilitychange' });
      record(`${filename} runtime: pauses when document.hidden === true`, particlesApi.isRunning() === false);

      // Test visibilitychange (show)
      env.document.hidden = false;
      env.document.dispatchEvent({ type: 'visibilitychange' });
      record(`${filename} runtime: resumes when document.hidden === false`, particlesApi.isRunning() === true);

      // Test prefers-reduced-motion
      env.triggerMediaChange(true);
      record(`${filename} runtime: halts when prefers-reduced-motion is triggered`, particlesApi.isRunning() === false);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`AUDIT RESULTS: ${results.passed} passed, ${results.failed} failed out of ${results.checks.length} checks`);
  console.log('='.repeat(80));

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmpiricalAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
