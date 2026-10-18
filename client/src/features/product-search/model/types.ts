/**
 * Типы для feature/product-search
 */

export interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
}

export interface SearchBarProps {
  className?: string;
  placeholder?: string;
  showSearchButton?: boolean;
  showImageSearch?: boolean;
  autoFocus?: boolean;
  /** Начальное значение (например, q из URL на /search) */
  initialValue?: string;
  onSearch?: (query: string) => void;
}
