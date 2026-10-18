
'use client';

import { useCartStore } from '@/entities/cart';
import { CHECKOUT_ONLY_LINE_IDS_SESSION_KEY } from '@/entities/cart/lib/checkout-session-storage';
import {
  getProductColorVisual,
  getProductSizeLabel,
  usePopularProducts,
  useProductRailActions,
} from '@/entities/product';
import {
  designTokens,
  getColorScale,
  getGrayColor,
  getSemanticColor,
} from '@/shared/config/design-tokens';
import { cn, getProductLinkId } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { ProductCarouselSection } from '@/widgets/product-carousel';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Returns the appropriate color value based on the designTokens and current theme.
 */
function getColor(obj: unknown, key: string | number, theme: 'light' | 'dark'): string {
  if (obj === designTokens.colors.gray) {
    return getGrayColor(key as keyof typeof designTokens.colors.gray, theme);
  }
  if (
    obj === designTokens.colors.success ||
    obj === designTokens.colors.info ||
    obj === designTokens.colors.danger
  ) {
    const semanticKey: 'success' | 'info' | 'danger' =
      obj === designTokens.colors.success
        ? 'success'
        : obj === designTokens.colors.danger
          ? 'danger'
          : 'info';
    return getSemanticColor(semanticKey, theme);
  }
  return getColorScale(obj as any, key as any);
}

/**
 * React hook for determining the current theme ("light" | "dark") in a safe, SSR-friendly way.
 * Returns the resolved theme ("light" | "dark"), falling back to "light" until mounted.
 */
function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme, theme: themeRaw } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // During SSR and until the component is mounted, always return "light"
  if (!mounted) return 'light';

  // resolvedTheme takes precedence, fallback to themeRaw, fallback to "light"
  const theme =
    (resolvedTheme as 'light' | 'dark' | undefined) ??
    (themeRaw as 'light' | 'dark' | undefined) ??
    'light';

  return theme === 'dark' ? 'dark' : 'light';
}

