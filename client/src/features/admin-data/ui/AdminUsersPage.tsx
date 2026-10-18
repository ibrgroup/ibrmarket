'use client';

import { useAuth } from '@/features/auth';
import { adminUsersService, type AdminUserStatus } from '@/shared/api/services/admin-users-service';
import { parseAdminSortSpec } from '@/shared/lib/admin-sort';
import {
  isStaffRole,
  isSuperAdminRole,
  roleLabelRu,
  USER_ROLES,
  type UserRole,
} from '@/shared/lib/user-roles';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ADMIN_USER_SORT_OPTIONS } from '@/widgets/dashboard-admin/config/admin-list-sort-options';
import {
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_USER,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { AdminPaginationBar } from '@/widgets/dashboard-admin/ui/AdminPaginationBar';
import { AdminSortSelect } from '@/widgets/dashboard-admin/ui/AdminSortSelect';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Ban, LockOpen, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const LIMIT = 20;

function userStatusLabel(status?: string): string {
  if (status === 'Suspended') return 'Заблокирован';
  if (status === 'Inactive') return 'Неактивен';
  if (status === 'Active') return 'Активен';
  return status ?? '—';
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const canManageUsers = isSuperAdminRole(currentUser?.role);
  const currentUserId = String(currentUser?._id ?? '');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sortSpec, setSortSpec] = useState('createdAt:desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const { sort, order } = parseAdminSortSpec(sortSpec, 'createdAt');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'users', page, debouncedQ, sortSpec],
    queryFn: () => adminUsersService.list(page, LIMIT, debouncedQ || undefined, sort, order),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminUsersService.updateRole(userId, role),
    onSuccess: () => {
      toast.success('Роль обновлена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось обновить роль'),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => adminUsersService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Пользователь удалён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось удалить'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AdminUserStatus }) =>
      adminUsersService.updateStatus(userId, status),
    onSuccess: (_res, { status }) => {
      toast.success(
        status === 'Active' ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось изменить статус'),
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Пользователи"
        description="Поиск и сортировка на сервере. Таблицу можно прокручивать по горизонтали и вертикали."
        actions={
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Обновить
          </Button>
        }
      />

      <AdminTableToolbar
        primary={
          <div className="space-y-1.5">
            <span className="text-muted-foreground text-xs">Поиск</span>
            <Input
              placeholder="Имя, email или телефон…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-gray-200 min-w-[240px] sm:w-[320px]"
            />
          </div>
        }
        secondary={
          <AdminSortSelect
            id="users-sort"
            label="Сортировка"
            value={sortSpec}
            options={ADMIN_USER_SORT_OPTIONS}
            onValueChange={(v) => {
              setSortSpec(v);
              setPage(1);
            }}
            className="w-full min-w-[220px] sm:w-[280px]"
          />
        }
      />

      {isError ? (
        <p className="text-destructive text-sm">{(error as Error)?.message ?? 'Ошибка загрузки'}</p>
      ) : null}

      <div className="rounded-2xl bg-card">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_USER}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              <TableHead className="min-w-[140px]">Имя</TableHead>
              <TableHead className="min-w-[180px]">Контакт</TableHead>
              <TableHead className="min-w-[200px]">Роль</TableHead>
              <TableHead className="min-w-[100px]">Статус</TableHead>
              <TableHead className="min-w-[120px]">Регистрация</TableHead>
              <TableHead className="w-[120px] text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={6} />
            ) : data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Нет пользователей
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((u) => {
                const isSelf = currentUserId !== '' && currentUserId === String(u._id);
                return (
                  <TableRow key={u._id}>
                    <TableCell className="max-w-[220px]">
                      <span className="text-foreground block font-medium leading-snug break-words">
                        {u.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] text-sm leading-snug break-all">
                      {u.email || u.mobile || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <Badge variant={isStaffRole(u.role) ? 'default' : 'secondary'}>
                          {roleLabelRu(u.role)}
                        </Badge>
                        {canManageUsers ? (
                        <Select
                          value={u.role}
                          disabled={!canManageUsers || isSelf || updateRole.isPending}
                          onValueChange={(role) =>
                            updateRole.mutate({ userId: u._id, role: role as UserRole })
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-full bg-muted/50 min-w-[120px] sm:w-[130px]"
                            size="sm"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r} — {roleLabelRu(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.status === 'Suspended' ? 'destructive' : 'outline'}
                        className={u.status === 'Active' ? 'text-emerald-600' : undefined}
                      >
                        {userStatusLabel(u.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs leading-snug whitespace-nowrap">
                      {u.createdAt
                        ? format(new Date(u.createdAt), 'd MMM yyyy', { locale: ru })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Заказы пользователя"
                          title="Заказы пользователя"
                          asChild
                        >
                          <Link href={`/dashboard/orders?userId=${u._id}`}>
                            <ShoppingBag className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canManageUsers && u.status === 'Suspended' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                            disabled={updateStatus.isPending}
                            aria-label="Разблокировать"
                            title="Разблокировать"
                            onClick={() => updateStatus.mutate({ userId: u._id, status: 'Active' })}
                          >
                            <LockOpen className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canManageUsers && u.status !== 'Suspended' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-600"
                            disabled={isSelf || updateStatus.isPending}
                            aria-label="Заблокировать"
                            title="Заблокировать"
                            onClick={() => {
                              if (
                                !confirm(
                                  `Заблокировать пользователя «${u.name}»? Он не сможет входить в аккаунт.`,
                                )
                              )
                                return;
                              updateStatus.mutate({ userId: u._id, status: 'Suspended' });
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canManageUsers ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            disabled={isSelf || deleteUser.isPending}
                            aria-label="Удалить пользователя"
                            onClick={() => {
                              if (!confirm(`Удалить пользователя «${u.name}»?`)) return;
                              deleteUser.mutate(u._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
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
