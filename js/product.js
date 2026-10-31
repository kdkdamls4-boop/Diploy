/**
 * ==============================================================================
 * DIPLOY GAMES - ЛОГИКА СТРАНИЦЫ ТОВАРА В СТИЛЕ STEAM (product.js)
 * ==============================================================================
 * Этот модуль отвечает за:
 * 1. Получение ID товара из параметров URL (?id=cyberpunk-2077)
 * 2. Загрузку информации о товаре из getProductById(id)
 * 3. Интерактивную галерею скриншотов (переключение главного изображения по клику)
 * 4. Отрисовку блоков изданий и бандлов в стиле Steam с плашками скидок (-50%)
 * 5. Кнопки «В корзину» и «Купить сейчас» (мгновенный переход к оформлению)
 * 6. Отображение таблицы системных требований (Минимальные и Рекомендуемые)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Получаем ID товара из URL-адреса
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Ищем товар в общем каталоге
  let product = null;
  if (productId) {
    product = getProductById(productId);
  } else {
    // Если страница открыта напрямую без параметров (демо-режим), берем первый товар из каталога
    const catalog = getCatalog();
    product = catalog.length > 0 ? catalog[0] : null;
  }

  if (!product) {
    document.getElementById("product-page-container").innerHTML = `
      <div style="text-align: center; padding: 100px 20px;">
        <h2>Товар не найден</h2>
        <p style="color: var(--text-secondary); margin: 16px 0;">Возможно, он был удален или ссылка неверна.</p>
        <a href="catalog.html" class="btn btn-primary">Вернуться в каталог</a>
      </div>
    `;
    return;
  }

  // Обновляем заголовок страницы в браузере
  document.title = `${product.title} — Diploy Games`;

  // ============================================================================
  // 1. ЗАПОЛНЕНИЕ ОСНОВНЫХ ДАННЫХ
  // ============================================================================
  document.getElementById("breadcrumb-title").textContent = product.title;
  document.getElementById("product-title").textContent = product.title;
  document.getElementById("product-platform").textContent = product.platformName || "Steam";
  document.getElementById("product-category").textContent = product.categoryName || "Игры";
  
  const topDiscount = document.getElementById("product-top-discount");
  if (product.discount) {
    topDiscount.textContent = `-${product.discount}%`;
    topDiscount.style.display = "inline-flex";
  } else {
    topDiscount.style.display = "none";
  }

  document.getElementById("product-short-desc").textContent = product.description;
  document.getElementById("product-full-desc").innerHTML = `<p>${product.description}</p>`;
  document.getElementById("product-developer").textContent = product.developer || "Не указан";
  document.getElementById("product-genre").textContent = product.genre || "Цифровой ключ";
  document.getElementById("product-release").textContent = product.releaseDate || "2026";
  
  const ratingEl = document.getElementById("product-rating");
  if (ratingEl) {
    if (product.rating) {
      ratingEl.textContent = `Очень положительные (${product.rating} / 5.0) • ${product.reviewsCount || 500} отзывов`;
    } else {
      ratingEl.textContent = "Новинка каталога • 100% положительных оценок";
    }
  }

  // ============================================================================
  // 2. ГАЛЕРЕЯ СКРИНШОТОВ (ИНТЕРАКТИВНОЕ ПЕРЕКЛЮЧЕНИЕ)
  // ============================================================================
  const mainScreenshot = document.getElementById("main-screenshot");
  const thumbnailsRow = document.getElementById("thumbnails-row");
  const galleryImages = (product.screenshots && product.screenshots.length > 0)
    ? product.screenshots
    : [product.coverImage || FALLBACK_IMAGE_DATA];

  // Устанавливаем первое изображение
  mainScreenshot.src = galleryImages[0];
  mainScreenshot.alt = product.title;
  mainScreenshot.onerror = function() { handleImageError(this); };

  // Генерируем миниатюры
  thumbnailsRow.innerHTML = galleryImages.map((imgUrl, idx) => `
    <div class="thumb-item ${idx === 0 ? "active" : ""}" data-index="${idx}">
      <img src="${imgUrl}" alt="Скриншот ${idx + 1}" onerror="handleImageError(this)">
    </div>
  `).join("");

  // Обработка клика по миниатюрам
  const thumbs = thumbnailsRow.querySelectorAll(".thumb-item");
  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      const idx = thumb.getAttribute("data-index");
      mainScreenshot.src = galleryImages[idx];
    });
  });

  // ============================================================================
  // 3. ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР ВАЛЮТЫ (ДЛЯ GGSEL / PLAYEROK / FUNPAY СТИЛЯ)
  // ============================================================================
  const calcWrapper = document.getElementById("currency-calculator-wrapper");
  const editionsSectionTitle = document.getElementById("editions-section-title");

  if (product.isCustomCurrency && calcWrapper) {
    calcWrapper.style.display = "block";
    const isRoblox = product.id === "roblox-robux" || product.platform === "roblox";

    if (isRoblox) {
      if (editionsSectionTitle) {
        editionsSectionTitle.innerHTML = `${getIcon('package')} Или выберите готовый пакет Robux:`;
      }

      const robuxRate = 1.25; // 1 R$ = 1.25 ₽
      const commissionRate = product.commissionRate || 0.05; // 5% комиссия
      const ratePercent = Math.round(commissionRate * 100);
      const minRobux = product.minAmount || 100;
      const maxRobux = product.maxAmount || 50000;

      calcWrapper.innerHTML = `
        <div class="currency-calc-card">
          <div class="calc-header">
            <div class="calc-tag">${getIcon('flash')} ОНЛАЙН-КАЛЬКУЛЯТОР ROBLOX ROBUX • GGSEL &amp; PLAYEROK СТИЛЬ</div>
            <h2 style="font-size: 1.45rem; font-weight: 900; margin-top: 8px; color: #fff;">
              Пополнение Roblox Robux (Робуксы)
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">
              Курс 1 R$ = 1.25 ₽ • Комиссия сервиса <strong>${ratePercent}%</strong> • Моментальная выдача без передачи пароля
            </p>
          </div>

          <div class="calc-body" style="margin-top: 20px;">
            <!-- Поле 1: Никнейм игрока -->
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 8px; display: block;">
                1. Никнейм игрока в Roblox (username):
              </label>
              <div style="position: relative;">
                <input type="text" id="calc-login-input" class="form-control" placeholder="Например: PlayerOne_2026" style="padding-left: 42px; font-size: 1rem; border-color: #ff3b30;">
                <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1.15rem;">${getIcon('user')}</span>
              </div>
              <div style="font-size: 0.8rem; color: #f87171; margin-top: 6px;">
                ${getIcon('info')} Вводите ваш точный никнейм в Roblox (3–20 символов, латиница, цифры, _). Пароль НЕ требуется!
              </div>
            </div>

            <!-- Поле 2: Пакеты и сумма Robux -->
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 8px; display: block;">
                2. Выберите популярный пакет или введите количество Robux (от 100 до 50 000 R$):
              </label>
              
              <!-- Быстрые кнопки пакетов Robux -->
              <div class="quick-amounts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 12px;">
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="400">400 R$ (525 ₽)</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn active" data-amt="800">800 R$ (1 050 ₽)</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="1700">1 700 R$ (2 231 ₽)</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="4500">4 500 R$ (5 906 ₽)</button>
              </div>

              <div style="position: relative;">
                <input type="number" id="calc-amount-input" class="form-control" value="800" min="${minRobux}" max="${maxRobux}" step="50" style="padding-left: 42px; font-size: 1.2rem; font-weight: 800; color: #fff;">
                <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #ff3b30; font-weight: 900;">R$</span>
              </div>
            </div>

            <!-- Поле 3: Прозрачный расчет чека -->
            <div class="calc-receipt-box">
              <div class="receipt-row">
                <span style="color: var(--text-secondary);">Количество Robux:</span>
                <strong id="receipt-base-amt" style="color: #fff;">800 R$ (1 000 ₽)</strong>
              </div>
              <div class="receipt-row" style="color: #f87171;">
                <span>Комиссия сервиса (${ratePercent}%):</span>
                <strong id="receipt-comm-amt">+50 ₽</strong>
              </div>
              <div class="receipt-row" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 8px;">
                <span style="font-size: 1.1rem; font-weight: 800; color: #fff;">Итого к оплате:</span>
                <strong id="receipt-total-amt" style="font-size: 1.45rem; color: #10b981; font-weight: 900;">1 050 ₽</strong>
              </div>
            </div>

            <!-- Кнопки пополнения -->
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-top: 20px;">
              <button type="button" id="calc-buy-btn" class="btn btn-primary" style="padding: 14px; font-size: 1.05rem; font-weight: 800; background: linear-gradient(135deg, #ff3b30, #ff6b00); border: none;">
                ${getIcon('rocket')} Пополнить на <span id="btn-total-display">1 050 ₽</span>
              </button>
              <button type="button" id="calc-cart-btn" class="btn btn-secondary" style="padding: 14px; font-size: 0.95rem;">
                ${getIcon('cart')} В корзину
              </button>
            </div>
          </div>
        </div>
      `;

      // Интерактивная логика калькулятора Roblox
      const nicknameInput = document.getElementById("calc-login-input");
      const amtInput = document.getElementById("calc-amount-input");
      const baseAmtEl = document.getElementById("receipt-base-amt");
      const commAmtEl = document.getElementById("receipt-comm-amt");
      const totalAmtEl = document.getElementById("receipt-total-amt");
      const btnTotalDisplay = document.getElementById("btn-total-display");
      const quickBtns = calcWrapper.querySelectorAll(".quick-amt-btn");

      function updateRobuxCalc() {
        let robux = parseInt(amtInput.value, 10);
        if (isNaN(robux) || robux < 0) robux = 0;
        const baseRubles = Math.round(robux * robuxRate);
        const comm = Math.round(baseRubles * commissionRate);
        const total = baseRubles + comm;

        baseAmtEl.textContent = `${robux.toLocaleString("ru-RU")} R$ (${formatPrice(baseRubles)})`;
        commAmtEl.textContent = `+${formatPrice(comm)}`;
        totalAmtEl.textContent = formatPrice(total);
        btnTotalDisplay.textContent = formatPrice(total);

        quickBtns.forEach(b => {
          if (parseInt(b.getAttribute("data-amt"), 10) === robux) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
      }

      amtInput.addEventListener("input", updateRobuxCalc);

      quickBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          amtInput.value = btn.getAttribute("data-amt");
          updateRobuxCalc();
        });
      });

      function getRobuxPayload() {
        const nickname = (nicknameInput.value || "").trim();
        const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!nickname) {
          showToast("Пожалуйста, укажите никнейм игрока в Roblox!", "error");
          nicknameInput.focus();
          return null;
        }
        if (!nicknameRegex.test(nickname)) {
          showToast("Никнейм Roblox должен содержать от 3 до 20 символов (латиница, цифры и _)", "error");
          nicknameInput.focus();
          return null;
        }

        let robux = parseInt(amtInput.value, 10);
        if (isNaN(robux) || robux < minRobux || robux > maxRobux) {
          showToast(`Количество Robux должно быть от ${minRobux} до ${maxRobux.toLocaleString("ru-RU")} R$`, "error");
          amtInput.focus();
          return null;
        }

        const baseRubles = Math.round(robux * robuxRate);
        const comm = Math.round(baseRubles * commissionRate);
        const total = baseRubles + comm;

        return {
          type: "roblox",
          nickname: nickname,
          robuxAmount: robux,
          amount: baseRubles,
          commission: comm,
          total: total,
          login: nickname
        };
      }

      document.getElementById("calc-buy-btn").addEventListener("click", () => {
        const payload = getRobuxPayload();
        if (!payload) return;
        addToCart(product.id, 0, 1, payload);
        window.location.href = "cart.html";
      });

      document.getElementById("calc-cart-btn").addEventListener("click", () => {
        const payload = getRobuxPayload();
        if (!payload) return;
        addToCart(product.id, 0, 1, payload);
      });

      updateRobuxCalc();
    } else {
      // Стандартный калькулятор пополнения баланса (Steam и др.)
      if (editionsSectionTitle) {
        editionsSectionTitle.innerHTML = `${getIcon('package')} Или выберите готовый номинал:`;
      }

      const rate = product.commissionRate || 0.04;
      const ratePercent = Math.round(rate * 100);
      const minAmt = product.minAmount || 100;
      const maxAmt = product.maxAmount || 50000;
      const isSteam = product.platform === "steam";
      const loginPlaceholder = isSteam ? "Например: my_steam_login" : "Логин или ID аккаунта...";
      const loginLabel = isSteam ? "1. Логин аккаунта Steam (под которым вы входите в Steam):" : "1. Логин / ID аккаунта для зачисления:";
      const loginHint = isSteam
        ? `${getIcon('alert')} Вводите логин, который вы используете для входа в Steam (НЕ никнейм!). Регион: Россия, Казахстан, СНГ.`
        : `${getIcon('info')} Официальное мгновенное зачисление средств на указанный идентификатор.`;

      calcWrapper.innerHTML = `
        <div class="currency-calc-card">
          <div class="calc-header">
            <div class="calc-tag">${getIcon('flash')} ОНЛАЙН-КАЛЬКУЛЯТОР ПОПОЛНЕНИЯ • GGSEL &amp; PLAYEROK СТИЛЬ</div>
            <h2 style="font-size: 1.45rem; font-weight: 900; margin-top: 8px; color: #fff;">
              Введите любую сумму пополнения
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">
              Минимальная комиссия сервиса всего <strong>${ratePercent}%</strong> • Автоматическое зачисление за 1-2 минуты
            </p>
          </div>

          <div class="calc-body" style="margin-top: 20px;">
            <!-- Поле 1: Логин -->
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 8px; display: block;">
                ${loginLabel}
              </label>
              <div style="position: relative;">
                <input type="text" id="calc-login-input" class="form-control" placeholder="${loginPlaceholder}" style="padding-left: 42px; font-size: 1rem; border-color: #3b82f6;">
                <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1.15rem;">${getIcon('user')}</span>
              </div>
              <div style="font-size: 0.8rem; color: #60a5fa; margin-top: 6px;">
                ${loginHint}
              </div>
            </div>

            <!-- Поле 2: Сумма -->
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 8px; display: block;">
                2. Сумма к зачислению (от ${formatPrice(minAmt)} до ${formatPrice(maxAmt)}):
              </label>
              
              <!-- Быстрые кнопки -->
              <div class="quick-amounts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; margin-bottom: 12px;">
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="300">300 ₽</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="500">500 ₽</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn active" data-amt="1000">1 000 ₽</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="2500">2 500 ₽</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="5000">5 000 ₽</button>
                <button type="button" class="btn btn-secondary btn-sm quick-amt-btn" data-amt="10000">10 000 ₽</button>
              </div>

              <div style="position: relative;">
                <input type="number" id="calc-amount-input" class="form-control" value="1000" min="${minAmt}" max="${maxAmt}" step="50" style="padding-left: 42px; font-size: 1.2rem; font-weight: 800; color: #fff;">
                <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: #10b981; font-weight: 900;">₽</span>
              </div>
            </div>

            <!-- Поле 3: Прозрачный расчет комиссии -->
            <div class="calc-receipt-box">
              <div class="receipt-row">
                <span style="color: var(--text-secondary);">Сумма на баланс:</span>
                <strong id="receipt-base-amt" style="color: #fff;">1 000 ₽</strong>
              </div>
              <div class="receipt-row" style="color: #60a5fa;">
                <span>Комиссия сервиса (${ratePercent}%):</span>
                <strong id="receipt-comm-amt">+40 ₽</strong>
              </div>
              <div class="receipt-row" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 8px;">
                <span style="font-size: 1.1rem; font-weight: 800; color: #fff;">Итого к оплате:</span>
                <strong id="receipt-total-amt" style="font-size: 1.45rem; color: #10b981; font-weight: 900;">1 040 ₽</strong>
              </div>
            </div>

            <!-- Кнопки пополнения -->
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-top: 20px;">
              <button type="button" id="calc-buy-btn" class="btn btn-primary" style="padding: 14px; font-size: 1.05rem; font-weight: 800;">
                ${getIcon('rocket')} Пополнить на <span id="btn-total-display">1 040 ₽</span>
              </button>
              <button type="button" id="calc-cart-btn" class="btn btn-secondary" style="padding: 14px; font-size: 0.95rem;">
                ${getIcon('cart')} В корзину
              </button>
            </div>
          </div>
        </div>
      `;

      // Интерактивная логика калькулятора
      const loginInput = document.getElementById("calc-login-input");
      const amtInput = document.getElementById("calc-amount-input");
      const baseAmtEl = document.getElementById("receipt-base-amt");
      const commAmtEl = document.getElementById("receipt-comm-amt");
      const totalAmtEl = document.getElementById("receipt-total-amt");
      const btnTotalDisplay = document.getElementById("btn-total-display");
      const quickBtns = calcWrapper.querySelectorAll(".quick-amt-btn");

      function updateCalc() {
        let val = parseFloat(amtInput.value) || 0;
        const comm = Math.round(val * rate);
        const total = val + comm;

        baseAmtEl.textContent = formatPrice(val);
        commAmtEl.textContent = `+${formatPrice(comm)}`;
        totalAmtEl.textContent = formatPrice(total);
        btnTotalDisplay.textContent = formatPrice(total);

        quickBtns.forEach(b => {
          if (parseFloat(b.getAttribute("data-amt")) === val) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
      }

      amtInput.addEventListener("input", updateCalc);

      quickBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          amtInput.value = btn.getAttribute("data-amt");
          updateCalc();
        });
      });

      function getCalcPayload() {
        const login = (loginInput.value || "").trim();
        if (!login) {
          showToast("Пожалуйста, укажите ваш логин для зачисления средств!", "error");
          loginInput.focus();
          return null;
        }
        let val = parseFloat(amtInput.value) || 0;
        if (val < minAmt || val > maxAmt) {
          showToast(`Сумма должна быть от ${formatPrice(minAmt)} до ${formatPrice(maxAmt)}`, "error");
          return null;
        }
        const comm = Math.round(val * rate);
        const total = val + comm;

        return {
          amount: val,
          commission: comm,
          total: total,
          login: login
        };
      }

      document.getElementById("calc-buy-btn").addEventListener("click", () => {
        const payload = getCalcPayload();
        if (!payload) return;
        addToCart(product.id, 0, 1, payload);
        window.location.href = "cart.html";
      });

      document.getElementById("calc-cart-btn").addEventListener("click", () => {
        const payload = getCalcPayload();
        if (!payload) return;
        addToCart(product.id, 0, 1, payload);
      });

      updateCalc();
    }
  } else if (calcWrapper) {
    calcWrapper.style.display = "none";
    if (editionsSectionTitle) {
      editionsSectionTitle.innerHTML = `${getIcon('cart')} Варианты покупки и наборы`;
    }
  }

  // ============================================================================
  // 4. БЛОКИ ПОКУПКИ В СТИЛЕ STEAM (ИЗДАНИЯ И БАНДЛЫ)
  // ============================================================================
  const editionsContainer = document.getElementById("steam-editions-container");
  const editions = (product.editions && product.editions.length > 0)
    ? product.editions
    : [{
        name: "Стандартное издание",
        description: "Оригинальный лицензионный цифровой ключ",
        price: product.price,
        oldPrice: product.oldPrice,
        discount: product.discount
      }];

  editionsContainer.innerHTML = editions.map((edition, idx) => {
    const isDiscounted = edition.discount && edition.discount > 0;
    return `
      <div class="steam-buy-box">
        <div class="steam-buy-info">
          <h3>Купить ${product.title} — ${edition.name}</h3>
          <p>${edition.description || "Лицензионный цифровой ключ мгновенной активации"}</p>
        </div>
        <div class="steam-buy-action">
          ${isDiscounted ? `<div class="steam-discount-badge">-${edition.discount}%</div>` : ""}
          <div class="steam-prices">
            ${edition.oldPrice ? `<div class="steam-old-price">${formatPrice(edition.oldPrice)}</div>` : ""}
            <div class="steam-current-price">${formatPrice(edition.price)}</div>
          </div>
          <button class="btn btn-primary" onclick="buyEdition('${product.id}', ${idx})" title="Оформить заказ">
            Купить сейчас
          </button>
          <button class="btn btn-secondary btn-sm" onclick="addToCart('${product.id}', ${idx}, 1)" title="Добавить в корзину">
            ${getIcon('cart')} В корзину
          </button>
        </div>
      </div>
    `;
  }).join("");

  // ============================================================================
  // 4. СИСТЕМНЫЕ ТРЕБОВАНИЯ
  // ============================================================================
  const reqMinList = document.getElementById("req-min-list");
  const reqRecList = document.getElementById("req-rec-list");

  if (product.requirements && (product.requirements.min || product.requirements.rec)) {
    const min = product.requirements.min;
    const rec = product.requirements.rec;

    if (min && reqMinList) {
      reqMinList.innerHTML = `
        <li><strong>ОС / Платформа:</strong> ${min.os || "Windows 10 (64-bit)"}</li>
        <li><strong>Процессор:</strong> ${min.cpu || "Intel Core i5 / AMD Ryzen 3"}</li>
        <li><strong>Оперативная память:</strong> ${min.ram || "8 ГБ ОЗУ"}</li>
        <li><strong>Видеокарта:</strong> ${min.gpu || "DirectX 11 совместимая"}</li>
        <li><strong>Место на диске:</strong> ${min.disk || "Достаточно свободного места"}</li>
      `;
    }

    if (rec && reqRecList) {
      reqRecList.innerHTML = `
        <li><strong>ОС / Платформа:</strong> ${rec.os || "Windows 11 (64-bit)"}</li>
        <li><strong>Процессор:</strong> ${rec.cpu || "Intel Core i7 / AMD Ryzen 5"}</li>
        <li><strong>Оперативная память:</strong> ${rec.ram || "16 ГБ ОЗУ"}</li>
        <li><strong>Видеокарта:</strong> ${rec.gpu || "NVIDIA GeForce RTX / AMD Radeon RX"}</li>
        <li><strong>Место на диске:</strong> ${rec.disk || "SSD накопитель"}</li>
      `;
    }
  } else if (reqMinList && reqRecList) {
    reqMinList.innerHTML = `
      <li><strong>Платформа:</strong> ${product.platformName || "Цифровая активация"}</li>
      <li><strong>Категория:</strong> ${product.categoryName || "Лицензионный ключ"}</li>
      <li><strong>Подключение:</strong> Доступ в Интернет для активации</li>
    `;
    reqRecList.innerHTML = `
      <li><strong>Регион:</strong> Глобальный (Global / РФ / СНГ)</li>
      <li><strong>Гарантия:</strong> Бессрочная официальная лицензия</li>
      <li><strong>Доставка:</strong> Мгновенно после оплаты</li>
    `;
  }
});

/**
 * Быстрая покупка конкретного издания (добавляет в корзину и сразу переводит в cart.html)
 * @param {string} productId 
 * @param {number} editionIndex 
 */
function buyEdition(productId, editionIndex) {
  const product = getProductById(productId);
  const loginInput = document.getElementById("calc-login-input");
  const nick = loginInput ? loginInput.value.trim() : "";
  if (product && product.id === "roblox-robux" && product.editions && product.editions[editionIndex]) {
    const ed = product.editions[editionIndex];
    const payload = {
      type: "roblox",
      nickname: nick || "Игрок",
      robuxAmount: ed.robuxAmount,
      amount: ed.baseAmount,
      commission: ed.commission,
      total: ed.price,
      login: nick || "Игрок"
    };
    addToCart(productId, editionIndex, 1, payload);
  } else {
    addToCart(productId, editionIndex, 1);
  }
  window.location.href = "cart.html";
}
