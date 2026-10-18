'use client';

import {
  bannerService,
  type Banner,
  type BannerPayload,
} from '@/shared/api/services/banner-service';
import { formatRub } from '@/shared/lib/format-money';
import {
  uploadBannerImageFiles,
  validateBannerImageAspectRatio,
} from '@/shared/lib/upload-admin-assets';
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
import {
  ADMIN_TABLE_CATEGORY,
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_VIEWPORT,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminTableSkeletonRows } from '@/widgets/dashboard-admin/ui/AdminTableSkeletonRows';
import { AdminTableToolbar } from '@/widgets/dashboard-admin/ui/AdminTableToolbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_IMG = 'https://placehold.co/1200x400/png?text=Banner';
const ALIGN_OPTIONS = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'Справа' },
];

export function AdminBannersSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => bannerService.getBanners(),
  });
  const banners = data?.banners ?? [];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [imagesText, setImagesText] = useState(DEFAULT_IMG);
  const [price, setPrice] = useState('0');
  const [alignInfo, setAlignInfo] = useState('center');
  const [catId, setCatId] = useState('');
  const [subCatId, setSubCatId] = useState('');
  const [thirdsubCatId, setThirdsubCatId] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditing(null);
    setBannerTitle('');
    setImagesText(DEFAULT_IMG);
    setPrice('0');
    setAlignInfo('center');
    setCatId('');
    setSubCatId('');
    setThirdsubCatId('');
    setSheetOpen(true);
  };

  const openEdit = (row: Banner) => {
    setEditing(row);
    setBannerTitle(row.bannerTitle);
    setImagesText((row.images ?? []).join('\n') || DEFAULT_IMG);
    setPrice(String(Number(row.price) || 0));
    setAlignInfo(row.alignInfo || 'center');
    setCatId(row.catId ?? '');
    setSubCatId(row.subCatId ?? '');
    setThirdsubCatId(row.thirdsubCatId ?? '');
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!sheetOpen) setEditing(null);
  }, [sheetOpen]);

  const buildPayload = (): BannerPayload => {
    const images = imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!bannerTitle.trim() || images.length === 0) {
      throw new Error('Укажите заголовок и хотя бы одно изображение');
    }
    return {
      bannerTitle: bannerTitle.trim(),
      images,
      price: Number(price) || 0,
      alignInfo,
      catId: catId.trim(),
      subCatId: subCatId.trim(),
      thirdsubCatId: thirdsubCatId.trim(),
    };
  };

  const createMut = useMutation({
    mutationFn: () => bannerService.createBanner(buildPayload()),
    onSuccess: () => {
      toast.success('Баннер создан');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'v1'] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка'),
  });

  const updateMut = useMutation({
    mutationFn: () => bannerService.updateBanner(editing!._id, buildPayload()),
    onSuccess: () => {
      toast.success('Баннер обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'v1'] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => bannerService.deleteBanner(id),
    onSuccess: () => {
      toast.success('Баннер удалён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'v1'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка удаления'),
  });

  const busy = createMut.isPending || updateMut.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      buildPayload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Проверьте поля');
      return;
    }
    if (editing) updateMut.mutate();
    else createMut.mutate();
  };

  const onUploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const list = Array.from(files);
      for (const file of list) {
        await validateBannerImageAspectRatio(file);
      }
      const urls = await uploadBannerImageFiles(list);
      setImagesText((prev) => {
        const existing = prev
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        return [...existing, ...urls].join('\n');
      });
      toast.success('Изображения загружены');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminTableToolbar
        primary={
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Промо-баннеры на главной и в каталоге. Изображения — пропорция 375:200, загрузка в
            Cloudinary.
          </p>
        }
        secondary={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Обновить
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Баннер
            </Button>
          </div>
        }
      />

      {isError ? (
        <p className="text-destructive text-sm">{(error as Error)?.message ?? 'Ошибка загрузки'}</p>
      ) : null}

      <div className="rounded-2xl bg-card">
        <Table wrapperClassName={ADMIN_TABLE_VIEWPORT} className={ADMIN_TABLE_CATEGORY}>
          <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
            <TableRow>
              <TableHead className="min-w-[180px]">Заголовок</TableHead>
              <TableHead className="w-[88px]">Превью</TableHead>
              <TableHead className="min-w-[80px]">Цена</TableHead>
              <TableHead className="min-w-[80px]">Выравн.</TableHead>
              <TableHead className="min-w-[100px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AdminTableSkeletonRows colSpan={5} />
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  Нет баннеров
                </TableCell>
              </TableRow>
            ) : (
              banners.map((b) => (
                <TableRow key={b._id}>
                  <TableCell className="max-w-[280px] font-medium break-words">{b.bannerTitle}</TableCell>
                  <TableCell>
                    {b.images?.[0] ? (
                      <Image
                        src={b.images[0]}
                        alt=""
                        width={64}
                        height={36}
                        className="h-9 w-16 rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatRub(Number(b.price))}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{b.alignInfo}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Изменить"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        aria-label="Удалить"
                        onClick={() => {
                          if (!confirm(`Удалить баннер «${b.bannerTitle}»?`)) return;
                          deleteMut.mutate(b._id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? 'Баннер' : 'Новый баннер'}</SheetTitle>
            <SheetDescription>
              Заголовок, изображения, цена и выравнивание текста на витрине.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="b-title">Заголовок</Label>
              <Input
                id="b-title"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="b-images">URL изображений (по строке)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void onUploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImages}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImages ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1 size-4" />
                  )}
                  Загрузить
                </Button>
              </div>
              <Textarea
                id="b-images"
                rows={4}
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="b-price">Цена (от)</Label>
                <Input
                  id="b-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Выравнивание</Label>
                <Select value={alignInfo} onValueChange={setAlignInfo}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[70] max-h-72">
                    {ALIGN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-cat">ID категории (опц.)</Label>
              <Input id="b-cat" value={catId} onChange={(e) => setCatId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-sub">ID подкатегории (опц.)</Label>
              <Input id="b-sub" value={subCatId} onChange={(e) => setSubCatId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-third">ID 3-го уровня (опц.)</Label>
              <Input
                id="b-third"
                value={thirdsubCatId}
                onChange={(e) => setThirdsubCatId(e.target.value)}
              />
            </div>
            <SheetFooter className="mt-auto gap-2 sm:flex-col">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {editing ? 'Сохранить' : 'Создать'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
