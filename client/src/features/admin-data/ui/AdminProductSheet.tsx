'use client';

import type { Product } from '@/entities/product';
import {
  getProductColorVisual,
  normalizeProductColorToken,
  PRODUCT_COLOR_PALETTE,
} from '@/entities/product/lib/product-color-options';
import {
  normalizeProductSizeToken,
  PRODUCT_SIZE_PALETTE,
} from '@/entities/product/lib/product-size-options';
import type { AdminCategoryRow } from '@/shared/api/services/admin-category-service';
import { adminProductsService } from '@/shared/api/services/admin-products-service';
import {
  PRODUCT_VIDEO_MAX_BYTES,
  uploadProductImageFiles,
  uploadProductVideoFiles,
} from '@/shared/lib/upload-admin-assets';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminCategoryCombobox } from './AdminCategoryCombobox';

type Mode = 'create' | 'edit' | 'duplicate';

const PLACEHOLDER_IMG = 'https://placehold.co/600x400/png?text=Product';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  productId?: string;
  categories: AdminCategoryRow[];
};

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergePaletteAndOrphans(paletteIds: string[], orphans: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of [...paletteIds, ...orphans]) {
    const k = String(x).trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function buildPayload(
  values: {
    name: string;
    description: string;
    brand: string;
    price: string;
    oldPrice: string;
    countInStock: string;
    discount: string;
    rating: string;
    categoryId: string;
    imagesText: string;
    videosText: string;
    isFeatured: boolean;
    paletteSizeIds: string[];
    orphanSizes: string[];
    paletteColorIds: string[];
    orphanColors: string[];
  },
  catLookup: Map<string, AdminCategoryRow>,
): Record<string, unknown> {
  const images = parseLines(values.imagesText);
  const imgs = images.length > 0 ? images : [PLACEHOLDER_IMG];
  const videos = parseLines(values.videosText);

  const cat = values.categoryId ? catLookup.get(values.categoryId) : undefined;

  const size = mergePaletteAndOrphans(values.paletteSizeIds, values.orphanSizes);
  const colors = mergePaletteAndOrphans(values.paletteColorIds, values.orphanColors);

  return {
    name: values.name.trim(),
    description: values.description.trim() || ' ',
    brand: values.brand.trim(),
    price: Number(values.price) || 0,
    oldPrice: Number(values.oldPrice) || 0,
    countInStock: Number(values.countInStock) || 0,
    discount: Number(values.discount) || 0,
    rating: Number(values.rating) || 0,
    isFeatured: values.isFeatured,
    category: values.categoryId || undefined,
    catId: cat?._id ?? '',
    catName: cat?.name ?? '',
    subCat: '',
    subCatId: '',
    thirdsubCat: '',
    thirdsubCatId: '',
    images: imgs,
    bannerimages: imgs,
    videos,
    ...(size.length ? { size } : {}),
    ...(colors.length ? { colors } : {}),
  };
}

export function AdminProductSheet({ open, onOpenChange, mode, productId, categories }: Props) {
  const queryClient = useQueryClient();
  const catLookup = new Map(categories.map((c) => [c._id, c]));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('0');
  const [oldPrice, setOldPrice] = useState('0');
  const [countInStock, setCountInStock] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [rating, setRating] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [imagesText, setImagesText] = useState(PLACEHOLDER_IMG);
  const [videosText, setVideosText] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [paletteSizeIds, setPaletteSizeIds] = useState<string[]>([]);
  const [orphanSizes, setOrphanSizes] = useState<string[]>([]);
  const [paletteColorIds, setPaletteColorIds] = useState<string[]>([]);
  const [orphanColors, setOrphanColors] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const productVideoInputRef = useRef<HTMLInputElement>(null);

  const { data: loaded, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin', 'product-edit', productId],
    queryFn: () => adminProductsService.getById(productId!),
    enabled: open && mode !== 'create' && Boolean(productId),
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      setName('');
      setDescription('');
      setBrand('');
      setPrice('0');
      setOldPrice('0');
      setCountInStock('0');
      setDiscount('0');
      setRating('0');
      setCategoryId('');
      setImagesText(PLACEHOLDER_IMG);
      setVideosText('');
      setIsFeatured(false);
      setPaletteSizeIds([]);
      setOrphanSizes([]);
      setPaletteColorIds([]);
      setOrphanColors([]);
      return;
    }
    if (!loaded) return;
    const p = loaded as Product;
    setName(mode === 'duplicate' ? `${p.name ?? ''} (копия)` : (p.name ?? ''));
    setDescription(p.description ?? '');
    setBrand(p.brand ?? '');
    setPrice(String(p.price ?? 0));
    setOldPrice(String(p.oldPrice ?? 0));
    setCountInStock(String(p.countInStock ?? 0));
    setDiscount(String(p.discount ?? 0));
    setRating(String(p.rating ?? 0));
    const cid =
      typeof p.category === 'object' && p.category?._id
        ? p.category._id
        : typeof p.category === 'string'
          ? p.category
          : '';
    setCategoryId(cid);
    setImagesText((p.images ?? []).join('\n') || PLACEHOLDER_IMG);
    setVideosText((p.videos ?? []).join('\n'));
    setIsFeatured(Boolean(p.isFeatured));
    const rawSizes = (p.size ?? []).map(String).filter((s) => s.trim());
    const nextSizeIds: string[] = [];
    const nextSizeOrphans: string[] = [];
    const seenSzId = new Set<string>();
    const seenSzOr = new Set<string>();
    for (const s of rawSizes) {
      const t = s.trim();
      const sid = normalizeProductSizeToken(t);
      if (sid) {
        if (!seenSzId.has(sid)) {
          seenSzId.add(sid);
          nextSizeIds.push(sid);
        }
      } else if (!seenSzOr.has(t)) {
        seenSzOr.add(t);
        nextSizeOrphans.push(t);
      }
    }
    setPaletteSizeIds(nextSizeIds);
    setOrphanSizes(nextSizeOrphans);
    const rawColors = (p.colors ?? []).map(String).filter((c) => c.trim());
    const nextIds: string[] = [];
    const nextOrphans: string[] = [];
    const seenId = new Set<string>();
    const seenOrphan = new Set<string>();
    for (const c of rawColors) {
      const t = c.trim();
      const nid = normalizeProductColorToken(t);
      if (nid) {
        if (!seenId.has(nid)) {
          seenId.add(nid);
          nextIds.push(nid);
        }
      } else if (!seenOrphan.has(t)) {
        seenOrphan.add(t);
        nextOrphans.push(t);
      }
    }
    setPaletteColorIds(nextIds);
    setOrphanColors(nextOrphans);
  }, [open, mode, loaded]);

  const saveCreate = useMutation({
    mutationFn: () =>
      adminProductsService.create(
        buildPayload(
          {
            name,
            description,
            brand,
            price,
            oldPrice,
            countInStock,
            discount,
            rating,
            categoryId,
            imagesText,
            videosText,
            isFeatured,
            paletteSizeIds,
            orphanSizes,
            paletteColorIds,
            orphanColors,
          },
          catLookup,
        ),
      ),
    onSuccess: () => {
      toast.success('Товар создан');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка создания'),
  });

  const saveUpdate = useMutation({
    mutationFn: () =>
      adminProductsService.update(
        productId!,
        buildPayload(
          {
            name,
            description,
            brand,
            price,
            oldPrice,
            countInStock,
            discount,
            rating,
            categoryId,
            imagesText,
            videosText,
            isFeatured,
            paletteSizeIds,
            orphanSizes,
            paletteColorIds,
            orphanColors,
          },
          catLookup,
        ),
      ),
    onSuccess: () => {
      toast.success('Товар сохранён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-edit', productId] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Ошибка сохранения'),
  });

  const busy = saveCreate.isPending || saveUpdate.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название');
      return;
    }
    if (mode === 'edit') saveUpdate.mutate();
    else saveCreate.mutate();
  };

  const togglePaletteColor = (id: string) => {
    setPaletteColorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePaletteSize = (id: string) => {
    setPaletteSizeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full px-3 flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create'
              ? 'Новый товар'
              : mode === 'duplicate'
                ? 'Дублирование товара'
                : 'Редактирование товара'}
          </SheetTitle>
          <SheetDescription>
            Поля соответствуют модели на сервере. URL изображений и видео — по одному в строке.
          </SheetDescription>
        </SheetHeader>

        {mode !== 'create' && productId && isLoadingProduct ? (
          <p className="text-muted-foreground py-6 text-sm">Загрузка…</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Название</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Описание</Label>
              <Textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-brand">Бренд</Label>
                <Input
                  className="bg-gray-100"
                  id="p-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <AdminCategoryCombobox
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-price">Цена</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-old">Старая цена</Label>
                <Input
                  id="p-old"
                  type="number"
                  min={0}
                  step="0.01"
                  className="bg-gray-100"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-stock">Остаток</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min={0}
                  className="bg-gray-100"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-disc">Скидка %</Label>
                <Input
                  id="p-disc"
                  type="number"
                  min={0}
                  className="bg-gray-100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-rating">Рейтинг</Label>
              <Input
                id="p-rating"
                type="number"
                min={0}
                className="bg-gray-100"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Размеры</Label>
                <p className="text-xs text-muted-foreground">
                  Один справочник для каталога, карточки товара и корзины. В БД сохраняются коды
                  (например <code className="text-[10px]">s</code>,{' '}
                  <code className="text-[10px]">c42</code>, <code className="text-[10px]">e41</code>
                  ).
                </p>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_SIZE_PALETTE.map((entry) => {
                      const selected = paletteSizeIds.includes(entry.id);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => togglePaletteSize(entry.id)}
                          className={cn(
                            'min-w-[2.75rem] cursor-pointer rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/25'
                              : 'border-transparent bg-background hover:bg-muted/80',
                          )}
                        >
                          {entry.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {orphanSizes.length > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-xs">
                    <p className="mb-1.5 font-medium text-amber-900 dark:text-amber-100">
                      Размеры не из справочника (старые карточки)
                    </p>
                    <p className="mb-2 text-amber-800/90 dark:text-amber-200/90">
                      Удалите или замените выбором выше.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {orphanSizes.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setOrphanSizes((prev) => prev.filter((x) => x !== o))}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-600/40 bg-background px-2 py-0.5 text-[11px] hover:bg-amber-500/20"
                        >
                          {o}
                          <span className="text-amber-700" aria-hidden>
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Цвета</Label>
                <p className="text-xs text-muted-foreground">
                  Выберите варианты из палитры — на сайте покажется цветной кружок и название.
                </p>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_COLOR_PALETTE.map((entry) => {
                      const selected = paletteColorIds.includes(entry.id);
                      const v = getProductColorVisual(entry.id);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => togglePaletteColor(entry.id)}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/25'
                              : 'border-transparent bg-background hover:bg-muted/80',
                          )}
                        >
                          <span
                            className={cn(
                              'h-6 w-6 shrink-0 rounded-full border border-black/15 dark:border-white/20',
                              v.ring && 'ring-2 ring-border ring-offset-1 ring-offset-background',
                            )}
                            style={v.style}
                            aria-hidden
                          />
                          <span className="leading-tight">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {orphanColors.length > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-xs">
                    <p className="mb-1.5 font-medium text-amber-900 dark:text-amber-100">
                      Значения не из палитры (старые карточки)
                    </p>
                    <p className="mb-2 text-amber-800/90 dark:text-amber-200/90">
                      Удалите или замените выбором выше — иначе они останутся в товаре.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {orphanColors.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setOrphanColors((prev) => prev.filter((x) => x !== o))}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-600/40 bg-background px-2 py-0.5 text-[11px] hover:bg-amber-500/20"
                        >
                          {o}
                          <span className="text-amber-700" aria-hidden>
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="p-feat"
                className="cursor-pointer"
                checked={isFeatured}
                onCheckedChange={(v) => setIsFeatured(v === true)}
              />
              <Label htmlFor="p-feat" className="cursor-pointer font-normal">
                Рекомендуемый на главной
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-vid">
                Видео в галерее (URL или загрузка, до 3 роликов, до{' '}
                {Math.round(PRODUCT_VIDEO_MAX_BYTES / (1024 * 1024))} МБ каждый)
              </Label>
              <Textarea
                id="p-vid"
                value={videosText}
                onChange={(e) => setVideosText(e.target.value)}
                rows={3}
                placeholder="https://example.com/preview.mp4"
                className="font-mono text-xs"
              />
              <input
                ref={productVideoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const list = e.target.files;
                  if (!list?.length) return;
                  const existing = parseLines(videosText).length;
                  const cap = Math.max(0, 3 - existing);
                  if (cap <= 0) {
                    toast.error('Уже максимум 3 видео — удалите строки в поле выше');
                    e.target.value = '';
                    return;
                  }
                  setUploadingVideos(true);
                  try {
                    const urls = await uploadProductVideoFiles(Array.from(list).slice(0, cap));
                    setVideosText((prev) => {
                      const lines = prev
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      return [...lines, ...urls].join('\n');
                    });
                    toast.success(`Видео загружено: ${urls.length}`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Ошибка загрузки видео');
                  } finally {
                    setUploadingVideos(false);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadingVideos || busy || parseLines(videosText).length >= 3}
                onClick={() => productVideoInputRef.current?.click()}
              >
                {uploadingVideos ? 'Загрузка видео…' : 'Загрузить видео с устройства'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-img">Изображения (URL, по одному в строке)</Label>
              <Textarea
                id="p-img"
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                rows={5}
                className="font-mono text-xs"
              />
              <input
                ref={productFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const list = e.target.files;
                  if (!list?.length) return;
                  setUploadingImages(true);
                  try {
                    const urls = await uploadProductImageFiles(Array.from(list).slice(0, 12));
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
                onClick={() => productFileInputRef.current?.click()}
              >
                {uploadingImages ? 'Загрузка…' : 'Загрузить файлы (Cloudinary)'}
              </Button>
            </div>
            <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy}>
                {mode === 'edit' ? 'Сохранить' : 'Создать'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
