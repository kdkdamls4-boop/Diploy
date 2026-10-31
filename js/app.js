/**
 * ==============================================================================
 * DIPLOY GAMES - ОБЩИЙ МОДУЛЬ И ХРАНИЛИЩЕ ДАННЫХ (app.js)
 * ==============================================================================
 * Этот скрипт подключается на каждой странице сайта.
 * Он отвечает за:
 * 1. Работу с браузерным хранилищем localStorage (каталог, корзина, заказы, баланс)
 * 2. Генерацию лицензионных ключей (формат: DIP-XXXX-YYYY-ZZZZ)
 * 3. Всплывающие уведомления (Toast)
 * 4. Обновление счетчиков в шапке (количество товаров в корзине, баланс)
 * 5. Форматирование цен и вспомогательные функции
 */

// Ключи для сохранения данных в localStorage
const STORAGE_KEYS = {
  CATALOG: "diploy_catalog_v6",
  CART: "diploy_cart_v1",
  ORDERS: "diploy_orders_v1",
  BALANCE: "diploy_balance_v1",
  USERS: "diploy_users_v1",
  CURRENT_USER: "diploy_current_user_v1",
  LOGS: "diploy_system_logs_v1"
};

// ==============================================================================
// 1. УПРАВЛЕНИЕ КАТАЛОГОМ ТОВАРОВ
// ==============================================================================

/**
 * Получить список всех товаров.
 * Если в localStorage еще ничего не сохранено — берем начальный список из data.js.
 * @returns {Array} Массив объектов товаров
 */
function getCatalog() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Проверяем, есть ли в сохраненном каталоге roblox-robux из DEFAULT_PRODUCTS
        if (typeof DEFAULT_PRODUCTS !== "undefined") {
          const hasRobux = parsed.some(p => p.id === "roblox-robux");
          const defaultRobux = DEFAULT_PRODUCTS.find(p => p.id === "roblox-robux");
          if (!hasRobux && defaultRobux) {
            parsed.push(defaultRobux);
            saveCatalog(parsed);
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Ошибка при чтении каталога из localStorage:", e);
  }

  // Если в хранилище еще ничего не записано — инициализируем каталог базовыми данными
  const initial = (typeof DEFAULT_PRODUCTS !== "undefined") ? DEFAULT_PRODUCTS : [];
  saveCatalog(initial);
  return initial;
}

/**
 * Сохранить обновленный каталог в localStorage.
 * @param {Array} catalog Массив товаров
 */
function saveCatalog(catalog) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
  } catch (e) {
    console.error("Ошибка при сохранении каталога:", e);
  }
}

/**
 * Сбросить каталог к стандартному набору из data.js (для админки).
 */
function resetCatalogToDefault() {
  if (typeof DEFAULT_PRODUCTS !== "undefined") {
    saveCatalog(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
  return [];
}

/**
 * Найти товар в каталоге по его уникальному идентификатору (id).
 * @param {string} id 
 * @returns {Object|null}
 */
function getProductById(id) {
  const catalog = getCatalog();
  return catalog.find(item => item.id === id) || null;
}

// ==============================================================================
// 2. УПРАВЛЕНИЕ КОРЗИНОЙ
// ==============================================================================

/**
 * Получить содержимое корзины из localStorage.
 * Элемент корзины хранит: { productId, editionIndex, quantity }
 * Автоматически отсекает товары, которые были удалены из каталога.
 * @returns {Array}
 */
function getCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    if (!data) return [];
    const cart = JSON.parse(data);
    if (!Array.isArray(cart)) return [];

    // Санитаризация: удаляем позиции, если товар был удален из каталога администратором
    const catalog = getCatalog();
    const catalogIds = new Set(catalog.map(p => p.id));
    const validCart = cart.filter(item => catalogIds.has(item.productId));
    if (validCart.length !== cart.length) {
      try {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(validCart));
      } catch (e) {}
      return validCart;
    }
    return cart;
  } catch (e) {
    console.error("Ошибка при чтении корзины:", e);
    return [];
  }
}

/**
 * Сохранить корзину в localStorage и обновить бейдж в шапке.
 * @param {Array} cart 
 */
function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateHeaderBadge();
  } catch (e) {
    console.error("Ошибка при сохранении корзины:", e);
  }
}

