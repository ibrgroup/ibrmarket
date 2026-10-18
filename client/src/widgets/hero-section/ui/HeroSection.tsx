'use client';

import { mapBannerV1ToHeroSlides } from '@/shared/lib/map-banner-v1';
import { useBannerV1 } from '@/shared/hooks/use-banners';
import { ProductSlider } from '@/features/product-slider';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMemo, type FC } from 'react';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: FC<HeroSectionProps> = ({ className }) => {
  const { data: banners, isLoading, error, refetch } = useBannerV1();

  const apiSlides = useMemo(
    () => (banners?.length ? mapBannerV1ToHeroSlides(banners) : []),
    [banners],
  );

  return (
    <section className={`hero-section ${className ?? ''}overflow-visible`}>
      <div>
        {isLoading ? (
          <div className="relative mx-auto w-full max-w-[1416px] px-4">
            <Skeleton className="h-[200px] w-full rounded-3xl md:h-72" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Ошибка загрузки баннеров:{' '}
                {error instanceof Error ? error.message : 'Неизвестная ошибка'}
              </span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <ProductSlider slides={apiSlides.length > 0 ? apiSlides : undefined} />
        )}
      </div>
    </section>
  );
};
