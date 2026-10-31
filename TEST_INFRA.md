# Test Infrastructure Specification: Diploy Games E2E Testing Track

## 1. Overview & Testing Philosophy

The test infrastructure of **Diploy Games** establishes an automated, opaque-box, requirement-driven verification track. It evaluates both the Autumn/Halloween store redesign and expansion features specified in `ORIGINAL_REQUEST.md` and the 26 items of the `PROJECT.md` Feature Inventory.

### Core Principles
1. **Opaque-Box & Requirement-Driven**: Tests are derived strictly from documented business logic, formulas, and user journeys — never from internal implementation artifacts or mocks that always pass.
2. **Zero External Dependencies**: Standalone execution relies exclusively on standard Node.js built-ins (`node:assert/strict`, `node:vm`, `node:fs`, `node:path`). No `npm install`, bundlers, or third-party test libraries are required.
3. **Pure `file:///` Standalone Compatibility**: Every test enforces that scripts operate cleanly in classic global browser contexts without ES modules (`import`/`export`), build steps, or CORS violations.
4. **Deterministic Sandbox Isolation**: Each test case instantiates its own isolated browser execution environment with clean in-memory `localStorage`, fresh mock DOM tree, and independent state.

---

## 2. Test Architecture & Directory Structure

```
Diploy/
├── TEST_INFRA.md                       # [This Document] Global Test Infrastructure Guide
├── TEST_READY.md                       # Published Test Track Readiness & Baseline Report
└── tests/
    ├── harness.js                      # Core VM sandboxing, Mock DOM, LocalStorage & helpers
    ├── runner.js                       # Master CLI test runner (all tiers, filtering, reporting)
    ├── tier1_feature_coverage.test.js  # Tier 1: 26 Feature Coverage tests (F01 - F26)
    ├── tier2_boundaries.test.js        # Tier 2: 14 Boundary & Corner Case tests (B01 - B14)
    ├── tier3_combinations.test.js      # Tier 3: 8 Cross-Feature Combination tests (C01 - C08)
    └── tier4_real_world.test.js        # Tier 4: 7 Real-World Application Scenarios (S01 - S07)
```

---

## 3. Test Environment Harness (`tests/harness.js`)

The harness provides an isolated browser runtime simulated inside `node:vm`:

### Key Components
- **`MockElement`**: Lightweight DOM element representation implementing `classList` (`add`, `remove`, `contains`, `toggle`), `style`, `innerHTML`, `outerHTML`, `textContent`, `value`, `attributes`, `addEventListener`, `dispatchEvent`, `querySelector`, `querySelectorAll`, and `getContext('2d')` for `<canvas>` elements.
- **`MockDocument`**: Implements `getElementById`, `querySelector`, `querySelectorAll`, `createElement`, `body`, `head`, `hidden` (for visibility change lifecycle), and document event dispatching.
- **`MockLocalStorage`**: In-memory key-value store replicating `getItem`, `setItem`, `removeItem`, `clear`, and `key` per HTML5 Web Storage standard.
- **`createTestEnv(options)`**: Spawns an isolated `vm.Context` with `window`, `document`, `localStorage`, `requestAnimationFrame`, `cancelAnimationFrame`, `matchMedia` (with `prefers-reduced-motion` support), and loads selected application scripts (`data.js`, `icons.js`, `app.js`, etc.) synchronously.
- **Static Inspection Utilities**:
  - `readProjectFile(relPath)` / `readAllHtmlFiles()` / `readCss()`: Direct file readers.
  - `findEmojis(text)`: Unicode regex detector ensuring absence of raw emojis across updated templates.
  - `validateJsSyntax(relPath)`: Strict syntax compiler checking `new vm.Script(...)` without execution.

---

## 4. Test Tiers Specification

### Tier 1: Feature Coverage (26 Features)
Direct 1:1 mapping against `PROJECT.md § Feature Inventory`:
- **T1-F01**: Autumn/Halloween Color Theme (`--halloween-orange: #ff7a00`, `--halloween-purple: #8b5cf6`, gradients, glowing accents).
- **T1-F02**: Discount Badges up to -70% (`.badge-discount`, `.badge-discount-mega`, discounts up to -73%).
- **T1-F03**: Autumn Sale Promo Ribbons & Banner copy in HTML and CSS.
- **T1-F04**: Canvas Particle Background Engine (25–35 particles, `requestAnimationFrame`).
- **T1-F05**: VisibilityChange Animation Pause (`cancelAnimationFrame` on `document.hidden === true`).
- **T1-F06**: Prefers-Reduced-Motion Support (canvas hidden and loop frozen under reduced motion).
- **T1-F07**: SVG Icons Dictionary (`js/icons.js` exporting `getIcon`, `renderIcon`, `initIcons`, 30+ vector paths).
- **T1-F08**: Emoji Replacement in Header & Nav across all 6 HTML files.
- **T1-F09**: Emoji Replacement in Perks, Features & Product Cards.
- **T1-F10**: Emoji Replacement in Modals, Buttons, Profile Library & Admin Panel.
- **T1-F11**: 3-Tab Quick Top-Up Widget Present on Homepage (`index.html`).
- **T1-F12**: Steam Top-Up Tab Logic & 4% Commission Formula (`Math.round(amount * 0.04)`).
- **T1-F13**: Roblox Top-Up Tab Logic, Packages (400, 800, 1700, 4500 R$) & 5% Fee Formula.
- **T1-F14**: PlayStation Tab Region Denominations (TR, US, PL, UK) & Ruble Conversion.
- **T1-F15**: Live Top-Up Receipt Preview Breakdown Structure.
- **T1-F16**: Top-Up Items Payload Integration with `addToCart(productId, editionIndex, qty, customData)`.
- **T1-F17**: `roblox-robux` Item in `DEFAULT_PRODUCTS` in `js/data.js` with 4 Editions.
- **T1-F18**: Roblox Vector Cover Asset Exists (`assets/covers/roblox.svg`).
- **T1-F19**: Dedicated Robux Support & Calculator on `product.html`.
- **T1-F20**: `DIP-ROBUX-XXXX-YYYY` Receipt Generation Format in User Library.
- **T1-F21**: Polymorphic Item Rendering in Cart & Order History.
- **T1-F22**: Clean Vanilla JS Architecture with Russian Documentation (Junior-friendly).
- **T1-F23**: Zero ES Modules & Full `file:///` Standalone Compatibility.
- **T1-F24**: Clean Syntax Check across all Scripts (`validateJsSyntax`).
- **T1-F25**: E2E Test Suite Integrity & Runner Operational Status.
- **T1-F26**: Adversarial Robustness, Injection Safety & Storage Integrity.

