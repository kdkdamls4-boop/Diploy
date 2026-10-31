/**
 * ==============================================================================
 * DIPLOY GAMES - ЛОГИКА ЛИЧНОГО КАБИНЕТА И БИБЛИОТЕКИ КЛЮЧЕЙ (profile.js)
 * ==============================================================================
 * Этот модуль отвечает за:
 * 1. Отображение баланса пользователя и модального окна пополнения счета
 * 2. Сбор всех купленных лицензионных ключей из истории заказов (getOrders())
 * 3. Отрисовку карточек ключей с возможностью копирования в буфер обмена
 * 4. Интерактивную смену статуса ключа («Готов к активации» / «Активирован»)
 * 5. Возможность очистить историю заказов для сброса демо-данных
 */

document.addEventListener("DOMContentLoaded", () => {
  // Элементы баланса
  const balanceDisplay = document.getElementById("profile-balance-display");
  const openDepositBtn = document.getElementById("open-deposit-modal-btn");
  const depositModal = document.getElementById("deposit-modal");
  const depositCloseBtn = document.getElementById("deposit-modal-close-btn");
  const customDepositInput = document.getElementById("custom-deposit-amount");
  const confirmDepositBtn = document.getElementById("confirm-deposit-btn");
  const quickDepositBtns = document.querySelectorAll(".quick-deposit-btn");

  // Элементы библиотеки ключей
  const keysCountBadge = document.getElementById("keys-count-badge");
  const noKeysView = document.getElementById("no-keys-view");
  const keysLibraryGrid = document.getElementById("keys-library-grid");
  const clearOrdersBtn = document.getElementById("clear-orders-btn");

  // ============================================================================
  // 1. УПРАВЛЕНИЕ БАЛАНСОМ И ДАННЫМИ ПОЛЬЗОВАТЕЛЯ
  // ============================================================================
  function updateBalanceView() {
    if (balanceDisplay) {
      balanceDisplay.textContent = formatPrice(getUserBalance());
    }
  }

  function updateUserInfo() {
    const cur = getCurrentUser();
    const avatarEl = document.querySelector(".user-avatar");
    const nameEl = document.querySelector(".user-info h2");
    const metaEl = document.querySelector(".user-info p");

    if (cur) {
      if (nameEl) nameEl.textContent = cur.username;
      if (metaEl) metaEl.innerHTML = `${escapeHtml(cur.email)} • Статус: Постоянный покупатель • Аккаунт создан: ${cur.createdAt || "сегодня"}`;
      if (avatarEl) avatarEl.textContent = cur.username.substring(0, 2).toUpperCase();
    } else {
      if (nameEl) nameEl.textContent = "Гостевой аккаунт";
      if (metaEl) metaEl.innerHTML = `<span style="color: var(--text-secondary);">Вы не вошли в систему.</span> <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()" style="padding: 3px 10px; font-size: 0.78rem; margin-left: 6px;">Войти / Создать аккаунт</button>`;
      if (avatarEl) avatarEl.textContent = "??";
    }
    updateBalanceView();
  }
  window.updateUserInfo = updateUserInfo;

  // Открытие модального окна пополнения
  if (openDepositBtn) {
    openDepositBtn.addEventListener("click", () => {
      depositModal.classList.add("active");
    });
  }

  // Закрытие модального окна по кнопке «крестик»
  if (depositCloseBtn) {
    depositCloseBtn.addEventListener("click", () => {
      depositModal.classList.remove("active");
    });
  }

  // Закрытие модального окна по клику на затемненный фон
  if (depositModal) {
    depositModal.addEventListener("click", (e) => {
      if (e.target === depositModal) {
        depositModal.classList.remove("active");
      }
    });
  }

  // Закрытие модального окна по нажатию Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && depositModal && depositModal.classList.contains("active")) {
      depositModal.classList.remove("active");
    }
  });

  // Быстрые кнопки пополнения (+500, +1000 и т.д.)
  quickDepositBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = parseInt(btn.getAttribute("data-amount"), 10);
      if (amount > 0) {
        depositBalance(amount);
        updateBalanceView();
        depositModal.classList.remove("active");
      }
    });
  });

  // Обработка пополнения на произвольную сумму
  function handleCustomDeposit() {
    const raw = parseFloat(customDepositInput.value);
    const val = Math.round(raw || 0);
    if (!val || val <= 0) {
      showToast("Введите корректную сумму пополнения", "error");
      return;
    }
    depositBalance(val);
    updateBalanceView();
    customDepositInput.value = "";
    depositModal.classList.remove("active");
  }

  if (confirmDepositBtn) {
    confirmDepositBtn.addEventListener("click", handleCustomDeposit);
  }

  if (customDepositInput) {
    customDepositInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCustomDeposit();
      }
    });
  }

  // ============================================================================
  // 2. ОТРИСОВКА БИБЛИОТЕКИ КУПЛЕННЫХ КЛЮЧЕЙ
  // ============================================================================
  function renderKeysLibrary() {
    const orders = getOrders();
    const allKeys = [];

    // Собираем все ключи из всех заказов
    orders.forEach((order) => {
      if (order.keys && Array.isArray(order.keys)) {
        order.keys.forEach((keyItem) => {
          allKeys.push({
            ...keyItem,
            orderId: order.id,
            orderDate: order.createdAt
          });
        });
      }
    });

    keysCountBadge.textContent = allKeys.length;

    if (allKeys.length === 0) {
      noKeysView.style.display = "block";
      keysLibraryGrid.innerHTML = "";
      return;
    }

    noKeysView.style.display = "none";

    keysLibraryGrid.innerHTML = allKeys.map(item => `
      <div class="key-card">
        <div class="key-card-header">
          <img src="${item.coverImage || 'assets/covers/steam-wallet.svg'}" alt="${item.productTitle}" class="key-card-thumb" onerror="handleImageError(this)">
          <div class="key-card-title">
            <h4>${item.productTitle}</h4>
            <span>${item.editionName} • ${item.platformName}</span>
          </div>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>Заказ: ${item.orderId}</span>
          <span>${item.orderDate}</span>
        </div>

        <!-- Поле с ключом / чеком и кнопкой копирования -->
        <div class="key-code-wrap">
          <span class="key-code-text">${item.key}</span>
          <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${item.key}')" title="Скопировать">
            ${getIcon('copy')} ${item.isTopup ? 'Чек' : 'Ключ'}
          </button>
        </div>

        <!-- Статус активации / пополнения -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
          <span style="font-size: 0.82rem; color: var(--text-secondary);">Статус доставки:</span>
          ${item.isTopup ? `
            <span class="badge" style="background-color: #10b981; color: #fff; font-weight: 700;">${getIcon('check')} Зачислено на аккаунт</span>
          ` : `
            <button class="badge ${item.isActivated ? 'badge-status-activated' : 'badge-status-ready'}" 
                    style="cursor: pointer; border: none;"
                    onclick="toggleKeyActivation('${item.key}')">
              ${item.isActivated ? getIcon('check') + ' Активирован' : getIcon('dot') + ' Готов к активации'}
            </button>
          `}
        </div>
      </div>
    `).join("");
  }

  // Переключение статуса активации ключа по уникальному коду лицензии
  window.toggleKeyActivation = function(licenseKey) {
    const orders = getOrders();
    let found = false;
    let nextState = false;

    for (let order of orders) {
      if (order.keys && Array.isArray(order.keys)) {
        for (let k of order.keys) {
          if (k.key === licenseKey) {
            k.isActivated = !k.isActivated;
            nextState = k.isActivated;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    if (found) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      renderKeysLibrary();
      showToast(nextState ? "Ключ помечен как активированный" : "Ключ помечен как новый", "info");
    }
  };

  // Очистка истории покупок
  if (clearOrdersBtn) {
    clearOrdersBtn.addEventListener("click", () => {
      if (confirm("Вы действительно хотите очистить всю историю купленных ключей?")) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        renderKeysLibrary();
        showToast("История заказов очищена", "info");
      }
    });
  }

  // Первоначальный запуск
  updateUserInfo();
  renderKeysLibrary();
});
