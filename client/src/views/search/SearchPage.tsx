'use client';

import type { Product } from '@/entities';
import { type Category, useCategories } from '@/entities/category';
import { isSingleSearchHit, useInfiniteSearchProducts } from '@/entities/product';
import {
  ActiveFilters,
  buildCategoryFilterTree,
  CategoryChips,
  flattenCategoryFilters,
  PRODUCTS_PER_PAGE,
} from '@/features/product-filters';
import {
  clearVisualSearchSession,
  readVisualSearchSession,
  type VisualSearchSession,
} from '@/features/product-search/lib/image-search-service';
import { DEFAULT_POPULAR_SEARCHES } from '@/shared/lib/constants/popularSearch';
import { Button } from '@/shared/ui/button';
import { ProductCardSkeleton, ProductsError, ProductsGrid } from '@/views/products/components';
import { useProductActions } from '@/views/products/hooks';
import { Loader2, Package, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { SearchResultsHeader } from './components';
import { useSearchCategoryFilters } from './hooks/useSearchCategoryFilters';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') ?? '';
  const isVisualSearch = searchParams?.get('byImage') === '1';
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [visualSession, setVisualSession] = useState<VisualSearchSession | null>(null);

  useEffect(() => {
    if (!isVisualSearch) {
      setVisualSession(null);
      return;
    }
    const session = readVisualSearchSession();
    if (!session) {
      router.replace('/search');
      return;
    }
    setVisualSession(session);
  }, [isVisualSearch, router]);

  const visualProducts = visualSession?.products ?? [];

  const { handleAddToCart, handleToggleWishlist, isInWishlist, isInCart, handleCartClick } =
    useProductActions();

  const trimmedQuery = query.trim();
  const {
    filters,
    selectedCategories,
    handleFiltersChange,
    handleRemoveCategory,
    handleClearCategories,
  } = useSearchCategoryFilters();

  const { data: categoryTree = [] } = useCategories();
  const filterCategoryTree = useMemo(
    () => buildCategoryFilterTree(Array.isArray(categoryTree) ? (categoryTree as Category[]) : []),
    [categoryTree],
  );
  const flatCategoryFilters = useMemo(
    () => flattenCategoryFilters(filterCategoryTree),
    [filterCategoryTree],
  );

  const {
    data: searchPages,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSearchProducts(trimmedQuery, {
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
  });

  const products: Product[] = useMemo(() => {
    if (!searchPages?.pages?.length) return [];
    return searchPages.pages.flatMap((page) => page.products);
  }, [searchPages]);

  const totalProducts = searchPages?.pages?.[0]?.total ?? products.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isVisualSearch || !trimmedQuery) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isVisualSearch, trimmedQuery]);

  useEffect(() => {
    if (isVisualSearch || isLoadingProducts || productsError || !trimmedQuery || !searchPages) {
      return;
    }
    const firstPage = searchPages.pages[0];
    if (!firstPage) return;
    const bundle = {
      products: firstPage.products,
      total: firstPage.total,
      totalPages: firstPage.totalPages,
    };
    if (isSingleSearchHit(bundle)) {
      router.replace(`/product/${bundle.products[0]._id}`);
    }
  }, [isLoadingProducts, productsError, trimmedQuery, searchPages, router, isVisualSearch]);

  const handleClear = () => {
    router.push('/search');
  };

  const handleClearVisualSearch = () => {
    clearVisualSearchSession();
    router.push('/search');
  };

  const handlePopularClick = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const isLoading = isVisualSearch ? false : isLoadingProducts;
  const displayProducts = isVisualSearch ? visualProducts : products;
  const hasActiveSearch = Boolean(trimmedQuery || isVisualSearch);

  return (
    <div className="max-container mx-auto px-3 pb-8 sm:px-4 md:px-6 md:pb-12">
      {isVisualSearch && visualSession ? (
        <div className="mt-3 mb-1 flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visualSession.previewDataUrl}
            alt={visualSession.fileName || 'Фото для поиска'}
            className="size-16 shrink-0 rounded-xl border object-cover"
          />
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-muted-foreground text-sm">
              Найдено {visualProducts.length}{' '}
              {visualProducts.length === 1
                ? 'товар'
                : visualProducts.length < 5
                  ? 'товара'
                  : 'товаров'}
            </p>
          </div>
        </div>
      ) : null}

      <SearchResultsHeader
        query={trimmedQuery}
        totalProducts={isVisualSearch ? visualProducts.length : totalProducts}
        isLoading={isLoading}
        isVisualSearch={isVisualSearch}
        onClear={isVisualSearch ? handleClearVisualSearch : trimmedQuery ? handleClear : undefined}
        className={isVisualSearch && visualSession ? 'mt-3' : undefined}
      />

      {!isVisualSearch && trimmedQuery && filterCategoryTree.length > 0 ? (
        <div className="mt-3 space-y-2">
          <CategoryChips
            categoryTree={filterCategoryTree}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            nowrap
            className="rounded-2xl border border-border/60 bg-card px-3 py-2.5"
          />
          {filters.categories.length > 0 ? (
            <ActiveFilters
              filters={filters}
              categories={flatCategoryFilters}
              brands={[]}
              onRemoveFilter={(type, value) => {
                if (type === 'categories' && typeof value === 'string') {
                  handleRemoveCategory(value);
                }
              }}
              onClearAll={handleClearCategories}
            />
          ) : null}
        </div>
      ) : null}

      {productsError ? (
        <div className="mt-4">
          <ProductsError error={productsError} onRetry={() => refetch()} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-0.5 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PRODUCTS_PER_PAGE / 2 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : hasActiveSearch && displayProducts.length > 0 ? (
        <>
          <div className="mt-4">
            <ProductsGrid
              products={displayProducts}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              isInWishlist={isInWishlist}
              isInCart={isInCart}
              onCartClick={handleCartClick}
            />
          </div>
          {!isVisualSearch && hasNextPage ? (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <Loader2 className="text-primary size-6 animate-spin" />
              ) : (
                <span className="text-muted-foreground text-sm">Загрузка…</span>
              )}
            </div>
          ) : null}
        </>
      ) : hasActiveSearch && displayProducts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
          <Package className="text-muted-foreground/40 mx-auto mb-4 size-14" />
          <h2 className="text-foreground mb-2 text-lg font-semibold">
            {isVisualSearch ? 'Похожие товары не найдены' : 'Ничего не найдено'}
          </h2>
          <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">
            {isVisualSearch ? (
              'Попробуйте другое фото или воспользуйтесь текстовым поиском.'
            ) : (
              <>
                По запросу &laquo;{trimmedQuery}&raquo; товаров нет. Проверьте написание или
                попробуйте более общий запрос.
              </>
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {isVisualSearch ? (
              <Button variant="outline" className="rounded-xl" onClick={handleClearVisualSearch}>
                Новый поиск
              </Button>
            ) : (
              <Button variant="outline" className="rounded-xl" onClick={handleClear}>
                Сбросить запрос
              </Button>
            )}
            <Button asChild className="rounded-xl">
              <Link href="/products">Перейти в каталог</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card px-6 py-12 text-center sm:py-16">
          <Search className="text-muted-foreground/40 mx-auto mb-4 size-14" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">Что будем искать?</h2>
          <p className="text-muted-foreground mx-auto mb-8 max-w-md text-sm">
            Введите запрос в строке поиска или выберите популярную категорию
          </p>
          <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2">
            {DEFAULT_POPULAR_SEARCHES.map((term) => (
              <Button
                key={term}
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => handlePopularClick(term)}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-container mx-auto flex justify-center px-4 py-16">
          <Loader2 className="text-primary size-8 animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
