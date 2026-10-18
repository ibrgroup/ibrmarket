'use client';

import type { Category } from '@/entities/category/model/types';
import { cn } from '@/shared/lib/utils';
import { AiOutlineAppstore } from 'react-icons/ai';

type CategoryIconProps = {
  category: Category;
  size?: number;
  className?: string;
};

export function CategoryIcon({ category, size = 24, className }: CategoryIconProps) {
  const src = category.images?.[0];

  if (src) {
    return (
      <img
        src={src}
        alt={src}
        width={size}
        height={size}
        className={cn('rounded-md overflow-hidden object-cover shrink-0', className)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <AiOutlineAppstore size={size} aria-hidden className={cn('text-primary shrink-0', className)} />
  );
}
