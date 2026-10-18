'use client';

import { useBrands } from '@/entities/brand';
import { type Category, useCategories } from '@/entities/category';
import { useProducts } from '@/entities/product';
import type { BrandFilter, CategoryFilter } from '@/features/product-filters';
import {
  ActiveFilters,
  buildCategoryFilterTree,
  DEFAULT_FILTER_STATE,
  flattenCategoryFilters,
  HorizontalFilters,
  PRICE_RANGE,
  PRODUCTS_PER_PAGE,
} from '@/features/product-filters';
import { InfiniteProductList } from '@/features/product-list/InfiniteProductList';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ProductCardSkeleton,
  ProductsEmpty,
  ProductsError,
  ProductsGrid,
  ProductsHeader,
  ProductsList,
  ProductsPagination,
} from './components';
import { useProductActions, useProductsFilters, useProductsPagination } from './hooks';

export function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Хуки для фильтров
  const { filters, paginationMode, apiFilters, handleFiltersChange } = useProductsFilters();

  // Текущая страница из URL (для пагинации и для запроса)
  const searchParams = useSearchParams();
  const currentPageFromUrl = useMemo(() => {
    const p = searchParams?.get('page');
    const n = p && !isNaN(Number(p)) && Number(p) > 0 ? Number(p) : 1;
    return n;
  }, [searchParams]);

  // Загрузка данных: в режиме pagination — page из URL; в infinite — page 1 (total для шапки)
  const {
    data: productsData = { products: [], total: 0, totalPages: 1 },
    isLoading,
    error,
    refetch,
  } = useProducts({
    ...apiFilters,
    page: paginationMode === 'pagination' ? currentPageFromUrl : 1,
  });

  const products = Array.isArray(productsData.products) ? productsData.products : [];
  const totalProducts =
    typeof productsData.total === 'number' ? productsData.total : products.length;

  // Пагинация (totalPages и handlePageChange)
  const { totalPages, handlePageChange } = useProductsPagination({
    totalProducts,
    paginationMode,
  });
  const currentPage = currentPageFromUrl;

  // Действия с продуктами
  const { handleAddToCart, handleToggleWishlist, isInWishlist, isInCart, handleCartClick } =
    useProductActions();

  // Категории для фильтров: дерево из API (иерархия) + плоский список для подписей
  const { data: categoryTree = [] } = useCategories();
  const filterCategoryTree: CategoryFilter[] = useMemo(
    () => buildCategoryFilterTree(Array.isArray(categoryTree) ? (categoryTree as Category[]) : []),
    [categoryTree],
  );
  const flatCategoryFilters = useMemo(
    () => flattenCategoryFilters(filterCategoryTree),
    [filterCategoryTree],
  );

  // Бренды для фильтров
  const { data: brands = [] } = useBrands();
  const filterBrands: BrandFilter[] = useMemo(() => {
    if (!Array.isArray(brands)) return [];
    return brands.map((brand: any) => ({
      value: typeof brand?.value === 'string' ? brand.value : '',
      label: typeof brand?.label === 'string' ? brand.label : '',
      count: typeof brand?.count === 'number' ? brand.count : 0,
    }));
  }, [brands]);

  // Обработчик удаления фильтра
  const handleRemoveFilter = (type: keyof typeof filters, value?: string | number) => {
    const newFilters = { ...filters };

    if (type === 'categories' && typeof value === 'string') {
      newFilters.categories = newFilters.categories.filter((cat) => cat !== value);
    } else if (type === 'brands' && typeof value === 'string') {
      newFilters.brands = newFilters.brands.filter((brand) => brand !== value);
    } else if (type === 'priceRange') {
      newFilters.priceRange = [PRICE_RANGE.min, PRICE_RANGE.max];
    } else if (type === 'rating') {
      newFilters.rating = 0;
    } else if (type === 'inStock') {
      newFilters.inStock = null;
    }

    handleFiltersChange(newFilters);
  };

  // Обработчик очистки всех фильтров
  const handleClearAll = () => {
    handleFiltersChange(DEFAULT_FILTER_STATE);
  };

  return (
    <div className="max-container mx-auto px-3 sm:px-4 md:px-6">
      <div className="mb-3 flex flex-col gap-3">
        <ProductsHeader isLoading={isLoading} totalProducts={totalProducts} />

        {/* Горизонтальные фильтры */}
        <HorizontalFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categoryTree={filterCategoryTree}
          brands={filterBrands}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          productsCount={totalProducts}
        />

        {/* Активные фильтры */}
        <ActiveFilters
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAll}
          categories={flatCategoryFilters}
          brands={filterBrands}
        />
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-0.5 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PRODUCTS_PER_PAGE / 2 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ProductsError error={error} onRetry={() => refetch?.()} />
        ) : (
          <>
            {products.length > 0 ? (
              <>
                {paginationMode === 'infinite' ? (
                  <InfiniteProductList
                    filters={filters}
                    dense={viewMode === 'list'}
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 gap-0.5 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : undefined
                    }
                  />
                ) : viewMode === 'grid' ? (
                  <ProductsGrid
                    products={products}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist}
                    isInCart={isInCart}
                    onCartClick={handleCartClick}
                  />
                ) : (
                  <ProductsList
                    products={products}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist}
                    isInCart={isInCart}
                    onCartClick={handleCartClick}
                  />
                )}
              </>
            ) : (
              <ProductsEmpty />
            )}
            {paginationMode === 'pagination' && (
              <ProductsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