/**
 * Добавить товар в корзину.
 * Поддерживает как стандартные издания, так и произвольную сумму валюты с комиссией.
 * @param {string} productId ID товара
 * @param {number} editionIndex Индекс выбранного издания (по умолчанию 0)
 * @param {number} quantity Количество
 * @param {Object|null} customData Дополнительные данные калькулятора { amount, commission, total, login }
 */
function addToCart(productId, editionIndex = 0, quantity = 1, customData = null) {
  const product = getProductById(productId);
  if (!product) {
    showToast("Товар не найден!", "error");
    return;
  }

  const cart = getCart();

  if (customData) {
    // Для кастомного пополнения валюты: сохраняем точные данные зачисления, логин/никнейм и комиссию
    cart.push({
      productId: productId,
      editionIndex: editionIndex,
      quantity: quantity,
      customData: customData
    });
    saveCart(cart);

    if (customData.type === "roblox" || customData.nickname || productId === "roblox-robux") {
      const targetUser = customData.nickname || customData.login || "игрока";
      const robuxLabel = customData.robuxAmount ? `${customData.robuxAmount} R$` : formatPrice(customData.amount);
      showToast(`«${product.title}» (${robuxLabel} для ${targetUser}) добавлен в корзину!`, "success");
    } else if (customData.type === "playstation") {
      showToast(`«${product.title}» (${customData.denomination || formatPrice(customData.amount)}) добавлен в корзину!`, "success");
    } else {
      const targetLogin = customData.login ? ` на логин ${customData.login}` : "";
      showToast(`«${product.title}» (${formatPrice(customData.amount)}${targetLogin}) добавлен в корзину!`, "success");
    }
    return;
  }

  const existingIndex = cart.findIndex(
    item => !item.customData && item.productId === productId && item.editionIndex === editionIndex
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      productId: productId,
      editionIndex: editionIndex,
      quantity: quantity
    });
  }

  saveCart(cart);

  const editionName = (product.editions && product.editions[editionIndex])
    ? product.editions[editionIndex].name
    : "Стандартное издание";

  showToast(`«${product.title}» (${editionName}) добавлен в корзину!`, "success");
}

/**
 * Изменить количество конкретной позиции в корзине.
 * @param {number} index Индекс в массиве корзины
 * @param {number} newQuantity Новое количество
 */
function updateCartQuantity(index, newQuantity) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    if (newQuantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = newQuantity;
    }
    saveCart(cart);
  }
}

/**
 * Удалить элемент из корзины.
 * @param {number} index Индекс элемента
 */
function removeFromCart(index) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart(cart);
    showToast("Товар удален из корзины", "info");
  }
}

/**
 * Очистить корзину полностью.
 */
function clearCart() {
  saveCart([]);
}

/**
 * Получить общее количество товаров в корзине.
 * @returns {number}
 */
function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.quantity || 1), 0);
}

// ==============================================================================
// 3. ПОЛЬЗОВАТЕЛИ, АВТОРИЗАЦИЯ И СИСТЕМНЫЕ ЛОГИ (ACCOUNTS & AUDIT LOGS)
// ==============================================================================

/**
 * Получить список всех пользователей системы
 * @returns {Array}
 */
function getUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Ошибка при чтении пользователей:", e);
  }
  // Предустановленный демо-пользователь для быстрой проверки
  const initialUsers = [
    {
      id: "usr-demo-1",
      username: "gamer_pro",
      email: "gamer@diploy.ru",
      password: "123",
      balance: 5000,
      createdAt: new Date().toLocaleString("ru-RU")
    }
  ];
  saveUsers(initialUsers);
  return initialUsers;
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Ошибка при сохранении пользователей:", e);
  }
}

/**
 * Получить данные текущего авторизованного пользователя
 * @returns {Object|null}
 */
function getCurrentUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Ошибка чтения текущего пользователя:", e);
  }
  return null;
}

/**
 * Установить или сбросить текущего пользователя
 * @param {Object|null} user 
 */
function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error("Ошибка сохранения текущего пользователя:", e);
  }
  if (typeof updateHeaderUserUI === "function") {
    updateHeaderUserUI();
  }
  updateHeaderBalance();
}

