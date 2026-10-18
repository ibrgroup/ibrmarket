'use client';

import { cn } from '@/shared/lib/utils';
import Image from 'next/image';
import { type FC } from 'react';

import { A11y, Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { DEFAULT_BANNERS } from '../model/constants';
import type { IBannerItem } from '../model/types';

interface BarsProps {
  banners?: IBannerItem[];
  onBannerClick?: (index: number, banner: IBannerItem) => void;
  autoplayDelay?: number;
}

const BANNER_HEIGHT = 160;

/**
 * Яркие компактные e-commerce баннеры с автопрокруткой, прогресс-баром и параллакс эффектами
 */
export const Bars: FC<BarsProps> = ({ banners, onBannerClick, autoplayDelay = 5000 }) => {
  const items = banners?.length ? banners : DEFAULT_BANNERS;

  const accentColors = {
    orange: 'from-orange-500 to-red-500',
    pink: 'from-pink-500 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
  };

  if (!items.length) return null;

  return (
    <section className="relative w-full py-3 px-4 mb-2 md:px-0 select-none ">
      {/* Swiper Carousel */}
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        slidesPerView={1}
        spaceBetween={16}
        observer
        observeParents
        updateOnWindowResize
        loop={items.length > 1}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'bars-swiper-bullet',
          bulletActiveClass: 'bars-swiper-bullet-active',
          el: '.swiper-bars-pagination',
        }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
        }}
        className="w-full"
      >
        {items.map((banner, idx) => (
          <SwiperSlide key={idx}>
            <div
              className={cn(
                'relative rounded-3xl overflow-hidden',
                'transition-all duration-300 cursor-pointer group',
                '',
              )}
              style={{ height: `${BANNER_HEIGHT}px` }}
              onClick={() => onBannerClick && onBannerClick(idx, banner)}
              role="button"
              tabIndex={0}
            >
              {banner.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  unoptimized
                />
              ) : null}
              <div
                className={cn(
                  'absolute inset-0',
                  banner.image ? 'opacity-55' : 'opacity-60',
                  banner.accentColor ? accentColors[banner.accentColor] : accentColors.orange,
                )}
              />

              {/* Content */}
              <div className="relative z-10 flex h-full items-center justify-between px-6">
                <div className="flex-1">
                  {banner.badge && (
                    <span className="inline-block px-3 py-1 mb-2 text-xs font-bold bg-white text-orange-600 rounded-full">
                      {banner.badge}
                    </span>
                  )}

                  {banner.discount && (
                    <div className="absolute top-4 right-4 text-black font-black text-2xl px-4 py-2 rounded-xl rotate-12 shadow-xl">
                      {banner.discount}
                    </div>

                  )}

                  {/* <h3 className="text-white text-2xl font-roboto md:text-3xl font-black mb-1 drop-shadow-lg">
                    {banner.title}
                  </h3>
                  <p className="text-white font-roboto text-sm md:text-base font-semibold mb-3">
                    {banner.subtitle}
                  </p> */}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="swiper-bars-pagination flex justify-center gap-2" />
    </section>
  );
};

export default Bars;
