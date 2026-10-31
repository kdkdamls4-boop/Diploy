# Project: Diploy Games — Autumn/Halloween Redesign & Store Expansion

## Architecture
- **Environment**: Pure client-side static web application with 100% standalone `file:///` compatibility. No bundlers, no npm dependencies, no ES modules (`import`/`export`), no build step.
- **Styling Architecture**: Vanilla CSS with modern custom properties in `css/style.css`. Dark theme baseline (#121212, #1c1c1c) with Autumn/Halloween Sale palette (`--halloween-orange: #ff7a00`, `--halloween-purple: #8b5cf6`, gradients, glowing accents, and badges).
- **Animation System**: Lightweight Canvas particle background (`js/particles.js`, `<canvas id="particles-canvas">`) running on `requestAnimationFrame` with 25–35 particles, automatic pause via `document.hidden` / `visibilitychange`, and full disablement under `@media (prefers-reduced-motion: reduce)`.
- **Iconography**: Modular SVG dictionary in `js/icons.js` exposing `getIcon(name, className)`, `renderIcon(name, options)`, and `initIcons(container)` over 30+ vector paths with `viewBox="0 0 24 24"` and `currentColor`. Zero raw XML copy-pasting.
- **Data & Business Logic**:
  - Catalog in `js/data.js` (`DEFAULT_PRODUCTS`) with new `roblox-robux` currency product.
  - Storage & Cart in `js/app.js` with `localStorage` persistence, polymorphic top-up items (`customData`), and receipt generation (`DIP-ROBUX-XXXX-YYYY`).
  - Interactive Quick Top-Up Widget on `index.html` with 3 tabs: Steam (4% fee), Roblox (packages + custom, 5% fee), PlayStation (PSN region + card denominations, ruble calculation with 5% fee).
  - Dedicated Robux support on `product.html`.

## Code Layout
- `index.html` — Homepage with Hero, Quick Top-Up Widget, Features, Hot Discounts, Popular Products.
- `catalog.html` — Store catalog with filtering, search, platforms, and sorting.
- `product.html` — Product details page with screenshot gallery, editions, and custom currency calculators.
- `cart.html` — Shopping cart with item breakdown, promo codes, and multi-method checkout.
- `profile.html` — User profile with balance top-up modal and purchased keys/receipts library.
- `admin.html` — Admin panel for catalog management.
- `css/style.css` — Centralized styles, responsive layouts, theme tokens, and animations.
- `js/icons.js` — [New] Modular vector SVG icons dictionary and renderer.
- `js/particles.js` — [New] Lightweight Autumn/Halloween canvas particle animation engine.
- `js/data.js` — Default product catalog database.
- `js/app.js` — Global state, cart management, balance, toasts, order/key generation.
- `js/catalog.js` — Catalog filter and render engine.
- `js/product.js` — Product page renderer and dynamic currency calculators.
- `js/cart.js` — Cart renderer, promo code validation, and checkout orchestration.
- `js/profile.js` — Profile page, balance deposit, and key activation.
- `js/admin.js` — Admin actions.
- `assets/covers/roblox.svg` — [New] Official vector cover art for Roblox Robux product.
- `tests/` — Automated E2E and business logic verification test suites (Tier 1 to 5).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Autumn/Halloween Color Theme | Orange `#ff7a00`, mystical purple `#8b5cf6`, gradients, glowing card hovers | M1 | R1 |
| 2 | Discount Badges up to -70% | Redesigned `.badge-discount` with pumpkin gradient and `.badge-discount-mega` | M1 | R1 |
| 3 | Autumn Sale Promo Ribbons | Top-bar ribbon and Hero banner with Halloween Sale copy and промокод HALLOWEEN | M1 | R1 |
| 4 | Canvas Particle Background | 25–35 floating autumn leaves & embers with `requestAnimationFrame` | M1 | R1 |
| 5 | VisibilityChange Animation Pause | Automatic `cancelAnimationFrame` when `document.hidden === true` | M1 | R1 |
| 6 | Prefers-Reduced-Motion Support | Immediate animation freeze and canvas hiding when reduced motion is preferred | M1 | R1 |
| 7 | SVG Icons Dictionary (`js/icons.js`) | Dictionary of 30+ vector paths with `getIcon(name, className)` and `renderIcon` | M2 | R2 |
| 8 | Emoji Replacement (Header & Nav) | Replace search, cart, profile emojis in all 6 HTML files with SVG icons | M2 | R2 |
| 9 | Emoji Replacement (Features & Cards) | Replace emojis in perks (flash, shield, card, gift) and cards (ratings, status) | M2 | R2 |
| 10 | Emoji Replacement (Modals & Buttons) | Replace emojis in cart, checkout, profile library, copy buttons, admin panel | M2 | R2 |
| 11 | Homepage Quick Top-Up Widget | 3-tab widget on `index.html` for Steam, Roblox, PlayStation | M4 | R3 |
| 12 | Steam Top-Up Tab | Login input + hint, quick buttons (300, 500, 1000, 2500, 5000 ₽) + custom, 4% fee | M4 | R3 |
| 13 | Roblox Top-Up Tab | Player nickname validation, package choices (400, 800, 1700, 4500 R$) + custom, fee | M4 | R3 |
| 14 | PlayStation Top-Up Tab | Region selection (TR, US, PL, UK) + denomination cards (TL, $, PLN, £), ruble conversion + fee | M4 | R3 |
| 15 | Live Top-Up Receipt Preview | Real-time breakdown of account, face value, commission, and total | M4 | R3 |
| 16 | Top-Up Cart Integration | Direct add-to-cart and instant checkout buttons from homepage widget | M4 | R3 |
| 17 | Roblox Robux in Catalog | Add `roblox-robux` to `DEFAULT_PRODUCTS` in `js/data.js` with 4 package editions | M3 | R4 |
| 18 | Roblox Vector Cover Asset | Create `assets/covers/roblox.svg` vector illustration | M3 | R4 |
| 19 | Robux on `product.html` | Custom calculator on product page with nickname validation and package selection | M3 | R4 |
| 20 | Robux Receipt Format | Generate `DIP-ROBUX-XXXX-YYYY` order receipts in user library | M3 | R4 |
| 21 | Polymorphic Cart & Orders | Display custom Robux / PSN / Steam details in cart and purchase history | M3 | R4 |
| 22 | Junior-Friendly Simplicity | Plain readable functions with clear Russian comments and zero complex closures | M1-M5 | R5 |
| 23 | Standalone `file:///` Autonomy | Zero ES modules, zero build tools, strict `<script src="...">` load order | M1-M5 | R5 |
| 24 | Node Syntax Validation | 100% clean `node -c js/*.js` syntax check across all scripts | M1-M5 | R5 |
| 25 | E2E Testing Suite (Tiers 1-4) | Comprehensive opaque-box test suites for all features and edge cases | E2E Track | Acceptance |
| 26 | Adversarial Hardening (Tier 5) | White-box stress-testing, boundary verification, and Forensic Audit | Final Milestone | Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test harness, runner, and Tier 1–4 requirement test suites; published `TEST_READY.md` | none | DONE |
| M1 | Autumn Sale / Halloween Theme & Particles | `css/style.css` Halloween palette, badges, ribbons; `js/particles.js` canvas engine | none | DONE |
| M2 | Modular SVG Icons Dictionary & Emoji Purge | `js/icons.js` implementation, script inclusions, replace 73 emojis across all HTML & JS | M1 | DONE |
| M3 | Roblox Robux Currency & Receipt Generation | `js/data.js`, `assets/covers/roblox.svg`, `js/app.js` receipts (`DIP-ROBUX-XXXX-YYYY`), `product.html`, cart & profile | M2 | IN_PROGRESS |
| M4 | Interactive Quick Top-Up Widget on Homepage | 3-tab widget on `index.html` (Steam, Roblox, PlayStation), calculations, cart addition | M1, M2, M3 | PLANNED |
| M5 | Final Milestone: E2E Test Pass & Coverage Hardening | Phase 1: 100% E2E test pass (Tiers 1-4); Phase 2: Adversarial coverage hardening (Tier 5) & Forensic Audit | E2E, M1-M4 | PLANNED |

---

## Interface Contracts

### 1. `js/icons.js` ↔ All Pages & Scripts
- Global exports on `window`:
  - `getIcon(name: string, className?: string): string` — returns inline `<svg class="svg-icon icon-{name} {className}" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">...</svg>`.
  - `renderIcon(name: string, options?: { size?: string, className?: string, fill?: string, title?: string }): string`.
  - `initIcons(container?: HTMLElement | Document): void` — scans `[data-icon]` and injects SVG markup.
- Supported icon keys: `flash`, `shield`, `card`, `gift`, `fire`, `star`, `user`, `cart`, `search`, `check`, `copy`, `settings`, `arrow-right`, `external-link`, `cross`, `plus`, `minus`, `refresh`, `trash`, `steam`, `roblox`, `playstation`, `xbox`, `gamepad`, `coins`, `package`, `key`, `lock`, `bag`, `dot`, `rocket`, `info`, `alert`, `pumpkin`.
- CSS dependency: `.svg-icon` with `display: inline-block; width: 1em; height: 1em; vertical-align: -0.15em; fill: currentColor;`.

### 2. `js/particles.js` ↔ HTML Pages
- Automatic initialization: `<canvas id="particles-canvas">` is either found or auto-appended to `document.body`.
- Particle budget: exactly 30 particles (within 25–35).
- Event lifecycle:
  - `document.addEventListener("visibilitychange", ...)` cancels frame loop when `document.hidden` is true, resumes when false.
  - `@media (prefers-reduced-motion: reduce)` media query listener stops animation loop and applies CSS `display: none !important`.

### 3. Quick Top-Up Widget (`index.html`) ↔ Cart (`js/app.js`, `js/cart.js`)
- Steam Cart Item payload:
  `customData: { type: "steam", login: string, amount: number, commission: number, total: number }`
- Roblox Cart Item payload:
  `customData: { type: "roblox", nickname: string, robuxAmount: number, amount: number, commission: number, total: number, login: string }`
- PlayStation Cart Item payload:
  `customData: { type: "playstation", region: string, regionName: string, denomination: string, faceValue: number, currency: string, amount: number, commission: number, total: number, login: string }`
- Added via: `addToCart(productId, editionIndex, quantity, customData)`.

### 4. Receipt Generator (`js/app.js`) ↔ User Library (`js/profile.js`)
- Robux receipt format: `DIP-ROBUX-[A-Z0-9]{4}-[A-Z0-9]{4}` (e.g. `DIP-ROBUX-7K9A-4M2X`).
- Steam top-up receipt format: `DIP-TOPUP-[0-9]{4}-[0-9]+RUB`.
- Standard game license key: `DIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}`.