### Tier 2: Boundary & Corner Cases (14 Cases)
- **T2-B01**: Steam Login empty, whitespace-only, and character limit boundaries.
- **T2-B02**: Roblox Nickname regex boundaries (min 3 chars, max 20 chars, allowed vs illegal characters).
- **T2-B03**: Steam Amount limits (min 100 ₽, max 50 000 ₽, clamping behavior).
- **T2-B04**: Roblox Robux custom amount limits (min 100 R$, max 50 000 R$).
- **T2-B05**: Precision & floating-point math rounding (integer rubles guarantee).
- **T2-B06**: Negative numeric inputs rejection in cart and balance deposits.
- **T2-B07**: Non-numeric, NaN, null, and undefined coercion resilience.
- **T2-B08**: Promo code case-insensitivity, whitespace trimming, and invalid code rejection.
- **T2-B09**: User balance payment boundaries (exact balance match vs 1 ruble deficit).
- **T2-B10**: Empty cart checkout rejection (prevent phantom orders).
- **T2-B11**: Corrupted LocalStorage JSON recovery without uncaught crashes.
- **T2-B12**: Unknown SVG icon key graceful fallback without throw.
- **T2-B13**: Cart quantity increment for standard games vs distinct customData isolation for top-ups.
- **T2-B14**: XSS / HTML injection defense in login and nickname payloads.

### Tier 3: Cross-Feature Combinations (8 Combinations)
- **T3-C01**: Quad-category mixed cart setup (standard game + Steam + Roblox Robux + PlayStation).
- **T3-C02**: Subtotal & total arithmetic across heterogeneous cart items.
- **T3-C03**: Promo code application & rate discounting across mixed carts (`HALLOWEEN`, `DIPLOY`, `STUDENT`).
- **T3-C04**: Balance checkout accurate sum deduction on mixed baskets.
- **T3-C05**: Heterogeneous keys and receipts generation in single multi-item order:
  - Game key: `DIP-XXXX-YYYY-ZZZZ`
  - Steam top-up: `DIP-TOPUP-XXXX-YYYRUB`
  - Roblox Robux: `DIP-ROBUX-XXXX-YYYY`
- **T3-C06**: Cart mutation lifecycle (add -> update quantity -> remove individual item -> clear).
- **T3-C07**: Successive orders cumulative storage in `diploy_orders_v1` without overwriting history.
- **T3-C08**: CSS theme tokens & SVG icon `currentColor` cascade interaction.

### Tier 4: Real-World Application Scenarios (7 End-to-End Journeys)
- **T4-S01**: Homepage Steam top-up -> Cart -> Checkout (SBP) -> Profile Library receipt.
- **T4-S02**: Homepage Roblox top-up -> Nickname -> Package -> Checkout -> `DIP-ROBUX` receipt.
- **T4-S03**: Homepage PlayStation tab -> Turkey region -> 500 TL card -> Checkout.
- **T4-S04**: Catalog shopper -> Autumn Sale discount (-73%) -> Balance payment -> License key in profile.
- **T4-S05**: Product page (`product.html`) Robux calculator -> Custom amount -> Add to cart.
- **T4-S06**: Profile balance top-up modal -> Balance deposit -> Game purchase -> Order history.
- **T4-S07**: Admin panel -> Add custom game -> Catalog reflection -> Reset to default catalog.

---

## 5. Execution Instructions

### Running the Entire Suite
```powershell
node tests/runner.js
```

### Running Individual Tiers
```powershell
node tests/runner.js --tier=1    # Tier 1: Feature Coverage
node tests/runner.js --tier=2    # Tier 2: Boundary & Corner Cases
node tests/runner.js --tier=3    # Tier 3: Cross-Feature Combinations
node tests/runner.js --tier=4    # Tier 4: Real-World Application Scenarios
```

### Non-Failing Diagnostic Mode
```powershell
node tests/runner.js --allow-fail
```

---

## 6. Audit & Acceptance Criteria

1. **Test Integrity**: Every test asserts observable, authoritative requirements (regex patterns, numeric computations, CSS custom properties, DOM structure).
2. **Progressive Testability**: Baseline execution clearly identifies passing features vs. pending milestones (M1–M4).
3. **Milestone 5 Target**: Upon completion of all feature milestones, `node tests/runner.js` must achieve **100% PASS** across all 55 tests.
