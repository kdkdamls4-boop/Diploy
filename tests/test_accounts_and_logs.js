/**
 * Automated Test Suite for User Accounts, Balance Synchronization & Admin Audit Logs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// Setup mock browser environment
const localStorageStore = {};
const sessionStorageStore = {};

const mockLocalStorage = {
  getItem: (key) => (Object.prototype.hasOwnProperty.call(localStorageStore, key) ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const mockSessionStorage = {
  getItem: (key) => (Object.prototype.hasOwnProperty.call(sessionStorageStore, key) ? sessionStorageStore[key] : null),
  setItem: (key, val) => { sessionStorageStore[key] = String(val); },
  removeItem: (key) => { delete sessionStorageStore[key]; },
  clear: () => { Object.keys(sessionStorageStore).forEach(k => delete sessionStorageStore[k]); }
};

const mockDocument = {
  getElementById: (id) => null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    style: {},
    setAttribute: () => {},
    appendChild: () => {},
    addEventListener: () => {},
    remove: () => {}
  }),
  body: {
    appendChild: () => {}
  },
  addEventListener: () => {}
};

const context = vm.createContext({
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON
});
context.window = context;

// Load code files into context
const iconsCode = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

vm.runInContext(iconsCode, context);
vm.runInContext(dataCode, context);
vm.runInContext(appCode, context);

console.log('=== Testing User Accounts, Balance & Admin Logs ===\n');

// Test 1: Default Users exist (gamer@diploy.ru)
const initialUsers = context.getUsers();
assert.ok(Array.isArray(initialUsers), 'Users should be an array');
assert.ok(initialUsers.length >= 1, 'Default user should exist');
const defaultUser = initialUsers.find(u => u.email === 'gamer@diploy.ru');
assert.ok(defaultUser, 'Default user gamer@diploy.ru should be present');
assert.strictEqual(defaultUser.balance, 5000, 'gamer@diploy.ru should have 5 000 ₽ initial balance');
console.log('[PASS] Test 1: Pre-seeded demo account gamer@diploy.ru with 5 000 ₽ exists');

// Test 2: User Registration with 1 000 ₽ bonus
const regResult = context.registerUser('pro_sniper', 'sniper@mail.ru', 'pass123');
assert.strictEqual(regResult.success, true, 'Registration should succeed');
assert.strictEqual(regResult.user.username, 'pro_sniper');
assert.strictEqual(regResult.user.balance, 1000, 'New user receives 1 000 ₽ bonus');
const currentUser = context.getCurrentUser();
assert.strictEqual(currentUser.email, 'sniper@mail.ru', 'Registered user becomes current user');
assert.strictEqual(context.getUserBalance(), 1000, 'Active user balance matches bonus');
console.log('[PASS] Test 2: New user registration awards +1 000 ₽ bonus and logs in');

// Test 3: Duplicate Registration prevention
const dupResult = context.registerUser('pro_sniper', 'sniper@mail.ru', 'anotherpass');
assert.strictEqual(dupResult.success, false, 'Duplicate registration must be rejected');
console.log('[PASS] Test 3: Duplicate username/email rejected');

// Test 4: User Logout & Guest fallback
context.logoutUser();
assert.strictEqual(context.getCurrentUser(), null, 'Current user should be null after logout');
console.log('[PASS] Test 4: User logout clears active session');

// Test 5: User Login
const loginResult = context.loginUser('sniper@mail.ru', 'pass123');
assert.strictEqual(loginResult.success, true, 'Login with correct credentials should succeed');
assert.strictEqual(context.getCurrentUser().username, 'pro_sniper');
console.log('[PASS] Test 5: User login succeeds with correct credentials');

// Test 6: Invalid Login rejection
context.logoutUser();
const badLogin = context.loginUser('sniper@mail.ru', 'wrongpassword');
assert.strictEqual(badLogin.success, false, 'Invalid password must fail');
console.log('[PASS] Test 6: Invalid password login rejected');

// Test 7: Balance Deposit and Sync with Account
context.loginUser('sniper@mail.ru', 'pass123');
const initialBal = context.getUserBalance();
assert.strictEqual(initialBal, 1000);
context.depositBalance(2500);
assert.strictEqual(context.getUserBalance(), 3500, 'Balance should increase to 3 500 ₽');
const savedUsers = context.getUsers();
const updatedSniper = savedUsers.find(u => u.email === 'sniper@mail.ru');
assert.strictEqual(updatedSniper.balance, 3500, 'Balance in user database is synchronized');
console.log('[PASS] Test 7: Balance deposit synchronizes with user record');

// Test 8: System Logs are recorded
const logs = context.getSystemLogs();
assert.ok(Array.isArray(logs), 'System logs should be an array');
assert.ok(logs.length > 0, 'System logs should have entries');
const authLogs = logs.filter(l => l.type === 'AUTH');
const depositLogs = logs.filter(l => l.type === 'DEPOSIT');
assert.ok(authLogs.length >= 1, 'AUTH logs should be recorded');
assert.ok(depositLogs.length >= 1, 'DEPOSIT logs should be recorded');
console.log('[PASS] Test 8: System logs record AUTH and DEPOSIT events accurately');

// Test 9: Purchase creates a PURCHASE log
const testOrder = {
  items: [
    { productId: 'minecraft-java', editionIndex: 0, quantity: 1 }
  ],
  total: 1999,
  paymentMethod: 'СБП',
  promoCode: null,
  discountAmount: 0
};
context.createOrder(testOrder);
const latestLogs = context.getSystemLogs();
const purchaseLog = latestLogs.find(l => l.type === 'PURCHASE');
assert.ok(purchaseLog, 'PURCHASE log must be created after order');
assert.ok(purchaseLog.details.replace(/\s+/g, ' ').includes('1 999'), 'Log details must include total price');
console.log('[PASS] Test 9: Order placement records PURCHASE log with details');

// Test 10: Clear Logs
context.clearSystemLogs();
assert.strictEqual(context.getSystemLogs().length, 0, 'Logs must be empty after clear');
console.log('[PASS] Test 10: Clear logs empties the audit trail');

console.log('\nAll 10 Account, Balance & Audit Log Tests PASSED successfully!');
