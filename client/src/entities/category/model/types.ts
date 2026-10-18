// Типы для сущности Category
export interface Category {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  icon?: any; // Для mock данных
}

export interface CategoryListProps {
  categories: Category[];
  className?: string;
}
