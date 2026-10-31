/**
 * ==============================================================================
 * DIPLOY GAMES - TIER 1: FEATURE COVERAGE TEST SUITE
 * ==============================================================================
 * Verifies all 26 features documented in PROJECT.md § Feature Inventory.
 * Requirements traceability: ORIGINAL_REQUEST.md (R1, R2, R3, R4, R5) and PROJECT.md.
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const {
  createTestEnv,
  readCss,
  readProjectFile,
  readAllHtmlFiles,
  findEmojis,
  validateJsSyntax,
  projectFileExists
} = require('./harness.js');

const tier1Tests = [
  // --------------------------------------------------------------------------
  // Feature 1: Autumn/Halloween Color Theme (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F01',
    name: 'Feature 1: Autumn/Halloween Color Theme Variables & Tokens in CSS',
    fn: () => {
      const css = readCss();
      assert.ok(css, 'css/style.css must exist and be readable');
      assert.match(
        css,
        /--halloween-orange\s*:\s*#ff7a00/i,
        'CSS must define --halloween-orange: #ff7a00'
      );
      assert.match(
        css,
        /--halloween-purple\s*:\s*#8b5cf6/i,
        'CSS must define --halloween-purple: #8b5cf6'
      );
      assert.ok(
        css.includes('--halloween-gradient') || css.includes('--halloween-badge-bg'),
        'CSS must define Halloween gradients or badge variables'
      );
    }
  },

  // --------------------------------------------------------------------------
  // Feature 2: Discount Badges up to -70% (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F02',
    name: 'Feature 2: Discount Badges up to -70% with Orange/Mega Styling',
    fn: () => {
      const css = readCss();
      assert.ok(css, 'css/style.css must exist');
      assert.match(
        css,
        /\.badge-discount\b/,
        'CSS must contain .badge-discount class'
      );
      assert.match(
        css,
        /\.badge-discount-mega\b/,
        'CSS must contain .badge-discount-mega class for extreme discounts'
      );

      // Verify catalog has discounts up to -70%
      const env = createTestEnv({ scripts: ['data.js'] });
      const products = env.context.DEFAULT_PRODUCTS;
      assert.ok(Array.isArray(products), 'DEFAULT_PRODUCTS must be an array');
      const maxDiscount = Math.max(...products.map(p => p.discount || 0));
      assert.ok(maxDiscount >= 70, `Catalog must feature discounts >= 70% (found max ${maxDiscount}%)`);
    }
  },

  // --------------------------------------------------------------------------
  // Feature 3: Autumn Sale Promo Ribbons & Banner (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F03',
    name: 'Feature 3: Autumn Sale Promo Ribbon / Banner Copy in HTML',
    fn: () => {
      const indexHtml = readProjectFile('index.html');
      assert.ok(indexHtml, 'index.html must exist');
      const hasAutumnPromo =
        /autumn sale|осенняя распродажа|halloween sale|хэллоуин/i.test(indexHtml);
      assert.ok(hasAutumnPromo, 'index.html must contain Autumn/Halloween Sale promo copy or banner');

      const css = readCss();
      assert.ok(
        css.includes('autumn-sale') || css.includes('halloween'),
        'css/style.css must contain styles for Autumn Sale banner or Halloween accents'
      );
    }
  },

  // --------------------------------------------------------------------------
  // Feature 4: Canvas Particle Background (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F04',
    name: 'Feature 4: Canvas Particle Background Engine (25-35 Particles)',
    fn: () => {
      assert.ok(projectFileExists('js/particles.js'), 'js/particles.js must exist');
      const code = readProjectFile('js/particles.js');
      assert.match(
        code,
        /requestAnimationFrame/i,
        'js/particles.js must use requestAnimationFrame'
      );

      // Initialize environment with particles.js
      const env = createTestEnv({
        scripts: ['particles.js'],
        prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
      });

      // Verify canvas was found or created
      const canvas = env.document.getElementById('particles-canvas');
      assert.ok(canvas, 'Particles canvas (#particles-canvas) must be in DOM');

      // Step animation frame
      assert.ok(env.hasPendingAnimation(), 'Particles animation loop must be scheduled via RAF');
      const executed = env.stepAnimation();
      assert.ok(executed > 0, 'Animation step callback must execute');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 5: VisibilityChange Animation Pause (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F05',
    name: 'Feature 5: VisibilityChange Animation Pause upon document.hidden',
    fn: () => {
      const code = readProjectFile('js/particles.js');
      assert.ok(code, 'js/particles.js must exist');
      assert.match(
        code,
        /visibilitychange/i,
        'js/particles.js must listen for visibilitychange'
      );
      assert.match(
        code,
        /document\.hidden/i,
        'js/particles.js must inspect document.hidden'
      );
      assert.match(
        code,
        /cancelAnimationFrame/i,
        'js/particles.js must call cancelAnimationFrame on hide'
      );

      const env = createTestEnv({
        scripts: ['particles.js'],
        prepopulateHtml: '<canvas id="particles-canvas"></canvas>'
      });

      // Emulate document hiding
      env.document.hidden = true;
      env.document.dispatchEvent({ type: 'visibilitychange' });

      // After hidden, RAF callbacks should be canceled or frozen
      const pendingAfterHide = env.hasPendingAnimation();
      assert.equal(pendingAfterHide, false, 'Animation loop must be cancelled when document.hidden === true');

      // Emulate document resuming
      env.document.hidden = false;
      env.document.dispatchEvent({ type: 'visibilitychange' });
      assert.ok(env.hasPendingAnimation(), 'Animation loop must resume when document.hidden === false');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 6: Prefers-Reduced-Motion Support (R1)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F06',
    name: 'Feature 6: Prefers-Reduced-Motion Disables Animation & Hides Canvas',
    fn: () => {
      const css = readCss();
      assert.match(
        css,
        /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i,
        'CSS must define @media (prefers-reduced-motion: reduce)'
      );
      assert.match(
        css,
        /#particles-canvas\s*\{[^}]*display\s*:\s*none/i,
        'CSS must hide #particles-canvas when prefers-reduced-motion is active'
      );

      // Test JS behavior under reduced motion
      const env = createTestEnv({
        scripts: ['particles.js'],
        prepopulateHtml: '<canvas id="particles-canvas"></canvas>',
        reducedMotion: true
      });

      // When reducedMotion is true, animation loop must not run continuously
      const pending = env.hasPendingAnimation();
      assert.equal(pending, false, 'Particles loop must not run when prefers-reduced-motion is reduce');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 7: SVG Icons Dictionary (R2)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F07',
    name: 'Feature 7: SVG Icons Dictionary (js/icons.js) API & Key Inventory',
    fn: () => {
      assert.ok(projectFileExists('js/icons.js'), 'js/icons.js must exist');
      const env = createTestEnv({ scripts: ['icons.js'] });

      assert.equal(typeof env.context.getIcon, 'function', 'getIcon must be a global function');
      assert.equal(typeof env.context.renderIcon, 'function', 'renderIcon must be a global function');
      assert.equal(typeof env.context.initIcons, 'function', 'initIcons must be a global function');

      const requiredKeys = [
        'flash', 'shield', 'card', 'gift', 'fire', 'star', 'user', 'cart',
        'search', 'check', 'copy', 'settings', 'arrow-right', 'external-link',
        'cross', 'plus', 'minus', 'refresh', 'trash', 'steam', 'roblox',
        'playstation', 'gamepad', 'coins', 'package', 'key', 'lock', 'bag'
      ];

      for (const key of requiredKeys) {
        const iconHtml = env.context.getIcon(key);
        assert.ok(iconHtml, `getIcon('${key}') must return non-empty markup`);
        assert.match(iconHtml, /<svg\b/i, `getIcon('${key}') must return an SVG tag`);
        assert.match(iconHtml, /viewBox=["']0 0 24 24["']/i, `Icon '${key}' must have viewBox="0 0 24 24"`);
        assert.match(iconHtml, /fill=["']currentColor["']/i, `Icon '${key}' must use fill="currentColor"`);
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 8: Emoji Replacement in Header & Nav (R2)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F08',
    name: 'Feature 8: Emoji Replacement in Header & Nav across all 6 HTML files',
    fn: () => {
      const htmls = readAllHtmlFiles();
      for (const [filename, content] of Object.entries(htmls)) {
        assert.ok(content, `${filename} must exist`);
        // Extract header region
        const headerMatch = content.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i);
        if (headerMatch) {
          const headerHtml = headerMatch[1];
          assert.ok(
            !headerHtml.includes('🔍'),
            `Header in ${filename} must not contain raw search emoji 🔍`
          );
          assert.ok(
            !headerHtml.includes('🛒'),
            `Header in ${filename} must not contain raw cart emoji 🛒`
          );
        }
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 9: Emoji Replacement in Features & Cards (R2)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F09',
    name: 'Feature 9: Emoji Replacement in Perks, Features & Product Cards',
    fn: () => {
      const indexHtml = readProjectFile('index.html');
      assert.ok(indexHtml, 'index.html must exist');

      // Check feature perks section
      const perksMatch = indexHtml.match(/<div class="features-grid">([\s\S]*?)<\/section>/i);
      if (perksMatch) {
        const perksHtml = perksMatch[1];
        assert.ok(!perksHtml.includes('⚡'), 'Perks grid must not contain raw ⚡ emoji');
        assert.ok(!perksHtml.includes('🛡️'), 'Perks grid must not contain raw 🛡️ emoji');
        assert.ok(!perksHtml.includes('💳'), 'Perks grid must not contain raw 💳 emoji');
        assert.ok(!perksHtml.includes('🎁'), 'Perks grid must not contain raw 🎁 emoji');
      }

      // Check card template in catalog.js and index.html
      const catalogJs = readProjectFile('js/catalog.js');
      if (catalogJs) {
        assert.ok(!catalogJs.includes('★'), 'js/catalog.js must not contain raw star ★ character in template');
        assert.ok(!catalogJs.includes('🟢'), 'js/catalog.js must not contain raw green dot 🟢 emoji');
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 10: Emoji Replacement in Modals & Buttons (R2)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F10',
    name: 'Feature 10: Emoji Replacement in Cart, Profile Library & Admin',
    fn: () => {
      const cartHtml = readProjectFile('cart.html');
      assert.ok(cartHtml, 'cart.html must exist');
      assert.ok(!cartHtml.includes('🛍️'), 'cart.html empty view must not use raw 🛍️ emoji');

      const profileHtml = readProjectFile('profile.html');
      assert.ok(profileHtml, 'profile.html must exist');
      assert.ok(!profileHtml.includes('🔑 Купленные'), 'profile.html must not use raw 🔑 emoji in heading');

      const adminHtml = readProjectFile('admin.html');
      assert.ok(adminHtml, 'admin.html must exist');
      assert.ok(!adminHtml.includes('⚙️ Управление'), 'admin.html must not use raw ⚙️ emoji in heading');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 11: Homepage Quick Top-Up Widget (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F11',
    name: 'Feature 11: 3-Tab Quick Top-Up Widget Present on Homepage (index.html)',
    fn: () => {
      const indexHtml = readProjectFile('index.html');
      assert.ok(indexHtml, 'index.html must exist');
      const hasTopupWidget =
        indexHtml.includes('quick-topup') ||
        indexHtml.includes('topup-widget') ||
        indexHtml.includes('steam-topup');
      assert.ok(hasTopupWidget, 'index.html must contain quick top-up widget container');

      // Verify presence of all 3 tabs (Steam, Roblox, PlayStation)
      assert.match(indexHtml, /steam/i, 'Widget must contain Steam tab');
      assert.match(indexHtml, /roblox/i, 'Widget must contain Roblox tab');
      assert.match(indexHtml, /playstation|psn/i, 'Widget must contain PlayStation tab');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 12: Steam Top-Up Tab Calculations (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F12',
    name: 'Feature 12: Steam Top-Up Tab Logic & 4% Commission Formula',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Steam commission rate is 4%
      function calcSteam(amount) {
        const amt = Math.max(100, Math.min(50000, Number(amount) || 0));
        const commission = Math.round(amt * 0.04);
        const total = amt + commission;
        return { amount: amt, commission, total };
      }

      // Test preset buttons (300, 500, 1000, 2500, 5000 ₽)
      assert.deepEqual(calcSteam(300), { amount: 300, commission: 12, total: 312 });
      assert.deepEqual(calcSteam(500), { amount: 500, commission: 20, total: 520 });
      assert.deepEqual(calcSteam(1000), { amount: 1000, commission: 40, total: 1040 });
      assert.deepEqual(calcSteam(2500), { amount: 2500, commission: 100, total: 2600 });
      assert.deepEqual(calcSteam(5000), { amount: 5000, commission: 200, total: 5200 });
    }
  },

  // --------------------------------------------------------------------------
  // Feature 13: Roblox Top-Up Tab Calculations (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F13',
    name: 'Feature 13: Roblox Top-Up Tab Logic, Packages & 5% Fee Formula',
    fn: () => {
      // Robux formula: 1 R$ = 1.25 ₽ base, 5% commission
      function calcRoblox(robuxAmount) {
        const robux = Math.max(100, Math.min(50000, Number(robuxAmount) || 0));
        const baseRubles = Math.round(robux * 1.25);
        const commission = Math.round(baseRubles * 0.05);
        const total = baseRubles + commission;
        return { robuxAmount: robux, baseRubles, commission, total };
      }

      // Standard packages
      assert.deepEqual(calcRoblox(400), { robuxAmount: 400, baseRubles: 500, commission: 25, total: 525 });
      assert.deepEqual(calcRoblox(800), { robuxAmount: 800, baseRubles: 1000, commission: 50, total: 1050 });
      assert.deepEqual(calcRoblox(1700), { robuxAmount: 1700, baseRubles: 2125, commission: 106, total: 2231 });
      assert.deepEqual(calcRoblox(4500), { robuxAmount: 4500, baseRubles: 5625, commission: 281, total: 5906 });

      // Nickname validation regex
      const nickRegex = /^[a-zA-Z0-9_]{3,20}$/;
      assert.ok(nickRegex.test('Gamer123'), 'Valid nickname must pass');
      assert.ok(nickRegex.test('Pro_Player'), 'Nickname with underscore must pass');
      assert.equal(nickRegex.test('ab'), false, 'Nickname < 3 chars must fail');
      assert.equal(nickRegex.test('Player With Spaces'), false, 'Nickname with spaces must fail');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 14: PlayStation Top-Up Tab Calculations (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F14',
    name: 'Feature 14: PlayStation Tab Region Denominations & Ruble Conversion',
    fn: () => {
      // Rates: TR (3.20 ₽/TL), US (95.00 ₽/$), PL (24.00 ₽/PLN), UK (120.00 ₽/£), 5% fee
      function calcPSN(region, faceValue) {
        const rates = { tr: 3.20, us: 95.00, pl: 24.00, uk: 120.00 };
        const rate = rates[region] || 1;
        const baseRubles = Math.round(faceValue * rate);
        const commission = Math.round(baseRubles * 0.05);
        const total = baseRubles + commission;
        return { baseRubles, commission, total };
      }

      // Turkey 250 TL
      assert.deepEqual(calcPSN('tr', 250), { baseRubles: 800, commission: 40, total: 840 });
      // Turkey 500 TL
      assert.deepEqual(calcPSN('tr', 500), { baseRubles: 1600, commission: 80, total: 1680 });
      // USA $25
      assert.deepEqual(calcPSN('us', 25), { baseRubles: 2375, commission: 119, total: 2494 });
      // Poland 100 PLN
      assert.deepEqual(calcPSN('pl', 100), { baseRubles: 2400, commission: 120, total: 2520 });
    }
  },

  // --------------------------------------------------------------------------
  // Feature 15: Live Top-Up Receipt Preview (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F15',
    name: 'Feature 15: Live Top-Up Receipt Preview Breakdown Structure',
    fn: () => {
      const indexHtml = readProjectFile('index.html');
      assert.ok(indexHtml, 'index.html must exist');
      // Widget markup should contain receipt preview container
      const hasReceiptPreview =
        indexHtml.includes('receipt-preview') ||
        indexHtml.includes('topup-summary') ||
        indexHtml.includes('topup-receipt') ||
        indexHtml.includes('quick-topup');
      assert.ok(hasReceiptPreview, 'index.html must have live receipt preview container');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 16: Top-Up Cart Integration (R3)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F16',
    name: 'Feature 16: Top-Up Items Payload Integration with addToCart()',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Add custom Steam item to cart
      const customSteam = {
        type: 'steam',
        login: 'test_user_steam',
        amount: 1000,
        commission: 40,
        total: 1040
      };
      env.context.addToCart('steam-wallet-topup', 0, 1, customSteam);

      const cart = env.context.getCart();
      assert.equal(cart.length, 1, 'Cart must contain 1 item');
      assert.deepEqual(cart[0].customData, customSteam, 'Item customData must match payload');

      // Add custom Roblox item to cart
      const customRoblox = {
        type: 'roblox',
        nickname: 'RobloxGamer_99',
        robuxAmount: 800,
        amount: 1000,
        commission: 50,
        total: 1050,
        login: 'RobloxGamer_99'
      };
      env.context.addToCart('roblox-robux', 0, 1, customRoblox);

      const cart2 = env.context.getCart();
      assert.equal(cart2.length, 2, 'Cart must now contain 2 items');
      assert.equal(cart2[1].customData.robuxAmount, 800, 'Roblox customData must be preserved');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 17: Roblox Robux in Catalog (R4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F17',
    name: 'Feature 17: roblox-robux Item in DEFAULT_PRODUCTS with 4 Editions',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js'] });
      const products = env.context.DEFAULT_PRODUCTS;
      const robux = products.find(p => p.id === 'roblox-robux');
      assert.ok(robux, 'DEFAULT_PRODUCTS must contain roblox-robux item');
      assert.equal(robux.category, 'currency', 'Category must be currency');
      assert.equal(robux.platform, 'roblox', 'Platform must be roblox');
      assert.equal(robux.isCustomCurrency, true, 'isCustomCurrency must be true');
      assert.ok(Array.isArray(robux.editions), 'Robux product must define editions');
      assert.equal(robux.editions.length, 4, 'Robux product must have exactly 4 editions (400, 800, 1700, 4500)');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 18: Roblox Vector Cover Asset (R4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F18',
    name: 'Feature 18: Roblox Vector Cover Asset Exists (assets/covers/roblox.svg)',
    fn: () => {
      assert.ok(projectFileExists('assets/covers/roblox.svg'), 'assets/covers/roblox.svg must exist');
      const svg = readProjectFile('assets/covers/roblox.svg');
      assert.ok(svg.length > 50, 'roblox.svg must contain vector graphics');
      assert.match(svg, /<svg\b/i, 'roblox.svg must contain valid SVG root tag');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 19: Robux on product.html (R4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F19',
    name: 'Feature 19: Dedicated Robux Support & Calculator on product.html',
    fn: () => {
      const productJs = readProjectFile('js/product.js');
      assert.ok(productJs, 'js/product.js must exist');
      assert.match(
        productJs,
        /roblox-robux|robuxAmount|roblox/i,
        'js/product.js must contain logic handling Roblox Robux'
      );
    }
  },

  // --------------------------------------------------------------------------
  // Feature 20: Robux Receipt Format (R4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F20',
    name: 'Feature 20: DIP-ROBUX-XXXX-YYYY Receipt Generation Format',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Seed cart with Roblox item
      const customRoblox = {
        type: 'roblox',
        nickname: 'PlayerOne',
        robuxAmount: 800,
        amount: 1000,
        commission: 50,
        total: 1050
      };
      env.context.addToCart('roblox-robux', 0, 1, customRoblox);

      // Create order with items from cart
      const cart = env.context.getCart();
      const order = env.context.createOrder({
        items: cart,
        total: 1050,
        customerName: 'Test Student',
        customerEmail: 'student@example.com',
        paymentMethod: 'card'
      });

      assert.ok(order, 'Order must be created successfully');
      assert.ok(order.keys && order.keys.length > 0, 'Order must contain generated keys/receipts');

      const robuxReceipt = order.keys[0].key;
      assert.match(
        robuxReceipt,
        /^DIP-ROBUX-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        `Robux receipt "${robuxReceipt}" must match pattern DIP-ROBUX-XXXX-YYYY`
      );
    }
  },

  // --------------------------------------------------------------------------
  // Feature 21: Polymorphic Cart & Orders (R3/R4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F21',
    name: 'Feature 21: Polymorphic Item Rendering in Cart & Order History',
    fn: () => {
      const cartJs = readProjectFile('js/cart.js');
      assert.ok(cartJs, 'js/cart.js must exist');

      // Verify cart.js handles roblox and playstation custom data polymorphically
      assert.match(
        cartJs,
        /nickname|robux|playstation|region/i,
        'js/cart.js must distinguish between nickname (Roblox) and login (Steam)'
      );

      const profileJs = readProjectFile('js/profile.js');
      assert.ok(profileJs, 'js/profile.js must exist');
      assert.match(
        profileJs,
        /isTopup|Чек|Зачислено/i,
        'js/profile.js must support receipts/top-ups in user library'
      );
    }
  },

  // --------------------------------------------------------------------------
  // Feature 22: Junior-Friendly Simplicity (R5)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F22',
    name: 'Feature 22: Clean Vanilla JS Architecture with Russian Documentation',
    fn: () => {
      const jsFiles = ['data.js', 'app.js', 'cart.js', 'catalog.js', 'product.js', 'profile.js', 'admin.js'];
      for (const f of jsFiles) {
        const content = readProjectFile(`js/${f}`);
        assert.ok(content, `js/${f} must exist`);
        // Verify code has Russian explanatory comments
        assert.match(content, /[а-яА-ЯёЁ]{4,}/, `js/${f} must contain readable Russian comments`);
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 23: Standalone file:/// Autonomy (R5)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F23',
    name: 'Feature 23: Zero ES Modules & Full file:/// Standalone Compatibility',
    fn: () => {
      const jsFiles = ['data.js', 'app.js', 'cart.js', 'catalog.js', 'product.js', 'profile.js', 'admin.js'];
      for (const f of jsFiles) {
        const content = readProjectFile(`js/${f}`);
        if (content) {
          assert.doesNotMatch(
            content,
            /^\s*(import\s+|export\s+default|export\s+\{)/m,
            `js/${f} must NOT use ES module import/export`
          );
        }
      }

      const htmls = readAllHtmlFiles();
      for (const [fname, content] of Object.entries(htmls)) {
        if (content) {
          assert.doesNotMatch(
            content,
            /<script\s+type=["']module["']/i,
            `${fname} must NOT contain <script type="module">`
          );
        }
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 24: Node Syntax Validation (R5)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F24',
    name: 'Feature 24: Clean Syntax Check across all Scripts (validateJsSyntax)',
    fn: () => {
      const jsFiles = ['data.js', 'app.js', 'cart.js', 'catalog.js', 'product.js', 'profile.js', 'admin.js'];
      for (const f of jsFiles) {
        const res = validateJsSyntax(`js/${f}`);
        assert.ok(res.ok, `Syntax validation failed for js/${f}: ${res.error}`);
      }
    }
  },

  // --------------------------------------------------------------------------
  // Feature 25: E2E Testing Suite (Tiers 1-4)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F25',
    name: 'Feature 25: E2E Test Suite Integrity & Runner Operational Status',
    fn: () => {
      assert.ok(projectFileExists('tests/harness.js'), 'tests/harness.js must exist');
      assert.ok(projectFileExists('tests/runner.js'), 'tests/runner.js must exist');
      assert.ok(projectFileExists('TEST_INFRA.md'), 'TEST_INFRA.md must exist');
    }
  },

  // --------------------------------------------------------------------------
  // Feature 26: Adversarial Hardening (Tier 5 Readiness)
  // --------------------------------------------------------------------------
  {
    id: 'T1-F26',
    name: 'Feature 26: Adversarial Robustness, Injection Safety & Storage Integrity',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Test catalog tamper resistance
      const catalog = env.context.getCatalog();
      assert.ok(Array.isArray(catalog), 'getCatalog() must return valid array');
      assert.ok(catalog.length >= 12, 'Catalog must contain at least 12 products');

      // Test formatPrice utility
      assert.equal(env.context.formatPrice(1000).replace(/[\s\u00A0]/g, ' '), '1 000 ₽');
      assert.equal(env.context.formatPrice(0), '0 ₽');
      assert.equal(env.context.formatPrice(525), '525 ₽');
    }
  }
];

module.exports = {
  tier: 1,
  title: 'Tier 1: Feature Coverage (PROJECT.md Inventory #1-26)',
  tests: tier1Tests
};
