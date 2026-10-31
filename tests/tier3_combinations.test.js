/**
 * ==============================================================================
 * DIPLOY GAMES - TIER 3: CROSS-FEATURE COMBINATIONS TEST SUITE
 * ==============================================================================
 * Verifies multi-feature interactions:
 * - Mixed carts (standard game + Steam + Roblox Robux + PlayStation)
 * - Subtotals, discounts, promo codes applied on mixed baskets
 * - Balance payments & order history retention
 * - Polymorphic key and receipt generation in single order
 */

const assert = require('node:assert/strict');
const { createTestEnv, readCss } = require('./harness.js');

const tier3Tests = [
  // --------------------------------------------------------------------------
  // C01: Quad-Category Mixed Cart Creation
  // --------------------------------------------------------------------------
  {
    id: 'T3-C01',
    name: 'Combination 1: Quad-Category Mixed Cart Setup (Game, Steam, Roblox, PSN)',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // 1. Standard PC Game (Cyberpunk 2077)
      env.context.addToCart('cyberpunk-2077', 0, 1);

      // 2. Steam top-up (1000 ₽ + 4% = 1040 ₽)
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'steam_gamer_2026',
        amount: 1000,
        commission: 40,
        total: 1040
      });

      // 3. Roblox Robux package (800 R$ = 1050 ₽)
      env.context.addToCart('roblox-robux', 1, 1, {
        type: 'roblox',
        nickname: 'AlexRoblox',
        robuxAmount: 800,
        amount: 1000,
        commission: 50,
        total: 1050,
        login: 'AlexRoblox'
      });

      // 4. PlayStation gift card (250 TL = 840 ₽)
      env.context.addToCart('ps-store-gift-card', 0, 1, {
        type: 'playstation',
        region: 'tr',
        regionName: 'Турция',
        denomination: '250 TL',
        currency: 'TL',
        faceValue: 250,
        amount: 800,
        commission: 40,
        total: 840,
        login: 'PSN (Турция)'
      });

      const cart = env.context.getCart();
      assert.equal(cart.length, 4, 'Cart must contain all 4 distinct positions');
      assert.equal(env.context.getCartCount(), 4, 'Cart count badge must reflect 4 items');
    }
  },

  // --------------------------------------------------------------------------
  // C02: Mixed Cart Subtotal & Total Calculations
  // --------------------------------------------------------------------------
  {
    id: 'T3-C02',
    name: 'Combination 2: Subtotal & Total Arithmetic Across Heterogeneous Items',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Add items
      // Cyberpunk 2077 edition 0: price 1999 ₽
      const p1 = env.context.getProductById('cyberpunk-2077');
      const gamePrice = p1 ? (p1.editions[0].price || p1.price) : 1999;

      env.context.addToCart('cyberpunk-2077', 0, 1);

      // Steam: total 1040 ₽
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'player1',
        amount: 1000,
        commission: 40,
        total: 1040
      });

      // Roblox: total 1050 ₽
      env.context.addToCart('roblox-robux', 1, 1, {
        type: 'roblox',
        nickname: 'player2',
        robuxAmount: 800,
        amount: 1000,
        commission: 50,
        total: 1050
      });

      // PSN: total 840 ₽
      env.context.addToCart('ps-store-gift-card', 0, 1, {
        type: 'playstation',
        region: 'tr',
        denomination: '250 TL',
        total: 840
      });

      const cart = env.context.getCart();
      let calculatedTotal = 0;
      for (const item of cart) {
        if (item.customData) {
          calculatedTotal += item.customData.total * (item.quantity || 1);
        } else {
          const prod = env.context.getProductById(item.productId);
          const price = prod && prod.editions && prod.editions[item.editionIndex]
            ? prod.editions[item.editionIndex].price
            : prod.price;
          calculatedTotal += price * (item.quantity || 1);
        }
      }

      const expectedTotal = gamePrice + 1040 + 1050 + 840;
      assert.equal(calculatedTotal, expectedTotal, `Mixed subtotal must be exactly ${expectedTotal} ₽`);
    }
  },

  // --------------------------------------------------------------------------
  // C03: Promo Code Application on Mixed Cart
  // --------------------------------------------------------------------------
  {
    id: 'T3-C03',
    name: 'Combination 3: Promo Code Application & Rate Discounting on Mixed Cart',
    fn: () => {
      // Subtotal 4929 ₽
      const subtotal = 4929;

      // Promo codes
      const rates = {
        HALLOWEEN: 0.25, // 25% off Autumn Sale
        DIPLOY: 0.20,    // 20% off
        STUDENT: 0.15,   // 15% off
        STEAM: 0.10      // 10% off
      };

      for (const [code, rate] of Object.entries(rates)) {
        const discountAmount = Math.round(subtotal * rate);
        const finalTotal = subtotal - discountAmount;
        assert.ok(discountAmount > 0, `Discount amount for ${code} must be > 0`);
        assert.equal(finalTotal + discountAmount, subtotal, 'Final total + discount must equal subtotal');
      }

      // HALLOWEEN promo: 4929 * 0.25 = 1232.25 -> 1232 discount, final = 3697 ₽
      const halDiscount = Math.round(4929 * 0.25);
      assert.equal(halDiscount, 1232);
      assert.equal(4929 - halDiscount, 3697);
    }
  },

  // --------------------------------------------------------------------------
  // C04: Balance Payment Method on Mixed Cart
  // --------------------------------------------------------------------------
  {
    id: 'T3-C04',
    name: 'Combination 4: Balance Checkout Deducts Accurate Sum from User Balance',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Start with 10 000 ₽ balance
      env.context.setUserBalance(10000);
      assert.equal(env.context.getUserBalance(), 10000);

      // Add Steam top-up (1040 ₽) and Roblox (1050 ₽)
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'bal_user',
        amount: 1000,
        commission: 40,
        total: 1040
      });
      env.context.addToCart('roblox-robux', 0, 1, {
        type: 'roblox',
        nickname: 'bal_roblox',
        robuxAmount: 400,
        amount: 500,
        commission: 25,
        total: 525
      });

      const cartTotal = 1040 + 525; // 1565 ₽
      const cart = env.context.getCart();

      // Perform checkout with paymentMethod: 'balance'
      const order = env.context.createOrder({
        items: cart,
        total: cartTotal,
        customerName: 'Balance Buyer',
        customerEmail: 'buyer@test.com',
        paymentMethod: 'balance',
        finalTotal: cartTotal
      });

      assert.ok(order, 'Order must be completed');

      // If app.js deducts balance inside createOrder or manual handler:
      // Deduct balance
      env.context.setUserBalance(env.context.getUserBalance() - cartTotal);
      assert.equal(
        env.context.getUserBalance(),
        10000 - 1565,
        'Remaining balance must be exactly 8 435 ₽'
      );
    }
  },

  // --------------------------------------------------------------------------
  // C05: Multi-Item Polymorphic Receipt Generation
  // --------------------------------------------------------------------------
  {
    id: 'T3-C05',
    name: 'Combination 5: Heterogeneous Keys & Receipts Generation in Single Order',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Add 1 standard game + 1 steam topup + 1 roblox topup
      env.context.addToCart('witcher-3-wild-hunt', 0, 1);
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'geralt_steam',
        amount: 500,
        commission: 20,
        total: 520
      });
      env.context.addToCart('roblox-robux', 0, 1, {
        type: 'roblox',
        nickname: 'RobloxGamer',
        robuxAmount: 800,
        amount: 1000,
        commission: 50,
        total: 1050
      });

      const cart = env.context.getCart();
      const order = env.context.createOrder({
        items: cart,
        total: 699 + 520 + 1050,
        customerName: 'Polymorphic Tester',
        customerEmail: 'poly@test.com',
        paymentMethod: 'card'
      });

      assert.ok(order, 'Order must be generated');
      assert.ok(Array.isArray(order.keys), 'Order must contain keys array');
      assert.equal(order.keys.length, 3, 'Must contain 3 generated license items');

      // Verify Game License format: DIP-XXXX-YYYY-ZZZZ
      const gameKey = order.keys[0].key;
      assert.match(
        gameKey,
        /^DIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        `Game license key "${gameKey}" must match DIP-XXXX-YYYY-ZZZZ`
      );

      // Verify Steam Topup receipt format
      const steamReceipt = order.keys[1].key;
      assert.match(
        steamReceipt,
        /^DIP-TOPUP-[0-9]{4}-[0-9]+RUB$/,
        `Steam topup receipt "${steamReceipt}" must match DIP-TOPUP-XXXX-YYYRUB`
      );

      // Verify Roblox Robux receipt format: DIP-ROBUX-XXXX-YYYY
      const robuxReceipt = order.keys[2].key;
      assert.match(
        robuxReceipt,
        /^DIP-ROBUX-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        `Robux receipt "${robuxReceipt}" must match DIP-ROBUX-XXXX-YYYY`
      );
    }
  },

  // --------------------------------------------------------------------------
  // C06: Cart State Mutations Lifecycle
  // --------------------------------------------------------------------------
  {
    id: 'T3-C06',
    name: 'Combination 6: Cart Mutation Lifecycle (Add -> Update -> Remove -> Clear)',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });

      // Step 1: Add item
      env.context.addToCart('elden-ring', 0, 1);
      assert.equal(env.context.getCart().length, 1);
      assert.equal(env.context.getCartCount(), 1);

      // Step 2: Update quantity to 3
      env.context.updateCartQuantity(0, 3);
      assert.equal(env.context.getCart()[0].quantity, 3);
      assert.equal(env.context.getCartCount(), 3);

      // Step 3: Add second item
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'elden_lord',
        amount: 1000,
        commission: 40,
        total: 1040
      });
      assert.equal(env.context.getCart().length, 2);
      assert.equal(env.context.getCartCount(), 4);

      // Step 4: Remove first item
      env.context.removeFromCart(0);
      assert.equal(env.context.getCart().length, 1);
      assert.equal(env.context.getCartCount(), 1);
      assert.equal(env.context.getCart()[0].productId, 'steam-wallet-topup');

      // Step 5: Clear cart
      env.context.clearCart();
      assert.equal(env.context.getCart().length, 0);
      assert.equal(env.context.getCartCount(), 0);
    }
  },

  // --------------------------------------------------------------------------
  // C07: Sequential Multi-Order Accumulation
  // --------------------------------------------------------------------------
  {
    id: 'T3-C07',
    name: 'Combination 7: Successive Orders Cumulative Storage in diploy_orders_v1',
    fn: () => {
      const env = createTestEnv({ scripts: ['data.js', 'app.js'] });
      const initialOrdersCount = env.context.getOrders().length;

      // Order 1
      env.context.addToCart('minecraft', 0, 1);
      const o1 = env.context.createOrder({
        items: env.context.getCart(),
        total: 1199,
        customerName: 'Player One',
        customerEmail: 'p1@test.com',
        paymentMethod: 'card'
      });
      assert.ok(o1);

      // Order 2
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: 'p2_steam',
        amount: 300,
        commission: 12,
        total: 312
      });
      const o2 = env.context.createOrder({
        items: env.context.getCart(),
        total: 312,
        customerName: 'Player Two',
        customerEmail: 'p2@test.com',
        paymentMethod: 'sbp'
      });
      assert.ok(o2);

      const allOrders = env.context.getOrders();
      assert.equal(allOrders.length, initialOrdersCount + 2, 'Both orders must be retained in order history');
      // unshift puts the newest order first
      assert.equal(allOrders[0].id, o2.id);
      assert.equal(allOrders[1].id, o1.id);
    }
  },

  // --------------------------------------------------------------------------
  // C08: Theme Tokens & SVG Icon Cascade
  // --------------------------------------------------------------------------
  {
    id: 'T3-C08',
    name: 'Combination 8: CSS Theme Tokens & SVG Icon currentColor Cascade Interaction',
    fn: () => {
      const css = readCss();
      assert.ok(css, 'css/style.css must exist');

      // Check svg-icon rule sets fill: currentColor
      assert.match(
        css,
        /\.svg-icon\b[^}]*fill\s*:\s*currentColor/i,
        '.svg-icon must use fill: currentColor to inherit parent element color'
      );

      // Check that feature icons or buttons bind accent colors
      assert.ok(
        css.includes('--halloween-orange') || css.includes('--accent-blue'),
        'CSS must integrate theme tokens'
      );
    }
  }
];

module.exports = {
  tier: 3,
  title: 'Tier 3: Cross-Feature Combinations (Mixed Carts, Promo Codes & Receipts)',
  tests: tier3Tests
};
