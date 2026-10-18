/**
 * UI Store Module
 * Публичный API для работы с UI состоянием
 */

// Store
export { useUIStore } from './uiStore';

// Types
export type {
  UIState,
  UIActions,
  UIStore,
  ProductModalState,
  PanelActions,
  ModalActions,
  SearchActions,
} from './types';

// Selectors
export { uiSelectors } from './selectors';

// Hooks
export {
  useCartPanel,
  useFilterPanel,
  useMobileMenu,
  useProductModal,
  useSearch,
  useAreAllPanelsClosed,
  usePanels,
  useModals,
} from './hooks';
