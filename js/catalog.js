/**
 * ==============================================================================
 * DIPLOY GAMES - ЛОГИКА СТРАНИЦЫ КАТАЛОГА (catalog.js)
 * ==============================================================================
 * Этот модуль отвечает за:
 * 1. Получение каталога товаров из getCatalog()
 * 2. Фильтрацию товаров по:
 *    - Поисковой строке
 *    - Категории (игры, валюта, подписки)
 *    - Платформам (Steam, EGS, Xbox, PlayStation, EA)
 *    - Диапазону цен (от / до)
 *    - Флагу «Только со скидкой»
 * 3. Сортировку товаров (популярность, цена возрастание/убывание, скидка, алфавит)
 * 4. Считывание параметров из адресной строки (?search=..., ?category=..., ?discount=...)
 * 5. Отрисовку карточек товаров в сетке
 */

document.addEventListener("DOMContentLoaded", () => {
  // Элементы управления фильтрами
  const searchInput = document.getElementById("filter-search");
  const categoryRadios = document.querySelectorAll('input[name="filter-category"]');
  const platformCheckboxes = document.querySelectorAll(".filter-platform");
  const priceMinInput = document.getElementById("filter-price-min");
  const priceMaxInput = document.getElementById("filter-price-max");
  const discountOnlyCheckbox = document.getElementById("filter-discount-only");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const emptyResetBtn = document.getElementById("empty-reset-btn");

  // Элементы вывода результатов
  const sortSelect = document.getElementById("catalog-sort-select");
  const catalogGrid = document.getElementById("catalog-grid");
  const countText = document.getElementById("catalog-count-text");
  const emptyMsg = document.getElementById("catalog-empty-msg");

  // ============================================================================
  // 1. СЧИТЫВАНИЕ URL ПАРАМЕТРОВ ПРИ ПЕРЕХОДЕ С ДРУГИХ СТРАНИЦ
  // ============================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const headerSearchInput = document.getElementById("header-search-input");

  // Параметр поиска: ?search=witcher
  if (urlParams.has("search")) {
    const searchVal = urlParams.get("search");
    searchInput.value = searchVal;
    if (headerSearchInput) headerSearchInput.value = searchVal;
  }

  // Живая синхронизация строки поиска в шапке на странице каталога
  if (headerSearchInput) {
    headerSearchInput.addEventListener("input", (e) => {
      searchInput.value = e.target.value;
      filterAndRender();
    });
    searchInput.addEventListener("input", (e) => {
      headerSearchInput.value = e.target.value;
    });
  }

  // Параметр категории: ?category=games
  if (urlParams.has("category")) {
    const cat = urlParams.get("category");
    categoryRadios.forEach(radio => {
      if (radio.value === cat) radio.checked = true;
    });
  }

  // Параметр платформы: ?platform=steam
  if (urlParams.has("platform")) {
    const plat = urlParams.get("platform");
    platformCheckboxes.forEach(cb => {
      if (cb.value === plat) cb.checked = true;
    });
  }

  // Параметр скидки: ?discount=true
  if (urlParams.get("discount") === "true") {
    discountOnlyCheckbox.checked = true;
  }

  // ============================================================================
  // 2. ФУНКЦИЯ ФИЛЬТРАЦИИ И СОРТИРОВКИ
  // ============================================================================
  function filterAndRender() {
    const allProducts = getCatalog();

    // Текущие значения фильтров
    const searchQuery = (searchInput.value || "").toLowerCase().trim();
    
    let selectedCategory = "all";
    categoryRadios.forEach(radio => {
      if (radio.checked) selectedCategory = radio.value;
    });

    const selectedPlatforms = Array.from(platformCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const minPrice = priceMinInput.value ? Math.max(0, parseFloat(priceMinInput.value) || 0) : 0;
    const maxPrice = priceMaxInput.value ? (parseFloat(priceMaxInput.value) || Infinity) : Infinity;
    const discountOnly = discountOnlyCheckbox.checked;

    // Фильтрация элементов массива
    let result = allProducts.filter(item => {
      // 1. Поиск по названию, жанру, разработчику, платформе или категории
      if (searchQuery) {
        const matchesTitle = item.title && item.title.toLowerCase().includes(searchQuery);
        const matchesGenre = item.genre && item.genre.toLowerCase().includes(searchQuery);
        const matchesDev = item.developer && item.developer.toLowerCase().includes(searchQuery);
        const matchesPlatform = item.platformName && item.platformName.toLowerCase().includes(searchQuery);
        const matchesCategory = item.categoryName && item.categoryName.toLowerCase().includes(searchQuery);
        if (!matchesTitle && !matchesGenre && !matchesDev && !matchesPlatform && !matchesCategory) return false;
      }

      // 2. Фильтр по категории
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // 3. Фильтр по платформе (если выбраны платформы)
      if (selectedPlatforms.length > 0) {
        if (!selectedPlatforms.includes(item.platform)) {
          return false;
        }
      }

      // 4. Фильтр по цене
      const price = item.price || 0;
      if (price < minPrice || price > maxPrice) {
        return false;
      }

      // 5. Только со скидкой
      if (discountOnly && (!item.discount || item.discount <= 0)) {
        return false;
      }

      return true;
    });

    // Сортировка результата
    const sortVal = sortSelect.value;
    if (sortVal === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortVal === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortVal === "discount") {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sortVal === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // По популярности / рейтингу
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // ==========================================================================
    // 3. ОТРИСОВКА В ИНТЕРФЕЙС
    // ==========================================================================
    countText.innerHTML = `Найдено: <strong>${result.length}</strong> товаров`;

    if (result.length === 0) {
      catalogGrid.innerHTML = "";
      emptyMsg.style.display = "block";
    } else {
      emptyMsg.style.display = "none";
      catalogGrid.innerHTML = result.map(item => {
        const isCurrency = item.isCustomCurrency || item.category === "currency";
        const discountBadge = item.discount
          ? `<span class="badge badge-discount">-${item.discount}%</span>`
          : (isCurrency ? `<span class="badge badge-discount">Комиссия 4%</span>` : "");
        const hitBadge = item.isHit ? `<span class="badge badge-hit">ХИТ</span>` : "";

        return `
          <div class="product-card">
            <div class="product-card-img-wrap">
              <img src="${item.coverImage}" alt="${item.title}" class="product-card-img" loading="lazy" onerror="handleImageError(this)">
              <div class="product-card-badges">
                <span class="badge badge-instant">${getIcon('flash')} АВТОВЫДАЧА</span>
                ${discountBadge}
                ${hitBadge}
              </div>
              <span class="product-card-platform">${item.platformName}</span>
              <div class="card-img-footer">
                <span class="card-status-dot">${getIcon('dot')} Моментально</span>
                <span class="card-rating-pill">${getIcon('star')} ${item.rating || 4.9}</span>
              </div>
            </div>
            <div class="product-card-body">
              <div class="product-card-genre">${item.categoryName} • ${item.genre}</div>
              <h3 class="product-card-title">
                <a href="product.html?id=${item.id}">${item.title}</a>
              </h3>
              <div class="card-trust-tag">
                ${getIcon('shield')} 100% Гарантия • ${getIcon('flash')} Доставка 1 мин
              </div>
              <div class="product-card-footer">
                <div class="product-card-prices">
                  ${isCurrency ? `
                    <span style="font-size: 0.72rem; color: var(--accent-green); font-weight: 700;">Любая сумма</span>
                    <span class="product-card-current-price">от ${formatPrice(item.price)}</span>
                  ` : `
                    ${item.oldPrice ? `<span class="product-card-old-price">${formatPrice(item.oldPrice)}</span>` : ""}
                    <span class="product-card-current-price">${formatPrice(item.price)}</span>
                  `}
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="product-card-buy-btn" onclick="addToCart('${item.id}', 0, 1)" title="В корзину">
                    ${getIcon('cart')}
                  </button>
                  <a href="product.html?id=${item.id}" class="btn btn-secondary btn-sm" title="Купить">
                    Купить
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // ============================================================================
  // 4. СЛУШАТЕЛИ СОБЫТИЙ ДЛЯ ФИЛЬТРОВ
  // ============================================================================
  searchInput.addEventListener("input", filterAndRender);
  categoryRadios.forEach(radio => radio.addEventListener("change", filterAndRender));
  platformCheckboxes.forEach(cb => cb.addEventListener("change", filterAndRender));
  priceMinInput.addEventListener("input", filterAndRender);
  priceMaxInput.addEventListener("input", filterAndRender);
  discountOnlyCheckbox.addEventListener("change", filterAndRender);
  sortSelect.addEventListener("change", filterAndRender);

  // Сброс всех фильтров
  function resetAllFilters() {
    searchInput.value = "";
    if (headerSearchInput) headerSearchInput.value = "";
    categoryRadios.forEach(r => r.checked = (r.value === "all"));
    platformCheckboxes.forEach(cb => cb.checked = false);
    priceMinInput.value = "";
    priceMaxInput.value = "";
    discountOnlyCheckbox.checked = false;
    sortSelect.value = "popular";
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    filterAndRender();
  }

  if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetAllFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAllFilters);

  // Первоначальный запуск фильтрации
  filterAndRender();
});
