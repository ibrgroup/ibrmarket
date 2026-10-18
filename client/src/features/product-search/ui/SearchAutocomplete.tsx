'use client';

import { useDebounce } from '@/shared/hooks/use-debounce';
import { DEFAULT_POPULAR_SEARCHES } from '@/shared/lib/constants/popularSearch';
import { devLog } from '@/shared/lib/logger';
import { cn } from '@/shared/lib/utils';
import { highlightMatch } from '@/shared/lib/utils/highlight-match';
import {
  loadRecentSearches,
  removeFromRecent,
  saveToRecent,
} from '@/shared/lib/utils/recent-searches';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent } from '@/shared/ui/popover';
import { Skeleton } from '@/shared/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiClock, FiPackage, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi';
import { SearchService } from '../lib/search-service';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: (query: string) => void;
  className?: string;
}

/**
 * Компонент автозаполнения поиска
 * Использует React Query для кэширования
 * Безопасная подсветка совпадений
 * Валидация localStorage
 */
export function SearchAutocomplete({
  value,
  onChange,
  onClear,
  onSubmit,
  className,
}: SearchAutocompleteProps) {
  const [recent, setRecent] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  //  Debounce для запросов
  const debouncedValue = useDebounce(value.trim(), 300);

  //  Загружаем историю поиска из localStorage однократно после маунта
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

  //  React Query для получения подсказок
  const {
    data: searchData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['autocomplete', debouncedValue],
    queryFn: ({ signal }) => SearchService.fetchSuggestions(debouncedValue, 5, { signal }),
    enabled: debouncedValue.length > 0 && isOpen,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo(() => searchData?.suggestions ?? [], [searchData?.suggestions]);
  const popular =
    searchData?.popular && searchData.popular.length > 0
      ? searchData.popular
      : DEFAULT_POPULAR_SEARCHES;

  //  Мемоизация всех элементов для навигации
  const getAllItems = useCallback(() => {
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

  //  Выбор элемента
  const handleSelect = useCallback(
    (query: string) => {
      onChange(query);
      onSubmit(query);
      const updated = saveToRecent(query);
      setRecent(updated);
      setIsOpen(false);
      setSelectedIndex(-1); //  Сбрасываем индекс после выбора
      inputRef.current?.blur();
    },
    [onChange, onSubmit],
  );

  // Удаление из истории с восстановлением фокуса
  const removeFromRecentItem = useCallback((query: string) => {
    const updated = removeFromRecent(query);
    setRecent(updated);
    // Восстанавливаем фокус после удаления
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  // Обработка клавиатурной навигации
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const items = getAllItems();

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        setIsOpen(true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const item = items[selectedIndex];
          handleSelect(item.text);
        } else if (value.trim()) {
          onSubmit(value.trim());
          const updated = saveToRecent(value.trim());
          setRecent(updated);
          setIsOpen(false);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
      }
    },
    [selectedIndex, getAllItems, value, onSubmit, handleSelect],
  );

  // Прокрутка к выбранному элементу
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item-index]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const hasSuggestions = suggestions.length > 0 || popular.length > 0 || recent.length > 0;
  const shouldShowDropdown =
    isOpen && (hasSuggestions || isLoading || isFetching || value.trim() === '' || isFocused);

  return (
    <div className={cn('relative w-full', className)}>
      <Popover
        open={shouldShowDropdown}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setIsFocused(true);
          } else if (document.activeElement !== inputRef.current) {
            setIsFocused(false);
          }
        }}
      >
        <div className="relative">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                const newValue = e.target.value;
                onChange(newValue);
                setSelectedIndex(-1); // Сбрасываем индекс при изменении
                if (!isOpen) {
                  setIsOpen(true);
                }
                setIsFocused(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                if (!isOpen) {
                  setIsOpen(true);
                }
              }}
              onBlur={(e) => {
                const relatedTarget = e.relatedTarget as HTMLElement | null;
                const isClickInsidePopover =
                  relatedTarget?.closest('[role="dialog"]') ||
                  relatedTarget?.closest('[data-radix-popper-content-wrapper]') ||
                  relatedTarget?.closest('[data-item-index]') ||
                  relatedTarget?.closest('button');

                requestAnimationFrame(() => {
                  if (!isClickInsidePopover) {
                    if (
                      document.activeElement !== inputRef.current &&
                      !document.activeElement?.closest('[role="dialog"]')
                    ) {
                      setIsFocused(false);
                      setIsOpen(false);
                    }
                  } else {
                    if (document.activeElement === inputRef.current) {
                      setIsFocused(true);
                      setIsOpen(true);
                    } else {
                      requestAnimationFrame(() => {
                        if (
                          inputRef.current &&
                          !document.activeElement?.closest('[role="dialog"]')
                        ) {
                          inputRef.current.focus();
                        }
                      });
                    }
                  }
                });
              }}
              onKeyDown={handleKeyDown}
              onMouseDown={() => {
                if (!isOpen) {
                  setIsOpen(true);
                }
                if (!isFocused) {
                  setIsFocused(true);
                }
              }}
              placeholder="Искать товары и бренды"
              className="h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 pr-10 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:shadow-md focus:border-purple-500 focus:shadow-lg focus:ring-2 focus:ring-purple-500/50 md:h-12 md:rounded-xl md:text-base dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-500 dark:focus:border-purple-400 dark:focus:ring-purple-500/50"
              aria-label="Поиск товаров и брендов"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              role="combobox"
            />

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                  setSelectedIndex(-1);
                  // Восстанавливаем фокус
                  requestAnimationFrame(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  });
                }}
                className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 rounded-full p-0 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Очистить поиск"
              >
                <FiX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            )}
          </div>
        </div>

        <PopoverContent
          className="mt-2 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          align="start"
          sideOffset={8}
          role="listbox"
          aria-label="Результаты поиска"
        >
          <div ref={listRef} className="max-h-[500px] overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {!value.trim() && (
                  <>
                    {recent.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800/50 dark:text-gray-400">
                          <FiClock className="h-3.5 w-3.5" />
                          Недавние запросы
                        </div>
                        {recent.map((item, index) => (
                          <button
                            key={`recent-${index}`}
                            type="button"
                            data-item-index={index}
                            onClick={() => handleSelect(item)}
                            className={cn(
                              'group flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20',
                              selectedIndex === index && 'bg-purple-50 dark:bg-purple-900/20',
                            )}
                            role="option"
                            aria-selected={selectedIndex === index}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <FiClock className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                              <span className="truncate text-gray-700 dark:text-gray-300">
                                {item}
                              </span>
                            </div>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeFromRecentItem(item);
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeFromRecentItem(item);
                                }
                              }}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30"
                              aria-label="Удалить из истории"
                            >
                              <FiX className="h-3 w-3 text-gray-400 hover:text-red-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {popular.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800/50 dark:text-gray-400">
                          <FiTrendingUp className="h-3.5 w-3.5" />
                          Популярные запросы
                        </div>
                        {popular.map((popularItem, index) => {
                          const globalIndex = recent.length + index;
                          return (
                            <button
                              key={`popular-${index}`}
                              data-item-index={globalIndex}
                              onClick={() => handleSelect(popularItem)}
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20',
                                selectedIndex === globalIndex &&
                                  'bg-purple-50 dark:bg-purple-900/20',
                              )}
                              role="option"
                              aria-selected={selectedIndex === globalIndex}
                            >
                              <FiTrendingUp className="h-4 w-4 flex-shrink-0 text-purple-500 dark:text-purple-400" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {popularItem}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {recent.length === 0 && popular.length === 0 && (
                      <div className="p-8 text-center">
                        <FiPackage className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Начните вводить запрос для поиска товаров
                        </p>
                      </div>
                    )}
                  </>
                )}

                {value.trim() && (
                  <>
                    {suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800/50 dark:text-gray-400">
                          <FiSearch className="h-3.5 w-3.5" />
                          Рекомендации
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`suggestion-${index}`}
                            data-item-index={index}
                            onClick={() => handleSelect(suggestion.title)}
                            className={cn(
                              'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20',
                              selectedIndex === index && 'bg-purple-50 dark:bg-purple-900/20',
                            )}
                            role="option"
                            aria-selected={selectedIndex === index}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <FiSearch className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                              <span className="truncate text-gray-700 dark:text-gray-300">
                                {/* Безопасная подсветка */}
                                {highlightMatch(suggestion.title, value)}
                              </span>
                            </div>
                            {suggestion.category && (
                              <span className="flex-shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                {suggestion.category}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestions.length === 0 && !isLoading && !isFetching && (
                      <div className="p-6 text-center">
                        <FiSearch className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Ничего не найдено
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Попробуйте изменить запрос или нажмите Enter для поиска
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
