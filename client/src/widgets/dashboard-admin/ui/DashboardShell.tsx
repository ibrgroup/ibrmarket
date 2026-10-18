'use client';

import { useAuth } from '@/features/auth';
import { adminMetricsService } from '@/shared/api/services/admin-metrics-service';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { roleLabelRu } from '@/shared/lib/user-roles';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import {
  ADMIN_NAV_GROUP_LABELS,
  isAdminNavActive,
  type AdminNavGroup,
  type AdminNavItem,
  type AdminNavSegment,
} from '@/widgets/dashboard-admin/config/nav';
import { getAdminNavForRole } from '@/widgets/dashboard-admin/lib/admin-nav-for-role';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminCommandPalette } from './AdminCommandPalette';

const NAV_GROUP_ORDER: AdminNavGroup[] = ['main', 'shop', 'clients', 'system'];
const SIDEBAR_COLLAPSED_KEY = 'ibr-admin-sidebar-collapsed';

function formatBadgeCount(n: number): string {
  return n > 99 ? '99+' : String(n);
}

function userInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function groupNavItems(items: AdminNavItem[]): { group: AdminNavGroup; items: AdminNavItem[] }[] {
  const byGroup = new Map<AdminNavGroup, AdminNavItem[]>();
  for (const item of items) {
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }
  return NAV_GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => ({
    group,
    items: byGroup.get(group)!,
  }));
}

function navTooltipLabel(item: AdminNavItem, count: number): string {
  if (count <= 0) return item.label;
  return `${item.label} (${formatBadgeCount(count)})`;
}

type SidebarNavLinkProps = {
  item: AdminNavItem;
  pathname: string;
  count: number;
  collapsed: boolean;
};

