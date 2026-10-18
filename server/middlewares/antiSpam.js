import UserModel from '../models/user.model.js';

/**
 * In-memory кеш для отслеживания попыток регистрации
 * В production лучше использовать Redis
 */
const registrationAttemptsCache = new Map();

/**
 * Очистка устаревших записей из кеша (каждые 5 минут)
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of registrationAttemptsCache.entries()) {
      if (now - data.timestamp > 15 * 60 * 1000) {
        // Удаляем записи старше 15 минут
        registrationAttemptsCache.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Middleware для защиты от массового создания аккаунтов
 * Ограничивает количество регистраций с одного контакта/IP за период времени
 *
 * Правила:
 * - Максимум 3 регистрации с одного контакта за 15 минут
 * - Максимум 5 регистраций с одного IP за час
 */
export const antiSpamMiddleware = async (request, response, next) => {
  try {
    const { contact, method } = request.body;
    const clientIp =
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection.remoteAddress ||
      'unknown';

    if (!contact || !method) {
      return next(); // Пропускаем если нет контакта (валидация будет в контроллере)
    }

    // Базовая валидация метода
    if (!['email', 'phone'].includes(method)) {
      return next(); // Пропускаем - валидация будет в контроллере
    }

    // Нормализация контакта для ключа кеша
    const normalizedContact =
      method === 'phone' ? contact.replace(/\D/g, '') : contact.toLowerCase().trim();
    const contactKey = `${method}:${normalizedContact}`;
    const ipKey = `ip:${clientIp}`;

    const now = Date.now();

    // Проверка лимита по контакту (3 регистрации за 15 минут)
    const contactData = registrationAttemptsCache.get(contactKey);
    if (contactData) {
      const timeSinceFirstAttempt = now - contactData.timestamp;
      const windowMs = 15 * 60 * 1000; // 15 минут

      if (timeSinceFirstAttempt < windowMs && contactData.count >= 3) {
        const remainingMinutes = Math.ceil((windowMs - timeSinceFirstAttempt) / (60 * 1000));
        console.warn(`⚠️ [AntiSpam] Превышен лимит регистраций для контакта: ${contactKey}`);
        return response.status(429).json({
          message: `Слишком много попыток регистрации. Попробуйте через ${remainingMinutes} минут`,
          error: true,
          success: false,
        });
      }

      // Обновляем счетчик
      registrationAttemptsCache.set(contactKey, {
        count: contactData.count + 1,
        timestamp: contactData.timestamp, // Сохраняем время первой попытки
      });
    } else {
      // Первая попытка
      registrationAttemptsCache.set(contactKey, {
        count: 1,
        timestamp: now,
      });
    }

    // Проверка лимита по IP (5 регистраций за час)
    const ipData = registrationAttemptsCache.get(ipKey);
    if (ipData) {
      const timeSinceFirstAttempt = now - ipData.timestamp;
      const windowMs = 60 * 60 * 1000; // 1 час

      if (timeSinceFirstAttempt < windowMs && ipData.count >= 5) {
        const remainingMinutes = Math.ceil((windowMs - timeSinceFirstAttempt) / (60 * 1000));
        console.warn(`⚠️ [AntiSpam] Превышен лимит регистраций для IP: ${clientIp}`);
        return response.status(429).json({
          message: `Слишком много попыток регистрации с вашего IP. Попробуйте через ${remainingMinutes} минут`,
          error: true,
          success: false,
        });
      }

      // Обновляем счетчик
      registrationAttemptsCache.set(ipKey, {
        count: ipData.count + 1,
        timestamp: ipData.timestamp,
      });
    } else {
      // Первая попытка с этого IP
      registrationAttemptsCache.set(ipKey, {
        count: 1,
        timestamp: now,
      });
    }

    // Дополнительная проверка: не создано ли уже слишком много аккаунтов с этого контакта
    // Проверяем количество существующих пользователей с таким контактом
    const searchQuery =
      method === 'email' ? { email: normalizedContact } : { mobile: normalizedContact };
    const existingUsersCount = await UserModel.countDocuments(searchQuery);

    // Если уже есть активный пользователь, это нормально (повторная отправка OTP)
    // Но если создано много неактивных/заблокированных - это подозрительно
    if (existingUsersCount > 0) {
      const activeUsers = await UserModel.countDocuments({
        ...searchQuery,
        status: 'Active',
      });

      // Если есть активный пользователь - это нормально (вход/повторная отправка)
      if (activeUsers > 0) {
        return next();
      }

      // Если много неактивных - возможно спам
      if (existingUsersCount >= 3) {
        console.warn(
          `⚠️ [AntiSpam] Обнаружено много неактивных аккаунтов для контакта: ${contactKey}`,
        );
        return response.status(429).json({
          message: 'Превышен лимит попыток регистрации для этого контакта',
          error: true,
          success: false,
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ [AntiSpam] Ошибка middleware:', error);
    // В случае ошибки пропускаем запрос (не блокируем легитимных пользователей)
    next();
  }
};

/**
 * Сброс счетчика для контакта (вызывается после успешной регистрации)
 */
export const resetContactAttempts = contactKey => {
  registrationAttemptsCache.delete(contactKey);
};

/**
 * Получение статистики попыток (для мониторинга)
 */
export const getAntiSpamStats = () => {
  return {
    cacheSize: registrationAttemptsCache.size,
    entries: Array.from(registrationAttemptsCache.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      age: Date.now() - data.timestamp,
    })),
  };
};