export function CartPage() {
  const currentTheme = useResolvedTheme();

  const {
    items = [],
    totalPrice = 0,
    totalItems = 0,
    selectedItems = [],
    selectedTotalPrice = 0,
    selectedTotalItems = 0,
    removeItem,
    setQuantity,
    clearCart,
    syncWithServer,
    toggleItemSelection,
    selectAll,
    deselectAll,
  } = useCartStore() || {};

  const { data: popularRail = [] } = usePopularProducts(20);
  const rail = useProductRailActions();

  // Состояние выбранной рассрочки
  const [installmentMonths, setInstallmentMonths] = useState<number>(3);

  // Load cart items from server when mounted or when sync function changes
  useEffect(() => {
    if (syncWithServer) {
      syncWithServer().catch(console.error);
    }
  }, [syncWithServer]);

  // Сброс режима «только эти строки на checkout» при возврате в корзину
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY);
    }
  }, []);

  // Handles changing the quantity of a cart item (removes if less than 1)
  const handleQuantity = (id: string, quantity: number): void => {
    if (quantity < 1) {
      removeItem?.(id);
      toast.success('Товар удалён из корзины');
    } else {
      setQuantity?.(id, quantity);
    }
  };

  const handleRemove = (id: string): void => {
    removeItem?.(id);
    toast.success('Товар удалён из корзины');
  };

  const handleClear = (): void => {
    clearCart?.();
    toast.success('Корзина очищена');
  };

  // Empty cart render
  if (!items?.length) {
    return (
      <>
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag
              className="mx-auto mb-6 h-24 w-24"
              style={{
                color: getColor(designTokens.colors.muted, 400, currentTheme),
              }}
              aria-hidden="true"
            />
            <h1
              className="text-2xl font-roboto font-bold"
              style={{
                color: getColor(designTokens.colors.foreground, 900, currentTheme),
              }}
            >
              Корзина пуста
            </h1>
            <p
              className="mb-8 mt-3 text-sm w-[250px] m-auto"
              style={{
                color: getColor(designTokens.colors.muted, 600, currentTheme),
              }}
            >
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Button asChild>
              <Link href="/products">Перейти к покупкам</Link>
            </Button>
          </div>
        </div>
        <div className="max-container m-auto px-4 pb-12">
          <ProductCarouselSection
            title="Популярные товары"
            subtitle="Часто покупают вместе с другими заказами"
            products={popularRail}
            onAddToCart={rail.onAddToCart}
            onToggleWishlist={rail.onToggleWishlist}
            isInWishlist={rail.isInWishlist}
            isInCart={rail.isInCart}
          />
        </div>
      </>
    );
  }

  const DELIVERY_THRESHOLD = 2000;
  const DELIVERY_COST = 300;

  // Используем выбранные товары для расчетов
  const checkoutPrice = selectedTotalPrice > 0 ? selectedTotalPrice : totalPrice;
  const deliveryFree = checkoutPrice >= DELIVERY_THRESHOLD;
  const deliveryCost = deliveryFree ? 0 : DELIVERY_COST;
  
  // Базовая сумма заказа с доставкой
  const baseTotal = checkoutPrice + deliveryCost;

  /**
   * Возвращает множитель шага наценки в зависимости от срока.
   * Каждые следующие месяцы после базовых 3-х добавляют еще 35%.
   */
  const getInstallmentMultiplier = (months: number): number => {
    switch (months) {
      case 3:
        return 1; // +35%
      case 4:
        return 2; // +70%
      case 6:
        return 3; // +105%
      case 12:
        return 4; // +140%
      default:
        return 1;
    }
  };

  // Расчет итоговой суммы с динамической комиссией
  const multiplier = getInstallmentMultiplier(installmentMonths);

  const hasSelectedItems = selectedItems.length > 0;

  // Данные для индикатора прогресса
  const steps = [
    { months: 3, widthClass: 'w-[25%]', bgClass: installmentMonths === 3 ? 'bg-green-400' : 'bg-gray-300' },
    { months: 4, widthClass: 'w-[50%]', bgClass: installmentMonths === 4 ? 'bg-green-400' : 'bg-gray-300' },
    { months: 6, widthClass: 'w-[75%]', bgClass: installmentMonths === 6 ? 'bg-green-400' : 'bg-gray-300' },
    { months: 12, widthClass: 'w-full', bgClass: installmentMonths === 12 ? 'bg-green-400' : 'bg-gray-300' },
  ];

  return (
    <>
      <div className="max-container m-auto py-3">
        <div className="mb-3 flex bg-white rounded-2xl items-center justify-between">
          <div className="flex items-center p-4 gap-2">
            <Checkbox
              checked={selectedItems.length === items.length && items.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAll();
                } else {
                  deselectAll();
                }
              }}
              className="h-5 w-5"
              aria-label="Выбрать все товары"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-roboto font-bold">Выбрать все {totalItems}</h1>
              <p
                style={{
                  color: getColor(designTokens.colors.muted, 600, currentTheme),
                }}
              ></p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleClear}
            className="bg-muted border-none mr-4"
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => {
              const productLinkId = getProductLinkId(item);
              const colorVisual = item.color ? getProductColorVisual(item.color) : null;
              const sizeLabel = item.size ? getProductSizeLabel(item.size) : null;
              return (
                <div
                  key={item._id}
                  className={`rounded-3xl bg-white p-4 transition-all ${
                    item.isSelected ? '' : ''
                  } ${currentTheme === 'dark' ? 'text-white' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className="relative h-40 w-30 flex-shrink-0 overflow-hidden rounded-md">
                      <Checkbox
                        checked={item.isSelected}
                        onCheckedChange={() => toggleItemSelection(item._id)}
                        className="h-5 w-5 bottom-0 m-1 bg-card absolute"
                        aria-label={`Выбрать ${item.name}`}
                      />
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productTitle || 'Product image'}
                          className="h-full w-full object-cover"
                          sizes="80px"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <span className="text-xs text-gray-400">Нет&nbsp;изображения</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <Link
                          href={productLinkId ? `/product/${productLinkId}` : '/products'}
                          className="group"
                          tabIndex={0}
                        >
                          <h3
                            className="group-hover:text-primary text-base line-clamp-2 leading-5 transition-colors"
                            title={item.productTitle}
                          >
                            {item.productTitle}
                          </h3>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item._id)}
                          className="ml-2 bg-muted h-auto flex-shrink-0 p-2"
                          style={{
                            color: getColor(designTokens.colors.muted, 400, currentTheme),
                          }}
                          aria-label="Удалить товар"
                          type="button"
                          tabIndex={0}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>

                      {item.brand ? (
                        <p
                          className="mb-1 text-xs"
                          style={{
                            color: getColor(designTokens.colors.muted, 500, currentTheme),
                          }}
                        >
                          {item.brand}
                        </p>
                      ) : null}
                      {sizeLabel || colorVisual ? (
                        <div
                          className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                          style={{
                            color: getColor(designTokens.colors.muted, 600, currentTheme),
                          }}
                        >
                          {sizeLabel ? <span>{sizeLabel}</span> : null}
                          {colorVisual ? (
                            <>
                              {sizeLabel ? (
                                <span className="text-muted-foreground" aria-hidden>
                                  ·
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'h-3.5 w-3.5 shrink-0 rounded-full border border-black/20 dark:border-white/25',
                                    colorVisual.ring &&
                                      'ring-1 ring-border ring-offset-1 ring-offset-background',
                                  )}
                                  style={colorVisual.style}
                                  aria-hidden
                                />
                                <span>{colorVisual.label}</span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mb-3 flex items-center gap-2">
                        <p
                          className="font-semibold font-roboto md:text-base text-md"
                          style={{
                            color: getColor(designTokens.colors.foreground, 900, currentTheme),
                          }}
                        >
                          {(item.subTotal !== undefined
                            ? Number(item.subTotal)
                            : Number(item.price) * Number(item.quantity)
                          ).toLocaleString()}{' '}
                          ₽
                        </p>
                        {item.oldPrice ? (
                          <>
                            <span
                              className="text-sm line-through"
                              style={{
                                color: getColor(designTokens.colors.muted, 400, currentTheme),
                              }}
                            >
                              {Number(item.oldPrice).toLocaleString()} ₽
                            </span>
                            <Badge
                              variant="secondary"
                              className="px-1.5 text-white bg-pink-500 dark:text-[#f2f2f2] font-bold py-0.5 text-xs"
                              style={{
                                backgroundColor: getColor(
                                  designTokens.colors.primary,
                                  100,
                                  currentTheme,
                                ),
                                color: getColor(designTokens.colors.primary, 700, currentTheme),
                              }}
                            >
                              -{Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%
                            </Badge>
                          </>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex bg-muted dark:bg-[#272A2E] items-center rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantity(item._id, Number(item.quantity) - 1)}
                            className="h-8 w-8 p-0"
                            style={{
                              color: getColor(designTokens.colors.primary, 600, currentTheme),
                            }}
                            aria-label="Уменьшить количество или убрать из корзины"
                            type="button"
                          >
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </Button>
                          <span
                            className="min-w-[3rem] border-x px-3 py-1 text-center text-sm font-medium"
                            style={{
                              borderColor: getColor(designTokens.colors.border, 300, currentTheme),
                            }}
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantity(item._id, Number(item.quantity) + 1)}
                            className="h-8 w-8 p-0"
                            style={{
                              color: getColor(designTokens.colors.primary, 600, currentTheme),
                            }}
                            aria-label="Увеличить количество"
                            type="button"
                            disabled={item.quantity >= 99}
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span
                            className="font-roboto text-sm font-bold"
                            style={{
                              color: getColor(designTokens.colors.primary, 500, currentTheme),
                            }}
                          >
                            {Number(item.price).toLocaleString()} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div
              className="sticky top-4 rounded-3xl bg-white p-5"
              style={{
                backgroundColor:
                  currentTheme === 'dark'
                    ? getColor(designTokens.colors.background, 900, currentTheme)
                    : getColor(designTokens.colors.background, 50, currentTheme),
                borderColor: getColor(designTokens.colors.border, 200, currentTheme),
                color:
                  currentTheme === 'dark'
                    ? getColor(designTokens.colors.foreground, 100, currentTheme)
                    : undefined,
              }}
            >
              <h2 className="mb-4 font-roboto font-bold text-2xl">Сводка заказа</h2>

              <div className="mb-4 space-y-3">
                <div className="flex items-center text-md justify-between">
                  <span
                    style={{
                      color: getColor(designTokens.colors.muted, 600, currentTheme),
                    }}
                  >
                    {hasSelectedItems
                      ? `Выбранные товары (${selectedTotalItems})`
                      : `Товары (${totalItems})`}
                  </span>
                  <span
                    className="font-roboto"
                    style={{
                      color: getColor(designTokens.colors.foreground, 800, currentTheme),
                    }}
                  >
                    {Number(checkoutPrice).toLocaleString()} ₽
                  </span>
                </div>

                {!hasSelectedItems && totalItems > 0 && (
                  <p
                    style={{
                      color: getColor(designTokens.colors.muted, 500, currentTheme),
                    }}
                  >
                    Всего в корзине: {Number(totalPrice).toLocaleString()} ₽
                  </p>
                )}
                <div className="flex text-md items-center justify-between">
                  <span
                    style={{
                      color: getColor(designTokens.colors.muted, 600, currentTheme),
                    }}
                  >
                    Доставка
                  </span>
                  <span
                    className="font-medium"
                    style={{
                      color: deliveryFree
                        ? getColor(designTokens.colors.success, 600, currentTheme)
                        : getColor(designTokens.colors.danger, 600, currentTheme),
                    }}
                  >
                    {deliveryFree ? 'Бесплатно' : `${DELIVERY_COST} ₽`}
                  </span>
                </div>
                {!deliveryFree && (
                  <div className="rounded-md p-3 bg-pink-500 text-white">
                    <p
                      className="text-sm"
                      style={{
                        color: getColor(designTokens.colors.foreground, 800, currentTheme),
                      }}
                    >
                      Добавьте товаров на{' '}
                      {Math.max(0, DELIVERY_THRESHOLD - Number(checkoutPrice)).toLocaleString()} ₽ для
                      бесплатной доставки
                    </p>
                  </div>
                )}
              </div>
              <div
                className="mb-3 border-t pt-4"
                style={{
                  borderColor: getColor(designTokens.colors.border, 200, currentTheme),
                }}
              >
                <div className="flex items-center font-roboto text-2xl justify-between font-bold">
                  <span>Итого</span>
                  <span
                    style={{
                      color: getColor(designTokens.colors.primary, 500, currentTheme),
                    }}
                    className="text-pink-500"
                  >
                    {Number(baseTotal).toLocaleString()} ₽
                  </span>
                </div>
              </div>
                         <div className="space-y-3">
              <Button
                className="w-full rounded-2xl mb-3 font-semibold text-md"
                size="lg"
                style={{
                  padding: '27px',
                  backgroundColor: !hasSelectedItems
                    ? getColor(designTokens.colors.muted, 300, currentTheme)
                    : getColor(designTokens.colors.primary, 500, currentTheme),
                  color: getColor(designTokens.colors.foreground, 700, currentTheme),
                  cursor: !hasSelectedItems ? 'not-allowed' : 'pointer',
                }}
                disabled={!hasSelectedItems}
                asChild={hasSelectedItems}
                type="button"
              >
                {hasSelectedItems ? (
                  <Link href="/checkout">Перейти к оформлению</Link>
                ) : (
                  <span>Выберите товары</span>
                )}
              </Button>
            </div>
              {/* БЛОК РАССРОЧКИ */}
              <div className="space-y-3">
                <div className="bg-gray-100 p-5 rounded-2xl">
                  {/* Сумма платежа */}
                  <div className="my-2">
                    <span
                      style={{
                        color: getColor(designTokens.colors.primary, 500, currentTheme),
                      }}
                      className="text-gray-900 font-roboto text-lg"
                    >
                         {Number(baseTotal).toLocaleString()} ₽ × {installmentMonths} месяцев
                    </span>
                  </div>

                  {/* Выбор срока */}
                  <div className="grid grid-cols-4 gap-1">
                    {[3, 4, 6, 12].map((months) => (
                      <button
                        key={months}
                        onClick={() => setInstallmentMonths(months)}
                        className={cn(
                          "hover:opacity-95 active:opacity-90 text-sm font-roboto px-4.5 py-1.5 rounded-md",
                          installmentMonths === months
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "bg-white text-gray-900"
                        )}
                      >
                        {months} м
                      </button>
                    ))}
                  </div>

                  {/* Индикатор прогресса — работает корректно для любого выбора */}
                  <div className='flex items-center gap-1 my-3'>
                    {steps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`flex-1 h-1 rounded-full transition-colors duration-200 ${step.bgClass}`}
                      />
                    ))}
                  </div>

                  {/* Кнопка оформления */}
                  <a href="https://ibrgroup.ru" target='_blank' rel="noopener noreferrer">
                    <div className="p-3 bg-pink-500 hover:bg-pink-600 transition-all text-md cursor-pointer text-white h-full w-full text-center font-semibold rounded-2xl">
                      Оформить в рассрочку
                    </div>
                  </a>
                </div>
              </div>

              <div
                className="mt-3 space-y-3 border-t py-6"
                style={{
                  borderColor: getColor(designTokens.colors.border, 200, currentTheme),
                }}
              >
                {[
                  'Бесплатная доставка от 2000 ₽',
                  'Возврат в течение 14 дней',
                  'Гарантия качества',
                ].map((txt) => (
                  <div
                    key={txt}
                    className="flex items-center gap-3 text-sm"
                    style={{
                      color: getColor(designTokens.colors.muted, 600, currentTheme),
                    }}
                  >
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor:
                          currentTheme === 'dark'
                            ? getColor(designTokens.colors.success, 400, currentTheme)
                            : getColor(designTokens.colors.success, 600, currentTheme),
                      }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: '#ffffff',
                        }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </div>
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      

      <div className="max-container px-0 sm:px-1">
        <ProductCarouselSection
          title="Популярные товары"
          subtitle="Вам может пригодиться"
          products={popularRail}
          onAddToCart={rail.onAddToCart}
          onToggleWishlist={rail.onToggleWishlist}
          isInWishlist={rail.isInWishlist}
          isInCart={rail.isInCart}
        />
      </div>
    </>
  );
}