/**
 * Регистрация нового аккаунта
 * @param {string} username 
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} { success, message, user }
 */
function registerUser(username, email, password) {
  const cleanUsername = (username || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = (password || "").trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: "Имя пользователя должно содержать от 3 символов" };
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, message: "Введите корректный адрес электронной почты" };
  }
  if (!cleanPassword || cleanPassword.length < 3) {
    return { success: false, message: "Пароль должен содержать от 3 символов" };
  }

  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    return { success: false, message: "Пользователь с таким email или логином уже существует!" };
  }

  // Приветственный стартовый баланс 1000 ₽ при регистрации
  const newUser = {
    id: "usr-" + Date.now(),
    username: cleanUsername,
    email: cleanEmail,
    password: cleanPassword,
    balance: 1000,
    createdAt: new Date().toLocaleString("ru-RU")
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  addSystemLog("AUTH", "Регистрация нового пользователя", `Пользователь ${cleanUsername} (${cleanEmail}) зарегистрирован с бонусом 1000 ₽`, cleanEmail);
  return { success: true, user: newUser };
}

/**
 * Авторизация в системе
 * @param {string} emailOrLogin 
 * @param {string} password 
 * @returns {Object} { success, message, user }
 */
function loginUser(emailOrLogin, password) {
  const query = (emailOrLogin || "").trim().toLowerCase();
  const pass = (password || "").trim();

  if (!query || !pass) {
    return { success: false, message: "Заполните логин и пароль" };
  }

  const users = getUsers();
  const user = users.find(u => (u.email.toLowerCase() === query || u.username.toLowerCase() === query) && u.password === pass);

  if (!user) {
    return { success: false, message: "Неверный логин или пароль!" };
  }

  setCurrentUser(user);
  addSystemLog("AUTH", "Вход пользователя", `Пользователь ${user.username} вошел в аккаунт`, user.email);
  return { success: true, user: user };
}

/**
 * Выход из аккаунта
 */
function logoutUser() {
  const cur = getCurrentUser();
  if (cur) {
    addSystemLog("AUTH", "Выход пользователя", `Пользователь ${cur.username} (${cur.email}) вышел из системы`, cur.email);
  }
  setCurrentUser(null);
  showToast("Вы успешно вышли из учетной записи", "info");
}

// ==============================================================================
// 3.1. ЖУРНАЛ СИСТЕМНЫХ СОБЫТИЙ (SYSTEM AUDIT LOGS)
// ==============================================================================

function getSystemLogs() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Ошибка при чтении логов:", e);
  }
  const initialLogs = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 3600000).toLocaleString("ru-RU"),
      type: "SYSTEM",
      action: "Инициализация платформы Diploy Games",
      details: "Система запущена, каталог готов к работе",
      user: "system"
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 1800000).toLocaleString("ru-RU"),
      type: "AUTH",
      action: "Создание учетной записи gamer@diploy.ru",
      details: "Начислен приветственный баланс 5 000 ₽",
      user: "gamer@diploy.ru"
    }
  ];
  saveSystemLogs(initialLogs);
  return initialLogs;
}

function saveSystemLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error("Ошибка сохранения логов:", e);
  }
}

/**
 * Добавить событие в аудит-лог
 * @param {string} type Категория: "AUTH" | "PURCHASE" | "DEPOSIT" | "CATALOG" | "ADMIN" | "SYSTEM"
 * @param {string} action Краткое название действия
 * @param {string} details Подробности
 * @param {string} [userEmail] Email или имя инициатора
 */
function addSystemLog(type, action, details, userEmail) {
  const logs = getSystemLogs();
  const cur = getCurrentUser();
  const user = userEmail || (cur ? cur.email : "Гость");

  const newLog = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toLocaleString("ru-RU"),
    type: type || "INFO",
    action: action || "Действие",
    details: details || "",
    user: user
  };

  logs.unshift(newLog);
  if (logs.length > 200) {
    logs.length = 200;
  }
  saveSystemLogs(logs);
}

function clearSystemLogs() {
  saveSystemLogs([]);
}

// ==============================================================================
// 3.2. УПРАВЛЕНИЕ БАЛАНСОМ ПОЛЬЗОВАТЕЛЯ
// ==============================================================================

