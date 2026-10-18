'use client';

import { mapBannerV1ToBarsItems } from '@/shared/lib/map-banner-v1';
import { useBannerV1 } from '@/shared/hooks/use-banners';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Bars } from '@/widgets/banners/bars';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

export function BannerSlider() {
  const { data, isLoading, error } = useBannerV1();

  const barItems = useMemo(() => (data?.length ? mapBannerV1ToBarsItems(data) : []), [data]);

  if (isLoading) {
    return (
      <div className="my-8 w-full">
        <Card className="overflow-hidden">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки баннеров:{' '}
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (barItems.length === 0) {
    return null;
  }

  return (
    <Bars
      banners={barItems}
      autoplayDelay={5000}
      onBannerClick={(index, banner) => {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Bars] Banner clicked:', index, banner.title);
        }
      }}
    />
  );
}
