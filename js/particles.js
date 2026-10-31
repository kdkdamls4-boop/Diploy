/**
 * ==============================================================================
 * DIPLOY GAMES - АТМОСФЕРНЫЙ ФОН ЧАСТИЦ (particles.js)
 * ==============================================================================
 * Легковесный фоновый эффект: осенние кружащиеся листья и мягкие хэллоуинские
 * тлеющие угольки на Canvas 2D.
 *
 * Особенности реализации:
 * - 0 внешних зависимостей, чистый Vanilla JS, совместимость с протоколом file:///
 * - Ровно 30 частиц (18 листьев + 12 огоньков) для нулевой нагрузки на CPU/GPU
 * - Использование requestAnimationFrame для плавного фреймрейта
 * - Автоматическая пауза анимации при неактивной вкладке (document.hidden / visibilitychange)
 * - Уважение настроек доступности prefers-reduced-motion (отключение движения)
 */

(function () {
  "use strict";

  // Конфигурация анимации
  var TOTAL_LEAVES = 18;  // Количество осенних листьев
  var TOTAL_EMBERS = 12;  // Количество светящихся хэллоуинских огоньков
  var particles = [];     // Массив всех активных частиц
  var canvas = null;      // DOM-элемент <canvas>
  var ctx = null;         // 2D контекст рисования
  var animId = null;      // Идентификатор кадра requestAnimationFrame
  var isRunning = false;  // Флаг активности анимационного цикла

  // Палитра цветов осенних листьев
  var LEAF_COLORS = [
    "#ff7a00", // Тыквенно-оранжевый
    "#f59e0b", // Янтарно-золотой
    "#ea580c", // Огненно-оранжевый
    "#d97706", // Теплый охристый
    "#b45309"  // Темный медный
  ];

  // Палитра цветов хэллоуинских огоньков
  var EMBER_COLORS = [
    "#ff7a00", // Оранжевое свечение
    "#c084fc", // Светло-фиолетовый
    "#8b5cf6", // Мистический фиолетовый
    "#ff9a3c", // Мягкий персиковый огонек
    "#fbbf24"  // Золотистая искра
  ];

  /**
   * Проверка системных настроек пользователя на уменьшение движения (Accessibility)
   */
  function isReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Генерация случайного числа с плавающей точкой в диапазоне [min, max]
   */
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Создание частицы «Осенний лист»
   */
  function createLeaf(w, h, initialSpawn) {
    return {
      type: "leaf",
      x: randomRange(0, w),
      y: initialSpawn ? randomRange(0, h) : randomRange(-40, -10),
      sizeX: randomRange(7, 13),      // Полуширина листочка
      sizeY: randomRange(4, 8),        // Полувысота листочка
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      opacity: randomRange(0.4, 0.75),
      speedY: randomRange(0.6, 1.4),   // Скорость падения вниз
      speedX: randomRange(-0.3, 0.3),  // Базовый горизонтальный дрейф
      angle: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.02, 0.02),
      swingOffset: randomRange(0, Math.PI * 2), // Фаза синусоидального покачивания
      swingSpeed: randomRange(0.015, 0.035)
    };
  }

  /**
   * Создание частицы «Тлеющий огонек / искра»
   */
  function createEmber(w, h, initialSpawn) {
    return {
      type: "ember",
      x: randomRange(0, w),
      y: initialSpawn ? randomRange(0, h) : randomRange(h + 10, h + 40),
      radius: randomRange(1.5, 3.2),
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      baseAlpha: randomRange(0.25, 0.65),
      speedY: randomRange(-0.7, -0.2), // Медленное парение вверх
      speedX: randomRange(-0.25, 0.25),
      pulse: randomRange(0, Math.PI * 2),
      pulseSpeed: randomRange(0.02, 0.05)
    };
  }

  /**
   * Инициализация массива частиц
   */
  function initParticlesArray(w, h) {
    particles = [];
    var i;
    for (i = 0; i < TOTAL_LEAVES; i++) {
      particles.push(createLeaf(w, h, true));
    }
    for (i = 0; i < TOTAL_EMBERS; i++) {
      particles.push(createEmber(w, h, true));
    }
  }

  /**
   * Обновление физических координат отдельной частицы
   */
  function updateParticle(p, w, h) {
    if (p.type === "leaf") {
      // Покачивание листа из стороны в сторону
      p.swingOffset += p.swingSpeed;
      p.x += p.speedX + Math.sin(p.swingOffset) * 0.75;
      p.y += p.speedY;
      p.angle += p.rotationSpeed;

      // Если лист улетел за нижний край экрана, перезапускаем его сверху
      if (p.y > h + 30) {
        p.y = -20;
        p.x = randomRange(0, w);
      }
      if (p.x < -40) {
        p.x = w + 20;
      } else if (p.x > w + 40) {
        p.x = -20;
      }
    } else if (p.type === "ember") {
      // Плавное парение огонька вверх и пульсация яркости
      p.pulse += p.pulseSpeed;
      p.x += p.speedX;
      p.y += p.speedY;

      // Если огонек улетел за верхний край экрана, перезапускаем его снизу
      if (p.y < -30) {
        p.y = h + 20;
        p.x = randomRange(0, w);
      }
      if (p.x < -30) {
        p.x = w + 20;
      } else if (p.x > w + 30) {
        p.x = -20;
      }
    }
  }

  /**
   * Отрисовка частицы на Canvas
   */
  function drawParticle(p) {
    if (p.type === "leaf") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      // Листочек в форме изящного эллипса
      ctx.ellipse(0, 0, p.sizeX, p.sizeY, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.restore();
    } else if (p.type === "ember") {
      // Расчет мерцания прозрачности от baseAlpha
      var alpha = Math.max(0.1, Math.min(0.9, p.baseAlpha + Math.sin(p.pulse) * 0.25));
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Главный анимационный цикл (60 кадров/сек)
   */
  function loop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      updateParticle(particles[i], canvas.width, canvas.height);
      drawParticle(particles[i]);
    }

    if (typeof requestAnimationFrame !== "undefined") {
      animId = requestAnimationFrame(loop);
    }
  }

  /**
   * Запуск анимации
   */
  function start() {
    if (isRunning) return;
    if (isReducedMotion()) return;
    isRunning = true;
    if (typeof requestAnimationFrame !== "undefined") {
      animId = requestAnimationFrame(loop);
    }
  }

  /**
   * Остановка анимации
   */
  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (animId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  /**
   * Обработка изменения размера окна браузера
   */
  function handleResize() {
    if (!canvas || typeof window === "undefined") return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  /**
   * Обработка смены видимости вкладки (document.hidden)
   * При скрытии вкладки анимация полностью замирает, экономя ресурсы устройства.
   */
  function handleVisibilityChange() {
    if (typeof document !== "undefined" && document.hidden) {
      stop();
    } else {
      if (!isReducedMotion()) {
        start();
      }
    }
  }

  /**
   * Первичная инициализация Canvas и запуск модуля
   */
  function init() {
    if (typeof document === "undefined") return;

    // Находим существующий элемент холста или создаем его динамически
    canvas = document.getElementById("particles-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "particles-canvas";
      if (document.body) {
        document.body.appendChild(canvas);
      } else {
        return;
      }
    }

    ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Устанавливаем корректные габариты холста
    handleResize();

    // Создаем 30 частиц (18 листьев + 12 огоньков)
    initParticlesArray(canvas.width, canvas.height);

    // Слушатели событий изменения окна и видимости вкладки
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Слушатель системной настройки prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia) {
      var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      var handleMotionChange = function (e) {
        if (e.matches) {
          stop();
          if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          if (typeof document !== "undefined" && !document.hidden) {
            start();
          }
        }
      };

      if (motionQuery.addEventListener) {
        motionQuery.addEventListener("change", handleMotionChange);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionChange);
      }
    }

    // Если у пользователя не включен режим reduced motion, запускаем цикл
    if (!isReducedMotion()) {
      start();
    }
  }

  // Запуск при готовности DOM
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // Экспорт объекта для возможности программной проверки или отладки
  if (typeof window !== "undefined") {
    window.DiployParticles = {
      getParticleCount: function () {
        return particles.length;
      },
      isRunning: function () {
        return isRunning;
      },
      start: start,
      stop: stop
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      TOTAL_LEAVES: TOTAL_LEAVES,
      TOTAL_EMBERS: TOTAL_EMBERS
    };
  }
})();