/**
 * Получить баланс текущего пользователя или гостевой баланс
 * @returns {number}
 */
function getUserBalance() {
  const user = getCurrentUser();
  if (user && typeof user.balance !== "undefined") {
    return Math.round(user.balance);
  }
  const val = localStorage.getItem(STORAGE_KEYS.BALANCE);
  if (val === null) {
    const initialBalance = 5000;
    localStorage.setItem(STORAGE_KEYS.BALANCE, initialBalance.toString());
    return initialBalance;
  }
  return Math.round(parseFloat(val) || 0);
}

/**
 * Установить баланс текущего пользователя и синхронизировать хранилище
 * @param {number} amount 
 */
function setUserBalance(amount) {
  const finalAmount = Math.max(0, Math.round(amount));
  const user = getCurrentUser();
  if (user) {
    user.balance = finalAmount;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx > -1) {
      users[idx].balance = finalAmount;
      saveUsers(users);
    }
  }
  localStorage.setItem(STORAGE_KEYS.BALANCE, finalAmount.toString());
  updateHeaderBalance();
}

/**
 * Пополнить баланс пользователя
 * @param {number} amount 
 */
function depositBalance(amount) {
  const current = getUserBalance();
  const next = current + Math.max(0, amount);
  setUserBalance(next);

  const cur = getCurrentUser();
  addSystemLog("DEPOSIT", "Пополнение баланса", `Счет успешно пополнен на +${formatPrice(amount)}. Текущий баланс: ${formatPrice(next)}`, cur ? cur.email : "Гость");
  showToast(`Баланс успешно пополнен на ${formatPrice(amount)}!`, "success");
}

/**
 * Получить список всех оформленных заказов.
 * @returns {Array}
 */
function getOrders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (data !== null) {
      return JSON.parse(data);
    }

    // Начальный демонстрационный заказ для мгновенной наглядности при защите проекта
    const initialOrders = [
      {
        id: "ORD-841920",
        createdAt: new Date().toLocaleString("ru-RU"),
        total: 1999,
        paymentMethod: "СБП",
        promoCode: "DIPLOY",
        discountAmount: 400,
        keys: [
          {
            key: "DIP-77NK-A92B-X44L",
            productId: "cyberpunk-2077",
            productTitle: "Cyberpunk 2077: Phantom Liberty",
            editionName: "Phantom Liberty Bundle",
            platformName: "Steam",
            coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
            isActivated: false,
            purchasedAt: new Date().toISOString()
          }
        ]
      }
    ];

    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
    } catch (e) {
      console.error("Ошибка сохранения начального заказа:", e);
    }
    return initialOrders;
  } catch (e) {
    console.error("Ошибка при чтении заказов:", e);
    return [];
  }
}

/**
 * Генерация реалистичного лицензионного ключа вида:
 * DIP-XXXX-YYYY-ZZZZ
 * @returns {string}
 */
function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (len) => {
    let res = "";
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `DIP-${segment(4)}-${segment(4)}-${segment(4)}`;
}

/**
 * Генерация квитанции заказа на робуксы вида:
 * DIP-ROBUX-XXXX-YYYY
 * @returns {string} Уникальный номер чека
 */
function generateRobuxReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (len) => {
    let res = "";
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `DIP-ROBUX-${segment(4)}-${segment(4)}`;
}

if (typeof window !== "undefined") {
  window.generateRobuxReceipt = generateRobuxReceipt;
}

/**
 * Оформить новый заказ и сгенерировать ключи активации.
 * @param {Object} orderData Информация о заказе { items, total, paymentMethod, promoCode }
 * @returns {Object} Созданный заказ
 */
