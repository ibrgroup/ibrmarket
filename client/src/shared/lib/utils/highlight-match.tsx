import { escapeHTML } from './escape-html';
import type { ReactElement } from 'react';

/**
 * Безопасная подсветка совпадений в тексте
 * Экранирует HTML для предотвращения XSS
 *
 * @param text - текст для подсветки
 * @param query - запрос для поиска
 * @returns React элемент с подсвеченными совпадениями
 */
export function highlightMatch(text: string, query: string): ReactElement {
  if (!query.trim()) {
    // Безопасно: экранируем весь текст, если нет запроса
    return <span>{escapeHTML(text)}</span>;
  }

  // Экранируем запрос перед использованием в RegExp
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        // Экранируем каждую часть перед отображением
        const escapedPart = escapeHTML(part);
        const isMatch = part.toLowerCase() === query.toLowerCase();

        return isMatch ? (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 text-gray-900 dark:bg-yellow-900/50 dark:text-gray-100"
          >
            {escapedPart}
          </mark>
        ) : (
          <span key={index}>{escapedPart}</span>
        );
      })}
    </span>
  );
}
