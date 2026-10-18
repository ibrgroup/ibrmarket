'use client';

import { cartLineMatchesProductCatalogDefault, productToCartItem, useCart } from '@/entities/cart';
import { fetchProductById, usePopularProducts, useProductRailActions } from '@/entities/product';
import type { Product } from '@/entities/product/model/types';
import { useWishlist, type WishlistItem } from '@/entities/wishlist';
import { designTokens } from '@/shared/config/design-tokens';
import { getProductLinkId } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { ProductCarouselSection } from '@/widgets/product-carousel';
import { useQueries } from '@tanstack/react-query';
import { Heart, Loader2, Search, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { toast } from 'sonner';

type SortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'discount-desc';

export function WishlistPage() {
  const { items, removeItem, isLoading: wishlistLoading, syncWithServer } = useWishlist();
  const { addItem: addToCart, items: cartItems, isLoading: cartLoading } = useCart();
  const { data: popularRail = [] } = usePopularProducts(20);
  const rail = useProductRailActions();

  const [sort, setSort] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState<{ [productId: string]: boolean }>({});
  const [justAdded, setJustAdded] = useState<{ [productId: string]: boolean }>({});
  const toastTimeoutsRef = useRef<{ [productId: string]: ReturnType<typeof setTimeout> }>({});

  // UX: scroll to top after removing last item
  const prevItemCountRef = useRef(items.length);
  useEffect(() => {
    if (prevItemCountRef.current !== items.length && items.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevItemCountRef.current = items.length;
  }, [items.length]);

  // Improved: Only sync on mount or if necessary (avoid repeated calls on every render)
  useEffect(() => {
    syncWithServer().catch((error) => {
      toast.error('Не удалось обновить избранное.');
      console.error('Wishlist page: Sync failed:', error);
    });
    // Disable exhaustive deps since syncWithServer is stable from context/hook
    // eslint-disable-next-line
  }, []);

  const displayedItems = useMemo(() => {
    let list = items;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const title = (item.productTitle || item.name || '').toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        return title.includes(q) || brand.includes(q);
      });
    }

    const sorted = [...list];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) =>
          (a.productTitle || a.name || '').localeCompare(b.productTitle || b.name || ''),
        );
        break;
      case 'name-desc':
        sorted.sort((a, b) =>
          (b.productTitle || b.name || '').localeCompare(a.productTitle || a.name || ''),
        );
        break;
      case 'discount-desc':
        sorted.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, searchQuery, sort]);

  const wishlistProductIds = useMemo(
    () => [
      ...new Set(
        displayedItems.map((i) => String(i.productId || i._id || '').trim()).filter(Boolean),
      ),
    ],
    [displayedItems],
  );

  const wishlistProductQueries = useQueries({
    queries: wishlistProductIds.map((id) => ({
      queryKey: ['product', 'wishlist-row', id],
      queryFn: () => fetchProductById(id),
      staleTime: 5 * 60_000,
      enabled: Boolean(id),
    })),
  });

  const wishlistProductById = useMemo(() => {
    const m = new Map<string, Product>();
    wishlistProductIds.forEach((id, i) => {
      const p = wishlistProductQueries[i]?.data;
      if (p) m.set(id, p);
    });
    return m;
  }, [wishlistProductIds, wishlistProductQueries]);

  // Improved: Handle adding to cart with feedback and prevent double add
  const handleAddToCart = async (item: WishlistItem) => {
    const productId = item.productId || item._id;
    setIsAdding((s) => ({ ...s, [productId]: true }));

    try {
      const product = await fetchProductById(String(productId));
      if (!product) {
        toast.error('Не удалось загрузить товар. Попробуйте с страницы товара.');
        return;
      }

      const cartHas = cartItems.some((cartItem) =>
        cartLineMatchesProductCatalogDefault(cartItem, product),
      );

      if (cartHas) {
        toast.info('Этот вариант уже в корзине');
        setJustAdded((s) => ({ ...s, [productId]: true }));
        clearTimeout(toastTimeoutsRef.current[productId]);
        toastTimeoutsRef.current[productId] = setTimeout(() => {
          setJustAdded((s) => ({ ...s, [productId]: false }));
        }, 1200);
        return;
      }

      await addToCart(productToCartItem(product, 1));

      toast.success(
        <div>
          Товар добавлен в корзину
          <div>
            <Link href="/cart" className="text-sm underline" tabIndex={-1}>
              Перейти в корзину
            </Link>
          </div>
        </div>,
      );
      setJustAdded((s) => ({ ...s, [productId]: true }));
      clearTimeout(toastTimeoutsRef.current[productId]);
      toastTimeoutsRef.current[productId] = setTimeout(() => {
        setJustAdded((s) => ({ ...s, [productId]: false }));
      }, 1200);
    } catch (error) {
      toast.error('Ошибка при добавлении в корзину. Попробуйте позже.');
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding((s) => ({ ...s, [productId]: false }));
    }
  };

  // UX: Loading skeleton state
  if (wishlistLoading && items.length === 0) {
    return (
      <div className="max-container mx-auto px-4 py-3">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <Skeleton className="mb-4 aspect-square w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-4 h-6 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // UX: Empty state
  if (items.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center animate-fadeIn">
            <Heart className="mx-auto mb-6 h-24 dark:text-[#f2f2f2] w-24 text-gray-900" />
            <h1 className="text-2xl font-roboto dark:text-[#f2f2f2] font-bold text-gray-900">
              Избранное пусто
            </h1>
            <p className="mb-8 mt-3 text-sm text-gray-900 dark:text-[#f2f2f2]">
              Добавляйте товары в избранное
            </p>
            <Button asChild size="lg">
              <Link href="/products">Посмотреть товары</Link>
            </Button>
          </div>
        </div>
        <div className="max-container mx-auto px-4 pb-12">
          <ProductCarouselSection
            title="Популярные товары"
            subtitle="Подборка по рейтингу и спросу"
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

  return (
    <div className="max-container mx-auto py-3">
      <div className="mb-3 flex p-3 bg-card rounded-2xl items-center justify-between">
        <div className="relative">
          <h1 className="text-xl md:text-2xl font-roboto font-bold">Избранное</h1>
        </div>
        <Button className="flex gap-1 border-none bg-muted" variant="outline" asChild>
          <Link href="/products">
            <span className="hidden md:block">Продолжить покупку</span>
            <ShoppingCart className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mb-3 flex bg-card p-3 rounded-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 bg-muted w-full rounded-md md:max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по названию или бренду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full dark:bg-gray-100 placeholder:text-sm "
            aria-label="Поиск в избранном"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger
            className="w-full dark:bg-gray-100 cursor-pointer bg-muted sm:w-[220px]"
            aria-label="Сортировка"
          >
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="cursor-pointer" value="newest">
              Сначала новые
            </SelectItem>
            <SelectItem className="cursor-pointer" value="price-asc">
              Цена: по возрастанию
            </SelectItem>
            <SelectItem className="cursor-pointer" value="price-desc">
              Цена: по убыванию
            </SelectItem>
            <SelectItem className="cursor-pointer" value="name-asc">
              Название: А → Я
            </SelectItem>
            <SelectItem className="cursor-pointer" value="name-desc">
              Название: Я → А
            </SelectItem>
            <SelectItem className="cursor-pointer" value="discount-desc">
              Скидка: больше сначала
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {displayedItems.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          По запросу ничего не найдено. Измените фильтр или поиск.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 lg:grid-cols-5 gap-0.5 md:gap-5">
          {displayedItems.map((item) => {
            const wishlistItemId = item._id;
            const productId = item.productId || item._id;
            const productLinkId = getProductLinkId(item);
            const rowProduct = wishlistProductById.get(String(productId));
            const added = rowProduct
              ? cartItems.some((c) => cartLineMatchesProductCatalogDefault(c, rowProduct))
              : cartItems.some((c) => c.productId === productId);
            const isAddingItem = isAdding[productId] || false;
            const justAddedItem = justAdded[productId] || false;

            // Fallbacks for fields, UX: prefer productTitle then name
            const displayTitle = item.productTitle || item.name || 'Без названия';
            const displayImage = item.image || '/placeholder.png';

            // Calculate old price if not provided
            const computedOldPrice =
              item.oldPrice ??
              (item.price && item.discount
                ? Math.round(item.price / (1 - item.discount / 100))
                : undefined);

            return (
              <Card
                key={wishlistItemId}
                className="group py-0 relative overflow-hidden transition-all"
              >
                <CardContent className="flex flex-col h-full gap-3 px-0">
                  <div className="relative aspect-square rounded-lg bg-muted">
                    {productLinkId ? (
                      <Link href={`/product/${productLinkId}`} className="font-semibold">
                        <img
                          src={displayImage}
                          alt={displayTitle}
                          className="h-full w-full object-cover transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          draggable={false}
                        />
                      </Link>
                    ) : (
                      <Link href="/catalog" className="font-semibold"></Link>
                    )}

                    <Button
                      size="icon"
                      variant="destructive"
                      title="Удалить из избранного"
                      aria-label="Удалить из избранного"
                      className="absolute top-2 right-2 h-8 w-8 shadow-lg transition-opacity"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeItem(wishlistItemId);
                        toast.success('Товар удален из избранного');
                      }}
                      disabled={wishlistLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {item.discount ? (
                      <Badge
                        variant="destructive"
                        className="absolute bottom-10 left-2 bg-pink-500 font-bold"
                      >
                        -{item.discount}%
                      </Badge>
                    ) : null}
                    {item.brand && (
                      <Badge variant="secondary" className="text-xs absolute bottom-2 left-2">
                        {item.brand}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 flex p-2 pt-0 flex-col space-y-3">
                    <h3 className="truncate text-sm text-md ">
                      {productLinkId ? (
                        <Link
                          href={`/product/${productLinkId}`}
                          className="hover:text-primary transition-colors"
                        >
                          {displayTitle}
                        </Link>
                      ) : (
                        <span>{displayTitle}</span>
                      )}
                    </h3>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-md text-pink-500 font-roboto">
                          {item.price ? item.price.toLocaleString() : '—'} ₽
                        </span>
                        {computedOldPrice && computedOldPrice > item.price ? (
                          <span className="text-sm text-gray-500 dark:text-muted-foreground line-through ">
                            {computedOldPrice.toLocaleString()} ₽
                          </span>
                        ) : null}
                      </div>

                      {item.rating ? (
                        <div className="flex items-center gap-1 text-base dark:text-gray-400">
                          <span aria-label="Оценка">
                            <FaStar className="text-yellow-500" />
                          </span>
                          <span className="text-sm dark:text-muted-foreground">{item.rating.toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex flex-1 items-center rounded-lg justify-center transition-all h-10 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor:
                            added || justAddedItem ? designTokens.colors.success[300] : '',
                          color: added || justAddedItem ? '#fff' : undefined,
                        }}
                        aria-label={
                          added || justAddedItem
                            ? 'Товар уже в корзине'
                            : isAddingItem
                              ? 'Добавление в корзину'
                              : 'Добавить в корзину'
                        }
                        onClick={() => {
                          if (!added && !isAddingItem) handleAddToCart(item);
                        }}
                        disabled={isAddingItem || cartLoading || added}
                      >
                        {added || justAddedItem ? (
                          <>
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 576 512"
                              height="17"
                              width="17"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192 32 192c-17.7 0-32 14.3-32 32s14.3 32 32 32L83.9 463.5C91 492 116.6 512 146 512L430 512c29.4 0 55-20 62.1-48.5L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32l-85.6 0L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192l-232.6 0L253.3 35.1zM192 304l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16zm96-16c8.8 0 16 7.2 16 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16zm128 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16z"></path>
                            </svg>
                            <span className="text-primary-foreground">В корзине</span>
                          </>
                        ) : isAddingItem ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                            <span className="text-primary-foreground">Добавление...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 576 512"
                              height="17"
                              width="17"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192 32 192c-17.7 0-32 14.3-32 32s14.3 32 32 32L83.9 463.5C91 492 116.6 512 146 512L430 512c29.4 0 55-20 62.1-48.5L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32l-85.6 0L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192l-232.6 0L253.3 35.1zM192 304l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16zm96-16c8.8 0 16 7.2 16 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16zm128 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16z"></path>
                            </svg>
                            <span className="text-white dark:text-[#f2f2f2]">В корзину</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <ProductCarouselSection
          title="Популярные товары"
          subtitle="Может заинтересовать"
          products={popularRail}
          onAddToCart={rail.onAddToCart}
          onToggleWishlist={rail.onToggleWishlist}
          isInWishlist={rail.isInWishlist}
          isInCart={rail.isInCart}
        />
      </div>
    </div>
  );
}