function createOrder(orderData) {
  const orders = getOrders();

  // Генерируем уникальные ключи для каждого приобретенного товара
  const generatedKeys = [];
  orderData.items.forEach(cartItem => {
    const product = getProductById(cartItem.productId);
    const isRoblox = cartItem.productId === "roblox-robux" ||
      (cartItem.customData && cartItem.customData.type === "roblox");

    if (isRoblox) {
      // Для покупки валюты Roblox Robux генерируем чек вида DIP-ROBUX-XXXX-YYYY
      const nickname = (cartItem.customData && (cartItem.customData.nickname || cartItem.customData.login))
        ? (cartItem.customData.nickname || cartItem.customData.login)
        : "Игрок";

      const robuxAmount = (cartItem.customData && cartItem.customData.robuxAmount)
        ? cartItem.customData.robuxAmount
        : (product && product.editions && product.editions[cartItem.editionIndex] && product.editions[cartItem.editionIndex].robuxAmount)
          ? product.editions[cartItem.editionIndex].robuxAmount
          : 400;

      const baseAmount = cartItem.customData
        ? cartItem.customData.amount
        : (product && product.editions && product.editions[cartItem.editionIndex] && product.editions[cartItem.editionIndex].baseAmount)
          ? product.editions[cartItem.editionIndex].baseAmount
          : Math.round(robuxAmount * 1.25);

      const commission = cartItem.customData
        ? cartItem.customData.commission
        : (product && product.editions && product.editions[cartItem.editionIndex] && product.editions[cartItem.editionIndex].commission)
          ? product.editions[cartItem.editionIndex].commission
          : Math.round(baseAmount * 0.05);

      const editionTitle = cartItem.customData
        ? `${robuxAmount} R$ (Никнейм: ${nickname})`
        : (product && product.editions && product.editions[cartItem.editionIndex])
          ? product.editions[cartItem.editionIndex].name
          : `${robuxAmount} Robux`;

      for (let i = 0; i < (cartItem.quantity || 1); i++) {
        generatedKeys.push({
          key: generateRobuxReceipt(),
          productId: cartItem.productId || "roblox-robux",
          productTitle: "Roblox: Robux (Робуксы)",
          editionName: editionTitle,
          platformName: "Roblox",
          coverImage: "assets/covers/roblox.svg",
          isActivated: true, // Средства зачислены моментально
          isTopup: true,
          topupLogin: nickname,
          topupNickname: nickname,
          robuxAmount: robuxAmount,
          topupAmount: baseAmount,
          commission: commission,
          purchasedAt: new Date().toISOString()
        });
      }
    } else if (cartItem.customData) {
      if (cartItem.customData.type === "playstation") {
        for (let i = 0; i < (cartItem.quantity || 1); i++) {
          generatedKeys.push({
            key: generateLicenseKey(),
            productId: cartItem.productId,
            productTitle: product ? product.title : "PlayStation Store",
            editionName: `Карта ${cartItem.customData.denomination || formatPrice(cartItem.customData.amount)} (${cartItem.customData.regionName || "PSN"})`,
            platformName: product ? product.platformName : "PlayStation",
            coverImage: product ? product.coverImage : "assets/covers/ps-store.svg",
            isActivated: false,
            isTopup: true,
            region: cartItem.customData.region,
            regionName: cartItem.customData.regionName,
            denomination: cartItem.customData.denomination,
            purchasedAt: new Date().toISOString()
          });
        }
      } else {
        // Для пополнения счета Steam генерируем уникальный чек/транзакцию пополнения
        for (let i = 0; i < (cartItem.quantity || 1); i++) {
          generatedKeys.push({
            key: `DIP-TOPUP-${Math.floor(1000 + Math.random() * 9000)}-${cartItem.customData.amount}RUB`,
            productId: cartItem.productId,
            productTitle: product ? product.title : "Пополнение баланса",
            editionName: `Зачисление ${formatPrice(cartItem.customData.amount)} (Логин: ${cartItem.customData.login})`,
            platformName: product ? product.platformName : "Steam",
            coverImage: product ? product.coverImage : "assets/covers/steam-wallet.svg",
            isActivated: true, // Средства зачислены моментально
            isTopup: true,
            topupLogin: cartItem.customData.login,
            topupAmount: cartItem.customData.amount,
            commission: cartItem.customData.commission,
            purchasedAt: new Date().toISOString()
          });
        }
      }
    } else {
      const edition = (product && product.editions && product.editions[cartItem.editionIndex])
        ? product.editions[cartItem.editionIndex]
        : { name: "Стандартное издание" };

      for (let i = 0; i < (cartItem.quantity || 1); i++) {
        generatedKeys.push({
          key: generateLicenseKey(),
          productId: cartItem.productId,
          productTitle: product ? product.title : "Неизвестный товар",
          editionName: edition.name,
          platformName: product ? product.platformName : "Steam",
          coverImage: product ? product.coverImage : "",
          isActivated: false,
          purchasedAt: new Date().toISOString()
        });
      }
    }
  });

  const newOrder = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    createdAt: new Date().toLocaleString("ru-RU"),
    total: orderData.total,
    paymentMethod: orderData.paymentMethod,
    promoCode: orderData.promoCode || null,
    discountAmount: orderData.discountAmount || 0,
    keys: generatedKeys
  };

  orders.unshift(newOrder); // Добавляем новый заказ в начало списка
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error("Ошибка сохранения заказа:", e);
  }

  // Фиксация покупки в журнале аудита
  const cur = getCurrentUser();
  addSystemLog(
    "PURCHASE",
    `Оформление заказа #${newOrder.id}`,
    `Сумма: ${formatPrice(newOrder.total)} (${newOrder.paymentMethod}). Позиций: ${generatedKeys.length}`,
    cur ? cur.email : "Гость"
  );

  // Очищаем корзину после успешной оплаты
  clearCart();

  return newOrder;
}

