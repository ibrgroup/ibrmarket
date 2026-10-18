'use client';

import type { Banner } from '@/shared/api/services/banner-service';
import { bannerService } from '@/shared/api/services/banner-service';
import { useQuery } from '@tanstack/react-query';

export type BannerV1Item = Banner;

/**
 * Хук для загрузки баннеров из API bannerV1.
 * Используется в HeroSection и BannerSlider для единого источника данных.
 */
export function useBannerV1() {
  return useQuery({
    queryKey: ['banners', 'v1'],
    queryFn: async (): Promise<BannerV1Item[]> => {
      const response = await bannerService.getBanners();
      return response.banners;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
