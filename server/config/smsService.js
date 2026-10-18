import axios from 'axios';

const SMSRU_BASE_URL = 'https://sms.ru';
const DEFAULT_TIMEOUT = 10000; // 10 секунд

/**
 * SMS.RU API Service для отправки SMS и управления балансом.
 * Поддержка расширения под новые типы уведомлений и отложенных отправок.
 * Документация: https://sms.ru/api/
 */
class SmsService {
  constructor() {
    this.apiId = process.env.SMS_RU_API_ID;
    this.senderName = process.env.SMS_RU_SENDER_NAME; // Имя отправителя (опционально, но рекомендуется)
    this.baseEndpoints = {
      send: `${SMSRU_BASE_URL}/sms/send`,
      balance: `${SMSRU_BASE_URL}/my/balance`,
    };
    this.isDev = process.env.NODE_ENV !== 'production';

    // Предупреждение, если имя отправителя не указано
    if (!this.senderName && this.isDev) {
      console.warn('⚠️ [SMS.RU] SMS_RU_SENDER_NAME не указан в .env');
      console.warn(
        '💡 [SMS.RU] Для работы может потребоваться зарегистрировать буквенного отправителя',
      );
      console.warn('💡 [SMS.RU] Подробнее: https://sms.ru/?panel=senders');
    }
  }

  /**
   * Нормализация номера телефона РФ: принимает +7XXXXXXXXXX, 7XXXXXXXXXX, 8XXXXXXXXXX
   * Возвращает строку в формате 7XXXXXXXXXX или выбрасывает ошибку.
   * @param {string} phone
   * @returns {string}
   */
  normalizePhone(phone) {
    if (typeof phone !== 'string') throw new Error('Некорректный тип номера телефона');
    const digits = phone.replace(/[^\d]/g, '');
    let normalized = digits;

    // Поддержка входных с 8 (расшифровка для РФ)
    if (digits.length === 11 && digits[0] === '8') {
      normalized = '7' + digits.slice(1);
    } else if (digits.length === 11 && digits[0] === '7') {
      normalized = digits;
    } else if (digits.length === 10) {
      normalized = '7' + digits;
    }

    // Финальная проверка
    if (!/^7\d{10}$/.test(normalized)) {
      throw new Error(
        `Неверный формат номера телефона: ${phone}. Ожидается российский номер (пример: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX)`,
      );
    }

    return normalized;
  }

  /**
   * Формирует текст для любого SMS, можно донастроить шаблоны для разных задач.
   * @param {string} code
   * @param {Object} [opts]
   * @returns {string}
   */
  getOtpMessage(code, opts = {}) {
    const { lifetime = 5 } = opts;
    return `Ваш код подтверждения: ${code}. Код действителен ${lifetime} мин. Никому не сообщайте его!`;
  }