// ==============================================================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ИНТЕРФЕЙС
// ==============================================================================

/**
 * Красивое форматирование цены (например, 1 999 ₽)
 * @param {number} price 
 * @returns {string}
 */
function formatPrice(price) {
  if (typeof price !== "number") price = Number(price) || 0;
  return price.toLocaleString("ru-RU") + " ₽";
}

/**
 * Показ стильного всплывающего уведомления (Toast)
 * @param {string} message Текст сообщения
 * @param {string} type 'success' | 'error' | 'info'
 */
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" 
    ? (typeof getIcon === "function" ? getIcon("check") : "✓") 
    : (type === "error" 
      ? (typeof getIcon === "function" ? getIcon("cross") : "✕") 
      : (typeof getIcon === "function" ? getIcon("info") : "ℹ"));
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  // Анимация появления
  setTimeout(() => toast.classList.add("show"), 10);

  // Удаление через 3.5 секунды
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Копирование текста в буфер обмена с уведомлением
 * @param {string} text 
 * @param {string} successMessage 
 */
function copyToClipboard(text, successMessage = "Ключ скопирован в буфер обмена!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage, "success");
    }).catch(() => {
      fallbackCopyText(text, successMessage);
    });
  } else {
    fallbackCopyText(text, successMessage);
  }
}

function fallbackCopyText(text, successMessage) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";
  textArea.style.opacity = "0";
  textArea.setAttribute("readonly", "");
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      showToast(successMessage, "success");
    } else {
      showToast("Скопируйте ключ вручную", "info");
    }
  } catch (err) {
    showToast("Скопируйте ключ вручную", "info");
  }
  document.body.removeChild(textArea);
}

/**
 * Запасное векторное изображение (SVG Data URI),
 * если внешний Unsplash скриншот недоступен оффлайн.
 */
const FALLBACK_IMAGE_DATA = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='338' viewBox='0 0 600 338'><rect width='600' height='338' fill='%231a202c'/><circle cx='300' cy='140' r='45' fill='%232563eb' fill-opacity='0.2'/><polygon points='285,120 285,160 325,140' fill='%2360a5fa'/><text x='50%25' y='65%25' font-family='system-ui,sans-serif' font-size='22' font-weight='800' fill='%23f3f4f6' text-anchor='middle'>DIPLOY GAMES</text><text x='50%25' y='75%25' font-family='system-ui,sans-serif' font-size='13' fill='%239ca3af' text-anchor='middle'>Цифровая лицензия • Мгновенная активация</text></svg>";

/**
 * Обработчик ошибки загрузки картинки (оффлайн режим или блокировка внешних URL)
 * @param {HTMLImageElement} img 
 */
function handleImageError(img) {
  if (img && img.src !== FALLBACK_IMAGE_DATA) {
    img.src = FALLBACK_IMAGE_DATA;
  }
}

/**
 * Обновление счетчика товаров в корзине в шапке сайта
 */
function updateHeaderBadge() {
  const badge = document.getElementById("header-cart-badge");
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
}

/**
 * Обновление баланса пользователя в шапке
 */
