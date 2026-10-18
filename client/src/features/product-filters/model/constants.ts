import type { FilterState, PriceRange } from './types';

// Константы для пагинации
export const PRODUCTS_PER_PAGE = 20;

// Константы для ценового диапазона
export const PRICE_RANGE: PriceRange = {
  min: 0,
  max: 200000,
  step: 1000,
};

export const DEFAULT_FILTER_STATE: FilterState = {
  categories: [],
  brands: [],
  priceRange: [PRICE_RANGE.min, PRICE_RANGE.max],
  rating: 0,
  inStock: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

export const RATING_OPTIONS = [
  { value: 0, label: 'Любой рейтинг' },
  { value: 4, label: '4+ звезд' },
  { value: 3, label: '3+ звезд' },
  { value: 2, label: '2+ звезд' },
  { value: 1, label: '1+ звезд' },
];

export const SORT_OPTIONS = [
  { value: 'name', label: 'По названию' },
  { value: 'price', label: 'По цене' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'createdAt', label: 'По дате добавления' },
];

export const STOCK_OPTIONS = [
  { value: null, label: 'Все товары' },
  { value: true, label: 'В наличии' },
  { value: false, label: 'Нет в наличии' },
];
