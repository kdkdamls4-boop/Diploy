/**
 * ==============================================================================
 * DIPLOY GAMES - БАЗА ДАННЫХ ТОВАРОВ (data.js)
 * ==============================================================================
 * В этом файле хранится каталог товаров с профессиональными обложками
 * в стиле лучших игровых маркетплейсов (GGsel, PlayerOK, Funpay):
 * 1. Компьютерные игры (официальные обложки Steam CDN)
 * 2. Игровая валюта с калькулятором суммы и реальной комиссией 4-5%
 * 3. Игровые подписки (Xbox Game Pass, PlayStation Plus, EA Play)
 * 
 * Данный массив используется как основа при первом запуске сайта,
 * а также при нажатии кнопки «Сбросить каталог» в панели администратора.
 */

const DEFAULT_PRODUCTS = [
  // ----------------------------------------------------------------------------
  // 1. ИГРЫ (Официальные обложки и арты Steam)
  // ----------------------------------------------------------------------------
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077: Phantom Liberty",
    category: "games",
    categoryName: "Игры",
    platform: "steam",
    platformName: "Steam",
    genre: "RPG / Экшен в открытом мире",
    developer: "CD PROJEKT RED",
    releaseDate: "2020 / DLC 2023",
    rating: 4.88,
    reviewsCount: 1840,
    price: 1999,
    oldPrice: 3999,
    discount: 50,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg"
    ],
    description: "Cyberpunk 2077 — приключенческая ролевая игра с открытым миром в мегаполисе Найт-Сити, где власть, роскошь и модификации тела ценятся превыше всего. Включает масштабное сюжетное дополнение «Призрачная свобода».",
    editions: [
      {
        name: "Стандартное издание",
        description: "Базовая игра Cyberpunk 2077 с обновлением 2.0",
        price: 1499,
        oldPrice: 2999,
        discount: 50
      },
      {
        name: "Phantom Liberty Bundle (Рекомендуем)",
        description: "Игра + масштабное сюжетное дополнение «Призрачная свобода» + бонусный саундтрек",
        price: 1999,
        oldPrice: 3999,
        discount: 50
      },
      {
        name: "Ultimate Cyberpunk Franchise Pack",
        description: "Игра + DLC Phantom Liberty + цифровой артбук, комиксы и обои в 4K",
        price: 2499,
        oldPrice: 4999,
        discount: 50
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 (64-bit)",
        cpu: "Core i7-6700 или Ryzen 5 1600",
        ram: "12 ГБ",
        gpu: "GeForce GTX 1060 6GB или Radeon RX 580 8GB",
        disk: "70 ГБ SSD"
      },
      rec: {
        os: "Windows 11 (64-bit)",
        cpu: "Core i7-12700 или Ryzen 7 7800X3D",
        ram: "16 ГБ",
        gpu: "GeForce RTX 3070 или Radeon RX 6800 XT",
        disk: "70 ГБ NVMe SSD"
      }
    }
  },
  {
    id: "witcher-3-wild-hunt",
    title: "Ведьмак 3: Дикая Охота — Полное Издание",
    category: "games",
    categoryName: "Игры",
    platform: "steam",
    platformName: "Steam",
    genre: "RPG / Фэнтези",
    developer: "CD PROJEKT RED",
    releaseDate: "2015 (Next-Gen 2022)",
    rating: 4.95,
    reviewsCount: 4210,
    price: 699,
    oldPrice: 2599,
    discount: 73,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg"
    ],
    description: "Станьте Геральтом из Ривии, профессиональным охотником на чудовищ. Ищите дитя предназначения в охваченном войной фэнтезийном мире. Издание включает оба масштабных дополнения: «Каменные сердца» и «Кровь и вино».",
    editions: [
      {
        name: "Стандартное издание",
        description: "Базовая игра «Ведьмак 3: Дикая Охота»",
        price: 499,
        oldPrice: 1599,
        discount: 69
      },
      {
        name: "Полное Издание (Complete Edition)",
        description: "Игра + дополнения «Каменные сердца» и «Кровь и вино» + 16 DLC",
        price: 699,
        oldPrice: 2599,
        discount: 73
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 (64-bit)",
        cpu: "Intel Core i5-2500K 3.3GHz",
        ram: "8 ГБ",
        gpu: "Nvidia GeForce GTX 660 / AMD Radeon HD 7870",
        disk: "50 ГБ"
      },
      rec: {
        os: "Windows 10 / 11 (64-bit)",
        cpu: "Intel Core i7-3770 3.4 GHz / AMD FX-8350",
        ram: "16 ГБ",
        gpu: "Nvidia GeForce RTX 2060 / AMD Radeon RX 5700",
        disk: "50 ГБ SSD"
      }
    }
  },
  {
    id: "elden-ring",
    title: "ELDEN RING: Shadow of the Erdtree",
    category: "games",
    categoryName: "Игры",
    platform: "steam",
    platformName: "Steam",
    genre: "Action-RPG / Souls-like",
    developer: "FromSoftware Inc.",
    releaseDate: "2022 / DLC 2024",
    rating: 4.92,
    reviewsCount: 3120,
    price: 2899,
    oldPrice: 4200,
    discount: 31,
    isHit: true,
    isSpecialOffer: false,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg"
    ],
    description: "Восстань, погасшая душа! Золотой порядок сломлен. Отправляйтесь в Междуземье под руководством благодати, чтобы обрести силу Кольца Элден и стать повелителем Элдена.",
    editions: [
      {
        name: "Стандартное издание",
        description: "Оригинальная игра ELDEN RING",
        price: 2199,
        oldPrice: 3199,
        discount: 31
      },
      {
        name: "Shadow of the Erdtree Edition",
        description: "Оригинальная игра + дополнение Shadow of the Erdtree",
        price: 2899,
        oldPrice: 4200,
        discount: 31
      },
      {
        name: "Deluxe Edition с артбуком и саундтреком",
        description: "Включает дополнение, цифровой саундтрек и артбук",
        price: 3499,
        oldPrice: 4999,
        discount: 30
      }
    ],
    requirements: {
      min: {
        os: "Windows 10",
        cpu: "Intel Core i5-8400 или AMD Ryzen 3 3300X",
        ram: "12 ГБ",
        gpu: "Nvidia GeForce GTX 1060 3GB",
        disk: "60 ГБ"
      },
      rec: {
        os: "Windows 11",
        cpu: "Intel Core i7-8700K или AMD Ryzen 5 3600X",
        ram: "16 ГБ",
        gpu: "Nvidia GeForce RTX 2070 8GB",
        disk: "60 ГБ SSD"
      }
    }
  },
  {
    id: "gta-v-premium",
    title: "Grand Theft Auto V: Premium Edition",
    category: "games",
    categoryName: "Игры",
    platform: "epic",
    platformName: "Epic Games",
    genre: "Экшен / Песочница",
    developer: "Rockstar Games",
    releaseDate: "2015",
    rating: 4.85,
    reviewsCount: 5600,
    price: 799,
    oldPrice: 1999,
    discount: 60,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg"
    ],
    description: "Окунитесь в криминальный мир Лос-Сантоса. Издание Premium Edition включает сюжетную кампанию GTA V, GTA Online и стартовый набор «Преступная организация» с $1,000,000 на счет.",
    editions: [
      {
        name: "Premium Edition",
        description: "Сюжетная кампания + GTA Online + Бонус $1,000,000 GTA$",
        price: 799,
        oldPrice: 1999,
        discount: 60
      },
      {
        name: "Premium + Платежная карта «Мегалодон» ($10,000,000)",
        description: "Игра + Огромный стартовый капитал $10,000,000 в GTA Online",
        price: 1599,
        oldPrice: 3499,
        discount: 54
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 (64-bit)",
        cpu: "Intel Core 2 Quad CPU Q6600 @ 2.40GHz",
        ram: "8 ГБ",
        gpu: "Nvidia 9800 GT 1GB / AMD HD 4870 1GB",
        disk: "100 ГБ"
      },
      rec: {
        os: "Windows 10 / 11 (64-bit)",
        cpu: "Intel Core i5 3470 @ 3.2GHz",
        ram: "16 ГБ",
        gpu: "Nvidia GTX 660 2GB / AMD HD 7870 2GB",
        disk: "100 ГБ"
      }
    }
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    category: "games",
    categoryName: "Игры",
    platform: "steam",
    platformName: "Steam",
    genre: "Партийная RPG / D&D",
    developer: "Larian Studios",
    releaseDate: "2023",
    rating: 4.96,
    reviewsCount: 4400,
    price: 1799,
    oldPrice: 2499,
    discount: 28,
    isHit: true,
    isSpecialOffer: false,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg"
    ],
    description: "Игра года! Соберите отряд и вернитесь в Забытые Королевства. Вас ждет история о дружбе и предательстве, жертвенности и выживании, а также о манящей силе абсолютной власти.",
    editions: [
      {
        name: "Стандартное издание",
        description: "Полная игра Baldur's Gate 3",
        price: 1799,
        oldPrice: 2499,
        discount: 28
      },
      {
        name: "Digital Deluxe Edition",
        description: "Игра + набор предметов с Забытых Королевств, саундтрек и артбук",
        price: 2199,
        oldPrice: 2999,
        discount: 26
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 64-bit",
        cpu: "Intel I5 4690 / AMD FX 8350",
        ram: "8 ГБ",
        gpu: "Nvidia GTX 970 / RX 480 (4GB)",
        disk: "150 ГБ SSD"
      },
      rec: {
        os: "Windows 11 64-bit",
        cpu: "Intel i7 8700K / AMD r5 3600",
        ram: "16 ГБ",
        gpu: "Nvidia 2060 Super / RX 5700 XT (8GB)",
        disk: "150 ГБ SSD"
      }
    }
  },
  {
    id: "rdr-2",
    title: "Red Dead Redemption 2: Ultimate Edition",
    category: "games",
    categoryName: "Игры",
    platform: "steam",
    platformName: "Steam",
    genre: "Экшен / Вестерн",
    developer: "Rockstar Games",
    releaseDate: "2019",
    rating: 4.92,
    reviewsCount: 3500,
    price: 1199,
    oldPrice: 3999,
    discount: 70,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg",
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/capsule_616x353.jpg",
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg"
    ],
    description: "Америка, 1899 год. Эпоха Дикого Запада подходит к концу. Артур Морган и банда Датча ван дер Линде вынуждены пуститься в бега. Грандиозная история об искуплении и выживании.",
    editions: [
      {
        name: "Standard Edition",
        description: "Оригинальная сюжетная кампания + Red Dead Online",
        price: 999,
        oldPrice: 2999,
        discount: 66
      },
      {
        name: "Ultimate Edition (Всё включено)",
        description: "Сюжетные бонусы, эксклюзивные костюмы, породистый конь и бонусы для Red Dead Online",
        price: 1199,
        oldPrice: 3999,
        discount: 70
      }
    ],
    requirements: {
      min: {
        os: "Windows 10",
        cpu: "Intel Core i5-2500K / AMD FX-6300",
        ram: "8 ГБ",
        gpu: "Nvidia GeForce GTX 770 2GB / AMD Radeon R9 280",
        disk: "150 ГБ"
      },
      rec: {
        os: "Windows 10 / 11",
        cpu: "Intel Core i7-4770K / AMD Ryzen 5 1500X",
        ram: "16 ГБ",
        gpu: "Nvidia GeForce GTX 1060 6GB / AMD Radeon RX 480",
        disk: "150 ГБ SSD"
      }
    }
  },
  {
    id: "minecraft",
    title: "Minecraft: Java & Bedrock Edition (Deluxe)",
    category: "games",
    categoryName: "Игры",
    platform: "xbox",
    platformName: "Xbox / PC",
    genre: "Песочница / Выживание",
    developer: "Mojang Studios",
    releaseDate: "2011 / 2024",
    rating: 4.97,
    reviewsCount: 6200,
    price: 1290,
    oldPrice: 2490,
    discount: 48,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "assets/covers/minecraft.svg",
    screenshots: [
      "assets/covers/minecraft.svg"
    ],
    description: "Культовая песочница! Создавайте всё, что можете вообразить, добывайте ресурсы и выживайте. Лицензионный ключ включает обе версии: Java Edition (с поддержкой модов) и Bedrock Edition (для игры с друзьями на любых устройствах).",
    editions: [
      {
        name: "Стандартное издание (Java + Bedrock)",
        description: "Две версии игры в одном ключе + официальный лаунчер",
        price: 1290,
        oldPrice: 2490,
        discount: 48
      },
      {
        name: "Deluxe Collection (+ 1600 Minecoins)",
        description: "Игра + 1600 Minecoins + 5 карт + 5 предметов персонализации",
        price: 1890,
        oldPrice: 3490,
        discount: 46
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 / 11 (64-bit)",
        cpu: "Intel Core i3-3210 / AMD A8-7600",
        ram: "4 ГБ",
        gpu: "Intel HD Graphics 4000 / AMD Radeon R5",
        disk: "4 ГБ места на диске"
      },
      rec: {
        os: "Windows 11 (64-bit)",
        cpu: "Intel Core i5-4690 / AMD FX-8350",
        ram: "8 ГБ",
        gpu: "GeForce 700 Series / AMD Radeon Rx 200",
        disk: "Быстрый SSD накопитель"
      }
    }
  },

  // ----------------------------------------------------------------------------
  // 2. ИГРОВАЯ ВАЛЮТА — КАЛЬКУЛЯТОР ПОПОЛНЕНИЯ С КОМИССИЕЙ 4-5% (КАК НА GGSEL/PLAYEROK)
  // ----------------------------------------------------------------------------
  {
    id: "steam-wallet-topup",
    title: "Пополнение баланса Steam (РФ / СНГ / КЗ)",
    category: "currency",
    categoryName: "Игровая валюта",
    platform: "steam",
    platformName: "Steam",
    genre: "Калькулятор суммы • Комиссия 4%",
    developer: "Valve Corporation",
    releaseDate: "2026",
    rating: 4.98,
    reviewsCount: 3840,
    price: 104, // 100 ₽ + 4% = 104 ₽
    oldPrice: null,
    discount: null,
    isHit: true,
    isSpecialOffer: false,
    isCustomCurrency: true,
    commissionRate: 0.04, // 4% комиссия сервиса
    minAmount: 100,
    maxAmount: 50000,
    coverImage: "assets/covers/steam-wallet.svg",
    screenshots: [
      "assets/covers/steam-wallet.svg"
    ],
    description: "Мгновенное автоматическое пополнение баланса кошелька Steam по логину аккаунта (Россия, Казахстан, СНГ). Прозрачный калькулятор суммы с минимальной комиссией сервиса всего 4% — как на лучших торговых площадках (GGsel, PlayerOK, Funpay). Пароль не требуется!",
    editions: [
      {
        name: "Пополнение на 500 ₽",
        description: "Зачисление 500 ₽ на баланс (с комиссией 4% = 520 ₽)",
        price: 520,
        baseAmount: 500,
        commission: 20
      },
      {
        name: "Пополнение на 1 000 ₽ (Хит)",
        description: "Зачисление 1 000 ₽ на баланс (с комиссией 4% = 1 040 ₽)",
        price: 1040,
        baseAmount: 1000,
        commission: 40
      },
      {
        name: "Пополнение на 2 500 ₽",
        description: "Зачисление 2 500 ₽ на баланс (с комиссией 4% = 2 600 ₽)",
        price: 2600,
        baseAmount: 2500,
        commission: 100
      },
      {
        name: "Пополнение на 5 000 ₽",
        description: "Зачисление 5 000 ₽ на баланс (с комиссией 4% = 5 200 ₽)",
        price: 5200,
        baseAmount: 5000,
        commission: 200
      }
    ],
    requirements: {
      min: {
        os: "Любое устройство (ПК, смартфон, консоль)",
        cpu: "Не требуется",
        ram: "Не требуется",
        gpu: "Не требуется",
        disk: "Логин аккаунта Steam (под которым вы входите в Steam)"
      },
      rec: {
        os: "Любое устройство",
        cpu: "Не требуется",
        ram: "Не требуется",
        gpu: "Не требуется",
        disk: "Автоматическое зачисление средств за 1-2 минуты"
      }
    }
  },
  {
    id: "ps-store-gift-card",
    title: "Пополнение кошелька PlayStation Store (PSN)",
    category: "currency",
    categoryName: "Игровая валюта",
    platform: "playstation",
    platformName: "PlayStation",
    genre: "Калькулятор карт пополнения • Комиссия 5%",
    developer: "Sony Interactive Entertainment",
    releaseDate: "2026",
    rating: 4.95,
    reviewsCount: 1420,
    price: 525, // 500 ₽ + 5% = 525 ₽
    oldPrice: null,
    discount: null,
    isHit: false,
    isSpecialOffer: false,
    isCustomCurrency: true,
    commissionRate: 0.05, // 5% комиссия
    minAmount: 500,
    maxAmount: 25000,
    coverImage: "assets/covers/ps-store.svg",
    screenshots: [
      "assets/covers/ps-store.svg"
    ],
    description: "Официальный цифровой код пополнения бумажника PlayStation Network (PSN). Подходит для покупки любых игр, дополнений и подписок на консолях PS4 и PS5. Моментальная автовыдача кода сразу после оплаты!",
    editions: [
      {
        name: "Карта пополнения 1 000 ₽",
        description: "Код пополнения на 1 000 ₽ (с комиссией 5% = 1 050 ₽)",
        price: 1050,
        baseAmount: 1000,
        commission: 50
      },
      {
        name: "Карта пополнения 2 500 ₽ (Хит)",
        description: "Код пополнения на 2 500 ₽ (с комиссией 5% = 2 625 ₽)",
        price: 2625,
        baseAmount: 2500,
        commission: 125
      },
      {
        name: "Карта пополнения 5 000 ₽",
        description: "Код пополнения на 5 000 ₽ (с комиссией 5% = 5 250 ₽)",
        price: 5250,
        baseAmount: 5000,
        commission: 250
      }
    ],
    requirements: {
      min: {
        os: "PlayStation 4 / PlayStation 5",
        cpu: "Консоль Sony",
        ram: "-",
        gpu: "-",
        disk: "Наличие аккаунта PlayStation Network"
      },
      rec: {
        os: "PlayStation 5",
        cpu: "Консоль Sony",
        ram: "-",
        gpu: "-",
        disk: "Код активируется в разделе «Погашение кодов» в PS Store"
      }
    }
  },
  {
    id: "roblox-robux",
    title: "Roblox: Robux (Робуксы)",
    category: "currency",
    categoryName: "Игровая валюта",
    platform: "roblox",
    platformName: "Roblox",
    genre: "Игровая валюта • Моментальная выдача",
    developer: "Roblox Corporation",
    releaseDate: "2026",
    rating: 4.96,
    reviewsCount: 2950,
    price: 525, // 400 R$ с комиссией 5%
    oldPrice: null,
    discount: null,
    isHit: true,
    isSpecialOffer: true,
    isCustomCurrency: true,
    commissionRate: 0.05,
    minAmount: 100,
    maxAmount: 50000,
    coverImage: "assets/covers/roblox.svg",
    screenshots: [
      "assets/covers/roblox.svg"
    ],
    description: "Официальное быстрое пополнение баланса Robux (Робуксы) для аккаунтов Roblox по никнейму игрока. Безопасная передача робуксов без пароля от аккаунта. Моментальная обработка и 100% гарантия зачисления!",
    editions: [
      {
        name: "400 Robux (Пакет «Старт»)",
        description: "Зачисление 400 R$ на ваш аккаунт Roblox",
        price: 525,
        robuxAmount: 400,
        baseAmount: 500,
        commission: 25
      },
      {
        name: "800 Robux (Хит продаж)",
        description: "Зачисление 800 R$ на ваш аккаунт Roblox",
        price: 1050,
        robuxAmount: 800,
        baseAmount: 1000,
        commission: 50
      },
      {
        name: "1 700 Robux (Выгодный набор)",
        description: "Зачисление 1 700 R$ на ваш аккаунт Roblox",
        price: 2231,
        robuxAmount: 1700,
        baseAmount: 2125,
        commission: 106
      },
      {
        name: "4 500 Robux (Максимальный набор)",
        description: "Зачисление 4 500 R$ на ваш аккаунт Roblox",
        price: 5906,
        robuxAmount: 4500,
        baseAmount: 5625,
        commission: 281
      }
    ],
    requirements: {
      min: {
        os: "ПК / Смартфон / Консоль",
        cpu: "Не требуется",
        ram: "Не требуется",
        gpu: "Не требуется",
        disk: "Никнейм игрока в Roblox (пароль НЕ требуется)"
      },
      rec: {
        os: "Любое устройство",
        cpu: "Не требуется",
        ram: "Не требуется",
        gpu: "Не требуется",
        disk: "Автоматическое зачисление на аккаунт"
      }
    }
  },

  // ----------------------------------------------------------------------------
  // 3. ПОДПИСКИ (Фирменные обложки)
  // ----------------------------------------------------------------------------
  {
    id: "xbox-game-pass-ultimate",
    title: "Xbox Game Pass Ultimate — Подписка",
    category: "subscriptions",
    categoryName: "Подписки",
    platform: "xbox",
    platformName: "Xbox / PC",
    genre: "Игровая подписка • 400+ игр",
    developer: "Microsoft",
    releaseDate: "2026",
    rating: 4.99,
    reviewsCount: 2650,
    price: 1499,
    oldPrice: 2999,
    discount: 50,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "assets/covers/xbox-gamepass.svg",
    screenshots: [
      "assets/covers/xbox-gamepass.svg"
    ],
    description: "Доступ к библиотеке из более чем 400 игр высочайшего качества на ПК и консолях Xbox. Включает подписку EA Play, Xbox Live Gold и сетевой мультиплеер.",
    editions: [
      {
        name: "Подписка на 1 месяц",
        description: "Пробный месяц Game Pass Ultimate для ПК и Xbox",
        price: 599,
        oldPrice: 1199,
        discount: 50
      },
      {
        name: "Подписка на 3 месяца (Хит)",
        description: "3 месяца непрерывного доступа ко всем новинкам Xbox",
        price: 1499,
        oldPrice: 2999,
        discount: 50
      },
      {
        name: "Подписка на 12 месяцев (Максимальная выгода)",
        description: "Годовой абонемент со скидкой 55% и бонусами EA Play",
        price: 4999,
        oldPrice: 10999,
        discount: 55
      }
    ],
    requirements: {
      min: {
        os: "Windows 10 / Windows 11 / Xbox One",
        cpu: "Совместимый ПК или консоль",
        ram: "8 ГБ",
        gpu: "Зависит от запускаемой игры",
        disk: "Приложение Xbox на Windows"
      },
      rec: {
        os: "Windows 11 / Xbox Series X|S",
        cpu: "Современный ПК или Xbox Series X",
        ram: "16 ГБ",
        gpu: "GeForce RTX или Radeon",
        disk: "Высокоскоростной интернет для облачного гейминга"
      }
    }
  },
  {
    id: "ps-plus-extra",
    title: "PlayStation Plus Extra & Deluxe — Подписка",
    category: "subscriptions",
    categoryName: "Подписки",
    platform: "playstation",
    platformName: "PlayStation",
    genre: "Игровая подписка • PS4 / PS5",
    developer: "Sony Interactive Entertainment",
    releaseDate: "2026",
    rating: 4.96,
    reviewsCount: 1890,
    price: 2499,
    oldPrice: 4999,
    discount: 50,
    isHit: true,
    isSpecialOffer: true,
    coverImage: "assets/covers/ps-plus.svg",
    screenshots: [
      "assets/covers/ps-plus.svg"
    ],
    description: "Доступ к огромному каталогу из сотен игр для PS4 и PS5 (God of War, Spider-Man, Horizon, Ghost of Tsushima), сетевому мультиплееру и эксклюзивным скидкам в PS Store.",
    editions: [
      {
        name: "PS Plus Essential — 1 месяц",
        description: "Онлайн-мультиплеер + 3 бесплатные игры каждый месяц",
        price: 899,
        oldPrice: 1499,
        discount: 40
      },
      {
        name: "PS Plus Extra — 3 месяца (Хит)",
        description: "Каталог из 400+ игр для PS4 и PS5 + онлайн-игра",
        price: 2499,
        oldPrice: 4999,
        discount: 50
      },
      {
        name: "PS Plus Deluxe — 12 месяцев (Максимум)",
        description: "Каталог 400+ игр + классика PS1/PS2/PSP + демоверсии новинок",
        price: 6999,
        oldPrice: 12999,
        discount: 46
      }
    ],
    requirements: {
      min: {
        os: "PlayStation 4 / PlayStation 5",
        cpu: "Консоль Sony",
        ram: "-",
        gpu: "-",
        disk: "Аккаунт PSN"
      },
      rec: {
        os: "PlayStation 5",
        cpu: "Консоль Sony",
        ram: "-",
        gpu: "-",
        disk: "Высокоскоростной интернет для загрузки игр"
      }
    }
  },
  {
    id: "ea-play-pro",
    title: "EA Play Pro — Подписка на игры EA",
    category: "subscriptions",
    categoryName: "Подписки",
    platform: "ea",
    platformName: "EA App",
    genre: "Подписка на игры EA • Все новинки",
    developer: "Electronic Arts",
    releaseDate: "2026",
    rating: 4.8,
    reviewsCount: 620,
    price: 3499,
    oldPrice: 5999,
    discount: 41,
    isHit: false,
    isSpecialOffer: false,
    coverImage: "assets/covers/ea-play.svg",
    screenshots: [
      "assets/covers/ea-play.svg"
    ],
    description: "Полный доступ ко всем топовым играм EA в день их мирового релиза (FC 25, Battlefield, Need for Speed, Star Wars Jedi). Максимальные издания с эксклюзивными внутриигровыми наградами.",
    editions: [
      {
        name: "Подписка на 1 месяц",
        description: "Месячный доступ Pro ко всем новинкам",
        price: 999,
        oldPrice: 1499,
        discount: 33
      },
      {
        name: "Подписка на 12 месяцев",
        description: "Годовой абонемент Pro на все игры EA со скидкой 41%",
        price: 3499,
        oldPrice: 5999,
        discount: 41
      }
    ],
    requirements: {
      min: {
        os: "Windows 10",
        cpu: "Совместимый ПК",
        ram: "8 ГБ",
        gpu: "Зависит от игры",
        disk: "Приложение EA app"
      },
      rec: {
        os: "Windows 11",
        cpu: "Современный 6-ядерный процессор",
        ram: "16 ГБ",
        gpu: "GeForce RTX 3060",
        disk: "SSD накопитель"
      }
    }
  }
];

// Проверяем доступность в глобальной области видимости
if (typeof window !== "undefined") {
  window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
}