function updateHeaderBalance() {
  const balanceEl = document.getElementById("header-user-balance");
  if (balanceEl) {
    balanceEl.textContent = formatPrice(getUserBalance());
  }
}

/**
 * Безопасное экранирование HTML для предотвращения XSS-инъекций
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Обновление интерфейса аккаунта пользователя в шапке на всех страницах
 */
function updateHeaderUserUI() {
  const headerActions = document.querySelector(".header-actions");
  if (!headerActions) return;

  // Ищем или создаем контейнер для слота пользователя
  let slot = document.getElementById("header-user-slot");
  if (!slot) {
    slot = document.createElement("div");
    slot.id = "header-user-slot";
    slot.style.display = "flex";
    slot.style.alignItems = "center";
    slot.style.gap = "8px";
    headerActions.insertBefore(slot, headerActions.firstChild);
  }

  const cur = getCurrentUser();
  if (cur) {
    slot.innerHTML = `
      <a href="profile.html" class="user-profile-btn" title="Личный кабинет">
        ${getIcon('user')} <span>${escapeHtml(cur.username)}</span>
      </a>
      <button type="button" class="logout-icon-btn" onclick="logoutUser()" title="Выйти из аккаунта">
        ${getIcon('logout')}
      </button>
    `;
  } else {
    slot.innerHTML = `
      <button type="button" class="btn btn-secondary btn-sm" onclick="openAuthModal()" style="font-size: 0.82rem; padding: 6px 12px; font-weight: 700;">
        ${getIcon('user')} Войти
      </button>
    `;
  }
}

/**
 * Создание и управление глобальным модальным окном авторизации/регистрации
 */
function ensureAuthModal() {
  let modal = document.getElementById("global-auth-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "global-auth-modal";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px;">
      <button type="button" class="modal-close-btn" onclick="closeAuthModal()" aria-label="Закрыть">&times;</button>
      
      <div class="auth-tabs">
        <button type="button" class="auth-tab-btn active" id="auth-tab-login-btn" onclick="switchAuthTab('login')">Вход</button>
        <button type="button" class="auth-tab-btn" id="auth-tab-reg-btn" onclick="switchAuthTab('register')">Регистрация</button>
      </div>

      <!-- Вкладка Входа -->
      <div id="auth-form-login-pane">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Вход в аккаунт</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
          Войдите, чтобы совершать покупки и управлять балансом
        </p>
        <form id="auth-login-form">
          <div class="form-group">
            <label style="font-size: 0.85rem;">Email или логин:</label>
            <input type="text" id="auth-login-login" class="form-control" placeholder="gamer@diploy.ru" required>
          </div>
          <div class="form-group">
            <label style="font-size: 0.85rem;">Пароль:</label>
            <input type="password" id="auth-login-pass" class="form-control" placeholder="••••••" required>
          </div>
          <div id="auth-login-error" class="admin-auth-error" style="display: none;"></div>
          <button type="submit" class="btn btn-primary btn-halloween btn-block" style="padding: 12px; margin-top: 10px;">
            ${getIcon('check')} Войти в аккаунт
          </button>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 12px; text-align: center;">
            Демо-аккаунт: <strong>gamer@diploy.ru</strong> / пароль: <strong>123</strong>
          </div>
        </form>
      </div>

      <!-- Вкладка Регистрации -->
      <div id="auth-form-reg-pane" style="display: none;">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Создание аккаунта</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
          Зарегистрируйтесь и получите <strong>+1 000 ₽</strong> на баланс в подарок!
        </p>
        <form id="auth-register-form">
          <div class="form-group">
            <label style="font-size: 0.85rem;">Имя пользователя (username):</label>
            <input type="text" id="auth-reg-name" class="form-control" placeholder="Alex_2026" required minlength="3">
          </div>
          <div class="form-group">
            <label style="font-size: 0.85rem;">Email:</label>
            <input type="email" id="auth-reg-email" class="form-control" placeholder="alex@gmail.com" required>
          </div>
          <div class="form-group">
            <label style="font-size: 0.85rem;">Пароль:</label>
            <input type="password" id="auth-reg-pass" class="form-control" placeholder="Минимум 3 символа" required minlength="3">
          </div>
          <div id="auth-reg-error" class="admin-auth-error" style="display: none;"></div>
          <button type="submit" class="btn btn-primary btn-halloween btn-block" style="padding: 12px; margin-top: 10px;">
            ${getIcon('gift')} Зарегистрироваться и получить 1 000 ₽
          </button>
        </form>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAuthModal();
  });

  const loginForm = document.getElementById("auth-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const loginVal = document.getElementById("auth-login-login").value;
      const passVal = document.getElementById("auth-login-pass").value;
      const errEl = document.getElementById("auth-login-error");

      const res = loginUser(loginVal, passVal);
      if (res.success) {
        if (errEl) errEl.style.display = "none";
        closeAuthModal();
        showToast(`Добро пожаловать, ${res.user.username}!`, "success");
        if (typeof updateUserInfo === "function") {
          updateUserInfo();
        }
      } else {
        if (errEl) {
          errEl.textContent = res.message;
          errEl.style.display = "block";
        }
        showToast(res.message, "error");
      }
    });
  }

  const regForm = document.getElementById("auth-register-form");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameVal = document.getElementById("auth-reg-name").value;
      const emailVal = document.getElementById("auth-reg-email").value;
      const passVal = document.getElementById("auth-reg-pass").value;
      const errEl = document.getElementById("auth-reg-error");

      const res = registerUser(nameVal, emailVal, passVal);
      if (res.success) {
        if (errEl) errEl.style.display = "none";
        closeAuthModal();
        showToast(`Аккаунт создан! Вам начислен бонус 1 000 ₽!`, "success");
        if (typeof updateUserInfo === "function") {
          updateUserInfo();
        }
      } else {
        if (errEl) {
          errEl.textContent = res.message;
          errEl.style.display = "block";
        }
        showToast(res.message, "error");
      }
    });
  }

  return modal;
}

