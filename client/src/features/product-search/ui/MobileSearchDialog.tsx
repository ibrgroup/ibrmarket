'use client';

import { cn } from '@/shared/lib/utils';
import { highlightMatch } from '@/shared/lib/utils/highlight-match';
import { Button } from '@/shared/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useRef } from 'react';
import { FiClock, FiPackage, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi';
import { getProductPathForSingleSearchHit, searchListingPath } from '../lib/search-navigation';
import { useSearch } from '../lib/use-search';

interface MobileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof FiClock;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      {children}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 px-3 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 flex-1 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function MobileSearchDialog({ open, onOpenChange }: MobileSearchDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    value,
    suggestions,
    popular,
    recent,
    isLoading,
    selectedIndex,
    setValue,
    clear,
    submit,
    removeRecent,
    navigateUp,
    navigateDown,
    selectCurrent,
  } = useSearch({
    onSearch: (query) => {
      void (async () => {
        const path = await getProductPathForSingleSearchHit(query, queryClient);
        router.push(path ?? searchListingPath(query));
        onOpenChange(false);
      })();
    },
  });

  useEffect(() => {
    if (open && inputRef.current) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, inputRef.current.value.length);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        navigateDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        navigateUp();
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        selectCurrent();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (!value.trim()) {
          onOpenChange(false);
        } else {
          clear();
          inputRef.current?.focus();
        }
        break;
      default:
        break;
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value.trim()) {
      clear();
      inputRef.current?.focus();
    } else {
      onOpenChange(false);
    }
  };

  const isInputEmpty = !value.trim();

  const itemClass = (active: boolean) =>
    cn(
      'cursor-pointer rounded-xl px-3 py-3 transition-colors active:bg-muted/80',
      active && 'bg-primary/10 dark:bg-primary/20',
    );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={false}
      fullscreen
      title="Поиск"
      description="Найдите товары и бренды на IBR Market"
    >
      <div
        className={cn(
          'shrink-0 border-b border-border/50 bg-background px-3 pb-3',
          'pt-[max(0.75rem,env(safe-area-inset-top))]',
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'relative flex min-w-0 flex-1 items-center rounded-2xl border bg-muted/25',
              'border-border/70 transition-[border-color,box-shadow] duration-200',
              'focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-sm',
            )}
          >
            <FiSearch className="pointer-events-none absolute left-3.5 size-[1.15rem] text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              placeholder="Найти на ibrmarket"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="h-11 border-0 bg-transparent pl-10 pr-10 text-[15px] shadow-none focus-visible:ring-0"
              aria-label="Поиск товаров и брендов"
            />
            {value.trim() ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCloseClick}
                className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Очистить поиск"
              >
                <FiX className="size-[1.15rem]" />
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 px-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
        </div>
      </div>

      <CommandList
        className={cn(
          'max-h-none min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth bg-muted/25',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
        )}
      >
        {isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            <CommandEmpty>
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
                  <FiPackage className="size-6" />
                </span>
                <p className="mb-1 text-[15px] font-medium text-foreground">
                  {isInputEmpty ? 'Начните вводить запрос' : 'Ничего не найдено'}
                </p>
                <p className="max-w-[280px] text-sm text-muted-foreground">
                  {isInputEmpty
                    ? 'Подсказки и популярные запросы появятся здесь'
                    : 'Попробуйте другие слова'}
                </p>
                {!isInputEmpty && (
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="mt-5 w-full max-w-sm rounded-xl"
                    onClick={selectCurrent}
                  >
                    Искать «{value}»
                  </Button>
                )}
              </div>
            </CommandEmpty>

            {isInputEmpty && (
              <>
                {!!recent.length && (
                  <section className="border-b border-border/40">
                    <SectionLabel icon={FiClock}>Недавние</SectionLabel>
                    <CommandGroup className="px-2 pb-3">
                      {recent.map((item, index) => (
                        <CommandItem
                          key={`recent-${index}`}
                          onSelect={() => submit(item)}
                          className={cn(itemClass(selectedIndex === index), 'group')}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                                <FiClock className="size-3.5" />
                              </span>
                              <span className="truncate text-[15px]">{item}</span>
                            </div>
                            <button
                              type="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecent(item);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeRecent(item);
                                }
                              }}
                              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label="Удалить из истории"
                            >
                              <FiX className="size-4" />
                            </button>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </section>
                )}

                {!!popular.length && (
                  <section className="px-3 pb-4">
                    <SectionLabel icon={FiTrendingUp}>Популярное</SectionLabel>
                    <div className="flex flex-wrap gap-2 px-1">
                      {popular.map((item, index) => {
                        const globalIndex = recent.length + index;
                        return (
                          <button
                            key={`popular-${index}`}
                            type="button"
                            onClick={() => submit(item)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
                              'border-border/80 bg-background text-foreground shadow-sm',
                              'active:scale-[0.98] active:bg-primary/10',
                              selectedIndex === globalIndex &&
                                'border-primary/40 bg-primary/10 ring-1 ring-primary/20',
                            )}
                          >
                            <FiTrendingUp className="text-primary size-3.5 shrink-0" />
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {!isInputEmpty && !!suggestions.length && (
              <section>
                <SectionLabel icon={FiSearch}>Рекомендации</SectionLabel>
                <CommandGroup className="px-2 pb-3">
                  {suggestions.map((suggestion, index) => {
                    const globalIndex = recent.length + popular.length + index;
                    return (
                      <CommandItem
                        key={`suggestion-${index}`}
                        onSelect={() => submit(suggestion.title)}
                        className={itemClass(selectedIndex === globalIndex)}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                              <FiSearch className="size-3.5" />
                            </span>
                            <span className="truncate text-[15px]">
                              {highlightMatch(suggestion.title, value)}
                            </span>
                          </div>
                          {suggestion.category ? (
                            <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm">
                              {suggestion.category}
                            </span>
                          ) : null}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </section>
            )}

            {!isInputEmpty && !suggestions.length && !isLoading && (
              <section className="px-3 pb-4">
                <SectionLabel icon={FiSearch}>Поиск</SectionLabel>
                <button
                  type="button"
                  onClick={selectCurrent}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3.5 text-left text-[15px] font-medium',
                    'transition-colors active:bg-primary/15',
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                    <FiSearch className="size-3.5" />
                  </span>
                  Искать «{value}»
                </button>
              </section>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
