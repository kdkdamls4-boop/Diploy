/**
 * ==============================================================================
 * DIPLOY GAMES - СЛОВАРЬ ВЕКТОРНЫХ SVG-ИКОНОК (js/icons.js)
 * ==============================================================================
 * Модуль предоставляет централизованный словарь векторных SVG-иконок
 * для замены устаревших эмодзи на сайте магазина.
 *
 * Особенности архитектуры:
 * - 100% чистый Vanilla JavaScript без сборщиков и без ES-модулей (import/export).
 * - Полная автономность и работоспособность при открытии через протокол file:///.
 * - Единый стандарт сетки viewBox="0 0 24 24" и адаптивного цвета fill="currentColor".
 * - Простота интеграции в HTML и JS-шаблоны для уровня Junior/студента.
 *
 * ОСНОВНЫЕ ФУНКЦИИ:
 * 1. getIcon(name, className) -> возвращает HTML-строку <svg class="svg-icon ...">...</svg>
 * 2. renderIcon(name, options) -> гибкий рендер с настройкой размеров, цветов и подсказок
 * 3. initIcons(container) -> автоматически находит [data-icon="name"] и вставляет SVG
 */

// 1. Словарь внутренних векторных контуров (все иконки оптимизированы под сетку 24x24)
const SVG_ICONS = {
  // --- Базовые иконки магазина и интерфейса ---
  flash: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>',
  shield: '<path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="currentColor"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"/><line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="7" width="20" height="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" fill="none" stroke="currentColor" stroke-width="2"/>',
  fire: '<path d="M12 23c-4.97 0-9-3.58-9-8 0-3.66 3.09-7.25 4.88-9.14a1 1 0 0 1 1.45.07C10.15 6.9 11 8.5 11 10c0 .55.45 1 1 1s1-.45 1-1c0-2.38 1.42-4.9 2.78-6.6a1 1 0 0 1 1.57-.02C19.06 5.4 21 8.87 21 15c0 4.42-4.03 8-9 8z" fill="currentColor"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>',
  cart: '<circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  check: '<polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  // --- Стрелки и элементы управления ---
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="12 5 19 12 12 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'external-link': '<line x1="7" y1="17" x2="17" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 7 17 7 17 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  cross: '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  refresh: '<polyline points="23 4 23 10 17 10" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="1 20 1 14 7 14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" fill="none" stroke="currentColor" stroke-width="2"/>',
  trash: '<polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2"/><line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>',

  // --- Игровые бренды и платформы ---
  steam: '<path d="M11.979 0C5.669 0 .504 4.908.026 11.12l4.897 2.022a3.52 3.52 0 0 1 2.003-.625c.106 0 .211.006.315.018l2.366-3.428a4.786 4.786 0 0 1-.097-.96 4.802 4.802 0 1 1 4.8 4.802c-.013 0-.025 0-.038-.001l-3.376 2.45a3.57 3.57 0 0 1 .032.482 3.535 3.535 0 0 1-3.532 3.532 3.55 3.55 0 0 1-2.92-1.54L.272 19.14A12 12 0 1 0 11.98 0zm-4.51 14.54l-1.488-.615a2.535 2.535 0 0 0 2.474 1.83 2.544 2.544 0 0 0 2.537-2.536 2.545 2.545 0 0 0-2.537-2.537c-.12 0-.238.012-.353.03l1.523.63a1.9 1.9 0 0 1 1.03 1.666 1.902 1.902 0 0 1-1.9 1.902 1.896 1.896 0 0 1-1.286-.37zm8.541-6.393a2.802 2.802 0 1 0 0 5.604 2.802 2.802 0 0 0 0-5.604z" fill="currentColor"/>',
  roblox: '<path d="M4.65 0L0 19.35 19.35 24 24 4.65 4.65 0zm10.74 13.93l-3.93.95-.95-3.93 3.93-.95.95 3.93z" fill="currentColor"/>',
  playstation: '<path d="M8.94 4.5v12.18l3.43 1.08V3.12c0-.52-.28-.9-.77-1.04-.47-.14-.97.02-1.29.35L8.94 4.5zm5.72 10.97c-2.48-.84-5.38-1.32-8.31-1.42l-.17.65c2.72.1 5.37.52 7.63 1.25.96.31 1.48.71 1.48 1.13 0 .74-1.31 1.25-3.35 1.25-1.93 0-3.9-.45-5.59-1.27l-.46.59c1.92.93 4.16 1.44 6.36 1.44 2.53 0 4.25-.66 4.25-1.78 0-.96-1.1-1.57-1.84-1.84zm6.07-2.31c-.13-.39-.44-.72-.94-.96-.75-.36-1.84-.57-3.11-.64l-.22.84c1.1.06 2.03.23 2.61.51.37.18.51.38.51.58 0 .44-.65.78-1.74.92-1.26.16-2.92.1-4.73-.17l-.23.86c1.94.29 3.79.35 5.21.17 1.46-.18 2.53-.66 2.53-1.63 0-.17-.03-.33-.09-.48z" fill="currentColor"/>',
  xbox: '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.91 17.61c-1.36 1.42-3.1 2.37-4.91 2.37-1.81 0-3.55-.95-4.91-2.37 1.62-1.75 3.32-3.66 4.91-5.52 1.59 1.86 3.29 3.77 4.91 5.52zm1.87-3.4c-.66-1.74-2.85-5.26-6.02-8.35 1.55-.54 3.22-.84 4.96-.84.44 0 .87.02 1.3.06-.52 2.87-.24 6.27-.24 9.13zm-17.56 0c0-2.86.28-6.26-.24-9.13.43-.04.86-.06 1.3-.06 1.74 0 3.41.3 4.96.84-3.17 3.09-5.36 6.61-6.02 8.35z" fill="currentColor"/>',

  // --- Категории товаров и служебные значки ---
  gamepad: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59l-.865 7.79a3 3 0 0 0 2.5 3.31A3.2 3.2 0 0 0 6 19.45l2.67-2.67a1 1 0 0 1 .71-.28h5.24a1 1 0 0 1 .71.28L18 19.45a3.2 3.2 0 0 0 1.66.24 3 3 0 0 0 2.5-3.31l-.865-7.79A4 4 0 0 0 17.32 5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  coins: '<ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" fill="none" stroke="currentColor" stroke-width="2"/>',
  package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21" stroke="currentColor" stroke-width="2"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>',
  key: '<path d="M21 2l-2 2m-1.5 1.5L16 7l-2 2-2 2M15 4l3 3M11 8l2 2m-2 2l-1.5 1.5a5 5 0 1 1-7-7L8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="currentColor" stroke-width="2"/>',
  dot: '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3m5-7a22 22 0 0 1 7 7c0 0-1 3-4 3l-3-3-3-3c0-3 3-4 3-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  info: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  pumpkin: '<path d="M12 2v3M9 3c-1.5 1-2 3-2 3M12 7c-4.4 0-8 3.1-8 7s3.6 7 8 7 8-3.1 8-7-3.6-7-8-7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12l1 2-1 1M15 12l-1 2 1 1M8 17s1.5 2 4 2 4-2 4-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
};

