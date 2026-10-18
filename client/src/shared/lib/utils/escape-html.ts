/**
 * Экранирование HTML для предотвращения XSS
 * Используется для безопасной подсветки совпадений в поиске
 */

/**
 * Экранирует специальные HTML символы
 * @param str - строка для экранирования
 * @returns экранированная строка
 */
export function escapeHTML(str: string): string {
  return str.replace(/[&<>"']/g, match => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[match] || match;
  });
}
