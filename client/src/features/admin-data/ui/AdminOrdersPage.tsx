'use client';

import {
  formatOrderDeliveryMethod,
  formatOrderNumber,
  formatOrderPaymentType,
  getOrderCustomerLabel,
  getOrderPayableAmount,
  getOrderStatusText,
  isTerminalOrderStatus,
  ORDER_STATUS,
  type OrderStatus,
} from '@/entities/order';
import {
  adminOrderService,
  type AdminOrdersFilter,
} from '@/shared/api/services/admin-order-service';
import { ADMIN_PERM, useAdminPermission } from '@/shared/hooks/use-admin-permission';
import { parseAdminSortSpec } from '@/shared/lib/admin-sort';
import { formatRub } from '@/shared/lib/format-money';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ADMIN_ORDER_SORT_OPTIONS } from '@/widgets/dashboard-admin/config/admin-list-sort-options';
import {
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_ORDER,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { AdminPaginationBar } from '@/widgets/dashboard-admin/ui/AdminPaginationBar';
import { AdminSortSelect } from '@/widgets/dashboard-admin/ui/AdminSortSelect';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfDay, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelect } from './OrderStatusSelect';

const LIMIT = 20;
const STATUS_OPTIONS = Object.values(ORDER_STATUS);

function formatDateRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return 'Все даты';
  const fromLabel = format(range.from, 'd MMM yyyy', { locale: ru });
  if (!range.to || range.to.getTime() === range.from.getTime()) return `с ${fromLabel}`;
  return `${fromLabel} — ${format(range.to, 'd MMM yyyy', { locale: ru })}`;
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canChangeOrderStatus = useAdminPermission(ADMIN_PERM.FULFILLMENT);
  const canExportOrders = useAdminPermission(ADMIN_PERM.FINANCE);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [paymentFilter, setPaymentFilter] = useState<string>('__all__');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sortSpec, setSortSpec] = useState('createdAt:desc');

  const userIdParam = searchParams.get('userId')?.trim() || undefined;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const statusParam = statusFilter === '__all__' ? undefined : statusFilter;
  const { sort, order } = parseAdminSortSpec(sortSpec, 'createdAt');

  const listFilter: AdminOrdersFilter = {
    status: statusParam,
    q: debouncedQ || undefined,
    paymentType: paymentFilter === '__all__' ? undefined : paymentFilter,
    userId: userIdParam,
    from: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
    to: dateRange?.from ? endOfDay(dateRange.to ?? dateRange.from).toISOString() : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'orders', page, listFilter, sortSpec],
    queryFn: () => adminOrderService.list(page, LIMIT, listFilter, sort, order),
    placeholderData: keepPreviousData,
  });

  const statusCounts = data?.statusCounts ?? {};
  const allCount = Object.values(statusCounts).reduce((acc, n) => acc + n, 0);

  const updateStatus = useMutation({
    mutationFn: ({ id, order_status }: { id: string; order_status: OrderStatus }) =>
      adminOrderService.updateStatus(id, order_status),
    onSuccess: () => {
      toast.success('Статус обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось обновить статус'),
  });

  const onExport = async () => {
    try {
      await adminOrderService.downloadOrdersExport(2000, listFilter);
      toast.success('Отчёт CSV скачан');
    } catch (e) {
      const message =
        e instanceof Error && e.message.trim() ? e.message : 'Не удалось скачать экспорт';
      toast.error(message);
    }
  };

  const clearUserFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('userId');
    router.replace(`/dashboard/orders${params.size ? `?${params}` : ''}`);
    setPage(1);
  };

  const totalPages = data?.totalPages ?? 1;
  const colSpan = 9;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Заказы"
        description={
          canExportOrders
            ? 'Фильтры, статусы и экспорт. На телефоне таблицу можно прокрутить вбок.'
            : 'Фильтры и статусы. На телефоне таблицу можно прокрутить вбок.'
        }
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Обновить
            </Button>
            {canExportOrders ? (
              <Button type="button" variant="secondary" onClick={onExport}>
                Скачать отчёт (CSV)
              </Button>
            ) : null}
          </>
        }
      />

      {isError ? (
        <p className="text-destructive text-sm">
          {(error as Error)?.message ?? 'Ошибка загрузки заказов'}
        </p>
      ) : null}

      {userIdParam ? (
        <Badge variant="secondary" className="gap-1.5 py-1 pr-1.5">
          Заказы пользователя {formatOrderNumber(userIdParam)}
          <button
            type="button"
            onClick={clearUserFilter}
            className="hover:bg-muted rounded-full p-0.5"
            aria-label="Сбросить фильтр по пользователю"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ) : null}

      <AdminTableToolbar
        primary={
          <>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Поиск</span>
              <Input
                placeholder="ID, email, имя, товар в заказе, paymentId…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-gray-200 min-w-[240px] sm:w-[320px]"
              />
            </div>
            <div className="space-y-1.5 flex items-center gap-3">
              <span className="text-muted-foreground text-xs">Период</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'bg-gray-200 w-full min-w-[200px] justify-start font-normal sm:w-[240px]',
                      !dateRange?.from && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="size-4" aria-hidden />
                    {formatDateRangeLabel(dateRange)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    locale={ru}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setPage(1);
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                  {dateRange?.from ? (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDateRange(undefined);
                          setPage(1);
                        }}
                      >
                        Сбросить период
                      </Button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Оплата</span>
              <Select
                value={paymentFilter}
                onValueChange={(v) => {
                  setPaymentFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-gray-200 w-full min-w-[160px] cursor-pointer sm:w-[180px]">
                  <SelectValue placeholder="Оплата" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="__all__">
                    Любая оплата
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="YOOKASSA">
                    ЮKassa
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="ON_DELIVERY">
                    При получении
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
        secondary={
          <AdminSortSelect
            id="orders-sort"
            label="Сортировка"
            value={sortSpec}
            options={ADMIN_ORDER_SORT_OPTIONS}
            onValueChange={(v) => {
              setSortSpec(v);
              setPage(1);
            }}
          />
        }
      />

      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Фильтр по статусу"
      >
        <Button
          type="button"
          size="sm"
          variant={statusFilter === '__all__' ? 'default' : 'outline'}
          className="h-8 shrink-0 rounded-full px-3 text-xs"
          onClick={() => {
            setStatusFilter('__all__');
            setPage(1);
          }}
        >
          Все{allCount > 0 ? ` (${allCount})` : ''}
        </Button>
        {STATUS_OPTIONS.map((s) => {
          const count = statusCounts[s] ?? 0;
          return (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              className="h-8 shrink-0 rounded-full px-3 text-xs"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {getOrderStatusText(s)}
              {count > 0 ? ` (${count})` : ''}
            </Button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-card shadow-sm">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_ORDER}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              <TableHead className="w-[88px]">ID</TableHead>
              <TableHead className="min-w-[140px] max-w-[200px]">Клиент</TableHead>
              <TableHead className="w-[52px] text-center">Поз.</TableHead>
              <TableHead className="min-w-[120px]">Доставка</TableHead>
              <TableHead className="min-w-[120px]">Оплата</TableHead>
              <TableHead className="w-[120px] text-right">Сумма</TableHead>
              <TableHead className="min-w-[220px]">Статус</TableHead>
              <TableHead className="min-w-[130px]">Дата</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={colSpan} />
            ) : data?.orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-muted-foreground py-10 text-center">
                  {debouncedQ || statusParam ? 'Ничего не найдено' : 'Заказов нет'}
                </TableCell>
              </TableRow>
            ) : (
              data?.orders.map((o) => {
                const n = o.products?.length ?? 0;
                return (
                  <TableRow key={o._id}>
                    <TableCell className="font-mono text-xs">
                      {formatOrderNumber(String(o._id))}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="text-foreground block font-medium leading-snug break-words">
                        {getOrderCustomerLabel(o.userId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{n}</TableCell>
                    <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                      {formatOrderDeliveryMethod(o.delivery_method)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                      {formatOrderPaymentType(o.payment_type)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatRub(getOrderPayableAmount(o))}
                      {getOrderPayableAmount(o) < Number(o.totalAmount || 0) - 0.009 ? (
                        <span className="text-muted-foreground mt-0.5 block text-xs font-normal line-through">
                          {formatRub(o.totalAmount)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {isTerminalOrderStatus(o.order_status) || !canChangeOrderStatus ? (
                        <OrderStatusBadge
                          status={o.order_status}
                          paymentType={o.payment_type}
                          className="w-fit"
                        />
                      ) : (
                        <OrderStatusSelect
                          value={o.order_status}
                          paymentType={o.payment_type}
                          disabled={updateStatus.isPending}
                          size="sm"
                          className="w-full max-w-[200px]"
                          onValueChange={(v) =>
                            updateStatus.mutate({
                              id: String(o._id),
                              order_status: v,
                            })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs leading-snug">
                      {o.createdAt
                        ? format(new Date(o.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/orders/${o._id}`}>Открыть</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPaginationBar
        page={page}
        totalPages={totalPages}
        total={data?.total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
