/**
 * Утилиты для модального окна авторизации
 */

import { EMAIL_REGEX, PHONE_REGEX } from '../model/constants';

/**
 * Тип контакта
 */
export type ContactType = 'email' | 'phone' | 'invalid';

/**
 * Определяет тип контакта (email или phone)
 *
 * @param contact - Строка контакта
 * @returns Тип контакта
 */
export function detectContactType(contact: string): ContactType {
  const trimmed = contact.trim();

  // Сначала проверяем email (более специфичный паттерн)
  if (EMAIL_REGEX.test(trimmed)) {
    return 'email';
  }

  // Проверяем телефон - считаем цифры
  const digits = trimmed.replace(/\D/g, '');
  // Если есть 10-11 цифр и нет @ - это телефон
  if (digits.length >= 10 && digits.length <= 11 && !trimmed.includes('@')) {
    return 'phone';
  }

  // Пробуем regex как fallback
  if (PHONE_REGEX.test(trimmed)) {
    return 'phone';
  }

  return 'invalid';
}

/**
 * Нормализует номер телефона к формату 7XXXXXXXXXX (без +)
 * Соответствует формату, ожидаемому backend
 *
 * @param phone - Номер телефона
 * @returns Нормализованный номер телефона (7XXXXXXXXXX)
 */
export function normalizePhone(phone: string): string {
  // Убираем все символы кроме цифр
  const digits = phone.replace(/\D/g, '');

  // Если начинается с 8, заменяем на 7
  if (digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }

  // Если начинается с 7, возвращаем как есть
  if (digits.startsWith('7')) {
    return digits;
  }

  // Иначе добавляем 7 в начало
  return `7${digits}`;
}

/**
 * Валидирует контакт (email или phone)
 *
 * @param contact - Строка контакта
 * @returns true если контакт валиден
 */
export function validateContact(contact: string): boolean {
  const type = detectContactType(contact);

  if (type === 'email') {
    return true;
  }

  if (type === 'phone') {
    // Проверяем что есть достаточно цифр (10-11 цифр)
    const digits = contact.replace(/\D/g, '');
    // Убираем первую 7 или 8 если есть
    const phoneDigits = digits.startsWith('8') || digits.startsWith('7')
      ? digits.slice(1)
      : digits;
    // Должно быть 10 цифр
    return phoneDigits.length === 10;
  }

  return false;
}

/**
 * Нормализует контакт (email или phone) для отправки на backend
 *
 * @param contact - Строка контакта
 * @returns Нормализованный контакт
 */
export function normalizeContact(contact: string): { contact: string; method: 'email' | 'phone' } {
  const contactType = detectContactType(contact);

  if (contactType === 'invalid') {
    throw new Error('Некорректный формат контакта');
  }

  if (contactType === 'phone') {
    return {
      contact: normalizePhone(contact),
      method: 'phone',
    };
  }

  // Email - приводим к lowercase
  return {
    contact: contact.trim().toLowerCase(),
    method: 'email',
  };
}

/**
 * Форматирует номер телефона в реальном времени
 * 89281234567 -> +7 (928) 123-45-67
 * 79281234567 -> +7 (928) 123-45-67
 * 9281234567 -> +7 (928) 123-45-67
 *
 * @param input - Ввод пользователя
 * @returns Отформатированный номер телефона
 */
export function formatPhoneInput(input: string): string {
  // Убираем все символы кроме цифр
  const digits = input.replace(/\D/g, '');

  // Если пусто - возвращаем пустую строку
  if (!digits) {
    return '';
  }

  // Если начинается с 8, заменяем на 7
  let phoneDigits = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;

  // Если не начинается с 7, добавляем 7
  if (!phoneDigits.startsWith('7')) {
    phoneDigits = `7${phoneDigits}`;
  }

  // Ограничиваем до 11 цифр (7 + 10 цифр)
  phoneDigits = phoneDigits.slice(0, 11);

  // Форматируем: +7 (XXX) XXX-XX-XX
  if (phoneDigits.length <= 1) {
    return `+${phoneDigits}`;
  }
  if (phoneDigits.length <= 4) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1)}`;
  }
  if (phoneDigits.length <= 7) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4)}`;
  }
  if (phoneDigits.length <= 9) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7)}`;
  }

  // Полный формат: +7 (XXX) XXX-XX-XX
  return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7, 9)}-${phoneDigits.slice(9)}`;
}

/**
 * Маскирует контакт для отображения
 * example@email.com -> e****e@email.com
 * +79991234567 -> +7 (999) ***-**-67
 *
 * @param contact - Контакт
 * @returns Замаскированный контакт
 */
export function maskContact(contact: string): string {
  const type = detectContactType(contact);

  if (type === 'email') {
    const [local, domain] = contact.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  if (type === 'phone') {
    // normalizePhone уже возвращает только цифры, но может быть без 7 в начале
    const normalized = normalizePhone(contact);
    // Убеждаемся что есть 11 цифр
    if (normalized.length === 11) {
      return `+${normalized[0]} (${normalized.slice(1, 4)}) ***-**-${normalized.slice(9)}`;
    }
    // Fallback для некорректных номеров
    return contact;
  }

  return contact;
}
