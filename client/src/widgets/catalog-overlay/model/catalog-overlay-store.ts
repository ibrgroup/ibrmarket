'use client';

import { create } from 'zustand';

type CatalogOverlayState = {
  open: boolean;
  initialCategoryId?: string;
  openCatalog: (initialCategoryId?: string) => void;
  closeCatalog: () => void;
  /** Открыть/закрыть; при открытии можно передать id категории (например из URL). */
  toggleCatalog: (initialCategoryIdWhenOpening?: string) => void;
};

export const useCatalogOverlayStore = create<CatalogOverlayState>((set) => ({
  open: false,
  initialCategoryId: undefined,
  openCatalog: (initialCategoryId) => set({ open: true, initialCategoryId }),
  closeCatalog: () => set({ open: false, initialCategoryId: undefined }),
  toggleCatalog: (initialCategoryIdWhenOpening) =>
    set((s) =>
      s.open
        ? { open: false, initialCategoryId: undefined }
        : { open: true, initialCategoryId: initialCategoryIdWhenOpening },
    ),
}));
