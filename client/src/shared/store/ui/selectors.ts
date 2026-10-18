import type { UIStore } from './types';

/**
 * Селекторы для UI Store
 * Используйте эти селекторы для оптимизации производительности
 */
export const uiSelectors = {
  // Panels
  panels: (state: UIStore) => state.panels,
  isCartPanelOpen: (state: UIStore) => state.panels.cart,
  isFilterPanelOpen: (state: UIStore) => state.panels.filter,
  isMobileMenuOpen: (state: UIStore) => state.panels.mobileMenu,

  // Modals
  modals: (state: UIStore) => state.modals,
  productModal: (state: UIStore) => state.modals.product,
  quickViewModal: (state: UIStore) => state.modals.quickView,

  // Search
  search: (state: UIStore) => state.search,
  isSearchOpen: (state: UIStore) => state.search.isOpen,

  // Actions
  actions: (state: UIStore) => state.actions,
  panelActions: (state: UIStore) => state.actions.panels,
  modalActions: (state: UIStore) => state.actions.modals,
  searchActions: (state: UIStore) => state.actions.search,

  // Combined selectors
  cartPanel: (state: UIStore) => ({
    isOpen: state.panels.cart,
    actions: state.actions.panels.cart,
  }),
  filterPanel: (state: UIStore) => ({
    isOpen: state.panels.filter,
    actions: state.actions.panels.filter,
  }),
  mobileMenu: (state: UIStore) => ({
    isOpen: state.panels.mobileMenu,
    actions: state.actions.panels.mobileMenu,
  }),
  productModalWithActions: (state: UIStore) => ({
    ...state.modals.product,
    actions: state.actions.modals.product,
  }),
  quickViewModalWithActions: (state: UIStore) => ({
    ...state.modals.quickView,
    actions: state.actions.modals.quickView,
  }),
  searchWithActions: (state: UIStore) => ({
    ...state.search,
    actions: state.actions.search,
  }),

  // All panels closed
  areAllPanelsClosed: (state: UIStore) =>
    !state.panels.cart && !state.panels.filter && !state.panels.mobileMenu && !state.search.isOpen && !state.modals.product.isOpen && !state.modals.quickView.isOpen,
};
