'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TbCameraStar } from 'react-icons/tb';
import { toast } from 'sonner';
import {
  fileToDataUrl,
  saveVisualSearchSession,
  searchProductsByImage,
} from '../lib/image-search-service';

type ImageSearchButtonProps = {
  className?: string;
  iconClassName?: string;
  size?: number;
};

export function ImageSearchButton({ className, iconClassName, size = 25 }: ImageSearchButtonProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const resetPreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setSelectedFile(null);
    setFileName('');
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !file.type.startsWith('image/')) {
      toast.error('Выберите файл изображения');
      return;
    }

    resetPreview();
    setSelectedFile(file);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (isSearching) return;
    setIsDialogOpen(open);
    if (!open) {
      resetPreview();
    }
  };

  const handleSearch = async () => {
    if (!selectedFile) return;

    setIsSearching(true);
    try {
      const [result, previewDataUrl] = await Promise.all([
        searchProductsByImage(selectedFile),
        fileToDataUrl(selectedFile),
      ]);

      if (result.products.length === 0) {
        toast.info('Похожие товары не найдены — попробуйте другое фото');
        return;
      }

      saveVisualSearchSession({
        products: result.products,
        previewDataUrl,
        fileName: selectedFile.name,
        matchType: result.matchType,
        savedAt: Date.now(),
      });

      setIsDialogOpen(false);
      resetPreview();
      router.push('/search?byImage=1');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось выполнить поиск по фото');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only z-0"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none',
          className,
        )}
        aria-label="Найти по фото"
        onClick={handleOpenPicker}
      >
        <TbCameraStar className={cn('text-indigo-400', iconClassName)} size={size} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader className='max-w-sm m-auto'>
            <DialogTitle>Поиск по фото</DialogTitle>
          </DialogHeader>

          {previewUrl ? (
            <div className="rounded-3xl outline-none">
              <img
                src={previewUrl}
                alt={fileName || 'Загруженное фото'}
                className="mx-auto rounded-3xl w-52 object-contain"
              />
              {fileName ? (
                <p className="text-muted-foreground mt-2 truncate text-center text-xs">
                  {fileName}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <div className='flex justify-center items-center gap-2 '>
              <Button
              type="button"
              variant="outline"
              disabled={isSearching}
              onClick={() => handleDialogChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              className="bg-indigo-500 hover:bg-indigo-500/90"
              disabled={!selectedFile || isSearching}
              onClick={() => void handleSearch()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Ищем…
                </>
              ) : (
                'Найти похожие'
              )}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
