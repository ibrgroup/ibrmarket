'use client';

import {
  adminAuditService,
  type AdminAuditFilter,
  type AdminAuditLogRow,
} from '@/shared/api/services/admin-audit-service';
import { parseAdminSortSpec } from '@/shared/lib/admin-sort';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ADMIN_AUDIT_SORT_OPTIONS } from '@/widgets/dashboard-admin/config/admin-list-sort-options';
import {
  ADMIN_TABLE_AUDIT,
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { AdminPaginationBar } from '@/widgets/dashboard-admin/ui/AdminPaginationBar';
import { AdminSortSelect } from '@/widgets/dashboard-admin/ui/AdminSortSelect';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

const LIMIT = 40;

const ACTION_LABELS_RU: Record<string, string> = {
  'user.role_update': 'Изменение роли пользователя',
  'user.status_update': 'Блокировка / разблокировка',
  'user.delete': 'Удаление пользователя',
  'user.delete_many': 'Массовое удаление пользователей',
  'product.create': 'Создание товара',
  'product.update': 'Изменение товара',
  'product.delete': 'Удаление товара',
  'product.delete_many': 'Массовое удаление товаров',
  'product.bulk_update': 'Массовое обновление товаров',
  'order.status_update': 'Смена статуса заказа',
  'order.delete': 'Удаление заказа',
  'category.create': 'Создание категории',
  'category.update': 'Изменение категории',
  'category.delete': 'Удаление категории',
};

const ENTITY_TYPE_OPTIONS = [
  { value: 'user', label: 'Пользователи' },
  { value: 'product', label: 'Товары' },
  { value: 'order', label: 'Заказы' },
  { value: 'category', label: 'Категории' },
];

function actionLabel(action: string): string {
  return ACTION_LABELS_RU[action] ?? action;
}

function auditDateRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return 'Все даты';
  const fromLabel = format(range.from, 'd MMM yyyy', { locale: ru });
  if (!range.to || range.to.getTime() === range.from.getTime()) return `с ${fromLabel}`;
  return `${fromLabel} — ${format(range.to, 'd MMM yyyy', { locale: ru })}`;
}

function actorLabel(log: AdminAuditLogRow): string {
  const a = log.actorUserId;
  if (a && typeof a === 'object') {
    return a.name || a.email || '—';
  }
  return typeof a === 'string' ? a : '—';
}

function actorDetail(log: AdminAuditLogRow): string {
  const a = log.actorUserId;
  if (a && typeof a === 'object') {
    const parts = [a.name, a.email].filter(Boolean);
    return parts.join(' · ') || '—';
  }
  if (typeof a === 'string' && a.length > 0) return a;
  return '—';
}

function metaJson(meta: Record<string, unknown> | undefined): string {
  if (!meta || typeof meta !== 'object') return '—';
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return '—';
  }
}

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [actor, setActor] = useState('');
  const [debouncedActor, setDebouncedActor] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('__all__');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortSpec, setSortSpec] = useState('createdAt:desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedActor(actor);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [actor]);

  const { sort, order } = parseAdminSortSpec(sortSpec, 'createdAt');

  const listFilter: AdminAuditFilter = {
    q: debouncedQ || undefined,
    actor: debouncedActor || undefined,
    entityType: entityTypeFilter === '__all__' ? undefined : entityTypeFilter,
    from: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
    to: dateRange?.from ? endOfDay(dateRange.to ?? dateRange.from).toISOString() : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'audit', page, listFilter, sortSpec],
    queryFn: () => adminAuditService.list(page, LIMIT, listFilter, sort, order),
    placeholderData: keepPreviousData,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Журнал действий"
        description="Фильтр по полю action (регекс на сервере). Сортировка по времени или действию. Детали — полный JSON."
        actions={
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Обновить
          </Button>
        }
      />

      <AdminTableToolbar
        primary={
          <>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Фильтр по действию</span>
              <Input
                placeholder="Например product.create, order…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-[200px] sm:w-[260px]"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Кто (имя, email или ID)</span>
              <Input
                placeholder="Актор…"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full min-w-[160px] sm:w-[200px]"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Сущность</span>
              <Select
                value={entityTypeFilter}
                onValueChange={(v) => {
                  setEntityTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-muted/50 w-full min-w-[140px] cursor-pointer sm:w-[160px]">
                  <SelectValue placeholder="Сущность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="__all__">
                    Все сущности
                  </SelectItem>
                  {ENTITY_TYPE_OPTIONS.map((o) => (
                    <SelectItem className="cursor-pointer" key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Период</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'bg-muted/50 w-full min-w-[180px] justify-start font-normal sm:w-[220px]',
                      !dateRange?.from && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="size-4" aria-hidden />
                    {auditDateRangeLabel(dateRange)}
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
          </>
        }
        secondary={
          <AdminSortSelect
            id="audit-sort"
            label="Сортировка"
            value={sortSpec}
            options={ADMIN_AUDIT_SORT_OPTIONS}
            onValueChange={(v) => {
              setSortSpec(v);
              setPage(1);
            }}
            className="w-full min-w-[220px] sm:w-[260px]"
          />
        }
      />

      {isError ? (
        <p className="text-destructive text-sm">{(error as Error)?.message ?? 'Ошибка загрузки'}</p>
      ) : null}

      <div className="rounded-2xl bg-card">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_AUDIT}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              <TableHead className="w-[128px]">Время</TableHead>
              <TableHead className="min-w-[160px]">Действие</TableHead>
              <TableHead className="min-w-[160px]">Кто</TableHead>
              <TableHead className="min-w-[180px]">Сущность</TableHead>
              <TableHead className="min-w-[280px]">Детали (JSON)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={5} />
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {debouncedQ || debouncedActor || entityTypeFilter !== '__all__' || dateRange?.from
                    ? 'Ничего не найдено'
                    : 'Записей нет'}
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-muted-foreground align-top text-xs whitespace-nowrap">
                    {log.createdAt
                      ? format(new Date(log.createdAt), 'd MMM yy HH:mm', { locale: ru })
                      : '—'}
                  </TableCell>
                  <TableCell className="align-top text-sm leading-snug">
                    <span className="text-foreground font-medium">{actionLabel(log.action)}</span>
                    <span className="text-muted-foreground mt-0.5 block font-mono text-[11px]">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="align-top text-sm leading-snug">
                    <span className="text-foreground font-medium">{actorLabel(log)}</span>
                    <span className="text-muted-foreground mt-1 block text-xs break-words">
                      {actorDetail(log)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground align-top text-xs leading-snug break-words">
                    {log.entityType
                      ? `${log.entityType}${log.entityId ? ` · ${log.entityId}` : ''}`
                      : '—'}
                  </TableCell>
                  <TableCell className="align-top">
                    <pre className="bg-muted/60 text-muted-foreground max-h-40 overflow-auto rounded-md p-2 text-[11px] leading-normal break-words whitespace-pre-wrap font-mono">
                      {metaJson(log.metadata)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))
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
