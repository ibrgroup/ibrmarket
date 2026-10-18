'use client';

import { cn } from '@/shared/lib/utils';
import { type FC } from 'react';
import { A11y, Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { DEFAULT_BANNERS } from '../model/constants';
import type { IBannerItem } from '../model/types';

interface MyBarsProps {
  banners?: IBannerItem[];
  onBannerClick?: (index: number, banner: IBannerItem) => void;
  autoplayDelay?: number;
}

const BANNER_HEIGHT = 160;

export const MyBars: FC<MyBarsProps> = ({ banners, onBannerClick, autoplayDelay = 5000 }) => {
  const items = banners?.length ? banners : DEFAULT_BANNERS;

  const accentColors = {
    orange: 'from-orange-500 to-red-500',
    pink: 'from-pink-500 to-purple-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
  };

  if (!items.length) return null;

  return (
    <section>
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
                'relative rounded-3xl overflow-hidden shadow-md',
                'transition-all duration-300 cursor-pointer group',
                'hover:shadow-lg',
              )}
              style={{ height: `${BANNER_HEIGHT}px` }}
              onClick={() => onBannerClick?.(idx, banner)}
              role="button"
              tabIndex={0}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r opacity-60',
                  banner.accentColor ? accentColors[banner.accentColor] : accentColors.orange,
                )}
              />

              <div className="relative z-10 flex h-full items-center justify-between px-6">
                <div className="flex-1">
                  {banner.badge && (
                    <span className="mb-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600 shadow-lg">
                      {banner.badge}
                    </span>
                  )}

                  {banner.discount && (
                    <div className="absolute top-4 right-4 rotate-12 rounded-xl bg-yellow-400 px-4 py-2 text-2xl font-black text-black shadow-xl">
                      {banner.discount}
                    </div>
                  )}
             
                  <h3 className="mb-1 font-roboto text-2xl font-black text-white drop-shadow-lg md:text-3xl">
                    {banner.title}
                  </h3>
                  <p className="mb-3 text-sm font-semibold text-white drop-shadow-md md:text-base">
                    {banner.subtitle}
                  </p>
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

export default MyBars;
