'use client';

import { adminCategoryService } from '@/shared/api/services/admin-category-service';
import {
  adminProductsService,
  type AdminProductsFilter,
} from '@/shared/api/services/admin-products-service';
import { useAdminPermission, useIsSuperAdmin } from '@/shared/hooks/use-admin-permission';
import { ADMIN_PERM } from '@/shared/lib/admin-permissions';
import { parseAdminSortSpec } from '@/shared/lib/admin-sort';
import { formatRub } from '@/shared/lib/format-money';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ADMIN_PRODUCT_SORT_OPTIONS } from '@/widgets/dashboard-admin/config/admin-list-sort-options';
import {
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_PRODUCT,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminPaginationBar } from '@/widgets/dashboard-admin/ui/AdminPaginationBar';
import { AdminSortSelect } from '@/widgets/dashboard-admin/ui/AdminSortSelect';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Pencil, Star, StarOff, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminProductSheet } from './AdminProductSheet';

const LIMIT = 20;

export function AdminProductsSection() {
  const queryClient = useQueryClient();
  const canMutateCatalog = useAdminPermission(ADMIN_PERM.CATALOG);
  const canDeleteCatalog = useIsSuperAdmin();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [stockFilter, setStockFilter] = useState('__all__');
  const [featuredFilter, setFeaturedFilter] = useState('__all__');
  const [sortSpec, setSortSpec] = useState('createdAt:desc');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [editId, setEditId] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const { sort, order } = parseAdminSortSpec(sortSpec, 'createdAt');

  const listFilter: AdminProductsFilter = {
    q: debouncedQ || undefined,
    category: categoryFilter === '__all__' ? undefined : categoryFilter,
    stock:
      stockFilter === 'out' || stockFilter === 'low' ? (stockFilter as 'out' | 'low') : undefined,
    featured: featuredFilter === '__all__' ? undefined : featuredFilter === 'true',
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminCategoryService.list(),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'products', page, listFilter, sortSpec],
    queryFn: () => adminProductsService.list(page, LIMIT, listFilter, sort, order),
    placeholderData: keepPreviousData,
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) => adminProductsService.delete(productId),
    onSuccess: () => {
      toast.success('Товар удалён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось удалить товар'),
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => adminProductsService.deleteMultiple(ids),
    onSuccess: (_res, ids) => {
      toast.success(`Удалено товаров: ${ids.length}`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось удалить товары'),
  });

  const bulkFeatured = useMutation({
    mutationFn: ({ ids, isFeatured }: { ids: string[]; isFeatured: boolean }) =>
      adminProductsService.bulkSetFeatured(ids, isFeatured),
    onSuccess: (_res, { ids, isFeatured }) => {
      toast.success(
        isFeatured
          ? `В рекомендуемые добавлено: ${ids.length}`
          : `Из рекомендуемых убрано: ${ids.length}`,
      );
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось обновить товары'),
  });

  const totalPages = data?.totalPages ?? 1;
  const pageProducts = data?.products ?? [];
  const pageIds = pageProducts.map((p) => p._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const bulkBusy = bulkDelete.isPending || bulkFeatured.isPending;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    if (!canMutateCatalog) return;
    setSheetMode('create');
    setEditId(undefined);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    if (!canMutateCatalog) return;
    setSheetMode('edit');
    setEditId(id);
    setSheetOpen(true);
  };

  const openDuplicate = (id: string) => {
    if (!canMutateCatalog) return;
    setSheetMode('duplicate');
    setEditId(id);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <AdminTableToolbar
        primary={
          <>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Поиск по названию</span>
              <Input
                placeholder="Название товара…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-gray-200 min-w-[200px] sm:w-[280px]"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Категория</span>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-gray-200 w-full min-w-[160px] cursor-pointer sm:w-[200px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="__all__">
                    Все категории
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem className="cursor-pointer" key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Наличие</span>
              <Select
                value={stockFilter}
                onValueChange={(v) => {
                  setStockFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-gray-200 w-full min-w-[140px] cursor-pointer sm:w-[170px]">
                  <SelectValue placeholder="Наличие" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="__all__">
                    Любое
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="low">
                    Мало (1–5 шт)
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="out">
                    Нет в наличии
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Рекомендуемые</span>
              <Select
            
                value={featuredFilter}
                onValueChange={(v) => {
                  setFeaturedFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-gray-200 w-full min-w-[130px] cursor-pointer sm:w-[150px]">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="__all__">
                    Все
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="true">
                    Только рекомендуемые
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="false">
                    Не рекомендуемые
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Обновить
              </Button>
              <Button type="button" onClick={openCreate} disabled={!canMutateCatalog}>
                Новый товар
              </Button>
            </div>
          </>
        }
        secondary={
          <AdminSortSelect
            id="products-sort"
            label="Сортировка"
            value={sortSpec}
            options={ADMIN_PRODUCT_SORT_OPTIONS}
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

      {canMutateCatalog && selectedIds.size > 0 ? (
        <div className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-14 z-[5] flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm backdrop-blur md:top-0">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() =>
                bulkFeatured.mutate({ ids: Array.from(selectedIds), isFeatured: true })
              }
            >
              <Star className="size-4" aria-hidden />В рекомендуемые
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() =>
                bulkFeatured.mutate({ ids: Array.from(selectedIds), isFeatured: false })
              }
            >
              <StarOff className="size-4" aria-hidden />
              Убрать из рекомендуемых
            </Button>
            {canDeleteCatalog ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkBusy}
                onClick={() => {
                  if (
                    !confirm(`Удалить выбранные товары (${selectedIds.size})? Действие необратимо.`)
                  )
                    return;
                  bulkDelete.mutate(Array.from(selectedIds));
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Удалить
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={bulkBusy}
              onClick={() => setSelectedIds(new Set())}
            >
              Сбросить
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-card shadow-sm">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_PRODUCT}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              {canMutateCatalog ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Выбрать все на странице"
                    className="cursor-pointer"
                  />
                </TableHead>
              ) : null}
              <TableHead className="w-14">Фото</TableHead>
              <TableHead className="min-w-[180px]">Название</TableHead>
              <TableHead className="min-w-[120px]">Категория</TableHead>
              <TableHead className="min-w-[100px]">Бренд</TableHead>
              <TableHead className="w-[110px] text-right">Цена</TableHead>
              <TableHead className="w-[100px] text-right">Остаток</TableHead>
              <TableHead className="min-w-[120px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={canMutateCatalog ? 8 : 7} />
            ) : data?.products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canMutateCatalog ? 8 : 7}
                  className="text-muted-foreground py-8 text-center"
                >
                  {debouncedQ ||
                  categoryFilter !== '__all__' ||
                  stockFilter !== '__all__' ||
                  featuredFilter !== '__all__'
                    ? 'Ничего не найдено'
                    : 'Нет товаров'}
                </TableCell>
              </TableRow>
            ) : (
              data?.products.map((p) => (
                <TableRow key={p._id} data-state={selectedIds.has(p._id) ? 'selected' : undefined}>
                  {canMutateCatalog ? (
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selectedIds.has(p._id)}
                        onCheckedChange={() => toggleSelect(p._id)}
                        aria-label={`Выбрать «${p.name}»`}
                        className="cursor-pointer"
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="w-14 p-2">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt=""
                        width={44}
                        height={44}
                        className="bg-muted size-11 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted size-11 rounded-md" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="text-foreground block font-medium leading-snug break-words">
                      {p.isFeatured ? (
                        <Star
                          className="mr-1 inline size-3.5 fill-amber-400 text-amber-400"
                          aria-label="Рекомендуемый"
                        />
                      ) : null}
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                    {p.category?.name ?? p.catName ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                    {p.brand ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatRub(p.price)}</TableCell>
                  <TableCell className="text-right">
                    {p.countInStock <= 0 ? (
                      <Badge variant="destructive" className="tabular-nums">
                        Нет в наличии
                      </Badge>
                    ) : p.countInStock <= 5 ? (
                      <Badge variant="outline" className="border-amber-500/50 tabular-nums">
                        Мало: {p.countInStock} шт
                      </Badge>
                    ) : (
                      <span className="tabular-nums">{p.countInStock}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Редактировать"
                        disabled={!canMutateCatalog}
                        onClick={() => openEdit(p._id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Дублировать"
                        title="Дублировать товар"
                        disabled={!canMutateCatalog}
                        onClick={() => openDuplicate(p._id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/product/${p._id}`} aria-label="На сайте">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canDeleteCatalog ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          disabled={deleteProduct.isPending}
                          aria-label="Удалить"
                          onClick={() => {
                            if (!confirm(`Удалить товар «${p.name}»?`)) return;
                            deleteProduct.mutate(p._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
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

      <AdminProductSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        productId={editId}
        categories={categories}
      />
    </div>
  );
}
