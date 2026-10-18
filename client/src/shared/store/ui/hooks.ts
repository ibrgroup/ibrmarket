import { useShallow } from 'zustand/react/shallow';

import { useUIStore } from './uiStore';
import { uiSelectors } from './selectors';

/**
 * Хуки для работы с UI Store
 * Предоставляют удобные способы доступа к состоянию и действиям
 */

/**
 * Хук для работы с панелью корзины
 * Использует useShallow для предотвращения бесконечных обновлений
 */
export const useCartPanel = () => {
  return useUIStore(useShallow(uiSelectors.cartPanel));
};

/**
 * Хук для работы с панелью фильтров
 * Использует useShallow для предотвращения бесконечных обновлений
 */
export const useFilterPanel = () => {
  return useUIStore(useShallow(uiSelectors.filterPanel));
};

/**
 * Хук для работы с мобильным меню
 */
export const useMobileMenu = () => {
  return useUIStore(
    useShallow(uiSelectors.mobileMenu)
  );
};

/**
 * Хук для работы с модальным окном продукта
 * Использует useShallow для предотвращения бесконечных обновлений
 */
export const useProductModal = () => {
  return useUIStore(useShallow(uiSelectors.productModalWithActions));
};

/**
 * Хук для работы с Quick View модалкой
 * Использует useShallow для предотвращения бесконечных обновлений
 */
export const useQuickViewModal = () => {
  return useUIStore(useShallow(uiSelectors.quickViewModalWithActions));
};

/**
 * Хук для работы с поиском
 * Использует useShallow для предотвращения бесконечных обновлений
 */
export const useSearch = () => {
  return useUIStore(useShallow(uiSelectors.searchWithActions));
};

/**
 * Хук для проверки, закрыты ли все панели
 */
export const useAreAllPanelsClosed = () => {
  return useUIStore(uiSelectors.areAllPanelsClosed);
};

/**
 * Хук для получения всех панелей (оптимизирован с useShallow)
 */
export const usePanels = () => {
  return useUIStore(
    useShallow(state => ({
      panels: state.panels,
      actions: state.actions.panels,
    }))
  );
};

/**
 * Хук для получения всех модальных окон (оптимизирован с useShallow)
 */
export const useModals = () => {
  return useUIStore(
    useShallow(state => ({
      modals: state.modals,
      actions: state.actions.modals,
    }))
  );
};
