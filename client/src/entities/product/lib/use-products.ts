import type { GetProductsParams } from '@/shared/api/services/product-service';
import { ProductService } from '@/shared/api/services/product-service';
import { devLog } from '@/shared/lib/logger';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '../model/types';
import { serverProductToProduct } from './adapters';
import { parseProductsFromApiResponse } from './parse-products-api-response';
import { parseSearchProductsResponse } from './parse-search-products-response';

/** Кэш React Query для каруселей витрины (похожие / популярные / рекомендации) */
const marketplaceRailQueryOptions = {
  staleTime: 60 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useProducts(params?: GetProductsParams & { search?: string }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      if (params?.search && params.search.trim().length > 0) {
        const limit = params?.limit ?? 100;
        const page = params?.page ?? 1;
        const response = await ProductService.searchProducts(params.search.trim(), { page, limit });
        return parseSearchProductsResponse(response, limit);
      }

      const response = await ProductService.getProducts(params);

      let products = [];
      let total = 0;
      let totalPages = 1;

      if (response.data && Array.isArray(response.data)) {
        products = response.data;
        total = response.total || response.totalCount || products.length;
        totalPages = response.totalPages || Math.ceil(total / (params?.limit || 20));
      } else if (response.data?.products && Array.isArray(response.data?.products)) {
        products = response.data.products;
        total = response.data.total || response.data.totalCount || products.length;
        totalPages = response.data.totalPages || Math.ceil(total / (params?.limit || 20));
      } else if (response.products && Array.isArray(response.products)) {
        products = response.products;
        total = response.total || response.totalCount || products.length;
        totalPages = response.totalPages || Math.ceil(total / (params?.limit || 20));
      } else if (Array.isArray(response)) {
        products = response;
        total = products.length;
        totalPages = 1;
      } else {
        devLog.warn('Неожиданный формат ответа для продуктов:', response);
      }

      return {
        products: products.map(serverProductToProduct),
        total,
        totalPages,
      };
    },
    staleTime: 30 * 1000, // 30 секунд - данные считаются свежими
    gcTime: 2 * 60 * 1000, // 2 минуты - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании, если данные свежие
  });
}

export function useFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await ProductService.getFeatured();
      const parsed = parseProductsFromApiResponse(response);
      if (parsed.length > 0) return parsed;
      const r = response as Record<string, unknown> | null;
      if (r?.success === true && Array.isArray(r.products)) return [];
      devLog.warn('Неожиданный формат ответа для featured:', response);
      return [];
    },
  });
}

export function usePopularProducts(limit = 24, enabled = true) {
  return useQuery<Product[]>({
    queryKey: ['products', 'popular', limit],
    queryFn: async () => {
      const response = await ProductService.getPopularProducts(limit);
      return parseProductsFromApiResponse(response);
    },
    enabled,
    ...marketplaceRailQueryOptions,
  });
}

export function useSimilarProducts(productId: string | undefined, limit = 16, enabled = true) {
  return useQuery<Product[]>({
    queryKey: ['products', 'similar', productId, limit],
    queryFn: async () => {
      const response = await ProductService.getSimilarProducts(productId!, limit);
      return parseProductsFromApiResponse(response);
    },
    enabled: Boolean(productId) && enabled,
    ...marketplaceRailQueryOptions,
  });
}

export function useRecommendedProducts(limit = 16, enabled = true) {
  return useQuery<Product[]>({
    queryKey: ['products', 'recommended', limit],
    queryFn: async () => {
      const response = await ProductService.getRecommendedForYou(limit);
      return parseProductsFromApiResponse(response);
    },
    enabled,
    ...marketplaceRailQueryOptions,
  });
}

export function useProductBanners() {
  return useQuery({
    queryKey: ['products', 'banners'],
    queryFn: async () => {
      const response = await ProductService.getProductBanners();
      return response.data?.images || [];
    },
    staleTime: 60 * 1000, // 1 minute - данные считаются свежими
    gcTime: 5 * 60 * 1000, // 5 minutes - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании, если данные свежие (использует prefetched данные)
  });
}

export function useProductById(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await ProductService.getProductById(productId);
      if (response.data) {
        return serverProductToProduct(response.data);
      } else if (response.product) {
        return serverProductToProduct(response.product);
      } else {
        return serverProductToProduct(response);
      }
    },
    enabled: !!productId,
  });
}
