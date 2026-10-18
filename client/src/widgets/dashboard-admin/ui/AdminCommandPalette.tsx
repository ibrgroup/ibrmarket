'use client';

import { getOrderCustomerLabel, getOrderPayableAmount, getOrderStatusText } from '@/entities/order';
import { useAuth } from '@/features/auth';
import { adminOrderService } from '@/shared/api/services/admin-order-service';
import { adminProductsService } from '@/shared/api/services/admin-products-service';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { formatRub } from '@/shared/lib/format-money';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { getAdminNavForRole } from '@/widgets/dashboard-admin/lib/admin-nav-for-role';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminCommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  const navItems = useMemo(() => getAdminNavForRole(user?.role), [user?.role]);
  const canSearchOrders = canAccessAdminPermission(user?.role, ADMIN_PERM.ORDERS);
  const canSearchProducts = canAccessAdminPermission(user?.role, ADMIN_PERM.CATALOG);
  const searchEnabled = open && debouncedQuery.length >= 2;

  const { data: ordersResult, isFetching: ordersFetching } = useQuery({
    queryKey: ['admin', 'palette-orders', debouncedQuery],
    queryFn: () => adminOrderService.list(1, 5, { q: debouncedQuery }),
    enabled: searchEnabled && canSearchOrders,
    staleTime: 30_000,
  });

  const { data: productsResult, isFetching: productsFetching } = useQuery({
    queryKey: ['admin', 'palette-products', debouncedQuery],
    queryFn: () => adminProductsService.list(1, 5, { q: debouncedQuery }),
    enabled: searchEnabled && canSearchProducts,
    staleTime: 30_000,
  });

  // CommandDialog отключает встроенный фильтр cmdk — фильтруем навигацию сами
  const filteredNav = query.trim()
    ? navItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : navItems;

  const orders = ordersResult?.orders ?? [];
  const products = productsResult?.products ?? [];
  const searching = ordersFetching || productsFetching;

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Быстрый переход"
      description="Навигация по админке, поиск заказов и товаров"
    >
      <CommandInput
        placeholder="Раздел, заказ (ID, клиент) или товар…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? 'Поиск…' : 'Ничего не найдено'}</CommandEmpty>

        {filteredNav.length > 0 ? (
          <CommandGroup heading="Разделы">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`nav-${item.href}`}
                  onSelect={() => go(item.href)}
                  className="cursor-pointer"
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {orders.length > 0 ? (
          <CommandGroup heading="Заказы">
            {orders.map((o) => (
              <CommandItem
                key={o._id}
                value={`order-${o._id}`}
                onSelect={() => go(`/dashboard/orders/${o._id}`)}
                className="cursor-pointer"
              >
                <ShoppingCart className="size-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  {getOrderCustomerLabel(o.userId)} · {formatRub(getOrderPayableAmount(o))}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {getOrderStatusText(o.order_status, o.payment_type)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {products.length > 0 ? (
          <CommandGroup heading="Товары">
            {products.map((p) => (
              <CommandItem
                key={p._id}
                value={`product-${p._id}`}
                onSelect={() => go(`/product/${p._id}`)}
                className="cursor-pointer"
              >
                <Package className="size-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">{formatRub(p.price)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
