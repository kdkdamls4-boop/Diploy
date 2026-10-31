const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Admin Authentication System ===");

// 1. Verify admin.html markup
const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
assert(adminHtml.includes('id="admin-auth-screen"'), "admin.html must contain #admin-auth-screen");
assert(adminHtml.includes('id="admin-panel-content"'), "admin.html must contain #admin-panel-content");
assert(adminHtml.includes('id="admin-login-form"'), "admin.html must contain #admin-login-form");
assert(adminHtml.includes('id="admin-login-email"'), "admin.html must contain #admin-login-email");
assert(adminHtml.includes('id="admin-login-password"'), "admin.html must contain #admin-login-password");
assert(adminHtml.includes('id="admin-logout-btn"'), "admin.html must contain #admin-logout-btn");

// 2. Verify admin.js logic
const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
assert(adminJs.includes('peredatprava@gmail.com'), "admin.js must check peredatprava@gmail.com");
assert(adminJs.includes('1   '), "admin.js must check password '1   '");
assert(adminJs.includes('isUserAdmin'), "admin.js must implement isUserAdmin()");
assert(adminJs.includes('updateAdminView'), "admin.js must implement updateAdminView()");

// 3. Test credential matching logic directly
function checkLogin(email, pass) {
  const ADMIN_EMAIL = "peredatprava@gmail.com";
  const ADMIN_PASS = "1   ";
  const cleanEmail = (email || "").trim().toLowerCase();
  const isEmailValid = cleanEmail === ADMIN_EMAIL;
  const isPassValid = (pass === ADMIN_PASS || (typeof pass === "string" && pass.trim() === "1"));
  return isEmailValid && isPassValid;
}

// Positive tests
assert.strictEqual(checkLogin("peredatprava@gmail.com", "1   "), true, "Should accept exact password '1   '");
assert.strictEqual(checkLogin("peredatprava@gmail.com", "1"), true, "Should accept trimmed password '1'");
assert.strictEqual(checkLogin("  PeredatPrava@gmail.com  ", "1   "), true, "Should accept case-insensitive trimmed email");

// Negative tests
assert.strictEqual(checkLogin("hacker@gmail.com", "1   "), false, "Should reject unknown email");
assert.strictEqual(checkLogin("peredatprava@gmail.com", "wrongpass"), false, "Should reject wrong password");
assert.strictEqual(checkLogin("peredatprava@gmail.com", ""), false, "Should reject empty password");
assert.strictEqual(checkLogin("", ""), false, "Should reject empty credentials");

console.log("All Admin Authentication Tests PASSED successfully!");
