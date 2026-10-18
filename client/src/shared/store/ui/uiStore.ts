import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { UIStore } from './types';

/**
 * Начальное состояние UI Store
 */
const INITIAL_STATE: Pick<UIStore, 'panels' | 'modals' | 'search'> = {
  panels: {
    cart: false,
    filter: false,
    mobileMenu: false,
  },
  modals: {
    product: {
      isOpen: false,
      productId: null,
    },
    quickView: {
      isOpen: false,
      productId: null,
    },
  },
  search: {
    isOpen: false,
  },
};

/**
 * UI Store для управления состоянием UI элементов
 * - Панели (cart, filter, mobileMenu)
 * - Модальные окна (product)
 * - Поиск
 */
export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      actions: {
        panels: {
          cart: {
            open: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, cart: true },
                }),
                false,
                'ui/panels/cart/open',
              ),
            close: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, cart: false },
                }),
                false,
                'ui/panels/cart/close',
              ),
            toggle: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, cart: !state.panels.cart },
                }),
                false,
                'ui/panels/cart/toggle',
              ),
          },
          filter: {
            open: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, filter: true },
                }),
                false,
                'ui/panels/filter/open',
              ),
            close: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, filter: false },
                }),
                false,
                'ui/panels/filter/close',
              ),
            toggle: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, filter: !state.panels.filter },
                }),
                false,
                'ui/panels/filter/toggle',
              ),
          },
          mobileMenu: {
            open: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, mobileMenu: true },
                }),
                false,
                'ui/panels/mobileMenu/open',
              ),
            close: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, mobileMenu: false },
                }),
                false,
                'ui/panels/mobileMenu/close',
              ),
            toggle: () =>
              set(
                (state) => ({
                  panels: { ...state.panels, mobileMenu: !state.panels.mobileMenu },
                }),
                false,
                'ui/panels/mobileMenu/toggle',
              ),
          },
        },
        modals: {
          product: {
            open: (productId: string) =>
              set(
                (state) => ({
                  modals: {
                    ...state.modals,
                    product: { isOpen: true, productId },
                  },
                }),
                false,
                'ui/modals/product/open',
              ),
            close: () =>
              set(
                (state) => ({
                  modals: {
                    ...state.modals,
                    product: { isOpen: false, productId: null },
                  },
                }),
                false,
                'ui/modals/product/close',
              ),
          },
          quickView: {
            open: (productId: string) =>
              set(
                (state) => ({
                  modals: {
                    ...state.modals,
                    quickView: { isOpen: true, productId },
                  },
                }),
                false,
                'ui/modals/quickView/open',
              ),
            close: () =>
              set(
                (state) => ({
                  modals: {
                    ...state.modals,
                    quickView: { isOpen: false, productId: null },
                  },
                }),
                false,
                'ui/modals/quickView/close',
              ),
          },
        },
        search: {
          open: () =>
            set(
              (state) => ({
                search: { ...state.search, isOpen: true },
              }),
              false,
              'ui/search/open',
            ),
          close: () =>
            set(
              (state) => ({
                search: { ...state.search, isOpen: false },
              }),
              false,
              'ui/search/close',
            ),
          toggle: () =>
            set(
              (state) => ({
                search: { ...state.search, isOpen: !state.search.isOpen },
              }),
              false,
              'ui/search/toggle',
            ),
        },
      },
    }),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
);
