'use client';

import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { useSyncExternalStore } from 'react';
import { DesktopCatalogMegaPanel } from './DesktopCatalogMegaPanel';
import { MobileCatalog } from './MobileCatalog';

export interface CatalogOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * `_id` категории для предвыбора (используется в /products фильтрах)
   */
  initialCategory?: string;
}

function subscribeMax767(callback: () => void) {
  const mq = window.matchMedia('(max-width: 767px)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMax767Snapshot() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function getMax767ServerSnapshot() {
  return false;
}

/** Отступ снизу под нижнюю панель (см. MobileBottomNav: h-16 + safe-area) */
const MOBILE_NAV_BOTTOM = 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]';
const MOBILE_NAV_MAX_H = 'max-h-[calc(100dvh-4rem-env(safe-area-inset-bottom,0px))]';

export function CatalogOverlay({ isOpen, onClose, initialCategory }: CatalogOverlayProps) {
  const narrow = useSyncExternalStore(subscribeMax767, getMax767Snapshot, getMax767ServerSnapshot);

  if (!isOpen) return null;

  return (
    <>
      {narrow ? (
        <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
          <DialogContent
            showCloseButton={false}
            overlayClassName={cn('z-[200] bg-background inset-x-0 top-0', MOBILE_NAV_BOTTOM)}
            className={cn(
              'p-0 overflow-hidden gap-0',
              // Выше TopBar (z-[60]); снизу — полоса под нижнюю навигацию
              'fixed inset-x-0 top-0 z-[200] flex w-full max-w-full translate-x-0 translate-y-0 flex-col border-0 shadow-lg',
              MOBILE_NAV_BOTTOM,
              MOBILE_NAV_MAX_H,
              'data-[state=open]:animate-in data-[state=closed]:animate-out  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
            )}
          >
            <DialogTitle className="sr-only">Каталог товаров</DialogTitle>
            <MobileCatalog initialCategory={initialCategory} onClose={onClose} />
          </DialogContent>
        </Dialog>
      ) : (
        <DesktopCatalogMegaPanel initialCategory={initialCategory} onClose={onClose} />
      )}
    </>
  );
}
