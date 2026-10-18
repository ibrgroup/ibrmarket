'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCatalogOverlayStore } from '../model/catalog-overlay-store';
import { CatalogOverlay } from './CatalogOverlay';

/**
 * Глобальный хост оверлея каталога — не привязан к режиму хедера.
 * Нижняя навигация и кнопка «Каталог» в хедере управляют одним zustand-стором.
 */
export function CatalogOverlayHost() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const catalogOpen = useCatalogOverlayStore((s) => s.open);
  const initialCategoryId = useCatalogOverlayStore((s) => s.initialCategoryId);
  const closeCatalog = useCatalogOverlayStore((s) => s.closeCatalog);

  const categoryFromUrl = pathname.startsWith('/products')
    ? (searchParams.get('category') ?? undefined)
    : undefined;
  const catalogInitialCategory = initialCategoryId ?? categoryFromUrl;

  return (
    <CatalogOverlay
      isOpen={catalogOpen}
      onClose={closeCatalog}
      initialCategory={catalogInitialCategory}
    />
  );
}
