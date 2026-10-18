'use client';

import { getProductColorVisual, getProductSizeLabel } from '@/entities/product';
import type { Product } from '@/entities/product/model/types';
import { useMediaQuery } from '@/shared/lib/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { ClipboardList, X } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

function formatSpecValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => formatSpecValue(v))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function humanizeKey(key: string): string {
  const withSpaces = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function buildProductDetailRows(
  product: Product,
  inStock: boolean,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && !value.trim()) return;
    let str: string;
    if (Array.isArray(value)) {
      str = value
        .filter((v) => v != null && String(v).trim() !== '')
        .map((v) => String(v))
        .join(', ');
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      str = String(value);
    } else if (typeof value === 'object') {
      return;
    } else {
      str = String(value);
    }
    if (!str.trim()) return;
    rows.push({ label, value: str });
  };

  add('Артикул', product._id);
  add('Название', product.name);
  if (product.brand) add('Бренд', product.brand);
  if (product.category?.name) add('Категория', product.category.name);
  else if (product.catName) add('Категория', product.catName);
  if (product.subCat) add('Подкатегория', product.subCat);
  if (product.thirdsubCat) add('Раздел', product.thirdsubCat);

  add('Цена', `${product.price.toLocaleString('ru-RU')} ₽`);
  if (product.oldPrice != null && product.oldPrice > product.price) {
    add('Цена без скидки', `${product.oldPrice.toLocaleString('ru-RU')} ₽`);
  }
  if (product.discount > 0) add('Скидка', `${product.discount}%`);

  rows.push({
    label: 'Наличие',
    value: inStock ? 'В наличии' : 'Нет в наличии',
  });
  if (typeof product.countInStock === 'number') {
    add('Остаток на складе', `${product.countInStock} шт.`);
  }

  if (product.size?.length) {
    add('Размеры', product.size.map((s) => getProductSizeLabel(String(s))).join(', '));
  }
  if (product.colors?.length) {
    add('Цвета', product.colors.map((c) => getProductColorVisual(String(c)).label).join(', '));
  }
  if (product.productRam?.length) add('Объём памяти / RAM', product.productRam);
  if (product.productWeight?.length) add('Вес / комплектация', product.productWeight);

  if (product.specifications && typeof product.specifications === 'object') {
    for (const [key, val] of Object.entries(product.specifications)) {
      const formatted = formatSpecValue(val);
      if (formatted.trim()) {
        rows.push({ label: humanizeKey(key), value: formatted });
      }
    }
  }

  return rows;
}

export interface ProductSpecificationsDrawerProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inStock: boolean;
}

function DrawerBody({
  product,
  inStock,
  onClose,
}: {
  product: Product;
  inStock: boolean;
  onClose: () => void;
}) {
  const rows = useMemo(() => buildProductDetailRows(product, inStock), [product, inStock]);
  const description = (product.description || '').trim();

  return (
    <>
      <header
        className={cn(
          'flex shrink-0 items-center gap-2 border-b mt-3 border-border/80 bg-background px-4 py-3',
          'pt-[max(0.75rem,env(safe-area-inset-top))]',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 bg-gray-200 shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-left text-lg font-semibold">
            <ClipboardList className="text-primary size-5 shrink-0" />
            <span className="truncate font-roboto text-xl">Все характеристики</span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{product.name}</p>
        </div>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-muted/20 px-4 py-4">
        <section className="mb-6">
          <h3 className="text-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
            Описание
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-zinc-200">
            {description ||
              'Описание не указано. Уточните детали у менеджера или в карточке после обновления каталога.'}
          </p>
        </section>

        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Параметры
          </h3>
          <div className="space-y-0 divide-y divide-border/80 rounded-xl bg-gray-100 border">
            {rows.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                className="flex flex-col gap-0.5 px-3 py-3 sm:grid sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-start sm:gap-3"
              >
                <span className="text-muted-foreground text-xs font-medium">{row.label}</span>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="text-foreground text-sm font-medium break-words">
                    {row.value}
                  </span>
                  {row.label === 'Артикул' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 px-2 text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(row.value);
                        toast.success('Артикул скопирован');
                      }}
                    >
                      Копировать
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer
        className={cn(
          'flex shrink-0 border-t border-border/80 bg-background px-4 py-3',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        )}
      >
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 w-full rounded-xl font-semibold"
          onClick={onClose}
        >
          Закрыть
        </Button>
      </footer>
    </>
  );
}

/**
 * Десктоп: Sheet справа (как «Все фильтры»). Мобильный: полноэкранный диалог.
 */
export function ProductSpecificationsDrawer({
  product,
  open,
  onOpenChange,
  inStock,
}: ProductSpecificationsDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleClose = () => onOpenChange(false);

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn(
            'flex h-full w-full max-w-full flex-col gap-0 p-0 sm:max-w-xl',
            'z-[100] border-l border-border/80 shadow-2xl',
            '[&>button]:hidden',
          )}
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Все характеристики товара</SheetTitle>
          <div className="flex h-full min-h-0 flex-col">
            <DrawerBody product={product} inStock={inStock} onClose={handleClose} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[100] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className={cn(
          'fixed top-0 left-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 shadow-none',
          'translate-x-0 translate-y-0',
          'duration-300 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4',
          'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
        )}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Все характеристики товара</DialogTitle>
        <DrawerBody product={product} inStock={inStock} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
