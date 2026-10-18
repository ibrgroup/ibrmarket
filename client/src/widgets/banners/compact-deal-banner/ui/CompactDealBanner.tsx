'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { FC } from 'react';
import { DEFAULT_DEALS } from '../model/constants';
import type { ICompactDealBannerProps } from '../model/types';

export const CompactDealBanner: FC<ICompactDealBannerProps> = ({ deals, onDealClick }) => {
  const items = deals?.length ? deals : DEFAULT_DEALS;

  return (
    <section className="w-full py-6">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((deal) => (
            <div
              key={deal.id}
              className="relative h-[160px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              onClick={() => onDealClick?.(deal)}
            >
              <Image
                src={deal.image || '/placeholder.svg'}
                alt={deal.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              <div className={cn('absolute inset-0 bg-gradient-to-r opacity-80', deal.color)} />

              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <span className="text-white/90 text-xs font-bold uppercase tracking-wider">
                      Специально для вас
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1 drop-shadow-lg">
                    {deal.title}
                  </h3>
                  <p className="text-white/90 text-sm font-semibold">{deal.subtitle}</p>
                </div>

                <Button
                  className="bg-white text-gray-900 hover:bg-white/90 font-bold w-full shadow-xl group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  {deal.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompactDealBanner;
