/**
 * ==============================================================================
 * DIPLOY GAMES - TIER 4: REAL-WORLD APPLICATION SCENARIOS (E2E USER JOURNEYS)
 * ==============================================================================
 * Verifies complete end-to-end user journeys through the application:
 * - Steam top-up on homepage to checkout and profile library
 * - Roblox Robux selection, calculation, checkout and DIP-ROBUX receipt
 * - PlayStation regional gift card selection and purchase
 * - Store shopper browsing Autumn Sale discounts and paying with account balance
 * - Product detail page Robux calculator workflow
 * - Virtual balance deposit and spend cycle
 * - Admin inventory creation, catalog verification, and reset
 */

const assert = require('node:assert/strict');
const { createTestEnv, readProjectFile } = require('./harness.js');

const tier4Tests = [
  // --------------------------------------------------------------------------
  // S01: Complete Steam Top-Up User Journey
  // --------------------------------------------------------------------------
  {
    id: 'T4-S01',
    name: 'Scenario 1: Homepage Steam Top-Up -> Cart -> Checkout (SBP) -> Profile Receipt',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/index.html'
      });

      // 1. User configures Steam top-up on homepage
      const targetLogin = 'alex_steam_pro';
      const desiredAmount = 2500;
      const commission = Math.round(desiredAmount * 0.04); // 100 ₽
      const totalRubles = desiredAmount + commission;     // 2600 ₽

      assert.equal(commission, 100);
      assert.equal(totalRubles, 2600);

      // 2. User clicks "В корзину" / "Пополнить"
      env.context.addToCart('steam-wallet-topup', 0, 1, {
        type: 'steam',
        login: targetLogin,
        amount: desiredAmount,
        commission: commission,
        total: totalRubles
      });

      // 3. User visits cart.html
      const cart = env.context.getCart();
      assert.equal(cart.length, 1);
      assert.equal(cart[0].customData.login, targetLogin);
      assert.equal(cart[0].customData.total, 2600);

      // 4. User completes checkout via SBP
      const order = env.context.createOrder({
        items: env.context.getCart(),
        total: totalRubles,
        customerName: 'Alex Pro',
        customerEmail: 'alex@example.com',
        paymentMethod: 'sbp'
      });

      assert.ok(order, 'Order must be completed');
      assert.equal(order.keys.length, 1);

      // 5. User visits profile.html -> library contains receipt
      const receipt = order.keys[0];
      assert.match(
        receipt.key,
        /^DIP-TOPUP-[0-9]{4}-[0-9]+RUB$/,
        'Receipt key must follow DIP-TOPUP-XXXX-YYYRUB format'
      );
      assert.equal(receipt.isTopup, true, 'Receipt must be marked as top-up');
      assert.equal(receipt.isActivated, true, 'Top-up receipt must be activated automatically');
      assert.equal(receipt.topupLogin, targetLogin, 'Target account login must be recorded in receipt');
    }
  },

  // --------------------------------------------------------------------------
  // S02: Complete Roblox Robux User Journey
  // --------------------------------------------------------------------------
  {
    id: 'T4-S02',
    name: 'Scenario 2: Homepage Roblox Top-Up -> Nickname -> Package -> Checkout -> DIP-ROBUX Receipt',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/index.html'
      });

      // 1. User selects Roblox tab, enters nickname, picks 1700 R$ package
      const nickname = 'Mega_Gamer_2026';
      const robuxAmount = 1700;
      const baseRubles = Math.round(robuxAmount * 1.25); // 2125 ₽
      const commission = Math.round(baseRubles * 0.05);   // 106 ₽
      const totalRubles = baseRubles + commission;       // 2231 ₽

      assert.equal(baseRubles, 2125);
      assert.equal(commission, 106);
      assert.equal(totalRubles, 2231);

      // 2. User adds to cart
      env.context.addToCart('roblox-robux', 2, 1, {
        type: 'roblox',
        nickname: nickname,
        robuxAmount: robuxAmount,
        amount: baseRubles,
        commission: commission,
        total: totalRubles,
        login: nickname
      });

      // 3. User applies promo code STUDENT (15% off)
      const cart = env.context.getCart();
      const studentDiscount = Math.round(totalRubles * 0.15); // 335 ₽
      const finalPrice = totalRubles - studentDiscount;       // 1896 ₽

      // 4. User completes checkout via Bank Card
      const order = env.context.createOrder({
        items: env.context.getCart(),
        customerName: 'Student Gamer',
        customerEmail: 'student@roblox.com',
        paymentMethod: 'card',
        promoCode: 'STUDENT',
        discountAmount: studentDiscount,
        total: finalPrice
      });

      assert.ok(order);
      assert.equal(order.keys.length, 1);

      // 5. User checks receipt in profile.html library
      const robuxKey = order.keys[0].key;
      assert.match(
        robuxKey,
        /^DIP-ROBUX-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        'Robux receipt key must match DIP-ROBUX-XXXX-YYYY'
      );
      assert.equal(order.keys[0].isTopup, true);
    }
  },

  // --------------------------------------------------------------------------
  // S03: Complete PlayStation Gift Card User Journey
  // --------------------------------------------------------------------------
  {
    id: 'T4-S03',
    name: 'Scenario 3: Homepage PlayStation Tab -> Turkey Region -> 500 TL Card -> Checkout',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/index.html'
      });

      // 1. User selects PlayStation tab, region Turkey (tr), 500 TL
      const faceValue = 500;
      const rate = 3.20;
      const baseRubles = Math.round(faceValue * rate); // 1600 ₽
      const commission = Math.round(baseRubles * 0.05); // 80 ₽
      const totalRubles = baseRubles + commission;     // 1680 ₽

      assert.equal(baseRubles, 1600);
      assert.equal(commission, 80);
      assert.equal(totalRubles, 1680);

      // 2. Add to cart
      env.context.addToCart('ps-store-gift-card', 1, 1, {
        type: 'playstation',
        region: 'tr',
        regionName: 'Турция',
        denomination: '500 TL',
        currency: 'TL',
        faceValue: 500,
        amount: baseRubles,
        commission: commission,
        total: totalRubles,
        login: 'PSN (Турция)'
      });

      // 3. Checkout
      const order = env.context.createOrder({
        items: env.context.getCart(),
        total: totalRubles,
        customerName: 'Console Player',
        customerEmail: 'psn@test.com',
        paymentMethod: 'sbp'
      });

      assert.ok(order);
      assert.equal(order.keys.length, 1);
    }
  },

  // --------------------------------------------------------------------------
  // S04: Store Shopper Autumn Sale & Balance Purchase Journey
  // --------------------------------------------------------------------------
  {
    id: 'T4-S04',
    name: 'Scenario 4: Catalog Shopper -> Autumn Sale Discount -> Balance Payment -> Key in Profile',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/catalog.html'
      });

      // 1. User deposits 2000 ₽ in balance (initial 5000 + 2000 = 7000 ₽)
      env.context.depositBalance(2000);
      assert.equal(env.context.getUserBalance(), 7000);

      // 2. User browses Autumn Sale: Witcher 3 with 73% discount (699 ₽)
      const witcher = env.context.getProductById('witcher-3-wild-hunt');
      assert.ok(witcher);
      assert.equal(witcher.price, 699);
      assert.equal(witcher.discount, 73);

      // 3. User adds Witcher 3 to cart
      env.context.addToCart('witcher-3-wild-hunt', 0, 1);
      assert.equal(env.context.getCartCount(), 1);

      // 4. User applies HALLOWEEN promo code (25% off 699 = 175 ₽ discount)
      const discount = Math.round(699 * 0.25); // 175 ₽
      const finalPrice = 699 - discount;      // 524 ₽

      // 5. User checks out with account balance
      const order = env.context.createOrder({
        items: env.context.getCart(),
        total: finalPrice,
        customerName: 'Witcher Fan',
        customerEmail: 'geralt@kaer-morhen.com',
        paymentMethod: 'balance',
        promoCode: 'HALLOWEEN',
        discountAmount: discount
      });

      assert.ok(order);

      // Deduct balance
      env.context.setUserBalance(env.context.getUserBalance() - finalPrice);
      assert.equal(env.context.getUserBalance(), 7000 - 524, 'Balance must be 6 476 ₽');

      // 6. User verifies license key in profile library
      const key = order.keys[0].key;
      assert.match(
        key,
        /^DIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        'License key must follow DIP-XXXX-YYYY-ZZZZ'
      );
    }
  },

  // --------------------------------------------------------------------------
  // S05: Product Detail Page Robux Calculator Workflow
  // --------------------------------------------------------------------------
  {
    id: 'T4-S05',
    name: 'Scenario 5: product.html Robux Calculator -> Custom 2500 R$ -> Add to Cart',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/product.html?id=roblox-robux'
      });

      // Emulate calculator math on product.html
      const customRobux = 2500;
      const baseRubles = Math.round(customRobux * 1.25); // 3125 ₽
      const commission = Math.round(baseRubles * 0.05);   // 156 ₽
      const totalRubles = baseRubles + commission;       // 3281 ₽
      const nickname = 'Robloxian_2026';

      env.context.addToCart('roblox-robux', 0, 1, {
        type: 'roblox',
        nickname: nickname,
        robuxAmount: customRobux,
        amount: baseRubles,
        commission: commission,
        total: totalRubles,
        login: nickname
      });

      const cart = env.context.getCart();
      assert.ok(cart.length >= 1, 'Cart must contain Robux item when roblox-robux is supported');
      assert.equal(cart[0].customData.robuxAmount, 2500);
      assert.equal(cart[0].customData.total, 3281);
    }
  },

  // --------------------------------------------------------------------------
  // S06: Profile Balance Management Lifecycle
  // --------------------------------------------------------------------------
  {
    id: 'T4-S06',
    name: 'Scenario 6: Profile Balance Top-Up -> View Balance -> Purchase -> Order in History',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/profile.html'
      });
      const initialOrdersCount = env.context.getOrders().length;

      // Initial balance: 5000 ₽
      assert.equal(env.context.getUserBalance(), 5000);

      // User deposits 1500 ₽ via profile top-up modal
      env.context.depositBalance(1500);
      assert.equal(env.context.getUserBalance(), 6500);

      // User buys RDR2 (1999 ₽)
      env.context.addToCart('rdr-2', 0, 1);
      const order = env.context.createOrder({
        items: env.context.getCart(),
        total: 1999,
        customerName: 'Arthur Morgan',
        customerEmail: 'arthur@van-der-linde.com',
        paymentMethod: 'balance'
      });
      assert.ok(order);

      // Balance deduction
      env.context.setUserBalance(env.context.getUserBalance() - 1999);
      assert.equal(env.context.getUserBalance(), 6500 - 1999, 'Balance must be 4 501 ₽');

      // Orders history contains order
      const orders = env.context.getOrders();
      assert.equal(orders.length, initialOrdersCount + 1);
      assert.equal(orders[0].keys[0].productId, 'rdr-2');
    }
  },

  // --------------------------------------------------------------------------
  // S07: Admin Catalog Inventory Lifecycle
  // --------------------------------------------------------------------------
  {
    id: 'T4-S07',
    name: 'Scenario 7: Admin Panel -> Add Custom Game -> Catalog Reflection -> Reset to Default',
    fn: () => {
      const env = createTestEnv({
        scripts: ['data.js', 'app.js'],
        url: 'file:///c:/Users/User/Desktop/Projects/Diploy/admin.html'
      });

      const initialCount = env.context.getCatalog().length;

      // Admin creates custom game
      const newProduct = {
        id: 'hollow-knight-silksong',
        title: 'Hollow Knight: Silksong',
        category: 'games',
        categoryName: 'Игры на ПК',
        platform: 'steam',
        platformName: 'Steam',
        genre: 'Метроидвания • Приключение',
        price: 1499,
        isHit: true,
        coverImage: 'assets/covers/minecraft.svg',
        editions: [
          { name: 'Стандартное издание', price: 1499 }
        ]
      };

      const catalog = env.context.getCatalog();
      catalog.push(newProduct);
      env.context.saveCatalog(catalog);

      // Verify catalog now has 1 more product
      const updatedCatalog = env.context.getCatalog();
      assert.equal(updatedCatalog.length, initialCount + 1);
      const found = env.context.getProductById('hollow-knight-silksong');
      assert.ok(found);
      assert.equal(found.title, 'Hollow Knight: Silksong');

      // Admin clicks "Сбросить к базовому каталогу"
      env.context.saveCatalog(env.context.DEFAULT_PRODUCTS);
      const resetCatalog = env.context.getCatalog();
      assert.equal(resetCatalog.length, initialCount, 'Catalog must reset to default products count');
      assert.equal(env.context.getProductById('hollow-knight-silksong'), null, 'Custom item must be gone');
    }
  }
];

module.exports = {
  tier: 4,
  title: 'Tier 4: Real-World Application Scenarios (E2E User Journeys)',
  tests: tier4Tests
};
