import { addressService } from '@/shared/api/services/address-service';
import { useUserStore } from '@/entities/user';
import { useQuery } from '@tanstack/react-query';

/**
 * Хук для получения списка адресов пользователя
 * Использует React Query для кэширования и оптимизации запросов
 *
 * CRITICAL: Uses user from Zustand store, NOT JWT decoding
 */
export function useAddresses(enabled: boolean = true) {
  const user = useUserStore((state) => state.user);

  const query = useQuery({
    queryKey: ['addresses', user?._id],
    queryFn: async () => {
      const userId = user?._id;
      const result = await addressService.getAddresses(userId);
      if (process.env.NODE_ENV === 'development') {
        console.info('🔍 [useAddresses] addresses:', result.addresses);
      }
      return result;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const addresses = query.data?.addresses ?? [];
  const maxAddresses = query.data?.maxAddresses ?? 10;
  const total = query.data?.total ?? addresses.length;

  return {
    ...query,
    data: addresses,
    addresses,
    maxAddresses,
    total,
    isAtLimit: addresses.length >= maxAddresses,
  };
}
