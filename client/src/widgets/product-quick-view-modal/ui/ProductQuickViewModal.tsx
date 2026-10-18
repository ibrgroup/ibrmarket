'use client';

import { ProductQuickView } from '@/features/product-quick-view';
import { useQuickViewModal } from '@/shared/store/ui/hooks';

export function ProductQuickViewModal() {
  const { isOpen, productId, actions } = useQuickViewModal();

  return (
    <ProductQuickView
      isOpen={isOpen}
      onClose={actions.close}
      productId={productId}
    />
  );
}

