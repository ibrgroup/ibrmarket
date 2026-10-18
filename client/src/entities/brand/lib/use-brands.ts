'use client';

import { useQuery } from '@tanstack/react-query';
import type { Brand } from '../model/types';

/**
 * Хук для получения списка брендов из API
 *
 * @returns Объект с данными брендов, статусом загрузки и ошибкой
 *
 * @example
 * ```tsx
 * const { data: brands = [], isLoading, error } = useBrands();
 * ```
 */
export function useBrands() {
  return useQuery<Brand[], Error>({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/brands', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки брендов: ${response.statusText}`);
        }

        const data = await response.json();

        // Валидация данных
        if (!Array.isArray(data)) {
          console.warn('Некорректный формат данных брендов, возвращаем пустой массив');
          return [];
        }

        // Маппинг данных в формат Brand
        return data
          .map((item: any) => ({
            value: typeof item.value === 'string' ? item.value : item._id?.toString() || '',
            label: typeof item.label === 'string' ? item.label : item.name || '',
            count: typeof item.count === 'number' ? item.count : 0,
            logo: typeof item.logo === 'string' ? item.logo : undefined,
          }))
          .filter((brand: Brand) => brand.value && brand.label)
          .sort((a: Brand, b: Brand) => a.label.localeCompare(b.label, 'ru'));
      } catch (error) {
        console.error('Ошибка при загрузке брендов:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут (было cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
