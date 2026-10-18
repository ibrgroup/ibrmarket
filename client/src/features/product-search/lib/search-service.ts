import { devLog } from '@/shared/lib/logger';
import type { SearchSuggestion } from '../model/types';

/**
 * Ответ от API автозаполнения
 */
export interface AutocompleteResponse {
  suggestions: SearchSuggestion[];
  popular: string[];
}

/**
 * Сервис для работы с поиском
 * Вынесен из хука для лучшей архитектуры и переиспользования
 */
export class SearchService {
  /**
   * Получает подсказки автозаполнения
   * @param query - поисковый запрос
   * @param limit - максимальное количество подсказок
   * @returns Promise с подсказками и популярными запросами
   */
  static async fetchSuggestions(
    query: string,
    limit: number = 5,
    options?: RequestInit,
  ): Promise<AutocompleteResponse> {
    const trimmedQuery = query.trim();

    //  Валидация входных данных
    if (!trimmedQuery) {
      return {
        suggestions: [],
        popular: [],
      };
    }

    if (trimmedQuery.length > 200) {
      throw new Error('Query is too long (max 200 characters)');
    }

    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(trimmedQuery)}&limit=${limit}`,
        {
          ...options,
        },
      );

      if (!response.ok) {
        throw new Error(`Autocomplete request failed: ${response.status}`);
      }

      const data = await response.json();

      //  Валидация ответа
      const suggestions: SearchSuggestion[] = Array.isArray(data.data?.suggestions)
        ? data.data.suggestions
        : Array.isArray(data.suggestions)
          ? data.suggestions
          : [];

      const popular: string[] = Array.isArray(data.data?.popular)
        ? data.data.popular
        : Array.isArray(data.popular)
          ? data.popular
          : [];

      return {
        suggestions: suggestions.slice(0, limit),
        popular: popular.slice(0, 10), // Ограничиваем популярные до 10
      };
    } catch (error) {
      devLog.error('Error fetching autocomplete:', error);
      //  Возвращаем пустой ответ вместо throw для graceful degradation
      return {
        suggestions: [],
        popular: [],
      };
    }
  }
}
