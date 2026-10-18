/**
 * Интерфейс бренда для фильтрации
 */
export interface Brand {
  /** Уникальный идентификатор бренда (slug) */
  value: string;
  /** Отображаемое название бренда */
  label: string;
  /** Количество продуктов этого бренда */
  count: number;
  /** URL логотипа бренда (опционально) */
  logo?: string;
}

/**
 * Ответ API со списком брендов
 */
export interface BrandsResponse {
  brands: Brand[];
  total: number;
}
