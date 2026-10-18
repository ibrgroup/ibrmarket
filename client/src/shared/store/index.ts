/**
 * Shared Store Module
 * Публичный API для всех сторов в shared слое
 *
 * Импорты организованы по модулям для избежания коллизий имен:
 * - UI Store: useUIStore, uiSelectors, useCartPanel, etc.
 * - Carousel Store: useCarouselStore, carouselSelectors, useCarouselNavigation, etc.
 * - Payment Store: usePaymentStore, paymentSelectors, usePaymentMethods, etc.
 */

// UI Store
export {
  useUIStore,
  uiSelectors,
  useCartPanel,
  useFilterPanel,
  useMobileMenu,
  useProductModal,
  useSearch,
  useAreAllPanelsClosed,
  usePanels,
  useModals,
} from './ui';

export type {
  UIState,
  UIActions,
  UIStore,
  ProductModalState,
  PanelActions,
  ModalActions,
  SearchActions,
} from './ui';

// Carousel Store
export {
  useCarouselStore,
  carouselSelectors,
  useCarouselIndex,
  useCarouselNavigation,
  useCarouselAutoplay,
  useCarouselActions,
  useCarouselState,
  getCarouselState,
  subscribeToCarousel,
} from './carousel';

export type { CarouselState, CarouselActions, CarouselStore } from './carousel';

// Payment Store
export {
  usePaymentStore,
  paymentSelectors,
  usePaymentMethods,
  useTransactions,
  usePaymentSecurity,
  usePaymentStatus,
  usePaymentActions,
  usePaymentState,
} from './payment';

export type {
  PaymentState,
  PaymentActions,
  PaymentStore,
  PaymentMethod,
  Transaction,
  PaymentSecuritySettings,
  AddPaymentMethodRequest,
} from './payment';

// Re-export для обратной совместимости
export { useCartStore } from '@/entities/cart';
export { useWishlistStore } from '@/entities/wishlist';
export { useUserStore } from '@/features/auth';
export { useNotificationStore } from '@/features/notifications';
