/**
 * ==============================================================================
 * DIPLOY GAMES - ВИДЖЕТ БЫСТРОГО ПОПОЛНЕНИЯ НА ГЛАВНОЙ (js/topup.js)
 * ==============================================================================
 * Этот модуль реализует интерактивный калькулятор пополнения баланса и валюты
 * прямо на главной странице магазина с 3 вкладками:
 * 1. Steam (пополнение кошелька по логину аккаунта, комиссия 4%)
 * 2. Roblox (покупка Робуксов по никнейму игрока, пакеты и произвольная сумма)
 * 3. PlayStation (карты предоплаты PS Store с выбором региона: Турция, США и др.)
 *
 * Архитектура:
 * - Чистый Vanilla JavaScript, без фреймворков и без сборщиков (file:/// compatible)
 * - Простой и понятный код с подробными русскими комментариями для защиты проекта
 * - Интеграция с общей корзиной через addToCart(...)
 */

(function initQuickTopupWidget() {
  // Запуск только после полной загрузки DOM
  document.addEventListener("DOMContentLoaded", () => {
    const widget = document.getElementById("quick-topup-widget");
    if (!widget) return;

    const formPanel = document.getElementById("topup-form-panel");
    const receiptBody = document.getElementById("topup-receipt-body");
    const submitBtn = document.getElementById("topup-submit-btn");
    const tabButtons = widget.querySelectorAll(".quick-topup-tab-btn");

    // Текущее состояние виджета
    let activeTab = "steam"; // "steam" | "roblox" | "psn"

    // Состояние для таба Steam
    const steamState = {
      amount: 1000,
      login: "",
      commissionRate: 0.04
    };

    // Состояние для таба Roblox
    const robloxState = {
      nickname: "",
      selectedPackageIndex: 1, // по умолчанию 800 Robux
      isCustom: false,
      customRobux: 1000,
      packages: [
        { robux: 400, basePrice: 500, price: 525, name: "400 Robux" },
        { robux: 800, basePrice: 1000, price: 1050, name: "800 Robux (Хит)" },
        { robux: 1700, basePrice: 2125, price: 2231, name: "1 700 Robux" },
        { robux: 4500, basePrice: 5625, price: 5906, name: "4 500 Robux" }
      ]
    };

    // Данные для таба PlayStation (регионы и готовые номиналы карт)
    const psnRegions = {
      turkey: {
        name: "Турция (TL)",
        flag: "🇹🇷",
        cards: [
          { denom: "250 TL", price: 1190 },
          { denom: "500 TL", price: 2290 },
          { denom: "1 000 TL", price: 4490 },
          { denom: "2 500 TL", price: 10990 }
        ]
      },
      usa: {
        name: "США ($ USD)",
        flag: "🇺🇸",
        cards: [
          { denom: "$10 USD", price: 1150 },
          { denom: "$25 USD", price: 2790 },
          { denom: "$50 USD", price: 5490 },
          { denom: "$100 USD", price: 10890 }
        ]
      },
      poland: {
        name: "Польша (PLN)",
        flag: "🇵🇱",
        cards: [
          { denom: "50 PLN", price: 1350 },
          { denom: "100 PLN", price: 2650 },
          { denom: "200 PLN", price: 5190 }
        ]
      },
      uk: {
        name: "Великобритания (£)",
        flag: "🇬🇧",
        cards: [
          { denom: "£10 GBP", price: 1390 },
          { denom: "£25 GBP", price: 3390 },
          { denom: "£50 GBP", price: 6690 }
        ]
      }
    };

    const psnState = {
      regionKey: "turkey",
      selectedCardIndex: 1, // по умолчанию 500 TL
      email: ""
    };

    // ==========================================================================
    // 1. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ==========================================================================
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        if (targetTab === activeTab) return;

        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTab = targetTab;

        renderWidget();
      });
    });

    // ==========================================================================
    // 2. ОТРИСОВКА СОДЕРЖИМОГО АКТИВНОЙ ВКЛАДКИ
    // ==========================================================================
    function renderWidget() {
      if (activeTab === "steam") {
        renderSteamTab();
      } else if (activeTab === "roblox") {
        renderRobloxTab();
      } else if (activeTab === "psn") {
        renderPsnTab();
      }

      // Обновляем SVG-иконки в новом DOM
      if (typeof initIcons === "function") {
        initIcons(widget);
      }
    }

    // --- ТАБ 1: STEAM ---
    function renderSteamTab() {
      formPanel.innerHTML = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            1. Логин аккаунта Steam:
          </label>
          <input type="text" id="quick-steam-login" class="form-control" placeholder="Например: my_steam_login" value="${steamState.login}">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
            <span data-icon="info"></span> Вводите логин для входа в Steam (не никнейм!). Пополнение подходит для РФ, Казахстана и СНГ.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            2. Быстрый выбор суммы (₽):
          </label>
          <div class="quick-choice-grid">
            <button type="button" class="quick-choice-btn ${steamState.amount === 300 ? 'active' : ''}" data-amt="300">300 ₽</button>
            <button type="button" class="quick-choice-btn ${steamState.amount === 500 ? 'active' : ''}" data-amt="500">500 ₽</button>
            <button type="button" class="quick-choice-btn ${steamState.amount === 1000 ? 'active' : ''}" data-amt="1000">1 000 ₽</button>
            <button type="button" class="quick-choice-btn ${steamState.amount === 2500 ? 'active' : ''}" data-amt="2500">2 500 ₽</button>
            <button type="button" class="quick-choice-btn ${steamState.amount === 5000 ? 'active' : ''}" data-amt="5000">5 000 ₽</button>
          </div>
        </div>

        <div>
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            Или введите свою сумму (от 100 до 50 000 ₽):
          </label>
          <input type="number" id="quick-steam-amount" class="form-control" min="100" max="50000" value="${steamState.amount}">
        </div>
      `;

      // Привязка обработчиков событий
      const loginInput = document.getElementById("quick-steam-login");
      const amtInput = document.getElementById("quick-steam-amount");
      const amtButtons = formPanel.querySelectorAll(".quick-choice-btn");

      loginInput.addEventListener("input", (e) => {
        steamState.login = e.target.value.trim();
        updateSteamReceipt();
      });

      amtInput.addEventListener("input", (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 100) val = 100;
        if (val > 50000) val = 50000;
        steamState.amount = val;
        amtButtons.forEach(b => b.classList.toggle("active", parseInt(b.getAttribute("data-amt"), 10) === val));
        updateSteamReceipt();
      });

      amtButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const val = parseInt(btn.getAttribute("data-amt"), 10);
          steamState.amount = val;
          amtInput.value = val;
          amtButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          updateSteamReceipt();
        });
      });

      updateSteamReceipt();
    }

    function updateSteamReceipt() {
      const commission = Math.round(steamState.amount * steamState.commissionRate);
      const total = steamState.amount + commission;
      const loginText = steamState.login || '<span style="color: var(--text-muted);">не указан</span>';

      receiptBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Сервис:</span>
          <span style="color: #66c0f4; font-weight: 700;">Steam Wallet (СНГ)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Логин:</span>
          <span style="font-weight: 700;">${loginText}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Сумма на баланс:</span>
          <span style="font-weight: 700;">${formatPrice(steamState.amount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Комиссия сервиса (+4%):</span>
          <span style="color: var(--accent-orange); font-weight: 700;">+${formatPrice(commission)}</span>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 1rem; font-weight: 800; color: #fff;">Итого к оплате:</span>
          <span style="font-size: 1.35rem; font-weight: 800; color: var(--accent-orange);">${formatPrice(total)}</span>
        </div>
      `;

      submitBtn.innerHTML = `${getIcon('flash')} Пополнить Steam на ${formatPrice(total)}`;
    }

    // --- ТАБ 2: ROBLOX ---
    function renderRobloxTab() {
      const pkg = robloxState.packages[robloxState.selectedPackageIndex];

      formPanel.innerHTML = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            1. Никнейм в игре Roblox (username):
          </label>
          <input type="text" id="quick-roblox-nick" class="form-control" placeholder="Например: CoolGamer2026" value="${robloxState.nickname}">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
            <span data-icon="info"></span> Пароль не требуется! Робуксы зачисляются напрямую на игровой профиль.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            2. Выберите пакет Robux:
          </label>
          <div class="quick-choice-grid" style="grid-template-columns: 1fr 1fr;">
            ${robloxState.packages.map((p, idx) => `
              <button type="button" class="quick-choice-btn ${robloxState.selectedPackageIndex === idx ? 'active' : ''}" data-pkg="${idx}">
                <div style="font-size: 0.95rem;">${p.name}</div>
                <div style="font-size: 0.78rem; opacity: 0.85;">${formatPrice(p.price)}</div>
              </button>
            `).join("")}
          </div>
        </div>
      `;

      const nickInput = document.getElementById("quick-roblox-nick");
      const pkgButtons = formPanel.querySelectorAll(".quick-choice-btn");

      nickInput.addEventListener("input", (e) => {
        robloxState.nickname = e.target.value.trim();
        updateRobloxReceipt();
      });

      pkgButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-pkg"), 10);
          robloxState.selectedPackageIndex = idx;
          pkgButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          updateRobloxReceipt();
        });
      });

      updateRobloxReceipt();
    }

    function updateRobloxReceipt() {
      const pkg = robloxState.packages[robloxState.selectedPackageIndex];
      const commission = Math.round(pkg.basePrice * 0.05);
      const nickText = robloxState.nickname || '<span style="color: var(--text-muted);">не указан</span>';

      receiptBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Сервис:</span>
          <span style="color: #ff9800; font-weight: 700;">Roblox Corporation</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Никнейм:</span>
          <span style="font-weight: 700;">${nickText}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Пакет валюты:</span>
          <span style="font-weight: 700;">${pkg.robux} R$ (Робуксы)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Комиссия сервиса (+5%):</span>
          <span style="color: var(--accent-orange); font-weight: 700;">+${formatPrice(commission)}</span>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 1rem; font-weight: 800; color: #fff;">Итого к оплате:</span>
          <span style="font-size: 1.35rem; font-weight: 800; color: var(--accent-orange);">${formatPrice(pkg.price)}</span>
        </div>
      `;

      submitBtn.innerHTML = `${getIcon('flash')} Купить ${pkg.robux} R$ за ${formatPrice(pkg.price)}`;
    }

    // --- ТАБ 3: PLAYSTATION ---
    function renderPsnTab() {
      const currentRegion = psnRegions[psnState.regionKey];
      const selectedCard = currentRegion.cards[psnState.selectedCardIndex] || currentRegion.cards[0];

      formPanel.innerHTML = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            1. Выберите регион вашего аккаунта PSN:
          </label>
          <div class="quick-choice-grid" style="grid-template-columns: repeat(4, 1fr);">
            ${Object.keys(psnRegions).map(key => {
              const reg = psnRegions[key];
              return `
                <button type="button" class="quick-choice-btn ${psnState.regionKey === key ? 'active' : ''}" data-reg="${key}">
                  <div style="font-size: 1.1rem;">${reg.flag}</div>
                  <div style="font-size: 0.72rem; margin-top: 2px;">${reg.name.split(' ')[0]}</div>
                </button>
              `;
            }).join("")}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
            <span data-icon="info"></span> В PS Store нет пополнения по нику. Вы получаете моментальный код для выбранного региона.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
            2. Номинал карты предоплаты (${currentRegion.name}):
          </label>
          <div class="quick-choice-grid" style="grid-template-columns: repeat(2, 1fr);" id="psn-cards-grid">
            ${currentRegion.cards.map((c, idx) => `
              <button type="button" class="quick-choice-btn ${psnState.selectedCardIndex === idx ? 'active' : ''}" data-card="${idx}">
                <div style="font-size: 0.95rem;">${c.denom}</div>
                <div style="font-size: 0.78rem; opacity: 0.85;">${formatPrice(c.price)}</div>
              </button>
            `).join("")}
          </div>
        </div>
      `;

      // Обработчики выбора региона
      const regButtons = formPanel.querySelectorAll("[data-reg]");
      regButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const reg = btn.getAttribute("data-reg");
          psnState.regionKey = reg;
          psnState.selectedCardIndex = 0; // сброс на первую карту
          renderPsnTab();
        });
      });

      // Обработчики выбора номинала
      const cardButtons = formPanel.querySelectorAll("[data-card]");
      cardButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-card"), 10);
          psnState.selectedCardIndex = idx;
          cardButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          updatePsnReceipt();
        });
      });

      updatePsnReceipt();
    }

    function updatePsnReceipt() {
      const currentRegion = psnRegions[psnState.regionKey];
      const selectedCard = currentRegion.cards[psnState.selectedCardIndex] || currentRegion.cards[0];
      const commission = Math.round(selectedCard.price * 0.05);

      receiptBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Сервис:</span>
          <span style="color: #0070d1; font-weight: 700;">PlayStation Network</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Регион:</span>
          <span style="font-weight: 700;">${currentRegion.flag} ${currentRegion.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Номинал карты:</span>
          <span style="font-weight: 700;">${selectedCard.denom}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.88rem;">
          <span style="color: var(--text-secondary);">Код активации:</span>
          <span style="color: var(--accent-green); font-weight: 700;">Моментальная автовыдача</span>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 1rem; font-weight: 800; color: #fff;">Итого к оплате:</span>
          <span style="font-size: 1.35rem; font-weight: 800; color: var(--accent-orange);">${formatPrice(selectedCard.price)}</span>
        </div>
      `;

      submitBtn.innerHTML = `${getIcon('flash')} Купить карту ${selectedCard.denom} за ${formatPrice(selectedCard.price)}`;
    }

    // ==========================================================================
    // 3. ОТПРАВКА В КОРЗИНУ И ОФОРМЛЕНИЕ
    // ==========================================================================
    submitBtn.addEventListener("click", () => {
      if (activeTab === "steam") {
        if (!steamState.login) {
          showToast("Пожалуйста, укажите логин аккаунта Steam!", "error");
          const input = document.getElementById("quick-steam-login");
          if (input) input.focus();
          return;
        }

        const commission = Math.round(steamState.amount * steamState.commissionRate);
        const total = steamState.amount + commission;

        addToCart("steam-wallet-topup", 0, 1, {
          type: "steam",
          amount: steamState.amount,
          commission: commission,
          total: total,
          login: steamState.login
        });

        // Плавный переход в корзину для завершения оплаты
        window.location.href = "cart.html";

      } else if (activeTab === "roblox") {
        if (!robloxState.nickname || robloxState.nickname.length < 3) {
          showToast("Пожалуйста, введите корректный никнейм в Roblox (от 3 символов)!", "error");
          const input = document.getElementById("quick-roblox-nick");
          if (input) input.focus();
          return;
        }

        const pkg = robloxState.packages[robloxState.selectedPackageIndex];
        const commission = Math.round(pkg.basePrice * 0.05);

        addToCart("roblox-robux", robloxState.selectedPackageIndex, 1, {
          type: "roblox",
          nickname: robloxState.nickname,
          robuxAmount: pkg.robux,
          amount: pkg.basePrice,
          commission: commission,
          total: pkg.price
        });

        window.location.href = "cart.html";

      } else if (activeTab === "psn") {
        const currentRegion = psnRegions[psnState.regionKey];
        const selectedCard = currentRegion.cards[psnState.selectedCardIndex] || currentRegion.cards[0];
        const commission = Math.round(selectedCard.price * 0.05);

        addToCart("ps-store-gift-card", psnState.selectedCardIndex, 1, {
          type: "playstation",
          regionName: currentRegion.name,
          denomination: selectedCard.denom,
          amount: selectedCard.price,
          commission: commission,
          total: selectedCard.price
        });

        window.location.href = "cart.html";
      }
    });

    // Первоначальный рендер таба Steam
    renderWidget();
  });
})();