  /**
   * Универсальный запрос к SMS.RU API
   * @param {string} endpoint
   * @param {Object} params
   * @param {Object} [options]
   */
  async request(endpoint, params, options = {}) {
    if (!this.apiId) {
      throw new Error('❌ [SMS.RU] api_id не настроен! Проверьте .env файл');
    }
    try {
      const response = await axios.get(endpoint, {
        params: { ...params, api_id: this.apiId, json: 1 },
        timeout: options.timeout || DEFAULT_TIMEOUT,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('❌ [SMS.RU] HTTP Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ [SMS.RU] Нет ответа от сервера SMS.RU');
      } else {
        console.error('❌ [SMS.RU] Ошибка:', error.message);
      }
      throw error;
    }
  }

  /**
   * Отправка OTP кода на номер телефона через SMS.RU
   * @param {string} phone
   * @param {string} code
   * @param {Object} [opts]
   * @returns {Promise<Object>}
   */
  async sendOTP(phone, code, opts = {}) {
    const normalizedPhone = this.normalizePhone(phone);
    const message = this.getOtpMessage(code, opts);

    // В dev режиме можно использовать тестовый режим SMS.RU (не отправляет реальные SMS)
    // Установите SMS_RU_TEST_MODE=1 в .env для тестирования без расходования средств
    const testMode = this.isDev && process.env.SMS_RU_TEST_MODE === '1';

    if (this.isDev) {
      console.log('📱 [SMS.RU][DEV] Отправка SMS:', {
        normalizedPhone,
        code,
        message,
        testMode: testMode ? 'ДА (SMS не будет отправлено)' : 'НЕТ (реальная отправка)',
      });
    } else {
      console.log('📱 [SMS.RU] Отправка SMS на номер:', normalizedPhone);
    }

    const requestParams = {
      to: normalizedPhone,
      msg: message,
    };

    // Добавляем имя отправителя, если указано
    if (this.senderName) {
      requestParams.from = this.senderName;
    }

    // Добавляем параметр test=1 только если явно включен тестовый режим
    if (testMode) {
      requestParams.test = 1;
      console.log('⚠️ [SMS.RU][DEV] Включен ТЕСТОВЫЙ режим - SMS НЕ будет отправлено реально!');
    }

    // Логирование параметров запроса для диагностики
    if (this.isDev) {
      console.log('📤 [SMS.RU] Параметры запроса:', {
        endpoint: this.baseEndpoints.send,
        params: { ...requestParams, api_id: '***скрыт***' },
        normalizedPhone,
      });
    }

    const apiResult = await this.request(this.baseEndpoints.send, requestParams);

    // Детальное логирование ответа API в dev режиме или когда есть проблемы
    if (this.isDev) {
      console.log('🔍 [SMS.RU][DEV] Полный ответ API:', JSON.stringify(apiResult, null, 2));
    }

    // Проверка успешности отправки
    if (apiResult.status === 'OK' && apiResult.status_code === 100) {
      // Проверяем наличие объекта sms
      if (!apiResult.sms || typeof apiResult.sms !== 'object') {
        console.error(
          '❌ [SMS.RU] КРИТИЧЕСКАЯ ОШИБКА: Объект sms отсутствует или имеет неверный формат!',
        );
        console.error('🔍 [SMS.RU] Полный ответ API:', JSON.stringify(apiResult, null, 2));
        throw new Error('SMS.RU Error: Объект sms отсутствует в ответе API');
      }

      // Извлекаем sms_id из разных возможных структур ответа
      let smsId = null;

      // Пробуем разные варианты ключей для номера телефона
      const possibleKeys = [
        normalizedPhone, // 79640260062
        `+${normalizedPhone}`, // +79640260062
        `7${normalizedPhone.slice(1)}`, // если уже есть 7
        normalizedPhone.replace(/^7/, '+7'), // +79640260062
      ];

      let smsData = null;
      let foundKey = null;

      for (const key of possibleKeys) {
        if (apiResult.sms?.[key]) {
          smsData = apiResult.sms[key];
          foundKey = key;
          break;
        }
      }

      // Если не нашли по ключам, проверяем всю структуру sms
      if (!smsData && apiResult.sms) {
        const smsKeys = Object.keys(apiResult.sms);
        console.warn(
          `⚠️ [SMS.RU] Номер ${normalizedPhone} не найден в ответе. Доступные ключи в sms:`,
          smsKeys,
        );

        if (smsKeys.length > 0) {
          // Берем первый доступный ключ (может быть номер в другом формате)
          foundKey = smsKeys[0];
          smsData = apiResult.sms[foundKey];
          console.warn(
            `⚠️ [SMS.RU] Используется первый найденный ключ: ${foundKey} (ожидался: ${normalizedPhone})`,
          );
        } else {
          console.error('❌ [SMS.RU] Объект sms пустой или не содержит данных!');
        }
      } else if (foundKey && foundKey !== normalizedPhone) {
        console.warn(
          `⚠️ [SMS.RU] Номер найден, но в другом формате: ${foundKey} (ожидался: ${normalizedPhone})`,
        );
      }

      if (smsData) {
        smsId = smsData.sms_id || smsData.smsId || smsData.id || null;

        // Проверяем статус конкретной SMS
        const smsStatus = smsData.status;
        const smsStatusCode = smsData.status_code;

        if (smsStatusCode && smsStatusCode !== 100) {
          const errorMsg = this.getErrorMessage(smsStatusCode);
          const statusText = smsData.status_text || '';

          console.error(`❌ [SMS.RU] Ошибка отправки SMS на номер ${normalizedPhone}:`, {
            status_code: smsStatusCode,
            error: errorMsg,
            status_text: statusText,
            sms_data: smsData,
          });

          // Специальная обработка ошибки 221
          if (smsStatusCode === 221) {
            console.error('💡 [SMS.RU] Решение: Необходимо создать буквенного отправителя!');
            console.error('📋 [SMS.RU] Инструкция:');
            console.error('   1. Войдите в личный кабинет: https://sms.ru/panel');
            console.error('   2. Перейдите в раздел "Отправители"');
            console.error('   3. Нажмите "Создать буквенного отправителя"');
            console.error('   4. Введите имя (3-11 символов, латиница, без пробелов)');
            console.error('   5. Загрузите документы (свидетельство о регистрации компании)');
            console.error('   6. Дождитесь модерации (1-2 недели)');
            console.error('   Подробнее: https://sms.ru/?panel=senders');
          }

          throw new Error(
            `SMS.RU Error для номера ${normalizedPhone}: ${errorMsg}${statusText ? '. ' + statusText : ''}`,
          );
        }
      }

      // Если sms_id все еще null, логируем полный ответ для диагностики
      if (!smsId && !testMode) {
        console.error('❌ [SMS.RU] КРИТИЧЕСКАЯ ПРОБЛЕМА: sms_id не получен, но статус OK!');
        console.error('🔍 [SMS.RU] Полный ответ API:', JSON.stringify(apiResult, null, 2));
        console.error('🔍 [SMS.RU] Нормализованный номер:', normalizedPhone);
        console.error('🔍 [SMS.RU] Объект sms:', JSON.stringify(apiResult.sms, null, 2));
        console.error('💡 [SMS.RU] Возможные причины:');
        console.error('   1. SMS.RU не отправил SMS (проверьте историю в личном кабинете)');
        console.error('   2. Неправильный формат номера в ключе объекта sms');
        console.error('   3. Проблема с API ключом или балансом');
        console.error('   4. Номер в стоп-листе или заблокирован');
      }

      // Логирование результата
      if (this.isDev) {
        console.log('✅ [SMS.RU] SMS отправлено:', {
          phone: normalizedPhone,
          sms_id: smsId || 'не получен',
          balance: apiResult.balance,
          sms_object: smsData,
          testMode: testMode ? '⚠️ ТЕСТОВЫЙ РЕЖИМ - SMS не отправлено!' : '✅ Реальная отправка',
        });

        if (!smsId && !testMode) {
          console.warn('⚠️ [SMS.RU][DEV] ВНИМАНИЕ: sms_id не получен, но статус OK.');
          console.warn('💡 [SMS.RU][DEV] Проверьте:');
          console.warn('   1. Структуру ответа API выше');
          console.warn('   2. Историю отправок в личном кабинете SMS.RU: https://sms.ru/panel');
          console.warn('   3. Баланс аккаунта (должен быть достаточным)');
          console.warn('   4. Статус доставки SMS в личном кабинете');
        }
      } else {
        // В production режиме тоже логируем, если sms_id null
        if (!smsId && !testMode) {
          console.error('❌ [SMS.RU] КРИТИЧЕСКАЯ ПРОБЛЕМА: sms_id не получен в production!');
          console.error('🔍 [SMS.RU] Полный ответ API:', JSON.stringify(apiResult, null, 2));
          console.error('🔍 [SMS.RU] Нормализованный номер:', normalizedPhone);
          console.error('🔍 [SMS.RU] Объект sms:', JSON.stringify(apiResult.sms, null, 2));
        }

        console.log('✅ [SMS.RU] SMS отправлено:', {
          phone: normalizedPhone,
          sms_id: smsId || 'НЕ ПОЛУЧЕН',
          balance: apiResult.balance,
        });
      }
      return {
        success: true,
        sms_id: smsId,
        balance: apiResult.balance,
      };
    } else {
      const errorMessage = this.getErrorMessage(apiResult.status_code);
      console.error('❌ [SMS.RU] Ошибка отправки SMS:', {
        phone: normalizedPhone,
        status_code: apiResult.status_code,
        error: errorMessage,
        raw: apiResult,
      });

      // Дополнительные инструкции для частых ошибок
      if (apiResult.status_code === 201) {
        console.error('💡 [SMS.RU] Решение: Пополните баланс на https://sms.ru/panel');
      } else if (apiResult.status_code === 200) {
        console.error('💡 [SMS.RU] Решение: Проверьте правильность SMS_RU_API_ID в .env файле');
      } else if (apiResult.status_code === 202) {
        console.error(
          '💡 [SMS.RU] Решение: Проверьте формат номера телефона (должен быть +7XXXXXXXXXX)',
        );
      } else if (apiResult.status_code === 207) {
        console.error(
          '💡 [SMS.RU] Решение: Этот номер заблокирован для отправки. Проверьте стоп-лист в личном кабинете',
        );
      } else if (apiResult.status_code === 221) {
        console.error('💡 [SMS.RU] Решение: Необходимо создать буквенного отправителя!');
        console.error('📋 [SMS.RU] Инструкция:');
        console.error('   1. Войдите в личный кабинет: https://sms.ru/panel');
        console.error('   2. Перейдите в раздел "Отправители"');
        console.error('   3. Нажмите "Создать буквенного отправителя"');
        console.error('   4. Введите имя (3-11 символов, латиница, без пробелов)');
        console.error('   5. Загрузите документы (свидетельство о регистрации компании)');
        console.error('   6. Дождитесь модерации (1-2 недели)');
        console.error('   Подробнее: https://sms.ru/?panel=senders');
      }

      throw new Error(`SMS.RU Error: ${errorMessage}`);
    }
  }

  /**
   * Получение расшифровки ошибок SMS.RU
   * @param {number|string} code
   * @returns {string}
   */
  getErrorMessage(code) {
    const errorCodes = {
      100: 'Сообщение принято к отправке',
      200: 'Неправильный api_id',
      201: 'Не хватает средств на лицевом счету',
      202: 'Неправильно указан получатель',
      203: 'Нет текста сообщения',
      204: 'Имя отправителя не согласовано с администрацией',
      205: 'Сообщение слишком длинное (превышает 8 SMS)',
      206: 'Будет превышен или уже превышен дневной лимит на отправку',
      207: 'На этот номер нельзя отправлять сообщения',
      208: 'Параметр time указан неправильно',
      209: 'Вы добавили этот номер в стоп-лист',
      210: 'Используется GET, где нужно POST',
      211: 'Метод не найден',
      220: 'Сервис временно недоступен',
      221: 'Необходимо создать буквенного отправителя (Sender Name)',
      300: 'Неправильный token (истек или IP сменился)',
      301: 'Неправильный пароль или пользователь не найден',
      302: 'Пользователь авторизован, но аккаунт не подтвержден',
    };

    return errorCodes[String(code)] || `Неизвестная ошибка SMS.RU (код: ${code})`;
  }

  /**
   * Получить текущий баланс аккаунта SMS.RU
   * @returns {Promise<number | string>} Баланс
   */
  async getBalance() {
    const resp = await this.request(this.baseEndpoints.balance, {});
    if (typeof resp.balance !== 'undefined') {
      if (this.isDev) {
        console.log('💰 [SMS.RU] Текущий баланс:', resp.balance);
      }
      return resp.balance;
    }
    throw new Error(this.getErrorMessage(resp.status_code || 0));
  }

  /**
   * Проверка статуса конкретного SMS по sms_id
   * @param {string} smsId
   * @returns {Promise<Object>} Результат проверки
   */
  async checkStatus(smsId) {
    if (!smsId) throw new Error('smsId обязателен');
    const data = await this.request(`${SMSRU_BASE_URL}/sms/status`, { sms_id: smsId });
    if (typeof data.status !== 'undefined' && data.status !== 'ERROR') {
      if (this.isDev) {
        console.log('🔎 [SMS.RU] Статус sms:', data);
      }
      return data;
    } else {
      throw new Error(this.getErrorMessage(data.status_code || 0));
    }
  }
}

// Экспорт singleton
const smsService = new SmsService();
export default smsService;
