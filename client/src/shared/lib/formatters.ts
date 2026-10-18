// Утилиты для форматирования данных

/**
 * Форматирование цены
 */
export const formatPrice = (price: number, currency: string = "₽"): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency === "₽" ? "RUB" : "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace(/₽|RUB|USD|\$/g, currency);
};

/**
 * Форматирование даты
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("ru-RU", {
    ...defaultOptions,
    ...options,
  }).format(new Date(date));
};

/**
 * Форматирование относительной даты (вчера, сегодня, завтра)
 */
export const formatRelativeDate = (date: Date | string): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Завтра";
  if (diffDays === -1) return "Вчера";
  if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} дней`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} дней назад`;

  return formatDate(date);
};

/**
 * Форматирование номера телефона
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11 && cleaned.startsWith("7")) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7,
      9,
    )}-${cleaned.slice(9)}`;
  }

  return phone;
};

/**
 * Скрытие части email для безопасности
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return email;

  const visibleStart = Math.ceil(local.length * 0.3);
  const visibleEnd = Math.floor(local.length * 0.7);

  return `${local.slice(0, visibleStart)}${"*".repeat(visibleEnd - visibleStart)}${local.slice(
    visibleEnd,
  )}@${domain}`;
};

/**
 * Форматирование процентов
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Форматирование больших чисел
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ru-RU").format(num);
};

/**
 * Обрезка текста с добавлением многоточия
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Преобразование первой буквы в заглавную
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Форматирование скидки
 */
export const formatDiscount = (discount: string | number): string => {
  const numDiscount = typeof discount === "string" ? parseFloat(discount) : discount;
  return `-${numDiscount}%`;
};
