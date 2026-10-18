'use client';

import { selectCartTotalUnits, useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth-modal';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { useCatalogOverlayStore } from '@/widgets/catalog-overlay';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';
import { FiGrid, FiHeart, FiHome, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';

/**
 * Тип для элемента навигации
 */
interface NavItem {
  id: string;
  label: string;
  icon: typeof FiHome;
  href: string;
  badge?: number;
  requiresAuth?: boolean;
  /** Открыть оверлей каталога вместо перехода по href */
  openCatalog?: boolean;
}

/**
 * Компонент нижней мобильной навигации
 *
 * @description Отображается только на мобильных устройствах (< 768px)
 * @features
 * - Фиксированная позиция внизу экрана
 * - Индикаторы активной страницы
 * - Счетчики для корзины и избранного
 * - Плавные анимации и переходы
 * - Поддержка темной темы
 */
export const MobileBottomNav: FC = () => {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const catalogOpen = useCatalogOverlayStore((s) => s.open);
  const toggleCatalog = useCatalogOverlayStore((s) => s.toggleCatalog);

  const categoryFromUrl = pathname.startsWith('/products')
    ? (searchParams.get('category') ?? undefined)
    : undefined;

  // Получаем количество товаров в корзине и избранном
  const cartItemsCount = useCartStore(selectCartTotalUnits);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  /**
   * Конфигурация элементов навигации
   */
  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Главная',
        icon: FiHome,
        href: '/',
      },
      {
        id: 'catalog',
        label: 'Каталог',
        icon: FiGrid,
        href: '/catalog',
        openCatalog: true,
      },
      {
        id: 'cart',
        label: 'Корзина',
        icon: FiShoppingCart,
        href: '/cart',
        badge: cartItemsCount,
      },
      {
        id: 'wishlist',
        label: 'Избранное',
        icon: FiHeart,
        href: '/wishlist',
        badge: wishlistCount,
      },
      {
        id: 'profile',
        label: isAuthenticated ? 'Профиль' : 'Войти',
        icon: FiUser,
        href: '/my-account',
      },
    ],
    [cartItemsCount, wishlistCount, isAuthenticated],
  );

  /**
   * Проверяет, является ли путь активным
   */
  const isActive = useCallback(
    (href: string, openCatalog?: boolean) => {
      if (openCatalog) {
        return catalogOpen;
      }
      if (href === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(href);
    },
    [pathname, catalogOpen],
  );

  /**
   * Обработчик клика по элементу навигации
   */
  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.openCatalog) {
        toggleCatalog(categoryFromUrl);
        return;
      }
      if (item.id === 'profile' && !isAuthenticated) {
        openAuthModal();
        return;
      }
      if (item.href === pathname) return;
      router.push(item.href);
    },
    [router, toggleCatalog, categoryFromUrl, pathname, isAuthenticated, openAuthModal],
  );

  return (
    <>
      {/* Отступ под «плавающую» панель + safe area */}
      <div
        className="h-[calc(5.25rem+env(safe-area-inset-bottom,0px))] shrink-0 md:hidden"
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed inset-x-0 bottom-[-0.2rem] md:hidden',
          'pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] px-3 pt-1.5',
          'pointer-events-none',
          catalogOpen ? 'z-[210]' : 'z-50',
        )}
      >
        <nav
          className={cn(
            'mobile-bottom-nav pointer-events-auto',
            'animate-in slide-in-from-bottom-4 fade-in duration-300',
            'mx-auto w-full max-w-md rounded-[1.35rem]',
            'border border-border/70 bg-background shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.06)_inset]',
            'dark:border-white/[0.08] dark:bg-background dark:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]',
          )}
          role="navigation"
          aria-label="Мобильная навигация"
        >
          <div className="flex h-[3.625rem] items-stretch gap-0.5 px-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.openCatalog);
              const isCatalog = item.id === 'catalog';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'mobile-nav-item group cursor-pointer relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center',
                    'rounded-2xl px-1 py-1 transition-[color,transform] duration-200 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-muted-foreground hover:text-foreground active:text-foreground',
                  )}
                  aria-label={
                    isCatalog ? (catalogOpen ? 'Закрыть каталог' : 'Открыть каталог') : item.label
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'absolute inset-x-0.5 inset-y-0.5 -z-0 rounded-[0.85rem] transition-all duration-200 ease-out',
                      active
                        ? 'bg-indigo-500/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-indigo-400/[0.18]'
                        : 'bg-transparent group-hover:bg-muted/55 group-active:bg-muted/75',
                    )}
                    aria-hidden="true"
                  />

                  <span className="relative z-10 flex flex-col items-center gap-0.5">
                    <span className="relative inline-flex">
                      {isCatalog ? (
                        <span
                          className="relative inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center"
                          aria-hidden="true"
                        >
                          <FiGrid
                            className={cn(
                              'absolute h-[1.375rem] w-[1.375rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.45,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0',
                              catalogOpen
                                ? 'scale-50 rotate-90 opacity-0'
                                : 'scale-100 rotate-0 opacity-100 group-hover:scale-110',
                            )}
                            strokeWidth={2}
                          />
                          <FiX
                            className={cn(
                              'absolute h-[1.375rem] w-[1.375rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.45,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0',
                              catalogOpen
                                ? 'scale-100 rotate-0 opacity-100'
                                : 'scale-50 -rotate-90 opacity-0',
                            )}
                            strokeWidth={2.35}
                          />
                        </span>
                      ) : (
                        <Icon
                          className={cn(
                            'h-[1.375rem] w-[1.375rem] transition-transform duration-200 ease-out',
                            active
                              ? 'scale-[1.08]'
                              : 'opacity-90 group-hover:scale-105 group-hover:opacity-100',
                          )}
                          strokeWidth={active ? 2.35 : 2}
                          aria-hidden="true"
                        />
                      )}

                      {item.badge !== undefined && item.badge > 0 ? (
                        <Badge
                          variant="default"
                          className={cn(
                            'absolute -top-2 -right-2.5 flex h-[1.125rem] min-w-[1.125rem] translate-x-px items-center justify-center',
                            'rounded-full px-1 tabular-nums text-[10px] font-bold leading-none',
                            'border-2 border-background shadow-sm',
                            'animate-in zoom-in-95 fade-in duration-200',
                            item.id === 'cart'
                              ? 'bg-pink-500 dark:text-[#f2f2f2] text-white dark:bg-pink-500'
                              : 'bg-pink-500 dark:text-[#f2f2f2]   text-white dark:bg-pink-500',
                          )}
                          aria-label={
                            item.id === 'cart'
                              ? `${item.badge} товаров в корзине`
                              : item.id === 'wishlist'
                                ? `${item.badge} товаров в избранном`
                                : `${item.badge}`
                          }
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      ) : null}
                    </span>

                    <span
                      className={cn(
                        'max-w-full truncate text-[10px] leading-tight tracking-tight transition-[font-weight,opacity,transform] duration-300',
                        active
                          ? 'font-semibold opacity-100'
                          : 'font-medium opacity-80 group-hover:opacity-100',
                      )}
                    >
                      {isCatalog && catalogOpen ? 'Закрыть' : item.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
