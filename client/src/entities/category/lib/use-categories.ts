import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/shared/api/services/category-service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getCategories(),
    select: (data) => data.data,
    staleTime: 60 * 1000, // 1 minute - данные считаются свежими
    gcTime: 5 * 60 * 1000, // 5 minutes - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании, если данные свежие (использует prefetched данные)
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => CategoryService.getCategoryById(Number(id)),
    select: (data) => data.data,
    enabled: !!id,
  });
}
