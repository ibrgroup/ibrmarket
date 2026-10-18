/**
 * Нормализация названия бренда карты
 * Убирает спецсимволы, пробелы, приводит к lowercase
 *
 * @param raw - сырое название бренда (например, "VISA®", "MasterCard™", "МИР")
 * @returns нормализованное название (например, "visa", "mastercard", "мир")
 *
 * @example
 * normalizeBrand("American Express®") // "americanexpress"
 * normalizeBrand(" VISA ") // "visa"
 * normalizeBrand("МИР") // "мир"
 */
export function normalizeBrand(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]/g, ''); // убираем спецсимволы: ®, ™, пробелы и т.д. (поддерживает кириллицу)
}
