/**
 * Утилиты для работы с контактами (телефоны и email)
 * Централизованная валидация и нормализация
 */

/**
 * Нормализует номер телефона к формату 7XXXXXXXXXX
 * Поддерживает форматы: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX
 *
 * @param phone - Номер телефона в любом формате
 * @returns Нормализованный номер в формате 7XXXXXXXXXX или null если невалидный
 *
 * @example
 * normalizePhone('+7 (999) 123-45-67') // '79991234567'
 * normalizePhone('8 999 123 45 67') // '79991234567'
 * normalizePhone('79991234567') // '79991234567'
 */
export function normalizePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Убираем все нецифровые символы
  const digitsOnly = phone.replace(/\D/g, '');

  // Проверяем и нормализуем формат
  if (/^8\d{10}$/.test(digitsOnly)) {
    // Формат 8XXXXXXXXXX -> 7XXXXXXXXXX
    return `7${digitsOnly.slice(1)}`;
  }

  if (/^7\d{10}$/.test(digitsOnly)) {
    // Уже в правильном формате
    return digitsOnly;
  }

  // Невалидный формат
  return null;
}

/**
 * Валидирует российский номер телефона
 *
 * @param phone - Номер телефона
 * @returns true если номер валидный
 */
export function isValidRussianPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}

/**
 * Форматирует номер телефона для отображения: +7 (XXX) XXX-XX-XX
 *
 * @param phone - Номер в формате 7XXXXXXXXXX или любом другом
 * @returns Отформатированный номер или исходную строку если невалидный
 *
 * @example
 * formatPhoneForDisplay('79991234567') // '+7 (999) 123-45-67'
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return phone; // Возвращаем исходную строку если невалидный
  }

  // Форматируем: +7 (XXX) XXX-XX-XX
  return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
}

/**
 * Валидирует email адрес
 *
 * @param email - Email адрес
 * @returns true если email валидный
 *
 * Использует более строгую валидацию для корректной работы с различными доменами
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return false;
  }

  // Более строгая валидация email:
  // - Локальная часть: буквы, цифры, точки, дефисы, подчеркивания
  // - @ символ
  // - Доменная часть: буквы, цифры, точки, дефисы
  // - Минимум одна точка в доменной части (для TLD)
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

/**
 * Валидирует контакт в зависимости от метода
 *
 * @param contact - Контакт (email или телефон)
 * @param method - Метод аутентификации
 * @returns true если контакт валиден для указанного метода
 *
 * Примечание: для телефона проверяет минимальную длину (не менее 10 цифр после +7)
 * чтобы не показывать ошибку при вводе
 */
export function isValidContact(contact: string, method: 'email' | 'phone'): boolean {
  if (!contact || typeof contact !== 'string') {
    return false;
  }

  const trimmed = contact.trim();
  if (!trimmed) {
    return false;
  }

  if (method === 'email') {
    return isValidEmail(trimmed);
  }

  if (method === 'phone') {
    // Для телефона проверяем, что это российский номер
    // Разрешаем неполные номера во время ввода (минимум 10 цифр после +7)
    const digitsOnly = trimmed.replace(/\D/g, '');
    // Проверяем, что начинается с 7 и имеет минимум 11 цифр (7 + 10)
    if (/^7\d{10,}$/.test(digitsOnly)) {
      return true;
    }
    // Также проверяем формат 8XXXXXXXXXX
    if (/^8\d{10,}$/.test(digitsOnly)) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Нормализует контакт для отправки на бэкенд
 * Для телефона - нормализует к 7XXXXXXXXXX
 * Для email - триммит и приводит к lowercase
 *
 * @param contact - Контакт
 * @param method - Метод аутентификации
 * @returns Нормализованный контакт или null если невалидный
 */
export function normalizeContact(contact: string, method: 'email' | 'phone'): string | null {
  if (!contact || typeof contact !== 'string') {
    return null;
  }

  if (method === 'email') {
    const trimmed = contact.trim().toLowerCase();
    return isValidEmail(trimmed) ? trimmed : null;
  }

  if (method === 'phone') {
    return normalizePhone(contact);
  }

  return null;
}

/**
 * Получает сообщение об ошибке валидации контакта
 *
 * @param contact - Контакт
 * @param method - Метод аутентификации
 * @returns Сообщение об ошибке или null если валидный
 */
export function getContactValidationError(
  contact: string,
  method: 'email' | 'phone',
): string | null {
  if (!contact || typeof contact !== 'string') {
    return method === 'email' ? 'Введите email адрес' : 'Введите номер телефона';
  }

  if (method === 'email') {
    if (!isValidEmail(contact)) {
      return 'Введите корректный email адрес (например: example@mail.ru)';
    }
  }

  if (method === 'phone') {
    if (!isValidRussianPhone(contact)) {
      return 'Введите корректный номер телефона в формате +7XXXXXXXXXX';
    }
  }

  return null;
}
