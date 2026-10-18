'use client';

import { cn } from '@/shared/lib/utils';
import { highlightMatch } from '@/shared/lib/utils/highlight-match';
import { Button } from '@/shared/ui/button';
import { PopoverContent } from '@/shared/ui/popover';
import { Skeleton } from '@/shared/ui/skeleton';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FiClock, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi';
import type { SearchSuggestion } from '../model/types';

interface SearchBarDropdownProps {
  open: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  value: string;
  suggestions: SearchSuggestion[];
  popular: string[];
  recent: string[];
  selectedIndex: number;
  onClose: () => void;
  onBlurInput: () => void;
  selectSuggestion: (index: number) => void;
  removeRecent: (item: string) => void;
  selectCurrent: () => void;
  anchorRef: RefObject<HTMLDivElement | null>;
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof FiClock;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      {children}
    </div>
  );
}

function DropdownSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 flex-1 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SearchBarDropdown({
  open,
  listRef,
  isLoading,
  value,
  suggestions,
  popular,
  recent,
  selectedIndex,
  onClose,
  onBlurInput,
  selectSuggestion,
  removeRecent,
  selectCurrent,
  anchorRef,
}: SearchBarDropdownProps) {
  const isEmpty = !value.trim();

  const backdrop =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
            aria-hidden="true"
            onMouseDown={(event) => {
              event.preventDefault();
              onClose();
              onBlurInput();
            }}
          />,
          document.body,
        )
      : null;

  return (
    <>
      {backdrop}

      <PopoverContent
        className={cn(
          'z-[70] mt-3 w-[var(--radix-popover-trigger-width)] overflow-hidden p-0',
          'rounded-2xl border border-border/70 bg-card',
          'shadow-[0_24px_60px_-16px_rgba(15,23,42,0.28)]',
          'dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)]',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200',
        )}
        align="center"
        sideOffset={4}
        role="listbox"
        aria-label="Результаты поиска"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) {
            return;
          }
          onClose();
          onBlurInput();
        }}
      >
        <div ref={listRef} className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain">
          {isLoading ? (
            <DropdownSkeleton />
          ) : isEmpty ? (
            <>
              {recent.length > 0 && (
                <section className="border-b border-border/60">
                  <SectionLabel icon={FiClock}>Недавние запросы</SectionLabel>
                  <ul className="space-y-0.5 px-2 pb-3">
                    {recent.map((item, index) => (
                      <li key={`recent-${index}`}>
                        <div
                          data-item-index={index}
                          className={cn(
                            'group flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm transition-colors',
                            selectedIndex === index
                              ? 'bg-primary/10 text-foreground'
                              : 'hover:bg-muted/70',
                          )}
                          role="option"
                          aria-selected={selectedIndex === index}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectSuggestion(index)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                              <FiClock className="size-3.5" />
                            </span>
                            <span className="truncate">{item}</span>
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecent(item);
                            }}
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Удалить из истории"
                          >
                            <FiX className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {popular.length > 0 && (
                <section className="px-2 pb-3">
                  <SectionLabel icon={FiTrendingUp}>Популярные запросы</SectionLabel>
                  <div className="flex flex-wrap gap-2 px-1 pb-1">
                    {popular.map((item, index) => {
                      const globalIndex = recent.length + index;
                      return (
                        <button
                          key={`popular-${index}`}
                          type="button"
                          data-item-index={globalIndex}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(globalIndex)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                            'border-border/80 bg-muted/40 text-foreground',
                            'hover:border-primary/35 hover:bg-primary/10',
                            selectedIndex === globalIndex &&
                              'border-primary/40 bg-primary/10 ring-1 ring-primary/20',
                          )}
                          role="option"
                          aria-selected={selectedIndex === globalIndex}
                        >
                          <FiTrendingUp className="text-primary size-3.5 shrink-0" />
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {recent.length === 0 && popular.length === 0 && (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
                    <FiSearch className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">Начните вводить запрос</p>
                  <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                    Подсказки и категории появятся по мере ввода
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {suggestions.length > 0 ? (
                <section>
                  <SectionLabel icon={FiSearch}>Рекомендации</SectionLabel>
                  <ul className="space-y-0.5 px-2 pb-3">
                    {suggestions.map((suggestion, index) => (
                      <li key={`suggestion-${index}`}>
                        <button
                          type="button"
                          data-item-index={index}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(index)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-left text-sm transition-colors',
                            selectedIndex === index
                              ? 'bg-primary/10 text-foreground'
                              : 'hover:bg-muted/70',
                          )}
                          role="option"
                          aria-selected={selectedIndex === index}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                              <FiSearch className="size-3.5" />
                            </span>
                            <span className="truncate">
                              {highlightMatch(suggestion.title, value)}
                            </span>
                          </span>
                          {suggestion.category ? (
                            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              {suggestion.category}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
                    <FiSearch className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">Ничего не найдено</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Попробуйте другие слова или перейдите к полному поиску
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="mt-4 rounded-xl"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCurrent()}
                  >
                    Искать «{value}»
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </>
  );
}
