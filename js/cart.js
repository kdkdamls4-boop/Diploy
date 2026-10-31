/**
 * ==============================================================================
 * DIPLOY GAMES - ЛОГИКА КОРЗИНЫ И ОФОРМЛЕНИЯ ЗАКАЗА (cart.js)
 * ==============================================================================
 * Этот модуль отвечает за:
 * 1. Отрисовку позиций в корзине с изменением количества и удалением
 * 2. Работу промокодов:
 *    - DIPLOY (-20%)
 *    - STUDENT (-15%)
 *    - STEAM (-10%)
 * 3. Расчет итоговой стоимости заказа (с учетом скидок)
 * 4. Выбор способа оплаты (СБП, Карта, Виртуальный баланс)
 * 5. Симуляцию оплаты и генерацию ключей через createOrder()
 * 6. Модальное окно успешного оформления с кнопками копирования ключей
 */

document.addEventListener("DOMContentLoaded", () => {
  // Элементы страницы
  const emptyView = document.getElementById("cart-empty-view");
  const contentView = document.getElementById("cart-content-view");
  const itemsList = document.getElementById("cart-items-list");

  // Элементы сводки заказа
  const subtotalEl = document.getElementById("summary-subtotal");
  const discountRow = document.getElementById("summary-discount-row");
  const discountEl = document.getElementById("summary-discount");
  const totalEl = document.getElementById("summary-total");
  const cartBalanceInfo = document.getElementById("cart-balance-info");

  // Элементы промокода
  const promoForm = document.getElementById("promo-code-form");
  const promoInput = document.getElementById("promo-input");
  const promoAppliedInfo = document.getElementById("promo-applied-info");

  // Оформление и модальное окно
  const checkoutBtn = document.getElementById("checkout-btn");
  const successModal = document.getElementById("success-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalOrderNumber = document.getElementById("modal-order-number");
  const modalKeysList = document.getElementById("modal-keys-list");

  // База доступных промокодов
  const PROMO_CODES = {
    "DIPLOY": 0.20,  // 20% скидка
    "STUDENT": 0.15, // 15% скидка
    "STEAM": 0.10    // 10% скидка
  };

  // Состояние активного промокода
  let activePromo = null;

  // ============================================================================
  // 1. ОТРИСОВКА И ПЕРЕСЧЕТ КОРЗИНЫ
  // ============================================================================
  function renderCart() {
    let cart = getCart();

    // Очищаем из корзины товары, которые могли быть удалены из каталога через панель управления
    const validCart = cart.filter(item => getProductById(item.productId) !== null);
    if (validCart.length !== cart.length) {
      cart = validCart;
      saveCart(cart);
    }

    // Обновляем доступный баланс в способах оплаты
    if (cartBalanceInfo) {
      cartBalanceInfo.textContent = `Доступно: ${formatPrice(getUserBalance())}`;
    }

    if (cart.length === 0) {
      emptyView.style.display = "block";
      contentView.style.display = "none";
      return;
    }

    emptyView.style.display = "none";
    contentView.style.display = "grid";

    let subtotal = 0;

    // Генерируем HTML для каждого товара
    itemsList.innerHTML = cart.map((item, index) => {
      const product = getProductById(item.productId);
      if (!product) return "";

      let editionName = "Стандартное издание";
      let unitPrice = product.price || 0;
      let extraDetails = "";

      if (item.customData) {
        unitPrice = item.customData.total;
        if (item.customData.type === "roblox" || item.customData.robuxAmount || item.productId === "roblox-robux") {
          const robux = item.customData.robuxAmount || 0;
          const nick = item.customData.nickname || item.customData.login || "Игрок";
          editionName = robux ? `${robux.toLocaleString("ru-RU")} R$ (Robux)` : "Пакет Robux";
          extraDetails = `
            <div style="font-size: 0.82rem; color: #f87171; margin-top: 3px;">
              ${getIcon('user')} Никнейм: <strong>${nick}</strong> • Комиссия (5%): +${formatPrice(item.customData.commission || 0)}
            </div>
          `;
        } else if (item.customData.type === "playstation") {
          const region = item.customData.regionName || "PlayStation";
          const denom = item.customData.denomination || formatPrice(item.customData.amount);
          editionName = `Карта ${denom} (${region})`;
          extraDetails = `
            <div style="font-size: 0.82rem; color: #60a5fa; margin-top: 3px;">
              ${getIcon('card')} Регион: <strong>${region}</strong> • Номинал: ${denom} • Комиссия (5%): +${formatPrice(item.customData.commission || 0)}
            </div>
          `;
        } else {
          // По умолчанию Steam или общее пополнение баланса
          const login = item.customData.login || "Аккаунт";
          editionName = `Пополнение на ${formatPrice(item.customData.amount)}`;
          extraDetails = `
            <div style="font-size: 0.82rem; color: #60a5fa; margin-top: 3px;">
              ${getIcon('user')} Логин: <strong>${login}</strong> • Комиссия (4%): +${formatPrice(item.customData.commission || 0)}
            </div>
          `;
        }
      } else {
        const edition = (product.editions && product.editions[item.editionIndex])
          ? product.editions[item.editionIndex]
          : { name: "Стандартное издание", price: product.price };
        editionName = edition.name;
        unitPrice = edition.price || product.price || 0;
      }

      const itemTotal = unitPrice * (item.quantity || 1);
      subtotal += itemTotal;

      return `
        <div class="cart-item">
          <img src="${product.coverImage}" alt="${product.title}" class="cart-item-img" onerror="handleImageError(this)">
          <div class="cart-item-info">
            <h4>${product.title}</h4>
            <div class="cart-item-edition">
              Издание: <strong>${editionName}</strong> • ${product.platformName}
            </div>
            ${extraDetails}
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              Цена за шт: ${formatPrice(unitPrice)}
            </div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQuantity(${index}, ${(item.quantity || 1) - 1})">−</button>
            <span class="qty-value">${item.quantity || 1}</span>
            <button class="qty-btn" onclick="changeQuantity(${index}, ${(item.quantity || 1) + 1})">+</button>
          </div>
          <div class="cart-item-price">${formatPrice(itemTotal)}</div>
          <button class="cart-item-remove" onclick="removeCartItem(${index})" title="Удалить товар">&times;</button>
        </div>
      `;
    }).join("");

    // Расчет скидки по промокоду
    let discountAmount = 0;
    if (activePromo && PROMO_CODES[activePromo]) {
      discountAmount = Math.round(subtotal * PROMO_CODES[activePromo]);
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);

    // Вывод сумм
    subtotalEl.textContent = formatPrice(subtotal);

    if (discountAmount > 0) {
      discountRow.style.display = "flex";
      discountEl.textContent = `-${formatPrice(discountAmount)}`;
    } else {
      discountRow.style.display = "none";
    }

    totalEl.textContent = formatPrice(finalTotal);
  }

  // Делаем функции изменения корзины доступными из HTML onclick
  window.changeQuantity = function(index, newQty) {
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      updateCartQuantity(index, newQty);
    }
    renderCart();
  };

  window.removeCartItem = function(index) {
    removeFromCart(index);
    renderCart();
  };

  // ============================================================================
  // 2. ОБРАБОТКА ПРОМОКОДОВ
  // ============================================================================
  if (promoForm) {
    promoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = promoInput.value.trim().toUpperCase();

      if (!code) {
        showToast("Введите промокод", "info");
        return;
      }

      if (PROMO_CODES[code]) {
        activePromo = code;
        const discountPercent = Math.round(PROMO_CODES[code] * 100);
        promoAppliedInfo.style.display = "block";
        promoAppliedInfo.innerHTML = `
          ${getIcon('check')} Промокод <strong>${code}</strong> применен! Скидка: ${discountPercent}%
          <button type="button" id="remove-promo-btn" style="background: none; border: none; color: var(--accent-red); cursor: pointer; text-decoration: underline; margin-left: 8px;">
            Удалить
          </button>
        `;

        document.getElementById("remove-promo-btn").addEventListener("click", () => {
          activePromo = null;
          promoInput.value = "";
          promoAppliedInfo.style.display = "none";
          renderCart();
          showToast("Промокод отменен", "info");
        });

        showToast(`Промокод ${code} на ${discountPercent}% успешно активирован!`, "success");
        renderCart();
      } else {
        showToast("Неверный промокод! Попробуйте DIPLOY, STUDENT или STEAM", "error");
      }
    });
  }

  // ============================================================================
  // 3. ВЫБОР СПОСОБА ОПЛАТЫ
  // ============================================================================
  const paymentItems = document.querySelectorAll(".payment-method-item");
  paymentItems.forEach(item => {
    item.addEventListener("click", () => {
      paymentItems.forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      const radio = item.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Синхронизация при выборе с клавиатуры
  const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      paymentItems.forEach(i => i.classList.remove("selected"));
      const parentLabel = radio.closest(".payment-method-item");
      if (parentLabel) parentLabel.classList.add("selected");
    });
  });

  // ============================================================================
  // 4. ОФОРМЛЕНИЕ ЗАКАЗА И ГЕНЕРАЦИЯ КЛЮЧЕЙ
  // ============================================================================
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0) {
        showToast("Корзина пуста!", "error");
        return;
      }

      // Выбранный способ оплаты
      const selectedMethodEl = document.querySelector('input[name="payment-method"]:checked');
      const paymentMethod = selectedMethodEl ? selectedMethodEl.value : "sbp";

      // Расчет финальной суммы
      let subtotal = 0;
      cart.forEach(item => {
        const prod = getProductById(item.productId);
        if (prod) {
          if (item.customData) {
            subtotal += item.customData.total * (item.quantity || 1);
          } else {
            const ed = (prod.editions && prod.editions[item.editionIndex]) ? prod.editions[item.editionIndex] : { price: prod.price };
            subtotal += ed.price * (item.quantity || 1);
          }
        }
      });

      let discountAmount = 0;
      if (activePromo && PROMO_CODES[activePromo]) {
        discountAmount = Math.round(subtotal * PROMO_CODES[activePromo]);
      }
      const finalTotal = Math.max(0, subtotal - discountAmount);

      // Проверка баланса, если оплата через внутренний счет
      if (paymentMethod === "balance") {
        const currentBalance = getUserBalance();
        if (currentBalance < finalTotal) {
          showToast(`Недостаточно средств на балансе (${formatPrice(currentBalance)}). Пополните баланс в профиле!`, "error");
          return;
        }
        // Списываем средства со счета
        setUserBalance(currentBalance - finalTotal);
      }

      // Создаем заказ через глобальную функцию app.js
      const order = createOrder({
        items: cart,
        total: finalTotal,
        paymentMethod: paymentMethod === "balance" ? "Баланс аккаунта" : (paymentMethod === "card" ? "Банковская карта" : "СБП"),
        promoCode: activePromo,
        discountAmount: discountAmount
      });

      // Отображаем окно успешной покупки
      modalOrderNumber.textContent = `Заказ #${order.id} • Оплачено: ${formatPrice(order.total)}`;

      // Заполняем сгенерированные лицензионные ключи или подтверждения пополнения
      modalKeysList.innerHTML = order.keys.map(k => {
        if (k.isTopup) {
          return `
            <div style="background-color: #212121; padding: 14px; border-radius: var(--radius-sm); border: 1px solid #10b981;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="font-weight: 700; font-size: 0.95rem; color: #fff;">
                  ${getIcon('flash')} ${k.productTitle}
                </div>
                <span class="badge badge-discount">${getIcon('check')} Зачислено</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
                ${k.editionName}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background-color: #121212; padding: 8px 12px; border-radius: 4px; border: 1px dashed #10b981;">
                <span style="font-family: monospace; font-size: 0.95rem; font-weight: 800; color: #10b981; letter-spacing: 1px;">
                  Чек: ${k.key}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${k.key}')" style="padding: 4px 8px; font-size: 0.75rem;">
                  ${getIcon('copy')} Чек
                </button>
              </div>
            </div>
          `;
        }
        return `
          <div style="background-color: #212121; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; color: #fff;">
              ${k.productTitle} (${k.editionName})
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background-color: #121212; padding: 8px 12px; border-radius: 4px; border: 1px dashed #3b82f6;">
              <span style="font-family: monospace; font-size: 1.05rem; font-weight: 800; color: #60a5fa; letter-spacing: 1.5px;">
                ${k.key}
              </span>
              <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${k.key}')" style="padding: 4px 8px; font-size: 0.75rem;">
                ${getIcon('copy')} Скопировать
              </button>
            </div>
          </div>
        `;
      }).join("");

      // Открываем модальное окно
      successModal.classList.add("active");

      // Сбрасываем примененный промокод после успешного оформления заказа
      activePromo = null;
      if (promoInput) promoInput.value = "";
      if (promoAppliedInfo) {
        promoAppliedInfo.style.display = "none";
        promoAppliedInfo.innerHTML = "";
      }

      // Обновляем отображение корзины (теперь она пуста)
      renderCart();
    });
  }

  // Закрытие модального окна по кнопке «крестик»
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      successModal.classList.remove("active");
    });
  }

  // Закрытие модального окна по клику на фон
  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) {
        successModal.classList.remove("active");
      }
    });
  }

  // Закрытие по нажатию клавиши Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && successModal && successModal.classList.contains("active")) {
      successModal.classList.remove("active");
    }
  });

  // Первоначальный рендер
  renderCart();
});