function openAuthModal(tab = "login") {
  const modal = ensureAuthModal();
  switchAuthTab(tab);
  modal.classList.add("active");
}

function closeAuthModal() {
  const modal = document.getElementById("global-auth-modal");
  if (modal) modal.classList.remove("active");
}

function switchAuthTab(tab) {
  const loginBtn = document.getElementById("auth-tab-login-btn");
  const regBtn = document.getElementById("auth-tab-reg-btn");
  const loginPane = document.getElementById("auth-form-login-pane");
  const regPane = document.getElementById("auth-form-reg-pane");

  if (tab === "register") {
    if (loginBtn) loginBtn.classList.remove("active");
    if (regBtn) regBtn.classList.add("active");
    if (loginPane) loginPane.style.display = "none";
    if (regPane) regPane.style.display = "block";
  } else {
    if (loginBtn) loginBtn.classList.add("active");
    if (regBtn) regBtn.classList.remove("active");
    if (loginPane) loginPane.style.display = "block";
    if (regPane) regPane.style.display = "none";
  }
}

// Экспорт в глобальную область видимости
if (typeof window !== "undefined") {
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.logoutUser = logoutUser;
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.getCurrentUser = getCurrentUser;
  window.getSystemLogs = getSystemLogs;
  window.addSystemLog = addSystemLog;
  window.clearSystemLogs = clearSystemLogs;
}

// ==============================================================================
// 5. ИНИЦИАЛИЗАЦИЯ ШАПКИ И СОБЫТИЙ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация векторных иконок
  if (typeof initIcons === "function") {
    initIcons();
  }

  // Первоначальное обновление индикаторов
  updateHeaderBadge();
  updateHeaderBalance();
  updateHeaderUserUI();

  // Подсветка активного пункта меню навигации
  const currentPath = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    link.classList.remove("active");
    if (href === currentPath || ((currentPath === "" || currentPath === "index.html") && href === "index.html")) {
      link.classList.add("active");
    }
  });

  // Быстрый поиск в шапке (переход на catalog.html с параметром ?search=...)
  const headerSearchForm = document.getElementById("header-search-form");
  if (headerSearchForm) {
    headerSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("header-search-input");
      const val = input ? input.value.trim() : "";
      if (val) {
        window.location.href = `catalog.html?search=${encodeURIComponent(val)}`;
      } else {
        window.location.href = "catalog.html";
      }
    });
  }
});
