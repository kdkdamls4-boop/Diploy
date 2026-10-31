/**
 * ==============================================================================
 * DIPLOY GAMES - AUTOMATED E2E TEST HARNESS (tests/harness.js)
 * ==============================================================================
 * Standard Node.js built-in opaque-box test harness.
 * Zero external dependencies: uses node:vm, node:fs, node:path, node:assert.
 * Provides isolated browser DOM/Window simulation for testing client-side code.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Lightweight mock DOM Element
 */
class MockElement {
  constructor(tagName = 'div', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this._style = {};
    this.listeners = new Map();
    this._value = '';
    this._textContent = '';
    this._innerHTML = '';

    // ClassList helper
    const self = this;
    this.classList = {
      _classes: new Set(),
      add(...classes) {
        classes.forEach(c => { if (c) self.classList._classes.add(c); });
        self._syncClassName();
      },
      remove(...classes) {
        classes.forEach(c => self.classList._classes.delete(c));
        self._syncClassName();
      },
      contains(c) {
        return self.classList._classes.has(c);
      },
      toggle(c, force) {
        if (force === undefined) {
          if (self.classList.contains(c)) {
            self.classList.remove(c);
            return false;
          } else {
            self.classList.add(c);
            return true;
          }
        }
        if (force) { self.classList.add(c); return true; }
        else { self.classList.remove(c); return false; }
      }
    };

    // Apply initial attributes
    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }
  }

  _syncClassName() {
    this.attributes.set('class', Array.from(this.classList._classes).join(' '));
  }

  get id() { return this.getAttribute('id') || ''; }
  set id(val) { this.setAttribute('id', val); }

  get className() { return Array.from(this.classList._classes).join(' '); }
  set className(val) {
    this.classList._classes = new Set((val || '').split(/\s+/).filter(Boolean));
    this._syncClassName();
  }

  get value() { return this._value; }
  set value(val) { this._value = String(val); }

  get style() { return this._style; }
  set style(val) {
    if (typeof val === 'object') {
      Object.assign(this._style, val);
    }
  }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join('');
  }
  set textContent(val) {
    this.children = [];
    this._textContent = String(val);
    this._innerHTML = escapeHtml(String(val));
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map(c => c.outerHTML).join('');
  }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this._textContent = stripHtml(String(val));
    // Parse top-level simple elements if needed
    this.children = parseSimpleHtml(this._innerHTML, this);
  }

  get outerHTML() {
    const attrs = Array.from(this.attributes.entries())
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('');
    const tag = this.tagName.toLowerCase();
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  getAttribute(name) {
    return this.attributes.get(name.toLowerCase()) || null;
  }

  setAttribute(name, val) {
    const lower = name.toLowerCase();
    this.attributes.set(lower, String(val));
    if (lower === 'class') {
      this.classList._classes = new Set(String(val).split(/\s+/).filter(Boolean));
    }
    if (lower === 'value') {
      this._value = String(val);
    }
  }

  hasAttribute(name) {
    return this.attributes.has(name.toLowerCase());
  }

  removeAttribute(name) {
    const lower = name.toLowerCase();
    this.attributes.delete(lower);
    if (lower === 'class') {
      this.classList._classes.clear();
    }
  }

  appendChild(child) {
    if (child) {
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parentNode = null;
      this.children.splice(index, 1);
    }
    return child;
  }

  addEventListener(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event).filter(h => h !== handler);
      this.listeners.set(event, list);
    }
  }

  dispatchEvent(event) {
    const eventType = typeof event === 'string' ? event : event.type;
    const evtObj = typeof event === 'string' ? { type: event, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } } : event;
    evtObj.target = this;
    const handlers = this.listeners.get(eventType) || [];
    for (const h of handlers) {
      try { h.call(this, evtObj); } catch (err) { console.error('Handler error:', err); }
    }
    return !evtObj.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, preventDefault() {} });
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const match = createMatcher(selector);

    function walk(node) {
      for (const child of node.children) {
        if (match(child)) {
          results.push(child);
        }
        walk(child);
      }
    }
    walk(this);
    return results;
  }

  getContext(type) {
    if (this.tagName === 'CANVAS') {
      return createMockCanvas2dContext();
    }
    return null;
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, '');
}

/**
 * Creates CSS selector matcher for simple selectors
 */
