import type { InfiniteProductParams, InfiniteProductResponse, Product } from '@/entities/product';
import type { GetProductsParams } from '@/shared/api/services/product-service';
import { ProductService } from '@/shared/api/services/product-service';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { serverProductToProduct } from './adapters';

export function useInfiniteProducts(params?: Omit<InfiniteProductParams, 'page' | 'limit'>) {
  return useInfiniteQuery<InfiniteProductResponse, Error, InfiniteData<InfiniteProductResponse>>({
    queryKey: ['infinite-products', params],
    queryFn: async ({ pageParam = 1 }) => {
      const safePage =
        typeof pageParam === 'number' && !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
      const sortOrderValue = params?.order ?? params?.sortOrder ?? 'desc';
      const queryParams: GetProductsParams = {
        ...(params || {}),
        page: safePage,
        limit: 20,
        sortBy: params?.sortBy ?? 'createdAt',
        sortOrder: sortOrderValue as 'asc' | 'desc',
      };

      let response: any;
      try {
        response = await ProductService.getProducts(queryParams);
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`Ошибка запроса продуктов: ${err.message}`);
        } else {
          throw new Error('Ошибка запроса продуктов');
        }
      }

      let products: Product[] = [];
      let total = 0;
      let totalPages = 1;
      let page = safePage;

      if (response && response.data && Array.isArray(response.data.products)) {
        products = response.data.products;
        total = response.data.total ?? response.data.totalCount ?? products.length;
        totalPages = response.data.totalPages ?? Math.ceil(total / (queryParams.limit || 20));
        page = response.data.page ?? safePage;
      } else if (response && Array.isArray(response.data)) {
        products = response.data;
        total = products.length;
        totalPages = 1;
      } else if (response && Array.isArray(response.products)) {
        products = response.products;
        total = response.total ?? response.totalCount ?? products.length;
        totalPages = response.totalPages ?? Math.ceil(total / (queryParams.limit || 20));
        page = response.page ?? safePage;
      } else if (Array.isArray(response)) {
        products = response;
        total = products.length;
        totalPages = 1;
      } else {
        if (response && response.success && Array.isArray(response.products)) {
          products = response.products;
          total = response.total ?? response.totalCount ?? products.length;
          totalPages = response.totalPages ?? Math.ceil(total / (queryParams.limit || 20));
          page = response.page ?? safePage;
        } else {
          console.warn('[useInfiniteProducts] Unexpected response shape:', response);
          products = [];
          total = 0;
          totalPages = 1;
        }
      }

      const hasMore = page < totalPages;
      const nextPage = hasMore ? page + 1 : undefined;

      const normalizedProducts = (products as any[]).map(serverProductToProduct);

      return {
        products: normalizedProducts,
        hasMore,
        nextPage,
        total,
        page,
        totalPages,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.nextPage;
    },
    getPreviousPageParam: (firstPage) => {
      const prevPage = firstPage.page - 1;
      return prevPage >= 1 ? prevPage : undefined;
    },
    staleTime: 30 * 1000, // 30 секунд - данные считаются свежими
    gcTime: 2 * 60 * 1000, // 2 минуты - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании, если данные свежие
  });
}
