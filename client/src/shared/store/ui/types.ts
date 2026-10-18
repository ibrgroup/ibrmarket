/**
 * Типы для UI Store
 */

/**
 * Состояние модального окна продукта
 */
export interface ProductModalState {
  isOpen: boolean;
  productId: string | null;
}

/**
 * Состояние модального окна быстрого просмотра
 */
export interface QuickViewModalState {
  isOpen: boolean;
  productId: string | null;
}

/**
 * Состояние UI Store
 */
export interface UIState {
  // Panels
  panels: {
    cart: boolean;
    filter: boolean;
    mobileMenu: boolean;
  };

  // Modals
  modals: {
    product: ProductModalState;
    quickView: QuickViewModalState;
  };

  // Search
  search: {
    isOpen: boolean;
  };
}

/**
 * Действия для панелей
 */
export interface PanelActions {
  cart: {
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
  filter: {
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
  mobileMenu: {
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
}

/**
 * Действия для модальных окон
 */
export interface ModalActions {
  product: {
    open: (productId: string) => void;
    close: () => void;
  };
  quickView: {
    open: (productId: string) => void;
    close: () => void;
  };
}

/**
 * Действия для поиска
 */
export interface SearchActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Все действия UI Store, сгруппированные по категориям
 */
export interface UIActions {
  panels: PanelActions;
  modals: ModalActions;
  search: SearchActions;
}

/**
 * Полный тип UI Store с объектом actions
 */
export interface UIStore extends UIState {
  actions: UIActions;
}