function createMatcher(selector) {
  selector = selector.trim();
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    return (el) => el.id === id;
  }
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return (el) => el.classList.contains(cls);
  }
  if (selector.startsWith('[')) {
    const match = selector.match(/^\[([a-zA-Z0-9_-]+)(?:=(?:"|')?([^"']*)(?:"|')?)?\]$/);
    if (match) {
      const attr = match[1].toLowerCase();
      const val = match[2];
      return (el) => {
        if (!el.hasAttribute(attr)) return false;
        return val === undefined || el.getAttribute(attr) === val;
      };
    }
  }
  // Tag name
  const upper = selector.toUpperCase();
  return (el) => el.tagName === upper;
}

/**
 * Lightweight HTML parser for extracting tags into MockElements
 */
function parseSimpleHtml(html, parentNode = null) {
  const elements = [];
  const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>(.*?)<\/\1>|<([a-zA-Z0-9-]+)([^>]*)\/?>/gs;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1] || match[4];
    const rawAttrs = match[2] || match[5] || '';
    const innerContent = match[3] || '';

    const el = new MockElement(tagName);
    if (parentNode) el.parentNode = parentNode;

    // Parse attributes
    const attrRegex = /([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const name = attrMatch[1];
      const val = attrMatch[2] !== undefined ? attrMatch[2] : '';
      el.setAttribute(name, val);
    }

    if (innerContent) {
      el.innerHTML = innerContent;
    }
    elements.push(el);
  }
  return elements;
}

/**
 * Mock Canvas 2D context for particle testing
 */
function createMockCanvas2dContext() {
  const calls = [];
  return {
    _calls: calls,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    globalAlpha: 1,
    clearRect(x, y, w, h) { calls.push({ method: 'clearRect', args: [x, y, w, h] }); },
    fillRect(x, y, w, h) { calls.push({ method: 'fillRect', args: [x, y, w, h] }); },
    beginPath() { calls.push({ method: 'beginPath' }); },
    arc(x, y, r, s, e) { calls.push({ method: 'arc', args: [x, y, r, s, e] }); },
    ellipse(x, y, rx, ry, rot, s, e) { calls.push({ method: 'ellipse', args: [x, y, rx, ry, rot, s, e] }); },
    fill() { calls.push({ method: 'fill' }); },
    stroke() { calls.push({ method: 'stroke' }); },
    save() { calls.push({ method: 'save' }); },
    restore() { calls.push({ method: 'restore' }); },
    translate(x, y) { calls.push({ method: 'translate', args: [x, y] }); },
    rotate(a) { calls.push({ method: 'rotate', args: [a] }); }
  };
}

/**
 * Mock LocalStorage in-memory implementation
 */
class MockLocalStorage {
  constructor(initialData = {}) {
    this._store = new Map();
    for (const [k, v] of Object.entries(initialData)) {
      this._store.set(k, String(v));
    }
  }

  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null;
  }

  setItem(key, val) {
    this._store.set(key, String(val));
  }

  removeItem(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }

  key(n) {
    return Array.from(this._store.keys())[n] || null;
  }

  get length() {
    return this._store.size;
  }

  dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) {
      try { obj[k] = JSON.parse(v); } catch { obj[k] = v; }
    }
    return obj;
  }
}

/**
 * Mock Document implementation
 */
class MockDocument {
  constructor() {
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.hidden = false;
    this.listeners = new Map();
  }

  createElement(tagName) {
    return new MockElement(tagName);
  }

  getElementById(id) {
    return this.body.querySelector(`#${id}`) || this.head.querySelector(`#${id}`);
  }

  querySelector(selector) {
    return this.body.querySelector(selector) || this.head.querySelector(selector);
  }

  querySelectorAll(selector) {
    const inBody = this.body.querySelectorAll(selector);
    const inHead = this.head.querySelectorAll(selector);
    return [...inBody, ...inHead];
  }

  addEventListener(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event).filter(h => h !== handler);
      this.listeners.set(event, list);
    }
  }

  dispatchEvent(event) {
    const eventType = typeof event === 'string' ? event : event.type;
    const evtObj = typeof event === 'string' ? { type: event, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } } : event;
    const handlers = this.listeners.get(eventType) || [];
    for (const h of handlers) {
      try { h.call(this, evtObj); } catch (err) { console.error('Doc event error:', err); }
    }
    return !evtObj.defaultPrevented;
  }
}