function SidebarNavLink({ item, pathname, count, collapsed }: SidebarNavLinkProps) {
  const Icon = item.icon;
  const active = isAdminNavActive(pathname, item);

  const link = (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'relative h-9 w-full font-normal',
        collapsed ? 'justify-center px-0' : 'justify-start gap-2 overflow-hidden px-2',
        active && 'bg-primary/10 font-medium',
      )}
      asChild
    >
      <Link
        href={item.href}
        prefetch
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? navTooltipLabel(item, count) : undefined}
        className={cn(
          'flex items-center',
          collapsed ? 'size-full justify-center' : 'w-full min-w-0 gap-2',
        )}
      >
        {active && !collapsed ? (
          <span
            className="bg-primary absolute top-1/2 left-1.5 h-5 w-0.5 -translate-y-1/2 rounded-full"
            aria-hidden
          />
        ) : null}
        {active && collapsed ? (
          <span
            className="bg-primary absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full"
            aria-hidden
          />
        ) : null}
        <Icon className="size-4 shrink-0" aria-hidden />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-[13px] leading-tight">{item.label}</span>
            {count > 0 ? (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px] tabular-nums"
                aria-label={`${formatBadgeCount(count)} требуют внимания`}
              >
                {formatBadgeCount(count)}
              </Badge>
            ) : null}
          </>
        ) : null}
        {collapsed && count > 0 ? (
          <span className="bg-primary absolute top-1.5 right-1.5 size-2 rounded-full" aria-hidden />
        ) : null}
      </Link>
    </Button>
  );

  if (!collapsed && item.label.length <= 14) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        {navTooltipLabel(item, count)}
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const { user, logout } = useAuth();
  const navItems = useMemo(() => getAdminNavForRole(user?.role), [user?.role]);
  const navGroups = useMemo(() => groupNavItems(navItems), [navItems]);

  const canSeeOrderBadges = canAccessAdminPermission(user?.role, ADMIN_PERM.ORDERS);
  const canSeeInboxBadges = canAccessAdminPermission(user?.role, ADMIN_PERM.INBOX);

  const { data: badges } = useQuery({
    queryKey: ['admin', 'badges'],
    queryFn: () => adminMetricsService.getBadges(),
    enabled: canSeeOrderBadges || canSeeInboxBadges,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  const badgeBySegment: Partial<Record<AdminNavSegment, number>> = {
    orders: canSeeOrderBadges ? (badges?.activeOrders ?? 0) : 0,
    support: canSeeInboxBadges ? (badges?.openConversations ?? 0) : 0,
  };

  const activeOrders = canSeeOrderBadges ? (badges?.activeOrders ?? 0) : 0;
  const openChats = canSeeInboxBadges ? (badges?.openConversations ?? 0) : 0;
  const hasActivityAlerts = activeOrders > 0 || openChats > 0;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPrefsReady, setSidebarPrefsReady] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === 'true') setSidebarCollapsed(true);
    } catch {
      // ignore
    }
    setSidebarPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarPrefsReady) return;
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed, sidebarPrefsReady]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="flex min-h-svh w-full">
      <TooltipProvider delayDuration={400}>
        <aside
          className={cn(
            'border-border bg-background sticky top-0 z-30 hidden h-svh shrink-0 flex-col overflow-hidden border-r shadow-sm transition-[width] duration-200 ease-out md:flex',
            sidebarCollapsed ? 'w-[3.25rem]' : 'w-[17rem]',
          )}
        >
          <div
            className={cn(
              'flex h-14 shrink-0 items-center',
              sidebarCollapsed ? 'justify-center px-1' : 'gap-2 px-2.5',
            )}
          >
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="bg-primary/10 text-primary hover:bg-primary/15 flex size-9 items-center justify-center rounded-lg transition-colors"
                    aria-label="IBR Admin — обзор"
                  >
                    <Store className="size-4" aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">IBR Admin</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="hover:bg-muted/50 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Store className="size-4" aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-semibold">IBR Admin</span>
                    <span className="text-muted-foreground truncate text-[11px]">
                      Панель управления
                    </span>
                  </div>
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label="Свернуть меню"
                      onClick={toggleSidebar}
                    >
                      <PanelLeftClose className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Свернуть (Ctrl+B)</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          <Separator />

          <div className={cn('shrink-0', sidebarCollapsed ? 'px-1.5 pt-2' : 'px-2.5 pt-2')}>
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 w-full"
                    aria-label="Поиск по админке"
                    onClick={() => setPaletteOpen(true)}
                  >
                    <Search className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Поиск (Ctrl+K)</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="text-muted-foreground hover:text-foreground h-9 w-full justify-start gap-2 px-2.5 font-normal"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Поиск…</span>
                <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] xl:inline-block">
                  Ctrl K
                </kbd>
              </Button>
            )}
          </div>

          {!sidebarCollapsed && hasActivityAlerts ? (
            <div className="mx-2.5 mt-2 shrink-0 space-y-1.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-2.5 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                Требуют внимания
              </p>
              {activeOrders > 0 ? (
                <Link
                  href="/dashboard/orders"
                  className="hover:bg-background/80 flex min-w-0 items-center justify-between gap-2 rounded-md px-1 py-0.5 text-xs transition-colors"
                >
                  <span className="truncate">Заказы в работе</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatBadgeCount(activeOrders)}
                  </span>
                </Link>
              ) : null}
              {openChats > 0 ? (
                <Link
                  href="/dashboard/owner-messages"
                  className="hover:bg-background/80 flex min-w-0 items-center justify-between gap-2 rounded-md px-1 py-0.5 text-xs transition-colors"
                >
                  <span className="truncate">Открытые чаты</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatBadgeCount(openChats)}
                  </span>
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 [-webkit-overflow-scrolling:touch]">
            <nav
              className={cn('flex flex-col gap-3', sidebarCollapsed ? 'px-1.5' : 'px-2.5')}
              aria-label="Админ-меню"
            >
              {navGroups.map(({ group, items }) => (
                <div key={group} className="space-y-0.5">
                  {!sidebarCollapsed && navGroups.length > 1 ? (
                    <p className="text-muted-foreground px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide uppercase">
                      {ADMIN_NAV_GROUP_LABELS[group]}
                    </p>
                  ) : null}
                  {items.map((item) => (
                    <SidebarNavLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      count={badgeBySegment[item.segment] ?? 0}
                      collapsed={sidebarCollapsed}
                    />
                  ))}
                </div>
              ))}
            </nav>
          </div>

          <Separator />

          <div className={cn('shrink-0 space-y-2', sidebarCollapsed ? 'p-1.5' : 'p-2.5')}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-1.5">
                {user ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <Avatar className="size-9 border">
                          {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                          <AvatarFallback className="text-xs">
                            {userInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{user.name || 'Пользователь'}</p>
                      <p className="text-muted-foreground text-xs">{roleLabelRu(user.role)}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label="Развернуть меню"
                      onClick={toggleSidebar}
                    >
                      <PanelLeftOpen className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Развернуть (Ctrl+B)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="size-9" asChild>
                      <Link href="/" aria-label="В магазин">
                        <ExternalLink className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">В магазин</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-9"
                      aria-label="Выйти"
                      onClick={() => void logout()}
                    >
                      <LogOut className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Выйти</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <>
                {user ? (
                  <div className="border-border/60 bg-muted/30 flex items-center gap-2.5 rounded-lg border px-2.5 py-2">
                    <Avatar className="size-9 shrink-0 border">
                      {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                      <AvatarFallback className="text-xs">{userInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {user.name || 'Пользователь'}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {roleLabelRu(user.role)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 px-2.5"
                    asChild
                  >
                    <Link href="/">
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />В магазин
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 w-full justify-start gap-2 px-2.5"
                    onClick={() => void logout()}
                  >
                    <LogOut className="size-3.5 shrink-0" aria-hidden />
                    Выйти
                  </Button>
                </div>
              </>
            )}
          </div>
        </aside>
      </TooltipProvider>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Store className="size-4" aria-hidden />
              </div>
              <span className="text-sm font-semibold">Админ</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Поиск по админке"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="size-4" aria-hidden />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Магазин</Link>
              </Button>
            </div>
          </div>
          <div className="pb-2 [-webkit-overflow-scrolling:touch] overflow-x-auto scroll-smooth [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]">
            <nav
              className="flex w-max min-w-full gap-1 px-3 snap-x snap-mandatory"
              aria-label="Разделы админки"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isAdminNavActive(pathname, item);
                const count = badgeBySegment[item.segment] ?? 0;
                return (
                  <Button
                    key={item.href}
                    size="sm"
                    variant={active ? 'secondary' : 'ghost'}
                    className="shrink-0 snap-start gap-1.5 rounded-full px-3"
                    asChild
                  >
                    <Link href={item.href} prefetch aria-current={active ? 'page' : undefined}>
                      <Icon className="size-3.5" aria-hidden />
                      {item.label}
                      {count > 0 ? (
                        <span className="bg-primary/10 text-primary inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums">
                          {formatBadgeCount(count)}
                        </span>
                      ) : null}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </header>

        <div className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 hidden h-11 items-center border-b px-4 backdrop-blur md:flex">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-8 gap-2 px-2"
                  onClick={toggleSidebar}
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="size-4" aria-hidden />
                  ) : (
                    <PanelLeftClose className="size-4" aria-hidden />
                  )}
                  {sidebarCollapsed ? 'Показать меню' : 'Скрыть меню'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Горячая клавиша: Ctrl+B</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
