'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverAnchor } from '@/shared/ui/popover';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { getProductPathForSingleSearchHit, searchListingPath } from '../lib/search-navigation';
import { useSearch } from '../lib/use-search';
import type { SearchBarProps } from '../model/types';
import { ImageSearchButton } from './ImageSearchButton';
import { SearchBarDropdown } from './SearchBarDropdown';

/**
 * Компонент поисковой строки с подсказками
 */
export function SearchBar({
  className,
  placeholder = 'Найти на ibrmarket',
  showImageSearch = false,
  autoFocus = false,
  initialValue = '',
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const {
    value,
    suggestions,
    popular,
    recent,
    isLoading,
    isOpen,
    selectedIndex,
    setValue,
    setOpen,
    clear,
    selectSuggestion,
    removeRecent,
    navigateUp,
    navigateDown,
    selectCurrent,
  } = useSearch({
    initialValue,
    onSearch: (query) => {
      void (async () => {
        const path = await getProductPathForSingleSearchHit(query, queryClient);
        router.push(path ?? searchListingPath(query));
        onSearch?.(query);
      })();
    },
    autoFocus,
  });

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Прокрутка к выбранному элементу
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item-index]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Обработка клавиатуры
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
        setOpen(true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectCurrent();
      } else if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [navigateDown, navigateUp, selectCurrent, setOpen],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const next = event.relatedTarget as Node | null;
      if (!next) {
        setOpen(false);
        return;
      }
      if (anchorRef.current?.contains(next)) {
        return;
      }
      if (listRef.current?.contains(next)) {
        return;
      }
      setOpen(false);
    },
    [setOpen],
  );

  // Вычисляем элементы для отображения (логика уже в хуке, но нужна для индексации)
  const hasContent = suggestions.length > 0 || popular.length > 0 || recent.length > 0;
  const shouldRenderContent = hasContent || isLoading || value.trim() === '';

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
           className='bg-white dark:bg-[#f2f2f2] rounded-xl z-50 relative items-center flex h-12'
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="outline-none px-3 dark:placeholder:text-[#494949] w-full rounded-2xl"
              aria-label="Поиск товаров и брендов"
              aria-expanded={isOpen && shouldRenderContent}
              aria-haspopup="listbox"
              role="combobox"
            />

            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                className="relative z-[1] p-1 w-10 h-10 rounded-full shrink-0 px-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                aria-label="Очистить поиск"
              >
                <FiX className="size-5" />
              </Button>
            ) : null}

            {showImageSearch ? (
              <ImageSearchButton
                className="relative z-[1] px-2"
                size={22}
                iconClassName="text-primary"
              />
            ) : null}
            <ImageSearchButton className='px-3 cursor-auto'/>
          </div>
        </PopoverAnchor>

        {/* Выпадающий список */}
        {shouldRenderContent && (
          <SearchBarDropdown
            open={isOpen}
            listRef={listRef}
            isLoading={isLoading}
            value={value}
            suggestions={suggestions}
            popular={popular}
            recent={recent}
            selectedIndex={selectedIndex}
            onClose={() => setOpen(false)}
            onBlurInput={() => inputRef.current?.blur()}
            selectSuggestion={selectSuggestion}
            removeRecent={removeRecent}
            selectCurrent={selectCurrent}
            anchorRef={anchorRef}
          />
        )}
      </Popover>
    </div>
  );
}
