/**
 * Типы для сущности User (пользователь)
 */

import type { UserRole } from '@/shared/lib/user-roles';

// Пользователь
export interface User {
  _id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  address?: string;
}

// Адрес доставки (соответствует структуре с бэкенда)
export interface Address {
  _id: string;
  userId: string;
  address_line1: string;
  city: string;
  state?: string;
  pincode: string;
  country: string;
  mobile?: number | null;
  status?: boolean;
  selected?: boolean;
  landmark?: string;
  createdAt?: string;
  updatedAt?: string;
}
