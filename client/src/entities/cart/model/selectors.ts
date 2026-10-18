import type { CartState } from './types';

/** Суммарное количество единиц товара в корзине (как бейдж в шапке). */
export const selectCartTotalUnits = (state: CartState) => state.totalItems;

/** Число отдельных позиций (строк) в корзине. */
export const selectCartLineCount = (state: CartState) => state.items.length;
