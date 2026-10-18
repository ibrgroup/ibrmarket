  'use client';

  import type { InfiniteProductResponse, Product } from '@/entities';
  import {
    cartLineMatchesProductCatalogDefault,
    productToCartItem,
    useCartStore,
  } from '@/entities/cart';
  import { ProductCard, useInfiniteProducts } from '@/entities/product';
  import { productToWishlistItem, useWishlistStore } from '@/entities/wishlist';
  import type { FilterState } from '@/features/product-filters';
  import { cn } from '@/shared/lib/utils';
  import { Button } from '@/shared/ui/button';
  import { Card, CardContent } from '@/shared/ui/card';
  import { Skeleton } from '@/shared/ui/skeleton';
  import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
  import { useRouter } from 'next/navigation';
  import React, { useCallback, useEffect, useRef } from 'react';
  import { toast } from 'sonner';
  import { BannerSlider } from './ui/BannerSlider';

  interface InfiniteProductListProps {
    filters: FilterState;
    className?: string;
    /** Плотная сетка — режим «список» на /products */
    dense?: boolean;
  }

  const DEFAULT_PRODUCT_GRID_CLASS =
    'grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:gap-4';

  const DENSE_PRODUCT_GRID_CLASS =
    'grid grid-cols-2 gap-0.5 md:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

  // const getProductImage = (product: Product): string => {
  //   if (Array.isArray(product.images) && product.images.length > 0) {
  //     const img = product.images.find(
  //       (i) =>
  //         (typeof i === 'string' && i.trim() && i !== '/placeholder.png') ||
  //         (typeof i === 'object' &&
  //           i &&
  //           'url' in i &&
  //           typeof (i as { url?: unknown }).url === 'string' &&
  //           (i as { url: string }).url.trim() &&
  //           (i as { url: string }).url !== '/placeholder.png'),
  //     );
  //     if (typeof img === 'string') {
  //       return img;
  //     }
  //     if (
  //       img &&
  //       typeof img === 'object' &&
  //       'url' in img &&
  //       typeof (img as { url?: unknown }).url === 'string' &&
  //       (img as { url: string }).url.trim()
  //     ) {
  //       return (img as { url: string }).url;
  //     }
  //   }
  //   return '/placeholder.png';
  // };

  const isProductInStock = (product: Product): boolean => {
    if (typeof product.countInStock === 'number') {
      return product.countInStock > 0;
    }
    return !('countInStock' in product) || !!product.countInStock;
  };

  export const InfiniteProductList: React.FC<InfiniteProductListProps> = ({
    filters,
    className,
    dense = false,
  }) => {
    const router = useRouter();
    const infiniteQueryResult: UseInfiniteQueryResult<
      InfiniteData<InfiniteProductResponse>,
      Error
    > = useInfiniteProducts({
      ...filters,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      brands: filters.brands.length > 0 ? filters.brands : undefined,
      priceRange:
        filters.priceRange[0] > 0 || filters.priceRange[1] < 200_000 ? filters.priceRange : undefined,
      rating: filters.rating > 0 ? filters.rating : undefined,
      inStock: filters.inStock !== null ? filters.inStock : undefined,
      sortBy: filters.sortBy,
      order: filters.sortOrder,
    });

    const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      isError,
      error,
      refetch,
    } = infiniteQueryResult;

    const sentinelRef = useRef<HTMLDivElement>(null);

    const { addItem: addToCart, items: cartItems } = useCartStore();
    const {
      addItem: addToWishlist,
      isInWishlist,
      removeItemByProductId: removeFromWishlist,
    } = useWishlistStore();

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      let isFetching = false;
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetching) {
            isFetching = true;
            fetchNextPage()
              .then(() => {
                isFetching = false;
              })
              .catch(() => {
                isFetching = false;
              });
          }
        },
        { threshold: 0.1, rootMargin: '100px' },
      );
      observer.observe(sentinel);

      return () => {
        if (sentinel) observer.unobserve(sentinel);
        isFetching = false;
      };
    }, [hasNextPage, fetchNextPage]);

    const handleAddToCart = useCallback(
      async (product: Product) => {
        if (!isProductInStock(product)) {
          toast.error('Товара нет в наличии');
          return;
        }
        if (cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, product))) {
          return;
        }
        const cartItem = productToCartItem(product, 1);
        await addToCart(cartItem);
      },
      [addToCart, cartItems],
    );

    const handleToggleWishlist = useCallback(
      async (product: Product) => {
        if (isInWishlist(product._id)) {
          await removeFromWishlist(product._id);
        } else {
          const wishlistItem = productToWishlistItem(product);
          await addToWishlist(wishlistItem);
        }
      },
      [addToWishlist, isInWishlist, removeFromWishlist],
    );

    // Проверка наличия товара в корзине
    const isInCart = useCallback(
      (p: Product) => cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, p)),
      [cartItems],
    );

    // Обработчик клика на кнопку корзины когда товар уже в корзине
    const handleCartClick = useCallback(
      (_product: Product) => {
        router.push('/cart');
      },
      [router],
    );

    // Type assertion to ensure data has the correct type
    const typedData = data as InfiniteData<InfiniteProductResponse> | undefined;
    const allProducts = typedData?.pages.flatMap((page) => page.products) || [];

    if (isLoading && (!typedData || (typedData.pages && typedData.pages.length === 0))) {
      return (
        <div
          className={`grid grid-cols-2 md:gap-5 gap-0.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className || ''}`}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card
              key={idx}
              className="flex animate-pulse p-0 flex-col overflow-hidden rounded-2xl bg-white duration-200 dark:bg-zinc-900"
              style={{ border: 'none' }}
            >
              <div className="relative aspect-square md:w-80 md:h-96 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100 transition-colors duration-200 dark:from-zinc-800 dark:to-zinc-950" />
              <CardContent className="flex flex-auto flex-col p-4">
                <Skeleton className="mb-2 h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="mb-2 h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4 dark:text-zinc-200">
            {error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Ошибка загрузки товаров'}
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-primary text-white transition-colors dark:bg-zinc-800 dark:text-zinc-100"
          >
            Повторить попытку
          </Button>
        </div>
      );
    }

    if (allProducts.length === 0 && !isFetchingNextPage) {
      return (
        <div className="py-10 text-center">
          <h2 className="mb-4 text-lg font-semibold text-zinc-500 dark:text-zinc-300">
            Нет товаров по выбранным фильтрам
          </h2>
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="transition-colors dark:bg-zinc-800 dark:text-zinc-100"
          >
            Обновить
          </Button>
        </div>
      );
    }

    // Разбиваем продукты на части: первые 12 и остальные
    const firstTwelve = allProducts.slice(0, 12);
    const rest = allProducts.slice(12);
    const productGridClass =
      className ?? (dense ? DENSE_PRODUCT_GRID_CLASS : DEFAULT_PRODUCT_GRID_CLASS);

    return (
      <>
        <div className={productGridClass}>
          {firstTwelve.map((product: Product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              isInWishlist={isInWishlist}
              isInCart={isInCart}
              onCartClick={handleCartClick}
            />
          ))}
        </div>

        {firstTwelve.length >= 10 && <BannerSlider />}

        {/* Остальные продукты */}
        {rest.length > 0 && (
          <div className={cn(productGridClass, 'gap-y-5')}>
            {rest.map((product: Product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist}
                isInCart={isInCart}
                onCartClick={handleCartClick}
              />
            ))}
          </div>
        )}

        {isFetchingNextPage && (
          <div className="mt-6 grid grid-cols-2 md:gap-5 gap-0.5 px-2 sm:px-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card
                key={`loading-${idx}`}
                className="flex animate-pulse p-0 flex-col overflow-hidden rounded-xl bg-white duration-200 dark:bg-zinc-900"
                style={{ border: 'none' }}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100 transition-colors duration-200 dark:from-zinc-800 dark:to-zinc-950" />
                <CardContent className="flex flex-auto flex-col p-4">
                  <Skeleton className="mb-2 h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="mb-2 h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '20px', width: '100%' }} />

        {!hasNextPage && allProducts.length > 0 && (
          <div className="mt-8 py-4 text-center">
            <p className="text-muted-foreground dark:text-zinc-400">Вы достигли конца списка</p>
          </div>
        )}


      </>
    );
  };
