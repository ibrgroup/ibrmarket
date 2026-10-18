'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Heart, Loader2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ProductActionsProps {
  countInStock: number;
  isInCart: boolean;
  isInWishlist: boolean;
  cartItemQuantity?: number;
  /** Если товар уже в корзине — фиксируем количество в сторе (как на странице товара). */
  onCommitCartQuantity?: (quantity: number) => void | Promise<void>;
  isAddingToCart?: boolean;
  isBuyingNow?: boolean;
  onAddToCart: (quantity: number) => Promise<void>;
  onGoToCart: () => void;
  onBuyNow: (quantity: number) => Promise<void>;
  onToggleWishlist: () => void;
}

/**
 * Компонент действий с товаром (корзина, избранное, количество)
 */
export function ProductActions({
  countInStock,
  isInCart,
  isInWishlist,
  cartItemQuantity,
  onCommitCartQuantity,
  isAddingToCart = false,
  isBuyingNow = false,
  onAddToCart,
  onGoToCart,
  onBuyNow,
  onToggleWishlist,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Синхронизация quantity с корзиной
  useEffect(() => {
    if (isInCart && cartItemQuantity != null && cartItemQuantity > 0) {
      setQuantity(cartItemQuantity);
    }
    if (!isInCart) {
      setQuantity(1);
    }
  }, [cartItemQuantity, isInCart]);

  const handleQuantityChange = useCallback(
    (delta: number) => {
      const maxQuantity = countInStock || 99;
      setQuantity((prev) => {
        if (isInCart && onCommitCartQuantity) {
          const next = prev + delta;
          if (next < 1) {
            void Promise.resolve(onCommitCartQuantity(0));
            return 1;
          }
          const clamped = Math.min(maxQuantity, next);
          if (clamped === prev) return prev;
          void Promise.resolve(onCommitCartQuantity(clamped));
          return clamped;
        }
        const next = Math.max(1, Math.min(maxQuantity, prev + delta));
        if (next === prev) return prev;
        return next;
      });
    },
    [countInStock, isInCart, onCommitCartQuantity],
  );

  const handleQuantityInput = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 1) {
        const maxQuantity = countInStock || 99;
        setQuantity(Math.min(maxQuantity, numValue));
      }
    },
    [countInStock],
  );

  const handleQuantityCommit = useCallback(async () => {
    if (!isInCart || !onCommitCartQuantity) return;
    const maxQuantity = countInStock || 99;
    const clamped = Math.max(1, Math.min(maxQuantity, quantity));
    if (clamped !== quantity) setQuantity(clamped);
    await onCommitCartQuantity(clamped);
  }, [isInCart, onCommitCartQuantity, countInStock, quantity]);

  const handleAddToCartClick = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onAddToCart(quantity);
    } finally {
      setIsProcessing(false);
    }
  }, [onAddToCart, quantity]);

  const handleBuyNowClick = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onBuyNow(quantity);
    } finally {
      setIsProcessing(false);
    }
  }, [onBuyNow, quantity]);

  const isOutOfStock = countInStock <= 0;
  const isLoading = isAddingToCart || isBuyingNow || isProcessing;

  return (
    <div className="mb-4 flex flex-col">
      {/* Основная кнопка добавления в корзину */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        {!isOutOfStock ? (
          isInCart ? (
            // Товар в корзине - показываем счетчик и кнопку перехода
            <>
              <div className="flex-1 bg-gray-100 flex items-center gap-2 rounded-2xl h-13 px-3 py-2 w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-full"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isLoading}
                  type="button"
                  aria-label="Уменьшить количество или убрать из корзины"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <input
                  type="number"
                  min={1}
                  max={countInStock}
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  onBlur={(e) => {
                    const raw = e.target.value;
                    const num = parseInt(raw, 10);
                    if (isInCart && onCommitCartQuantity) {
                      if (!raw || Number.isNaN(num) || num < 1) {
                        void onCommitCartQuantity(0);
                        setQuantity(1);
                        return;
                      }
                    } else if (!raw || Number.isNaN(num) || num < 1) {
                      setQuantity(1);
                    }
                    void handleQuantityCommit();
                  }}
                  disabled={isLoading}
                  className="text-foreground bg-transparent border-none text-center text-lg w-12 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Количество товара"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-full"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= countInStock || isLoading}
                  type="button"
                  aria-label="Увеличить количество"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <button
                className={cn(
                  'inline-flex items-center justify-center h-13 cursor-pointer whitespace-nowrap bg-indigo-500 outline-none text-primary-foreground shadow-xs hover:bg-indigo-500/90 px-6 has-[>svg]:px-4 w-full rounded-2xl text-sm',
                )}
                onClick={onGoToCart}
                disabled={isLoading}
                aria-label="Перейти в корзину"
                type="button"
              >
                В корзине
              </button>
            </>
          ) : (
            // Товар не в корзине - кнопка добавления
            <Button
              className={cn(
                'group relative h-13 w-full rounded-2xl transition-all',
                'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
              size="lg"
              onClick={handleAddToCartClick}
              disabled={isLoading}
              type="button"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить в корзину'
              )}
            </Button>
          )
        ) : (
          // Нет в наличии
          !isInCart && (
          <></>
          )
        )}
      </div>

      {/* Дополнительные действия */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className={cn(
            'border-primary bg-card text-primary/80 hover:text-primary/100 hover:border-primary/80 hover:bg-muted min-h-[46px] flex-1 rounded-xl transition-all active:scale-[0.98]',
          )}
          size="lg"
          onClick={handleBuyNowClick}
          disabled={isOutOfStock || isLoading}
          aria-disabled={isOutOfStock || isLoading}
          type="button"
        >
          {isBuyingNow ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Оформление...
            </>
          ) : (
            'Купить сейчас'
          )}
        </Button>

        <button
          onClick={onToggleWishlist}
          className={cn(
            'group cursor-pointer relative flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 focus:outline-none',
            isInWishlist
              ? 'border-destructive bg-destructive/30 text-destructive shadow-destructive/20 shadow-sm'
              : 'border-border bg-card text-primary hover:border-primary/50 hover:bg-primary/10',
          )}
          aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
          aria-pressed={isInWishlist}
          title={isInWishlist ? 'В избранном' : 'Добавить в избранное'}
          type="button"
          disabled={isLoading}
        >
          <Heart
            className={cn(
              'h-6 w-6 transition-all',
              isInWishlist
                ? 'fill-destructive text-destructive scale-110'
                : 'group-hover:scale-110',
            )}
          />
          {isInWishlist && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-destructive relative inline-flex h-3 w-3 rounded-full"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
