/**
 * ==============================================================================
 * DIPLOY GAMES - ЛОГИКА АДМИН-ПАНЕЛИ (admin.js)
 * ==============================================================================
 * Этот модуль отвечает за:
 * 1. Отрисовку таблицы всех существующих товаров из getCatalog()
 * 2. Добавление нового товара в каталог через форму:
 *    - Валидация полей
 *    - Генерация уникального ID
 *    - Автоматический расчет старой цены при указании скидки
 *    - Сохранение в localStorage через saveCatalog()
 * 3. Удаление товара из каталога
 * 4. Сброс каталога к базовым демонстрационным товарам (resetCatalogToDefault())
 */

document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("add-product-form");
  const tbody = document.getElementById("admin-products-tbody");
  const totalCountEl = document.getElementById("admin-total-count");
  const resetBtn = document.getElementById("reset-catalog-btn");
  let currentLogFilter = "all";

  // ============================================================================
  // 0. АВТОРИЗАЦИЯ И ЗАЩИТА ДОСТУПА В АДМИН-ПАНЕЛЬ
  // ============================================================================
  const ADMIN_AUTH_KEY = "diploy_admin_authenticated";
  const ADMIN_EMAIL = "peredatprava@gmail.com";
  // Пароль: "1   " (также принимаем "1" без пробелов, чтобы предотвратить опечатки)
  const ADMIN_PASS = "1   ";

  const authScreen = document.getElementById("admin-auth-screen");
  const panelContent = document.getElementById("admin-panel-content");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("admin-login-error");
  const logoutBtn = document.getElementById("admin-logout-btn");

  /**
   * Проверка, авторизован ли текущий пользователь как администратор
   */
  function isUserAdmin() {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === "true" || localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  }

  /**
   * Обновление отображения страницы: показ экрана входа или панели управления
   */
  function updateAdminView() {
    const isAuth = isUserAdmin();
    if (isAuth) {
      if (authScreen) authScreen.style.display = "none";
      if (panelContent) panelContent.style.display = "block";
      renderProductsTable();
      renderAdminLogsTable(currentLogFilter);
    } else {
      if (authScreen) authScreen.style.display = "flex";
      if (panelContent) panelContent.style.display = "none";
    }
    if (typeof initIcons === "function") {
      initIcons(document);
    }
  }

  // Обработка формы авторизации администратора
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("admin-login-email");
      const passInput = document.getElementById("admin-login-password");
      
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      const pass = passInput ? passInput.value : "";

      const isEmailValid = (email === ADMIN_EMAIL);
      const isPassValid = (pass === ADMIN_PASS || pass.trim() === "1");

      if (isEmailValid && isPassValid) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
        localStorage.setItem(ADMIN_AUTH_KEY, "true");
        if (loginError) loginError.style.display = "none";
        if (typeof addSystemLog === "function") {
          addSystemLog("ADMIN", "Вход администратора", "Успешная авторизация в панели управления peredatprava@gmail.com", ADMIN_EMAIL);
        }
        showToast("Успешный вход в панель администратора!", "success");
        updateAdminView();
      } else {
        if (loginError) {
          loginError.textContent = "Неверный email или пароль. Доступ разрешен только для peredatprava@gmail.com";
          loginError.style.display = "block";
        }
        showToast("Доступ запрещен: неверные учетные данные!", "error");
      }
    });
  }

  // Обработка кнопки выхода из админки
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (typeof addSystemLog === "function") {
        addSystemLog("ADMIN", "Выход администратора", "Завершение сеанса управления", ADMIN_EMAIL);
      }
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
      localStorage.removeItem(ADMIN_AUTH_KEY);
      showToast("Вы вышли из панели управления", "info");
      updateAdminView();
    });
  }

  // Словари для человекочитаемых названий категорий и платформ
  const CATEGORY_NAMES = {
    games: "Игры",
    currency: "Игровая валюта",
    subscriptions: "Подписки"
  };

  const PLATFORM_NAMES = {
    steam: "Steam",
    epic: "Epic Games",
    xbox: "Xbox / PC",
    playstation: "PlayStation",
    ea: "EA App"
  };

  // Стандартные стильные обложки для товаров без ссылки
  const FALLBACK_IMAGES = {
    games: "assets/covers/minecraft.svg",
    currency: "assets/covers/steam-wallet.svg",
    subscriptions: "assets/covers/xbox-gamepass.svg"
  };

  // ============================================================================
  // 1. ОТРИСОВКА ТАБЛИЦЫ ТОВАРОВ
  // ============================================================================
  function renderProductsTable() {
    const catalog = getCatalog();
    totalCountEl.textContent = catalog.length;

    if (catalog.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);">
            В каталоге нет товаров. Добавьте первый товар через форму слева или нажмите «Сбросить к базовому».
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = catalog.map(item => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${item.coverImage}" alt="${item.title}" style="width: 50px; height: 32px; object-fit: cover; border-radius: 4px;" onerror="handleImageError(this)">
            <div>
              <div style="font-weight: 700; color: #fff;">
                <a href="product.html?id=${item.id}" target="_blank" title="Открыть страницу товара">
                  ${item.title} ${getIcon('external-link')}
                </a>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${item.genre || ""}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-platform">${item.categoryName || item.category}</span>
        </td>
        <td>
          <span class="badge" style="background-color: #2b394e; color: #66c0f4;">${item.platformName || item.platform}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: #fff;">${formatPrice(item.price)}</div>
          ${item.discount ? `<div style="font-size: 0.75rem; color: var(--accent-green);">Скидка -${item.discount}%</div>` : ""}
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="deleteProduct('${item.id}')" style="color: var(--accent-red); padding: 4px 8px; font-size: 0.8rem;">
            ${getIcon('trash')} Удалить
          </button>
        </td>
      </tr>
    `).join("");
  }

  // ============================================================================
  // 2. ДОБАВЛЕНИЕ НОВОГО ТОВАРА
  // ============================================================================
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!isUserAdmin()) {
        showToast("Ошибка: требуется авторизация администратора!", "error");
        updateAdminView();
        return;
      }

      const title = document.getElementById("prod-title").value.trim();
      const category = document.getElementById("prod-category").value;
      const platform = document.getElementById("prod-platform").value;
      const price = parseFloat(document.getElementById("prod-price").value) || 0;
      const rawDiscount = parseInt(document.getElementById("prod-discount").value, 10) || 0;
      const discount = Math.max(0, Math.min(95, rawDiscount));
      const genre = document.getElementById("prod-genre").value.trim() || "Цифровой ключ";
      const image = document.getElementById("prod-image").value.trim() || FALLBACK_IMAGES[category];
      const desc = document.getElementById("prod-desc").value.trim() || "Официальный цифровой ключ с мгновенной активацией.";

      if (!title || price <= 0) {
        showToast("Заполните обязательные поля корректно!", "error");
        return;
      }

      // Расчет старой цены при наличии скидки
      let oldPrice = null;
      if (discount > 0) {
        oldPrice = Math.round(price / (1 - (discount / 100)));
      }

      // Формируем уникальный ID товара
      const id = "custom-" + Date.now();

      // Адаптируем системные требования под категорию товара
      let reqMin, reqRec;
      if (category === "currency") {
        reqMin = {
          os: "Любое совместимое устройство",
          cpu: "Не требуется",
          ram: "Не требуется",
          gpu: "Не требуется",
          disk: `Аккаунт ${PLATFORM_NAMES[platform] || "платформы"}`
        };
        reqRec = {
          os: "Любое устройство с браузером",
          cpu: "Не требуется",
          ram: "Не требуется",
          gpu: "Не требуется",
          disk: `Активация в ${PLATFORM_NAMES[platform] || "сервисе"}`
        };
      } else if (category === "subscriptions") {
        reqMin = {
          os: "Windows 10 / Совместимая консоль",
          cpu: "Совместимый ПК или консоль",
          ram: "8 ГБ",
          gpu: "Зависит от выбранной игры",
          disk: `Приложение ${PLATFORM_NAMES[platform] || "сервиса"}`
        };
        reqRec = {
          os: "Windows 11 / Консоль нового поколения",
          cpu: "Современный многоядерный процессор",
          ram: "16 ГБ",
          gpu: "Игровая видеокарта RTX / RX",
          disk: "Широкополосный доступ в Интернет"
        };
      } else {
        reqMin = {
          os: "Windows 10 (64-bit)",
          cpu: "Intel Core i5 / AMD Ryzen 3",
          ram: "8 ГБ",
          gpu: "Современная видеокарта DirectX 11",
          disk: "Достаточно свободного места"
        };
        reqRec = {
          os: "Windows 11 (64-bit)",
          cpu: "Intel Core i7 / AMD Ryzen 5",
          ram: "16 ГБ",
          gpu: "Игровая видеокарта RTX / RX",
          disk: "Быстрый SSD накопитель"
        };
      }

      const newProduct = {
        id: id,
        title: title,
        category: category,
        categoryName: CATEGORY_NAMES[category] || "Игры",
        platform: platform,
        platformName: PLATFORM_NAMES[platform] || "Steam",
        genre: genre,
        developer: "Официальный издатель",
        releaseDate: "2026",
        rating: 4.8,
        reviewsCount: 120,
        price: price,
        oldPrice: oldPrice,
        discount: discount,
        isHit: false,
        coverImage: image,
        screenshots: [image],
        description: desc,
        editions: [
          {
            name: "Стандартное издание",
            description: "Лицензионный цифровой ключ",
            price: price,
            oldPrice: oldPrice,
            discount: discount
          }
        ],
        requirements: {
          min: reqMin,
          rec: reqRec
        }
      };

      const catalog = getCatalog();
      catalog.unshift(newProduct); // Добавляем товар в начало списка
      saveCatalog(catalog);

      if (typeof addSystemLog === "function") {
        addSystemLog("CATALOG", "Добавлен новый товар", `Товар «${title}» (${CATEGORY_NAMES[category] || category}) добавлен по цене ${formatPrice(price)}`, ADMIN_EMAIL);
      }

      showToast(`Товар «${title}» успешно добавлен в каталог!`, "success");
      addForm.reset();
      renderProductsTable();
      renderAdminLogsTable(currentLogFilter);
    });
  }

  // ============================================================================
  // 3. УДАЛЕНИЕ ТОВАРА
  // ============================================================================
  window.deleteProduct = function(productId) {
    if (!isUserAdmin()) {
      showToast("Ошибка: требуется авторизация администратора!", "error");
      updateAdminView();
      return;
    }

    if (confirm("Вы точно хотите удалить этот товар из каталога?")) {
      let catalog = getCatalog();
      const itemToDelete = catalog.find(item => item.id === productId);
      const itemTitle = itemToDelete ? itemToDelete.title : productId;

      catalog = catalog.filter(item => item.id !== productId);
      saveCatalog(catalog);

      if (typeof addSystemLog === "function") {
        addSystemLog("CATALOG", "Удален товар из каталога", `Товар «${itemTitle}» (ID: ${productId}) удален из каталога`, ADMIN_EMAIL);
      }

      renderProductsTable();
      renderAdminLogsTable(currentLogFilter);
      showToast("Товар удален из каталога", "info");
    }
  };

  // ============================================================================
  // 4. СБРОС КАТАЛОГА К БАЗОВОМУ
  // ============================================================================
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!isUserAdmin()) {
        showToast("Ошибка: требуется авторизация администратора!", "error");
        updateAdminView();
        return;
      }

      if (confirm("Сбросить каталог к стандартному списку товаров из data.js? Все добавленные товары будут удалены.")) {
        resetCatalogToDefault();
        if (typeof addSystemLog === "function") {
          addSystemLog("CATALOG", "Сброс каталога к базовому", "Все добавленные товары удалены, каталог возвращен к стандартному списку", ADMIN_EMAIL);
        }
        renderProductsTable();
        renderAdminLogsTable(currentLogFilter);
        showToast("Каталог сброшен к базовым настройкам!", "success");
      }
    });
  }

  // ============================================================================
  // 5. ЖУРНАЛ СИСТЕМНЫХ СОБЫТИЙ И АУДИТА
  // ============================================================================
  const logsTbody = document.getElementById("admin-logs-tbody");
  const logsCountBadge = document.getElementById("logs-count-badge");
  const clearLogsBtn = document.getElementById("clear-logs-btn");

  function renderAdminLogsTable(filterType = "all") {
    if (!logsTbody) return;
    const allLogs = (typeof getSystemLogs === "function") ? getSystemLogs() : [];
    if (logsCountBadge) {
      logsCountBadge.textContent = allLogs.length;
    }

    const filteredLogs = (filterType === "all")
      ? allLogs
      : allLogs.filter(log => log.type === filterType);

    if (filteredLogs.length === 0) {
      logsTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-secondary);">
            Событий в журнале не найдено ${filterType !== "all" ? `для категории «${filterType}»` : ""}.
          </td>
        </tr>
      `;
      return;
    }

    logsTbody.innerHTML = filteredLogs.map(log => {
      const typeLower = (log.type || "system").toLowerCase();
      const safeTime = (typeof escapeHtml === "function") ? escapeHtml(log.timestamp) : log.timestamp;
      const safeUser = (typeof escapeHtml === "function") ? escapeHtml(log.user || "Система") : (log.user || "Система");
      const safeAction = (typeof escapeHtml === "function") ? escapeHtml(log.action || "") : log.action;
      const safeDetails = (typeof escapeHtml === "function") ? escapeHtml(log.details || "") : log.details;

      return `
        <tr>
          <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
            ${safeTime}
          </td>
          <td>
            <span class="log-badge log-badge-${typeLower}">
              ${(typeof escapeHtml === "function") ? escapeHtml(log.type || "INFO") : (log.type || "INFO")}
            </span>
          </td>
          <td style="font-weight: 600; color: #fff; font-size: 0.85rem;">
            ${safeUser}
          </td>
          <td style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">
            ${safeAction}
          </td>
          <td style="font-size: 0.84rem; color: var(--text-secondary);">
            ${safeDetails}
          </td>
        </tr>
      `;
    }).join("");
  }

  // Фильтрация событий журнала
  const filterBtns = document.querySelectorAll("[data-log-filter]");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLogFilter = btn.getAttribute("data-log-filter") || "all";
      renderAdminLogsTable(currentLogFilter);
    });
  });

  // Очистка журнала логов
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener("click", () => {
      if (!isUserAdmin()) {
        showToast("Ошибка: требуется авторизация администратора!", "error");
        return;
      }
      if (confirm("Вы действительно хотите очистить всю историю системных логов?")) {
        if (typeof clearSystemLogs === "function") {
          clearSystemLogs();
        }
        if (typeof addSystemLog === "function") {
          addSystemLog("ADMIN", "Очистка журнала аудита", "Все предыдущие записи логов были удалены администратором", ADMIN_EMAIL);
        }
        renderAdminLogsTable(currentLogFilter);
        showToast("Журнал аудита успешно очищен", "info");
      }
    });
  }

  // Первоначальная проверка прав и рендер
  updateAdminView();
});

