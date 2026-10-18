'use client';

import {
  adminCategoryService,
  type AdminCategoryRow,
} from '@/shared/api/services/admin-category-service';
import { useAdminPermission, useIsSuperAdmin } from '@/shared/hooks/use-admin-permission';
import { ADMIN_PERM } from '@/shared/lib/admin-permissions';
import { uploadCategoryImageFiles } from '@/shared/lib/upload-admin-assets';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';
import { ADMIN_CATEGORY_SORT_OPTIONS } from '@/widgets/dashboard-admin/config/admin-list-sort-options';
import {
  ADMIN_TABLE_CATEGORY,
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminSortSelect } from '@/widgets/dashboard-admin/ui/AdminSortSelect';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_IMG = 'https://placehold.co/240x240/png?text=Cat';

export function AdminCategoriesSection() {
  const queryClient = useQueryClient();
  const canMutateCatalog = useAdminPermission(ADMIN_PERM.CATALOG);
  const canDeleteCatalog = useIsSuperAdmin();
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminCategoryService.list(),
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('__none__');
  const [imagesText, setImagesText] = useState(DEFAULT_IMG);
  const [uploadingImages, setUploadingImages] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  const [sortSpec, setSortSpec] = useState('name:asc');

  const sortedCategories = useMemo(() => {
    const list = [...categories];
    const desc = sortSpec.endsWith(':desc');
    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
      return desc ? -cmp : cmp;
    });
    return list;
  }, [categories, sortSpec]);

  const openCreate = () => {
    if (!canMutateCatalog) return;
    setEditing(null);
    setName('');
    setParentId('__none__');
    setImagesText(DEFAULT_IMG);
    setSheetOpen(true);
  };

  const openEdit = (row: AdminCategoryRow) => {
    if (!canMutateCatalog) return;
    setEditing(row);
    setName(row.name);
    setParentId(row.parentId ? String(row.parentId) : '__none__');
    setImagesText((row.images ?? []).join('\n') || DEFAULT_IMG);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!sheetOpen) setEditing(null);
  }, [sheetOpen]);

  const createMut = useMutation({
    mutationFn: () =>
      adminCategoryService.create({
        name,
        parentId: parentId === '__none__' ? null : parentId,
        images: imagesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Категория создана');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка'),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      adminCategoryService.update(editing!._id, {
        name,
        parentId: parentId === '__none__' ? null : parentId,
        images: imagesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Категория обновлена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminCategoryService.delete(id),
    onSuccess: () => {
      toast.success('Категория удалена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка удаления'),
  });

  const busy = createMut.isPending || updateMut.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название');
      return;
    }
    if (editing) updateMut.mutate();
    else createMut.mutate();
  };

  return (
    <div className="space-y-4">
      <AdminTableToolbar
        primary={
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Создание и правка категорий (дерево по parentId). Удаление каскадно с подкатегориями на
            сервере.
          </p>
        }
        secondary={
          <>
            <AdminSortSelect
              id="categories-sort"
              label="Порядок"
              value={sortSpec}
              options={ADMIN_CATEGORY_SORT_OPTIONS}
              onValueChange={setSortSpec}
              className="w-full min-w-[180px] sm:w-[200px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Обновить
              </Button>
              <Button type="button" size="sm" onClick={openCreate} disabled={!canMutateCatalog}>
                <Plus className="mr-1 size-4" />
                Категория
              </Button>
            </div>
          </>
        }
      />

      {isError ? (
        <p className="text-destructive text-sm">{(error as Error)?.message ?? 'Ошибка загрузки'}</p>
      ) : null}

      <div className="rounded-2xl bg-card">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_CATEGORY}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              <TableHead className="min-w-[160px]">Название</TableHead>
              <TableHead className="min-w-[140px]">Родитель</TableHead>
              <TableHead className="w-[72px] text-right">Фото</TableHead>
              <TableHead className="min-w-[100px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={4} />
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  Нет категорий
                </TableCell>
              </TableRow>
            ) : (
              sortedCategories.map((c) => {
                const parent = categories.find((x) => String(x._id) === String(c.parentId));
                return (
                  <TableRow key={c._id}>
                    <TableCell className="max-w-[280px]">
                      <span className="text-foreground block font-medium leading-snug break-words">
                        {c.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                      {parent?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">{c.images?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Изменить"
                          disabled={!canMutateCatalog}
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {canDeleteCatalog ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            aria-label="Удалить"
                            onClick={() => {
                              if (!confirm(`Удалить «${c.name}» и подкатегории?`)) return;
                              deleteMut.mutate(c._id);
                            }}
                          >
                            <Trash2 className="size-4" />
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? 'Категория' : 'Новая категория'}</SheetTitle>
            <SheetDescription>Название, родитель и URL изображений (по строке).</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Название</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Родительская категория</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Нет" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[70] max-h-72">
                  <SelectItem value="__none__">— корень —</SelectItem>
                  {categories
                    .filter((c) => !editing || c._id !== editing._id)
                    .map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-img">Изображения (URL)</Label>
              <Textarea
                id="c-img"
                rows={4}
                className="font-mono text-xs"
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
              />
              <input
                ref={categoryFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const list = e.target.files;
                  if (!list?.length) return;
                  setUploadingImages(true);
                  try {
                    const urls = await uploadCategoryImageFiles(Array.from(list).slice(0, 12));
                    setImagesText((prev) => {
                      const existing = prev
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      return [...existing, ...urls].join('\n');
                    });
                    toast.success(`Загружено: ${urls.length}`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
                  } finally {
                    setUploadingImages(false);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadingImages || busy}
                onClick={() => categoryFileInputRef.current?.click()}
              >
                {uploadingImages ? 'Загрузка…' : 'Загрузить файлы (Cloudinary)'}
              </Button>
            </div>
            <SheetFooter className="mt-auto gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy}>
                {editing ? 'Сохранить' : 'Создать'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