/**
 * Create an isolated test environment with simulated browser globals
 */
function createTestEnv(options = {}) {
  const {
    initialStorage = {},
    scripts = [],
    url = 'file:///c:/Users/User/Desktop/Projects/Diploy/index.html',
    prepopulateHtml = '',
    reducedMotion = false
  } = options;

  const document = new MockDocument();
  if (prepopulateHtml) {
    document.body.innerHTML = prepopulateHtml;
  }

  const localStorage = new MockLocalStorage(initialStorage);
  const mediaListeners = [];

  let nextRafId = 1;
  const rafCallbacks = new Map();

  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    location: {
      href: url,
      pathname: url.replace(/^file:\/\/\/[a-zA-Z]:/, '').split('?')[0],
      search: url.includes('?') ? url.split('?')[1] : '',
      hash: ''
    },
    localStorage: localStorage,
    document: document,
    matchMedia(query) {
      const isReduced = query.includes('prefers-reduced-motion') && query.includes('reduce');
      return {
        matches: isReduced ? !!reducedMotion : false,
        media: query,
        addEventListener(evt, fn) { mediaListeners.push({ query, evt, fn }); },
        removeEventListener(evt, fn) {
          const idx = mediaListeners.findIndex(l => l.fn === fn);
          if (idx !== -1) mediaListeners.splice(idx, 1);
        }
      };
    },
    requestAnimationFrame(cb) {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    },
    cancelAnimationFrame(id) {
      rafCallbacks.delete(id);
    },
    addEventListener(event, fn) { document.addEventListener(event, fn); },
    removeEventListener(event, fn) { document.removeEventListener(event, fn); },
    dispatchEvent(event) { return document.dispatchEvent(event); },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    RegExp: RegExp,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean
  };

  mockWindow.window = mockWindow;

  const context = vm.createContext(mockWindow);

  // Load requested scripts
  for (const scriptFile of scripts) {
    const fullPath = path.isAbsolute(scriptFile)
      ? scriptFile
      : path.join(PROJECT_ROOT, 'js', scriptFile);

    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        vm.runInContext(code, context, { filename: scriptFile });
      } catch (err) {
        throw new Error(`Failed to execute script ${scriptFile}: ${err.message}\n${err.stack}`);
      }
    }
  }

  return {
    window: mockWindow,
    document: document,
    localStorage: localStorage,
    context: context,
    stepAnimation(timestamp = Date.now()) {
      const callbacks = Array.from(rafCallbacks.values());
      rafCallbacks.clear();
      for (const cb of callbacks) {
        try { cb(timestamp); } catch (err) { console.error('RAF error:', err); }
      }
      return callbacks.length;
    },
    hasPendingAnimation() {
      return rafCallbacks.size > 0;
    },
    triggerMediaChange(reduced) {
      for (const l of mediaListeners) {
        if (l.query.includes('prefers-reduced-motion')) {
          l.fn({ matches: reduced });
        }
      }
    }
  };
}

/**
 * File inspection and static verification helpers
 */
function readProjectFile(relPath) {
  const full = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function projectFileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relPath));
}

function readAllHtmlFiles() {
  const files = ['index.html', 'catalog.html', 'product.html', 'cart.html', 'profile.html', 'admin.html'];
  const res = {};
  for (const f of files) {
    res[f] = readProjectFile(f);
  }
  return res;
}

function readCss() {
  return readProjectFile('css/style.css');
}

/**
 * Unicode emoji detector
 */
function findEmojis(text) {
  if (!text) return [];
  // Regex covering standard emojis and pictographs
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}]/gu;
  const matches = [];
  let m;
  while ((m = emojiRegex.exec(text)) !== null) {
    matches.push({ emoji: m[0], index: m.index });
  }
  return matches;
}

/**
 * Validate JavaScript syntax without execution
 */
function validateJsSyntax(relPath) {
  const content = readProjectFile(relPath);
  if (content === null) {
    return { ok: false, error: 'File does not exist: ' + relPath };
  }
  try {
    new vm.Script(content, { filename: relPath });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  PROJECT_ROOT,
  MockElement,
  MockDocument,
  MockLocalStorage,
  createTestEnv,
  readProjectFile,
  projectFileExists,
  readAllHtmlFiles,
  readCss,
  findEmojis,
  validateJsSyntax
};
