'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { FC } from 'react';
import { DEFAULT_CATEGORIES } from '../model/constants';
import type { ICategory } from '../model/types';

interface CategoryBannerProps {
  categories?: ICategory[];
  onCategoryClick?: (category: ICategory) => void;
}

export const CategoryBanner: FC<CategoryBannerProps> = ({ categories, onCategoryClick }) => {
  const items = categories?.length ? categories : DEFAULT_CATEGORIES;

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-gray-900">Популярные категории</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/90 hover:bg-transparent font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Все категории
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
              onClick={() => onCategoryClick?.(category)}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src={category.image || '/placeholder.svg'}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                />
                <div
                  className={cn('absolute inset-0 bg-gradient-to-t', category.color, 'opacity-60')}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                  <h3 className="text-xl font-black mb-1 text-center drop-shadow-lg">
                    {category.name}
                  </h3>
                  <span className="text-xs font-semibold bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    {category.productCount.toLocaleString('ru-RU')} товаров
                  </span>
                </div>
                <div className="absolute inset-0 border-4 border-white/0 group-hover:border-white/80 rounded-2xl transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBanner;