/**
 * 2. Получение SVG-иконки в виде готовой строки разметки.
 * Идеально подходит для интерполяции в шаблонных строках `${getIcon('cart')}`.
 *
 * @param {string} name - Название иконки (например: 'cart', 'flash', 'star')
 * @param {string} [className] - Дополнительный CSS-класс для кастомизации
 * @returns {string} Строка SVG-разметки
 */
function getIcon(name, className) {
  const path = SVG_ICONS[name] || SVG_ICONS['info'] || '';
  const extraClass = className ? ' ' + className : '';
  return '<svg class="svg-icon icon-' + name + extraClass + '" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">' + path + '</svg>';
}

/**
 * 3. Расширенный рендер иконки с поддержкой объекта параметров.
 * Позволяет гибко переопределять размер, цвет заливки и заголовок доступности.
 *
 * @param {string} name - Название иконки
 * @param {Object|string} [options] - Параметры рендера или имя CSS-класса
 * @returns {string} Строка SVG-разметки
 */
function renderIcon(name, options) {
  if (typeof options === 'string') {
    return getIcon(name, options);
  }
  const opts = options || {};
  const size = opts.size || '1em';
  const extraClass = opts.className ? ' ' + opts.className : '';
  const path = SVG_ICONS[name] || SVG_ICONS['info'] || '';
  const fill = opts.fill || 'currentColor';
  const titleTag = opts.title ? '<title>' + opts.title + '</title>' : '';
  return '<svg class="svg-icon icon-' + name + extraClass + '" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="' + fill + '" aria-hidden="true">' + titleTag + path + '</svg>';
}

/**
 * 4. Автоматическая замена заглушек [data-icon="name"] в статическом HTML на векторный SVG.
 * Позволяет верстать страницы без копирования длинного XML-кода:
 * <span data-icon="search"></span>
 *
 * @param {HTMLElement|Document} [container=document] - Корневой элемент для сканирования
 */
function initIcons(container) {
  const root = container || (typeof document !== 'undefined' ? document : null);
  if (!root || typeof root.querySelectorAll !== 'function') return;

  const elements = root.querySelectorAll('[data-icon]');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const iconName = el.getAttribute('data-icon');
    const customClass = el.getAttribute('data-icon-class') || '';
    if (iconName && SVG_ICONS[iconName]) {
      el.innerHTML = getIcon(iconName, customClass);
    }
  }
}

// 5. Автоматическая инициализация при загрузке документа (если доступен в браузере)
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', function() {
    initIcons();
  });
}

// 6. Экспорт в глобальный контекст window для использования в других скриптах
if (typeof window !== 'undefined') {
  window.SVG_ICONS = SVG_ICONS;
  window.getIcon = getIcon;
  window.renderIcon = renderIcon;
  window.initIcons = initIcons;
}
