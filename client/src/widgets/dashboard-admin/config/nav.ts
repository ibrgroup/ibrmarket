import type { AdminDashboardSegment } from '@/shared/lib/admin-permissions';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Users,
} from 'lucide-react';

export type AdminNavSegment = AdminDashboardSegment;

export type AdminNavGroup = 'main' | 'shop' | 'clients' | 'system';

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string> = {
  main: 'Главное',
  shop: 'Магазин',
  clients: 'Клиенты',
  system: 'Система',
};

export type AdminNavItem = {
  segment: AdminNavSegment;
  href: string;
  label: string;
  /** Shown on the overview hub as a link card */
  blurb: string;
  icon: LucideIcon;
  group: AdminNavGroup;
  /** Only `/dashboard` is exact — avoid matching every `/dashboard/*` route */
  exact?: boolean;
};

/**
 * Single source of truth for admin IA: sidebar, mobile strip, and overview hub cards.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    segment: 'overview',
    href: '/dashboard',
    label: 'Обзор',
    blurb: 'Сводка и быстрый переход в разделы',
    icon: LayoutDashboard,
    group: 'main',
    exact: true,
  },
  {
    segment: 'catalog',
    href: '/dashboard/catalog',
    label: 'Каталог',
    blurb: 'Товары, категории, баннеры и медиа',
    icon: Package,
    group: 'shop',
  },
  {
    segment: 'orders',
    href: '/dashboard/orders',
    label: 'Заказы',
    blurb: 'Статусы, оплаты и отгрузки',
    icon: ShoppingCart,
    group: 'shop',
  },
  {
    segment: 'users',
    href: '/dashboard/users',
    label: 'Пользователи',
    blurb: 'Роли, блокировки и сессии',
    icon: Users,
    group: 'clients',
  },
  {
    segment: 'support',
    href: '/dashboard/owner-messages',
    label: 'Сообщения покупателей',
    blurb: 'Чаты с владельцем: все обращения пользователей',
    icon: MessageCircle,
    group: 'clients',
  },
  {
    segment: 'audit',
    href: '/dashboard/audit',
    label: 'Журнал',
    blurb: 'Аудит действий администраторов',
    icon: ClipboardList,
    group: 'system',
  },
  {
    segment: 'settings',
    href: '/dashboard/settings',
    label: 'Настройки',
    blurb: 'Интеграции, витрина и флаги',
    icon: Settings,
    group: 'system',
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const ADMIN_OVERVIEW_HINTS = [
  {
    title: 'Маршруты',
    text: 'Каждый раздел — отдельный сегмент маршрута: меньше JS на первом экране и проще вынести админку на другой домен.',
    icon: BarChart3,
  },
  {
    title: 'Доступ',
    text: 'Проверка роли персонала (STAFF) на сервере при наличии cookie на этом хосте; иначе — после загрузки профиля.',
    icon: Shield,
  },
] as const;
