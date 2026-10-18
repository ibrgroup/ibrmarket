/**
 * Константы для модального окна авторизации
 */

/**
 * Время таймера для повторной отправки OTP (в секундах)
 */
export const OTP_RESEND_COOLDOWN = 60;

/**
 * Длина OTP кода
 */
export const OTP_LENGTH = 6;

/**
 * Задержка перед автоматическим закрытием модалки после успешного входа (в миллисекундах)
 */
export const SUCCESS_AUTO_CLOSE_DELAY = 1500;

/**
 * Regex для валидации email
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Regex для валидации номера телефона (Россия)
 * Поддерживает форматы: +7 (XXX) XXX-XX-XX, +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX
 */
export const PHONE_REGEX = /^(\+7|8|7)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$|^\+7\s?\([0-9]{3}\)\s?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

/**
 * Сообщения об ошибках
 */
export const ERROR_MESSAGES = {
  INVALID_CONTACT: 'Введите корректный email или номер телефона',
  OTP_SEND_FAILED: 'Не удалось отправить код. Попробуйте ещё раз',
  OTP_VERIFY_FAILED: 'Неверный код. Попробуйте ещё раз',
  OTP_EXPIRED: 'Код истёк. Запросите новый код',
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение',
} as const;
