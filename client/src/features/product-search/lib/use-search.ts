import { useDebounce } from '@/shared/hooks/use-debounce';
import { DEFAULT_POPULAR_SEARCHES } from '@/shared/lib/constants/popularSearch';
import { devLog } from '@/shared/lib/logger';
import {
  loadRecentSearches,
  removeFromRecent,
  saveToRecent,
} from '@/shared/lib/utils/recent-searches';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SearchSuggestion } from '../model/types';
import { SearchService } from './search-service';

const DEBOUNCE_DELAY = 300;

interface UseSearchOptions {
  initialValue?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
}

interface UseSearchReturn {
  // State
  value: string;
  suggestions: SearchSuggestion[];
  popular: string[];
  recent: string[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;

  // Actions
  setValue: (value: string) => void;
  setOpen: (open: boolean) => void;
  clear: () => void;
  submit: (query?: string) => void;
  selectSuggestion: (index: number) => void;
  removeRecent: (query: string) => void;

  // Navigation
  navigateUp: () => void;
  navigateDown: () => void;
  selectCurrent: () => void;
}

/**
 * Универсальный хук для поиска с подсказками
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { initialValue = '', onSearch } = options;

  const [value, setValueState] = useState(initialValue);
  const [recent, setRecent] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce для запросов
  const debouncedValue = useDebounce(value.trim(), DEBOUNCE_DELAY);

  // Загружаем историю поиска из localStorage при монтировании
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const loaded = loadRecentSearches();
        setRecent(loaded);
      } catch (error) {
        devLog.error('Failed to load recent searches:', error);
        setRecent([]);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // React Query для получения подсказок
  const {
    data: searchData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['autocomplete', debouncedValue],
    queryFn: () => SearchService.fetchSuggestions(debouncedValue, 5),
    enabled: debouncedValue.length > 0, // Запрос только если есть текст
    staleTime: 30 * 1000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
  });

  const suggestions = useMemo(() => searchData?.suggestions ?? [], [searchData?.suggestions]);
  const popular =
    searchData?.popular && searchData.popular.length > 0
      ? searchData.popular
      : DEFAULT_POPULAR_SEARCHES;

  // Мемоизация всех элементов для навигации
  const allItems = useMemo(() => {
    const items: Array<{
      type: 'recent' | 'popular' | 'suggestion';
      text: string;
      category?: string;
    }> = [];

    if (!value.trim()) {
      recent.forEach((item) => items.push({ type: 'recent', text: item }));
      popular.forEach((item) => items.push({ type: 'popular', text: item }));
    } else {
      suggestions.forEach((item) =>
        items.push({
          type: 'suggestion',
          text: item.title,
          category: item.category,
        }),
      );
    }

    return items;
  }, [value, recent, popular, suggestions]);

  // Установка значения с сбросом индекса
  const setValue = useCallback(
    (newValue: string) => {
      setValueState(newValue);
      setSelectedIndex(-1); // Сбрасываем индекс при изменении значения
      if (newValue.trim() && !isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen],
  );

  // Очистка
  const clear = useCallback(() => {
    setValueState('');
    setSelectedIndex(-1);
    // Компоненты сами управляют фокусом через свои refs
  }, []);

  // Отправка поиска
  const submit = useCallback(
    (query?: string) => {
      const searchQuery = query || value.trim();
      if (!searchQuery) return;

      // Сохраняем в историю
      const updatedRecent = saveToRecent(searchQuery);
      setRecent(updatedRecent);

      setIsOpen(false);
      setSelectedIndex(-1); // Сбрасываем индекс после отправки
      onSearch?.(searchQuery);
    },
    [value, onSearch],
  );

  // Выбор подсказки по индексу
  const selectSuggestion = useCallback(
    (index: number) => {
      if (allItems[index]) {
        const item = allItems[index];
        setValueState(item.text);
        setSelectedIndex(-1); // Сбрасываем индекс после выбора
        submit(item.text);
      }
    },
    [allItems, submit],
  );

  // Навигация вверх
  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
  }, [allItems.length]);

  // Навигация вниз
  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : -1));
  }, [allItems.length]);

  // Выбор текущего элемента
  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0) {
      selectSuggestion(selectedIndex);
    } else if (value.trim()) {
      submit();
    }
  }, [selectedIndex, selectSuggestion, value, submit]);

  // Удаление из истории
  const removeRecentItem = useCallback((query: string) => {
    const updated = removeFromRecent(query);
    setRecent(updated);
    // Компоненты сами управляют фокусом через свои refs
  }, []);

  return {
    value,
    suggestions,
    popular,
    recent,
    isLoading: isLoading || isFetching,
    isOpen,
    selectedIndex,
    setValue,
    setOpen: setIsOpen,
    clear,
    submit,
    selectSuggestion,
    removeRecent: removeRecentItem,
    navigateUp,
    navigateDown,
    selectCurrent,
  };
}
