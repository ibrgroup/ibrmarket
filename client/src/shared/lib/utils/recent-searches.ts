import { devLog } from '@/shared/lib/logger';

/**
 * Утилиты для работы с историей поиска в localStorage
 */

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Валидирует и загружает историю поиска из localStorage
 * @returns массив строк с историей поиска
 */
export function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    // Валидация: проверяем, что это массив строк
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Фильтруем только строки и обрезаем до максимума
    const recentList = parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES);

    return recentList;
  } catch (error) {
    // В случае ошибки возвращаем пустой массив
    devLog.error('Error loading recent searches:', error);
    return [];
  }
}

/**
 * Сохраняет запрос в историю поиска
 * Удаляет дубликаты и ограничивает размер
 * @param query - запрос для сохранения
 * @returns обновленный массив истории поиска
 */
export function saveToRecent(query: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return loadRecentSearches();
  }

  try {
    const recentList = loadRecentSearches();

    // Удаляем дубликаты (case-insensitive)
    const filtered = recentList.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());

    // Добавляем в начало и ограничиваем размер
    const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    devLog.error('Error saving recent search:', error);
    return loadRecentSearches();
  }
}

/**
 * Удаляет запрос из истории поиска
 * @param query - запрос для удаления
 * @returns обновленный массив истории поиска
 */
export function removeFromRecent(query: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const recentList = loadRecentSearches();
    const filtered = recentList.filter(item => item !== query);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    devLog.error('Error removing recent search:', error);
    return loadRecentSearches();
  }
}
