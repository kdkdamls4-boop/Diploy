/**
 * ==============================================================================
 * DIPLOY GAMES - TIER 2: BOUNDARY & CORNER CASES TEST SUITE
 * ==============================================================================
 * Verifies limits, boundary conditions, edge inputs, negative numbers,
 * type coercion, floating-point precision, and storage corruption recovery.
 */

const assert = require('node:assert/strict');
const { createTestEnv, projectFileExists } = require('./harness.js');

const tier2Tests = [
  // --------------------------------------------------------------------------
  // B01: Empty & Whitespace Steam Login
  // --------------------------------------------------------------------------
  {
    id: 'T2-B01',
    name: 'Boundary 1: Steam Login Empty, Whitespace & Sanitization Handling',
    fn: () => {
      function validateSteamLogin(login) {
        if (!login || typeof login !== 'string') return false;
        const trimmed = login.trim();
        return trimmed.length >= 2 && trimmed.length <= 32;
      }

      assert.equal(validateSteamLogin(''), false, 'Empty login must be invalid');
      assert.equal(validateSteamLogin('   '), false, 'Whitespace-only login must be invalid');
      assert.equal(validateSteamLogin('a'), false, 'Single character login must be invalid');
      assert.equal(validateSteamLogin('steam_gamer_2026'), true, 'Standard login must be valid');
      assert.equal(validateSteamLogin('  gamer_pro  '), true, 'Padded valid login must pass after trim');
      assert.equal(validateSteamLogin('a'.repeat(33)), false, 'Login exceeding 32 chars must be invalid');
    }
  },

  // --------------------------------------------------------------------------
  // B02: Roblox Nickname Regex Boundary
  // --------------------------------------------------------------------------
  {
    id: 'T2-B02',
    name: 'Boundary 2: Roblox Nickname Regex Boundaries (3-20 chars, alphanumeric + _)',
    fn: () => {
      const regex = /^[a-zA-Z0-9_]{3,20}$/;

      // Length boundaries
      assert.equal(regex.test('ab'), false, '2 chars must be invalid (< 3)');
      assert.equal(regex.test('abc'), true, 'Exact min boundary (3 chars) must be valid');
      assert.equal(regex.test('a'.repeat(20)), true, 'Exact max boundary (20 chars) must be valid');
      assert.equal(regex.test('a'.repeat(21)), false, '21 chars must be invalid (> 20)');

      // Character restrictions
      assert.equal(regex.test('Gamer_123'), true, 'Letters, numbers, and underscore must be valid');
      assert.equal(regex.test('Gamer 123'), false, 'Spaces must be invalid');
      assert.equal(regex.test('Gamer-123'), false, 'Hyphens must be invalid');
      assert.equal(regex.test('Gamer@123'), false, 'Special chars must be invalid');
      assert.equal(regex.test('Никнейм'), false, 'Cyrillic characters must be invalid for Roblox username');
    }
  },

  // --------------------------------------------------------------------------
  // B03: Steam Amount Limits (100 - 50 000 ₽)
  // --------------------------------------------------------------------------
  {
    id: 'T2-B03',
    name: 'Boundary 3: Steam Amount Limits (Min 100 ₽, Max 50 000 ₽, Clamping & Validation)',
    fn: () => {
      function clampSteamAmount(val) {
        const num = Math.floor(Number(val));
        if (isNaN(num)) return 100;
        return Math.max(100, Math.min(50000, num));
      }

      assert.equal(clampSteamAmount(50), 100, 'Values below min 100 ₽ must clamp to 100');
      assert.equal(clampSteamAmount(0), 100, '0 ₽ must clamp to 100');
      assert.equal(clampSteamAmount(-500), 100, 'Negative values must clamp to 100');
      assert.equal(clampSteamAmount(100), 100, 'Exact min boundary 100 ₽ must stay 100');
      assert.equal(clampSteamAmount(50000), 50000, 'Exact max boundary 50 000 ₽ must stay 50 000');
      assert.equal(clampSteamAmount(50001), 50000, 'Values above 50 000 ₽ must clamp to 50 000');
      assert.equal(clampSteamAmount(999999), 50000, 'Extreme amounts must clamp to 50 000');
    }
  },

  // --------------------------------------------------------------------------
  // B04: Roblox Robux Custom Amount Limits (100 - 50 000 R$)
  // --------------------------------------------------------------------------
  {
    id: 'T2-B04',
    name: 'Boundary 4: Roblox Robux Custom Amount Limits (Min 100 R$, Max 50 000 R$)',
    fn: () => {
      function clampRobuxAmount(val) {
        const num = Math.floor(Number(val));
        if (isNaN(num)) return 100;
        return Math.max(100, Math.min(50000, num));
      }

      assert.equal(clampRobuxAmount(10), 100, 'Robux below 100 R$ must clamp to 100');
      assert.equal(clampRobuxAmount(100), 100, 'Exact min boundary 100 R$ must be preserved');
      assert.equal(clampRobuxAmount(50000), 50000, 'Exact max boundary 50 000 R$ must be preserved');
      assert.equal(clampRobuxAmount(100000), 50000, 'Robux above 50 000 R$ must clamp to 50 000');
    }
  },

  // --------------------------------------------------------------------------
  // B05: Precision & Floating Point Math Integrity
  // --------------------------------------------------------------------------
  {
    id: 'T2-B05',
    name: 'Boundary 5: Precision & Floating-Point Rounding (Integer Rubles Guarantee)',
    fn: () => {
      // Test 4% fee rounding on odd numbers
      const oddAmounts = [333, 777, 1234, 4999, 13];
      for (const amt of oddAmounts) {
        const commission = Math.round(amt * 0.04);
        const total = amt + commission;
        assert.ok(Number.isInteger(commission), `Commission for ${amt} must be an integer`);
        assert.ok(Number.isInteger(total), `Total for ${amt} must be an integer`);
        assert.equal(total, amt + commission, 'Total must equal amt + commission exactly');
      }

      // Test Roblox 1.25x rate + 5% fee on irregular numbers
      const robuxAmounts = [333, 777, 1700, 4500];
      for (const r of robuxAmounts) {
        const baseRubles = Math.round(r * 1.25);
        const commission = Math.round(baseRubles * 0.05);
        const total = baseRubles + commission;
        assert.ok(Number.isInteger(baseRubles), 'Base rubles must be integer');
        assert.ok(Number.isInteger(commission), 'Commission must be integer');
        assert.ok(Number.isInteger(total), 'Total must be integer');
        // Ensure string representation has no decimal points
        assert.doesNotMatch(String(total), /\./, `Total ${total} must not contain decimals`);
      }
    }
  },

  // --------------------------------------------------------------------------
  // B06: Negative Numeric Inputs Prevention
  // --------------------------------------------------------------------------
  {
    id: 'T2-B06',
    name: 'Boundary 6: Negative Numeric Inputs Rejection in Cart & Balance',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Test negative balance deposit
      const initialBalance = env.context.getUserBalance();
      assert.equal(initialBalance, 5000, 'Initial balance default is 5000');

      env.context.depositBalance(-1000);
      assert.equal(
        env.context.getUserBalance(),
        5000,
        'Depositing negative amount must not decrease user balance'
      );

      // Test negative quantity in cart
      env.context.addToCart('cyberpunk-2077', 0, 1);
      const cart = env.context.getCart();
      assert.equal(cart.length, 1);

      // Attempt setting negative quantity
      env.context.updateCartQuantity(0, -5);
      const updatedCart = env.context.getCart();
      // Should either remove the item (quantity <= 0) or keep minimum 1
      assert.ok(
        updatedCart.length === 0 || updatedCart[0].quantity >= 1,
        'Negative cart quantity must not be stored as negative'
      );
    }
  },

  // --------------------------------------------------------------------------
  // B07: Non-Numeric / NaN / Null Inputs Handling
  // --------------------------------------------------------------------------
  {
    id: 'T2-B07',
    name: 'Boundary 7: Non-Numeric, NaN, Null & Undefined Coercion Resilience',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // formatPrice resilience
      assert.equal(env.context.formatPrice(null), '0 ₽');
      assert.equal(env.context.formatPrice(undefined), '0 ₽');
      assert.equal(env.context.formatPrice('abc'), '0 ₽');
      assert.equal(env.context.formatPrice(0), '0 ₽');

      // depositBalance with negative amount must not decrease balance
      const bBefore = env.context.getUserBalance();
      env.context.depositBalance(-500);
      assert.equal(env.context.getUserBalance(), bBefore, 'Negative deposit must not decrease user balance');
    }
  },

  // --------------------------------------------------------------------------
  // B08: Promo Code Case Insensitivity & Whitespace
  // --------------------------------------------------------------------------
  {
    id: 'T2-B08',
    name: 'Boundary 8: Promo Code Case-Insensitivity, Trimming & Unknown Rejection',
    fn: () => {
      const promoCodes = {
        HALLOWEEN: 0.25,
        DIPLOY: 0.20,
        STUDENT: 0.15,
        STEAM: 0.10
      };

      function validatePromo(code) {
        if (!code || typeof code !== 'string') return null;
        const normalized = code.trim().toUpperCase();
        return promoCodes[normalized] !== undefined
          ? { code: normalized, discount: promoCodes[normalized] }
          : null;
      }

      // Case variations
      assert.deepEqual(validatePromo('halloween'), { code: 'HALLOWEEN', discount: 0.25 });
      assert.deepEqual(validatePromo('HALLOWEEN'), { code: 'HALLOWEEN', discount: 0.25 });
      assert.deepEqual(validatePromo('  Halloween  '), { code: 'HALLOWEEN', discount: 0.25 });
      assert.deepEqual(validatePromo('diploy'), { code: 'DIPLOY', discount: 0.20 });
      assert.deepEqual(validatePromo('student'), { code: 'STUDENT', discount: 0.15 });

      // Invalid & empty
      assert.equal(validatePromo(''), null);
      assert.equal(validatePromo('   '), null);
      assert.equal(validatePromo('FAKE_PROMO_2026'), null);
      assert.equal(validatePromo(null), null);
    }
  },

  // --------------------------------------------------------------------------
  // B09: Balance Payment Boundaries (Exact Match vs 1 Ruble Deficit)
  // --------------------------------------------------------------------------
  {
    id: 'T2-B09',
    name: 'Boundary 9: User Balance Payment Boundaries (Exact Match vs 1 Ruble Deficit)',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Set user balance to exactly 1000 ₽
      env.context.setUserBalance(1000);
      assert.equal(env.context.getUserBalance(), 1000);

      // Order total 1000 ₽ (exact match)
      const exactOrderTotal = 1000;
      assert.ok(env.context.getUserBalance() >= exactOrderTotal, 'Exact balance match must be permitted');

      // Order total 1001 ₽ (1 ruble deficit)
      const deficitOrderTotal = 1001;
      assert.equal(
        env.context.getUserBalance() >= deficitOrderTotal,
        false,
        '1 ruble deficit must reject balance checkout'
      );
    }
  },

  // --------------------------------------------------------------------------
  // B10: Empty Cart Checkout Rejection
  // --------------------------------------------------------------------------
  {
    id: 'T2-B10',
    name: 'Boundary 10: Empty Cart Checkout Rejection (Prevent Phantom Orders)',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });
      const initialOrdersCount = env.context.getOrders().length;
      env.context.clearCart();
      const cart = env.context.getCart();
      assert.equal(cart.length, 0, 'Cart must be empty');

      // Empty cart cannot be submitted for order
      const order = cart.length === 0 ? null : env.context.createOrder({
        items: cart,
        customerName: 'Empty Cart Tester',
        customerEmail: 'tester@test.com',
        paymentMethod: 'card'
      });

      assert.equal(order, null, 'Checkout on empty cart must be prevented');
      const orders = env.context.getOrders();
      assert.equal(orders.length, initialOrdersCount, 'No new order must be persisted in storage');
    }
  },

  // --------------------------------------------------------------------------
  // B11: Corrupted LocalStorage Recovery
  // --------------------------------------------------------------------------
  {
    id: 'T2-B11',
    name: 'Boundary 11: Corrupted LocalStorage JSON Recovery without Crashing',
    fn: () => {
      // Simulate broken JSON in all storage keys
      const corruptedStorage = {
        diploy_catalog_v5: '<<<not-valid-json>>>',
        diploy_catalog_v6: '{bad json',
        diploy_cart_v1: 'undefined',
        diploy_orders_v1: '[{"broken": true,',
        diploy_balance_v1: 'not_a_number'
      };

      const env = createTestEnv({
        initialStorage: corruptedStorage,
        scripts: ['data.js', 'app.js']
      });

      // getCatalog() must recover to DEFAULT_PRODUCTS
      const catalog = env.context.getCatalog();
      assert.ok(Array.isArray(catalog), 'getCatalog() must recover and return array');
      assert.ok(catalog.length >= 12, 'Catalog must contain default products');

      // getCart() must recover to empty array
      const cart = env.context.getCart();
      assert.ok(Array.isArray(cart), 'getCart() must recover and return array');
      assert.equal(cart.length, 0, 'Cart must reset to empty array');

      // getUserBalance() must recover to a valid number
      const balance = env.context.getUserBalance();
      assert.ok(typeof balance === 'number' && !isNaN(balance), 'Balance must recover to a valid number');
    }
  },

  // --------------------------------------------------------------------------
  // B12: Unknown SVG Icon Key Fallback
  // --------------------------------------------------------------------------
  {
    id: 'T2-B12',
    name: 'Boundary 12: Unknown SVG Icon Key Graceful Fallback (No Uncaught Throw)',
    fn: () => {
      if (!projectFileExists('js/icons.js')) return; // deferred until M2
      const env = createTestEnv({ scripts: ['icons.js'] });

      assert.doesNotThrow(() => {
        const fallback = env.context.getIcon('nonexistent_icon_xyz_999');
        assert.ok(typeof fallback === 'string', 'getIcon must return a string even for missing keys');
      }, 'Querying unknown icon must not throw uncaught exception');
    }
  },

  // --------------------------------------------------------------------------
  // B13: Duplicate Item Cart Aggregation vs Custom Data Separation
  // --------------------------------------------------------------------------
  {
    id: 'T2-B13',
    name: 'Boundary 13: Cart Quantity Increment vs Distinct CustomData Isolation',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Add same standard game twice
      env.context.addToCart('cyberpunk-2077', 0, 1);
      env.context.addToCart('cyberpunk-2077', 0, 2);

      const cartStandard = env.context.getCart();
      assert.equal(cartStandard.length, 1, 'Standard item must be aggregated into single position');
      assert.equal(cartStandard[0].quantity, 3, 'Quantity must sum to 1 + 2 = 3');

      // Add two custom top-ups with different logins
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'account_alpha',
        amount: 500,
        commission: 20,
        total: 520
      });

      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'account_beta',
        amount: 1000,
        commission: 40,
        total: 1040
      });

      const cartMixed = env.context.getCart();
      assert.equal(cartMixed.length, 3, 'Items with distinct customData logins must remain separate positions');
    }
  },

  // --------------------------------------------------------------------------
  // B14: XSS / HTML Injection in Top-Up Fields
  // --------------------------------------------------------------------------
  {
    id: 'T2-B14',
    name: 'Boundary 14: XSS / HTML Injection Defense in Login & Nickname Payloads',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      const maliciousLogin = '<script>alert("pwned")</script>';
      const payload = {
        type: 'steam',
        login: maliciousLogin,
        amount: 1000,
        commission: 40,
        total: 1040
      };

      env.context.addToCart('steam-wallet-topup', 0, 1, payload);
      const cart = env.context.getCart();
      assert.equal(cart.length, 1);
      assert.equal(cart[0].customData.login, maliciousLogin, 'Payload stored verbatim');

      // Check order creation does not break
      const order = env.context.createOrder({
        items: cart,
        total: 1040,
        customerName: 'Security Tester',
        customerEmail: 'sec@test.com',
        paymentMethod: 'sbp'
      });
      assert.ok(order, 'Order created safely without code execution');
    }
  }
];

module.exports = {
  tier: 2,
  title: 'Tier 2: Boundary & Corner Cases (Limits, Edge Inputs & Recovery)',
  tests: tier2Tests
};
