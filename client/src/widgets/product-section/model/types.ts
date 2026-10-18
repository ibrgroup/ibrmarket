// Типы для ProductSection widget
export interface ProductSectionProps {
  title: string;
  products: import("@/entities/product").Product[];
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  loading?: boolean;
  error?: string | null;
}

export interface ProductSectionState {
  loading: boolean;
  error: string | null;
  products: import("@/entities/product").Product[];
}
