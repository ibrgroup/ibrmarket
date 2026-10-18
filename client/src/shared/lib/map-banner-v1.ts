import type { Banner } from '@/shared/api/services/banner-service';
import type { IBannerItem } from '@/widgets/banners/bars/model/types';

const ACCENTS: NonNullable<IBannerItem['accentColor']>[] = ['orange', 'pink', 'blue', 'green'];

/** bannerV1 API → компактные баннеры Bars в каталоге */
export function mapBannerV1ToBarsItems(banners: Banner[]): IBannerItem[] {
  return banners
    .flatMap((banner, bannerIndex) =>
      (banner.images ?? []).map((image, imageIndex) => {
        const idx = bannerIndex * 10 + imageIndex;
        const priceLabel =
          banner.price && banner.price > 0
            ? `от ${banner.price.toLocaleString('ru-RU')} ₽`
            : '';
        return {
          image,
          title: banner.bannerTitle || `Баннер ${bannerIndex + 1}`,
          subtitle: priceLabel || 'Специальное предложение',
          ctaText: 'Смотреть',
          accentColor: ACCENTS[idx % ACCENTS.length],
        } satisfies IBannerItem;
      }),
    )
    .slice(0, 12);
}

export type HeroSlide = {
  id: number;
  src: string;
  alt: string;
  caption: string;
};

/** bannerV1 API → слайды главного Hero */
export function mapBannerV1ToHeroSlides(banners: Banner[]): HeroSlide[] {
  return banners
    .flatMap((banner, bannerIndex) =>
      (banner.images ?? []).map((src, imageIndex) => ({
        id: bannerIndex * 100 + imageIndex,
        src,
        alt: banner.bannerTitle || `Баннер ${bannerIndex + 1}`,
        caption: banner.bannerTitle || '',
      })),
    )
    .slice(0, 8);
}
