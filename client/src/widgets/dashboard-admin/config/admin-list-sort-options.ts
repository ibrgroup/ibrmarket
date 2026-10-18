import type { AdminSortOption } from '@/shared/lib/admin-sort';

export const ADMIN_ORDER_SORT_OPTIONS: AdminSortOption[] = [
  { value: 'createdAt:desc', label: 'Дата — сначала новые' },
  { value: 'createdAt:asc', label: 'Дата — сначала старые' },
  { value: 'totalAmount:desc', label: 'Сумма — по убыванию' },
  { value: 'totalAmount:asc', label: 'Сумма — по возрастанию' },
  { value: 'order_status:asc', label: 'Статус — А→Я' },
  { value: 'order_status:desc', label: 'Статус — Я→А' },
];

export const ADMIN_PRODUCT_SORT_OPTIONS: AdminSortOption[] = [
  { value: 'createdAt:desc', label: 'Дата — сначала новые' },
  { value: 'createdAt:asc', label: 'Дата — сначала старые' },
  { value: 'name:asc', label: 'Название — А→Я' },
  { value: 'name:desc', label: 'Название — Я→А' },
  { value: 'price:desc', label: 'Цена — по убыванию' },
  { value: 'price:asc', label: 'Цена — по возрастанию' },
  { value: 'countInStock:desc', label: 'Остаток — больше сначала' },
  { value: 'countInStock:asc', label: 'Остаток — меньше сначала' },
  { value: 'brand:asc', label: 'Бренд — А→Я' },
  { value: 'brand:desc', label: 'Бренд — Я→А' },
];

export const ADMIN_USER_SORT_OPTIONS: AdminSortOption[] = [
  { value: 'createdAt:desc', label: 'Регистрация — сначала новые' },
  { value: 'createdAt:asc', label: 'Регистрация — сначала старые' },
  { value: 'name:asc', label: 'Имя — А→Я' },
  { value: 'name:desc', label: 'Имя — Я→А' },
  { value: 'email:asc', label: 'Email — А→Я' },
  { value: 'email:desc', label: 'Email — Я→А' },
  { value: 'role:asc', label: 'Роль — А→Я' },
  { value: 'role:desc', label: 'Роль — Я→А' },
];

export const ADMIN_AUDIT_SORT_OPTIONS: AdminSortOption[] = [
  { value: 'createdAt:desc', label: 'Время — сначала новые' },
  { value: 'createdAt:asc', label: 'Время — сначала старые' },
  { value: 'action:asc', label: 'Действие — А→Я' },
  { value: 'action:desc', label: 'Действие — Я→А' },
];

export const ADMIN_CATEGORY_SORT_OPTIONS: AdminSortOption[] = [
  { value: 'name:asc', label: 'Название — А→Я' },
  { value: 'name:desc', label: 'Название — Я→А' },
];
