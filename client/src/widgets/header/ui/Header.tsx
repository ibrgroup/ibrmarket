'use client';

import { selectCartTotalUnits, useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth-modal';
import { SearchBar } from '@/features/product-search';
import { hasDashboardAccess } from '@/shared/lib/user-roles';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/ui/hover-card';
import { Separator } from '@/shared/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { useCatalogOverlayStore } from '@/widgets/catalog-overlay';
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FC, useEffect, useMemo, useState } from 'react';
import { BsFillBoxSeamFill } from 'react-icons/bs';
import { FaBasketShopping } from 'react-icons/fa6';
import type { HeaderProps } from '../model/types';
import { MobileHeader } from './MobileHeader';

const Header: FC<HeaderProps> = ({
  className = '',
  mode = 'full',
  variant = 'default',
  showTopBar = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const catalogOpen = useCatalogOverlayStore((s) => s.open);
  const toggleCatalog = useCatalogOverlayStore((s) => s.toggleCatalog);

  const categoryFromUrl = pathname.startsWith('/products')
    ? (searchParams.get('category') ?? undefined)
    : undefined;

  const cartItemsCount = useCartStore(selectCartTotalUnits);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const { user, isAuthenticated, isInitialized, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const displayName = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    return user.name || null;
  }, [isAuthenticated, user]);

  const onBlueShell = variant === 'embedded';

  useEffect(() => {
    const handler = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const headerClasses = useMemo(
    () =>
      cn(
        'sticky top-0 w-full rounded-b-3xl border-b border-border/40 py-2 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out',
        isScrolled
          ? 'bg-background/85 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:bg-background/75'
          : 'bg-background/95 dark:bg-background/90',
        className,
      ),
    [isScrolled, className],
  );

  const mobileHeader =
    variant === 'embedded' ? null : mode === 'hidden' ? null : mode === 'search-only' ? (
      <MobileHeader mode="search-only" />
    ) : (
      <MobileHeader mode="full" showTopBar={showTopBar} />
    );

  const navActionBtnClass = cn(
    'relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring',
    onBlueShell
      ? 'text-white hover:bg-white/15'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-primary',
  );

  const navLabelClass = cn(
    'line-clamp-1 w-full text-center text-[11px] leading-none',
    onBlueShell ? 'text-white/95' : 'text-muted-foreground',
  );

  const navItemClass = 'flex w-[4.5rem] flex-col items-center gap-1';

  const badgeClass =
    'absolute -right-1 -top-0.5 flex dark:text-[#f2f2f2] h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1 py-0 text-[10px] font-bold leading-none text-white';

  const desktopNav = (
    <div
      className={cn(
        'w-full bg-transparent',
        onBlueShell ? 'px-4 md:px-5' : 'max-container mx-auto px-4 md:px-6',
      )}
    >
      <nav
        className={cn(
          'flex items-center justify-between ',
          onBlueShell ? 'min-h-[64px]' : 'min-h-[52px] sm:min-h-[56px]',
        )}
        aria-label="Главная навигация"
      >
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="group outline-none hidden flex-shrink-0 md:flex"
            tabIndex={0}
            aria-label="На главную"
          >
            <img
              width={180}
              src="/logo.png"
              alt="IBR Market"
              className="h-auto max-h-9 w-auto object-contain"
            />
          </Link>
          <div className="hidden sm:block">
            <Button
              type="button"
              aria-label={catalogOpen ? 'Закрыть каталог' : 'Открыть каталог'}
              aria-pressed={catalogOpen}
              aria-expanded={catalogOpen}
              className={cn(
                'group flex h-12 text-md items-center gap-2.5 dark:bg-[#f2f2f2] rounded-xl px-4 font-medium transition-all duration-300 ease-out focus:ring-2 focus:outline-none',
                onBlueShell
                  ? cn(
                      'bg-white text-indigo-600 hover:bg-white/90 focus:ring-white/40',
                      catalogOpen &&
                        'bg-indigo-500 text-white hover:bg-indigo-500/95 ring-1 ring-white/70',
                    )
                  : cn(
                      'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/45',
                      catalogOpen &&
                        'bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/80 ring-offset-1 ring-offset-primary',
                    ),
              )}
              onClick={() => toggleCatalog(categoryFromUrl)}
            >
              <span
                className="relative flex size-5 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out',
                    catalogOpen ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
                  )}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <X
                  className={cn(
                    'absolute size-5 transition-all duration-300 ease-out',
                    catalogOpen
                      ? 'scale-100 rotate-0 opacity-100'
                      : 'scale-50 -rotate-90 opacity-0',
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
              </span>
              <span className="flex items-center gap-1 font-semibold">Каталог</span>
            </Button>
          </div>
        </div>

        <div className="relative mx-2 hidden min-w-0 flex-1 sm:block md:mx-6">
          <SearchBar
            key={pathname.startsWith('/search') ? `q-${searchParams?.get('q') ?? ''}` : 'default'}
            initialValue={pathname.startsWith('/search') ? (searchParams?.get('q') ?? '') : ''}
          />
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex shrink-0 items-end gap-0.5 sm:gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={navItemClass}>
                  <button
                    type="button"
                    className={navActionBtnClass}
                    aria-label="Избранное"
                    
                    onClick={() => router.push('/wishlist')}
                  >
                    <span className="sr-only ">Избранное</span>
                    <svg
                      color="currentColor"
                      className={cn('size-[22px]', onBlueShell && 'text-white dark:text-[#f2f2f2]')}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                    >
                      <path
                        fill="currentColor"
                        d="M2.933 5.215C5.236 2.991 8.805 3.718 12 6.5c3.195-2.782 6.764-3.415 9.067-1.19 2.582 2.493 1.517 7.32-1.936 10.895-2.2 2.278-4.838 4.12-7.131 4.89V21c-2.293-.77-4.931-2.612-7.131-4.89C1.416 12.535.35 7.709 2.933 5.215"
                      />
                    </svg>
                    {wishlistCount > 0 && (
                      <Badge
                        variant="default"
                        className={badgeClass}
                        title={`Избранное: ${wishlistCount}`}
                      >
                        {wishlistCount}
                      </Badge>
                    )}
                  </button>
                  <span className={`${navLabelClass} dark:text-[#f2f2f2]`}>Избранное</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Перейти в избранное</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className={navItemClass}>
                  <button
                    type="button"
                    className={navActionBtnClass}
                    aria-label="Мои заказы"
                    onClick={() => router.push('/my-orders')}
                  >
                    <span className="sr-only">Заказы</span>
                    <BsFillBoxSeamFill
                      className={cn('size-5', onBlueShell ? 'text-white dark:text-[#f2f2f2]' : 'text-current')}
                    />
                  </button>
                  <span className={`${navLabelClass} dark:text-[#f2f2f2]`}>Заказы</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">История и статусы заказов</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className={navItemClass}>
                  <button
                    type="button"
                    className={navActionBtnClass}
                    aria-label="Корзина"
                    onClick={() => router.push('/cart')}
                  >
                    <FaBasketShopping
                      className={cn('size-5', onBlueShell ? 'text-white dark:text-[#f2f2f2]' : 'text-current')}
                    />
                    {cartItemsCount > 0 && (
                      <Badge
                        variant="default"
                        className={badgeClass}
                        title={`В корзине: ${cartItemsCount}`}
                      >
                        {cartItemsCount}
                      </Badge>
                    )}
                  </button>
                  <span className={`${navLabelClass} dark:text-[#f2f2f2]`}>Корзина</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Открыть корзину</TooltipContent>
            </Tooltip>

            {isAuthenticated && user && isInitialized ? (
              <HoverCard openDelay={80} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <Link
                    href="/my-account"
                    className={cn(
                      navItemClass,
                      'group cursor-pointer rounded-md border-0 bg-transparent p-0 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    aria-label="Перейти в личный кабинет"
                    aria-haspopup="dialog"
                  >
                    <Avatar
                      className={cn(
                        'h-9 w-9 shadow-sm transition-[border-color,box-shadow]',
                        onBlueShell
                          ? 'border-2 border-white/45 group-hover:border-white/80'
                          : 'border-2 border-primary/30 group-hover:border-primary/50',
                      )}
                    >
                      <AvatarImage
                        src={user?.avatar}
                        alt={displayName || 'Профиль'}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-violet-600 text-xs font-semibold text-white">
                        {(displayName?.split(' ') ?? [])
                          .map((part: string) => part[0]?.toUpperCase())
                          .join('')
                          .slice(0, 2) || '—'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`${navLabelClass} dark:text-[#f2f2f2]`}>Профиль</span>
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 p-2 border-none rounded-2xl shadow-2xs" align="end" side="bottom" sideOffset={10}>
                  <div className="space-y-1">
                    <p className="truncate px-2 text-sm font-semibold">{displayName}</p>
                    {user.email ? (
                      <p className="text-muted-foreground truncate px-2 text-xs">{user.email}</p>
                    ) : null}
                    <Separator className="my-2" />
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/my-account">
                        <UserRound className="size-4" />
                        Личный кабинет
                      </Link>
                    </Button>
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/messages">
                        <MessageCircle className="size-4" />
                        Сообщения
                      </Link>
                    </Button>
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/messages?to=owner">
                        <Store className="size-4" />
                        Написать владельцу
                      </Link>
                    </Button>
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/purchases">
                        <ShoppingBag className="size-4" />
                        Мои покупки
                      </Link>
                    </Button>
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/my-account?tab=addresses">
                        <MapPin className="size-4" />
                        Адреса доставки
                      </Link>
                    </Button>
                    <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2" asChild>
                      <Link href="/settings">
                        <Settings className="size-4" />
                        Настройки
                      </Link>
                    </Button>
                    {hasDashboardAccess(user.role) ? (
                      <Button
                        variant="ghost"
                        className="h-9 w-full justify-start gap-2 px-2"
                        asChild
                      >
                        <Link href="/dashboard">
                          <LayoutDashboard className="size-4" />
                          Панель магазина
                        </Link>
                      </Button>
                    ) : null}
                    <Separator className="my-1" />
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive h-9 w-full justify-start gap-2 px-2"
                      type="button"
                      onClick={() => void logout()}
                    >
                      <LogOut className="size-4" />
                      Выйти
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(navItemClass, 'hidden sm:flex')}>
                    <Button
                      variant={onBlueShell ? 'secondary' : 'default'}
                      size="sm"
                      aria-label="Войти в аккаунт"
                      onClick={() => openAuthModal()}
                      className={cn(
                        'h-9 shrink-0 px-4 text-sm font-medium',
                        onBlueShell && 'bg-white text-indigo-600 dark:bg-[#f2f2f2] hover:bg-white/90',
                      )}
                    >
                      Войти
                    </Button>
                    <span className={`${navLabelClass} dark:text-[#f2f2f2]`}>Аккаунт</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Вход по телефону или email</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </nav>
    </div>
  );

  if (variant === 'mobile-only') {
    return <>{mobileHeader}</>;
  }

  if (variant === 'embedded') {
    // measure на shell — здесь только внутренние отступы, чтобы подписи не прилипали к краю
    return <header className={cn('py-1', className)}>{desktopNav}</header>;
  }

  return (
    <>
      {mobileHeader}
      <header data-site-chrome-measure className={cn(headerClasses, 'hidden md:block', className)}>
        {desktopNav}
      </header>
    </>
  );
};

export default Header;
