/**
 * Парсит положительное целое число из значения
 * @param {any} value - Значение для парсинга
 * @param {number} defaultValue - Значение по умолчанию, если парсинг не удался
 * @returns {number} Положительное целое число или defaultValue
 * @example
 * parsePositiveInt('10', 1) // 10
 * parsePositiveInt('-5', 1) // 1
 * parsePositiveInt('abc', 1) // 1
 * parsePositiveInt(null, 1) // 1
 */
export const parsePositiveInt = (value, defaultValue) => {
  const parsed = parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed < 1) return defaultValue;
  return parsed;
};

/**
 * Обрезает пробелы в начале и конце строки
 * @param {any} value - Значение для обработки
 * @returns {string} Обрезанная строка или пустая строка, если value не строка
 * @example
 * trimString('  hello  ') // 'hello'
 * trimString(null) // ''
 * trimString(123) // ''
 */
export const trimString = (value) => {
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * Обрезает пробелы в начале и конце строки, возвращает undefined для не-строк
 * @param {any} value - Значение для обработки
 * @returns {string|undefined} Обрезанная строка или undefined, если value не строка
 * @example
 * trimOptionalString('  hello  ') // 'hello'
 * trimOptionalString(null) // undefined
 * trimOptionalString(123) // undefined
 */
export const trimOptionalString = (value) => {
  return typeof value === 'string' ? value.trim() : undefined;
};

/**
 * Валидирует почтовый индекс (5-6 цифр)
 * @param {any} pincode - Почтовый индекс для валидации
 * @returns {boolean} true если индекс валидный (5-6 цифр)
 * @example
 * isValidPincode('12345') // true
 * isValidPincode('123456') // true
 * isValidPincode('1234') // false
 * isValidPincode('abc123') // false
 */
export const isValidPincode = (pincode) => {
  const v = trimString(pincode);
  return /^\d{5,6}$/.test(v);
};

/**
 * Нормализует российский номер телефона к формату 7XXXXXXXXXX
 * @param {any} mobile - Номер телефона в любом формате
 * @returns {string|null} Нормализованный номер в формате 7XXXXXXXXXX или null если невалидный
 * @example
 * normalizeRussianMobile('+7 (999) 123-45-67') // '79991234567'
 * normalizeRussianMobile('8 999 123 45 67') // '79991234567'
 * normalizeRussianMobile('79991234567') // '79991234567'
 * normalizeRussianMobile('123') // null
 */
export const normalizeRussianMobile = (mobile) => {
  const digits = String(mobile ?? '').replace(/\D/g, '');
  if (!/^7\d{10}$/.test(digits)) return null;
  return digits;
};
