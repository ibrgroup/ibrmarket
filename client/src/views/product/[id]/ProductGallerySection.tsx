'use client';

import type { ProductGallerySlide } from '@/entities/product/lib/product-gallery';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import type { PlyrLike } from '@/shared/ui/product-video-plyr';
import { ProductVideoPlyr } from '@/shared/ui/product-video-plyr';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, Heart, Play, Share2, X } from 'lucide-react';
import Image from 'next/image';
import { FaAngleLeft } from "react-icons/fa6";
import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface ProductGallerySectionProps {
  productName: string;
  gallerySlides: ProductGallerySlide[];
  hasDiscount: boolean;
  discountPercent: number;
  inStock: boolean;
  isWishlisted: boolean;
  copied: boolean;
  onWishlistClick: () => void;
  onShareClick: () => void;
  onSlideChange: (index: number) => void;
}

function slideAlt(name: string, slide: ProductGallerySlide, index: number, total: number): string {
  const base = name.trim() || 'Товар';
  if (total <= 1) {
    return slide.type === 'video' ? `${base}, видео товара` : base;
  }
  if (slide.type === 'video') {
    return `${base} — видео ${index + 1} из ${total}`;
  }
  return `${base} — фото ${index + 1} из ${total}`;
}

function clampZoom(z: number): number {
  return Math.min(3, Math.max(1, Math.round(z * 100) / 100));
}

function touchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function ProductGallerySection({
  productName,
  gallerySlides,
  inStock,
  isWishlisted,
  copied,
  onWishlistClick,
  onShareClick,
  onSlideChange,
}: ProductGallerySectionProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoadedByUrl, setImageLoadedByUrl] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  const thumbnailsRefVertical = useRef<HTMLDivElement>(null);
  const thumbnailsRefHorizontal = useRef<HTMLDivElement>(null);
  const urlSlideAppliedRef = useRef(false);
  const lastLightboxTapRef = useRef(0);
  const lightboxZoomRef = useRef(1);
  const lightboxScrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ d0: number; z0: number } | null>(null);
  const skipLightboxDoubleTapRef = useRef(false);
  const mainPlyrRef = useRef<PlyrLike | null>(null);

  /* 
    РАЗРЕШАЕМ ПЕРЕТАСКИВАНИЕ.
    Если курсор на контролах плеера (.plyr__controls) — запрещаем drag, 
    чтобы можно было регулировать громкость.
  */
  const allowEmblaCarouselDrag = useCallback((_api: unknown, event: MouseEvent | TouchEvent) => {
    const t = event.target;
    if (!(t instanceof Element)) return true;
    if (t.closest('.plyr__controls') || t.closest('.plyr__menu')) {
      return false;
    }
    return true;
  }, []);

  /* 
    НАСТРОЙКИ ДЛЯ ЛИСТАНИЯ ПО ОДНОМУ СЛАЙДУ (жесткая привязка)
  */
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: gallerySlides.length > 1,
    align: 'start',
    watchDrag: true,
    dragFree: false, /* Листаем строго по одному слайду */
    dragThreshold: 10,
    skipSnaps: false,
  });

  const showGalleryNav = gallerySlides.length > 1;
  const safeIndex = gallerySlides.length > 0 ? Math.min(selectedImage, gallerySlides.length - 1) : 0;
  const currentSlide = gallerySlides.length > 0 ? gallerySlides[safeIndex] : null;
  const gallerySlidesKey = useMemo(() => gallerySlides.map((s) => `${s.type}:${s.url}`).join('|'), [gallerySlides, gallerySlides.length]);
  const activeSlideIsVideo = currentSlide?.type === 'video';
  const mainImageShowsLoader = currentSlide?.type === 'image' && !imageLoadedByUrl[currentSlide.url];

  const markImageUrlLoaded = useCallback((url: string) => {
    setImageLoadedByUrl((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
  }, []);

  const goNext = useCallback(() => {
    if (gallerySlides.length <= 1) return;
    setLightboxZoom(1);
    setSelectedImage((prev) => (prev < gallerySlides.length - 1 ? prev + 1 : 0));
  }, [gallerySlides.length]);

  const goPrev = useCallback(() => {
    if (gallerySlides.length <= 1) return;
    setLightboxZoom(1);
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : gallerySlides.length - 1));
  }, [gallerySlides.length]);

  const enterThumbnail = useCallback((index: number) => {
    setLightboxZoom(1);
    setSelectedImage(index);
  }, []);

  useEffect(() => {
    if (gallerySlides.length === 0) return;
    setSelectedImage((prev) => Math.min(prev, gallerySlides.length - 1));
  }, [gallerySlides.length]);

  useEffect(() => {
    lightboxZoomRef.current = lightboxZoom;
  }, [lightboxZoom]);

  useEffect(() => {
    if (!emblaApi || gallerySlides.length === 0) return;
    emblaApi.reInit({
      loop: gallerySlides.length > 1,
      align: 'start',
      watchDrag: true,
      dragFree: false,
      dragThreshold: 10,
      skipSnaps: false,
    });
  }, [emblaApi, gallerySlidesKey, gallerySlides.length]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const i = emblaApi.selectedScrollSnap();
      setSelectedImage(i);
    };
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || gallerySlides.length === 0) return;
    const target = Math.min(safeIndex, gallerySlides.length - 1);
    const id = requestAnimationFrame(() => {
      if (emblaApi.selectedScrollSnap() !== target) {
        emblaApi.scrollTo(target, true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [emblaApi, safeIndex, gallerySlides.length, gallerySlidesKey]);

  useEffect(() => {
    if (!lightboxOpen) return;
    try {
      mainPlyrRef.current?.pause();
    } catch {
      mainPlyrRef.current = null;
    }
  }, [lightboxOpen]);

  useEffect(() => {
    if (urlSlideAppliedRef.current || gallerySlides.length === 0) return;
    if (typeof window !== 'undefined') {
      const raw = new URLSearchParams(window.location.search).get('image');
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 1) {
          const idx = Math.min(Math.max(0, n - 1), gallerySlides.length - 1);
          setSelectedImage(idx);
        }
      }
    }
    urlSlideAppliedRef.current = true;
  }, [gallerySlides.length]);

  useEffect(() => {
    onSlideChange(safeIndex);
  }, [safeIndex, onSlideChange]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxOpen(false);
      } else if (e.key === '+' || e.code === 'NumpadAdd' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        setLightboxZoom((z) => clampZoom(z * 1.12));
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setLightboxZoom((z) => clampZoom(z / 1.12));
      } else if (e.key === '0') {
        e.preventDefault();
        setLightboxZoom(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goNext, goPrev]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const imageUrls = gallerySlides.filter((s): s is ProductGallerySlide & { type: 'image' } => s.type === 'image').map((s) => s.url);
    const unique = [...new Set(imageUrls)];
    const cleanups: Array<() => void> = [];
    for (const href of unique) {
      const img = document.createElement('img');
      const done = () => markImageUrlLoaded(href);
      img.addEventListener('load', done);
      img.addEventListener('error', done);
      img.src = href;
      if (img.complete && img.naturalWidth > 0) done();
      cleanups.push(() => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, [gallerySlidesKey, markImageUrlLoaded]);

  useEffect(() => {
    if (typeof document === 'undefined' || gallerySlides.length === 0) return;
    const imageUrls = gallerySlides.filter((s): s is ProductGallerySlide & { type: 'image' } => s.type === 'image').map((s) => s.url);
    const hrefs = [...new Set(imageUrls)];
    const links = hrefs.map((href) => {
      const el = document.createElement('link');
      el.rel = 'preload';
      el.as = 'image';
      el.href = href;
      document.head.appendChild(el);
      return el;
    });
    return () => links.forEach((l) => l.remove());
  }, [gallerySlidesKey, gallerySlides.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || gallerySlides.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const idx = safeIndex + 1;
    if (params.get('image') === String(idx)) return;
    params.set('image', String(idx));
    const path = window.location.pathname;
    const q = params.toString();
    window.history.replaceState(null, '', q ? `${path}?${q}` : path);
  }, [safeIndex, gallerySlides.length]);

  useEffect(() => {
    const onPop = () => {
      if (gallerySlides.length === 0) return;
      const raw = new URLSearchParams(window.location.search).get('image');
      if (raw == null || raw === '') return;
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n) || n < 1) return;
      const idx = Math.min(Math.max(0, n - 1), gallerySlides.length - 1);
      setSelectedImage(idx);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [gallerySlides.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const el = lightboxScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setLightboxZoom((z) => clampZoom(e.deltaY < 0 ? z * 1.08 : z / 1.08));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [lightboxOpen]);

  useEffect(() => {
    const scrollThumbIntoView = (container: HTMLDivElement | null) => {
      if (!container || selectedImage >= gallerySlides.length) return;
      const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const buttons = container.querySelectorAll('button');
      buttons[selectedImage]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    };
    scrollThumbIntoView(thumbnailsRefVertical.current);
    scrollThumbIntoView(thumbnailsRefHorizontal.current);
  }, [selectedImage, gallerySlides.length]);

  return (
    <>
      <section className="min-w-0 lg:col-span-5 xl:span-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          {showGalleryNav && (
            <div
              ref={thumbnailsRefVertical}
              className="hide-scrollbar hidden h-[680px] w-[46px] flex-shrink-0 flex-col gap-2 overflow-y-auto overscroll-y-contain pr-1 md:flex lg:w-[70px]"
              aria-label="Миниатюры"
            >
              {gallerySlides.map((slide, index) => (
                <button
                  key={`${slide.type}-${index}-${slide.url}`}
                  type="button"
                  onClick={() => enterThumbnail(index)}
                  onFocus={() => enterThumbnail(index)}
                  className={cn(
                    'flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all outline-none',
                    selectedImage === index
                      ? 'border-purple-600 shadow-md ring-2 ring-purple-200 dark:border-purple-400 dark:ring-purple-900/30'
                      : 'border-gray-200 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600',
                  )}
                  aria-label={
                    slide.type === 'video'
                      ? `Видео ${index + 1} из ${gallerySlides.length}`
                      : `Фото ${index + 1} из ${gallerySlides.length}`
                  }
                  aria-current={selectedImage === index ? 'true' : undefined}
                >
                  {slide.type === 'video' ? (
                    <div className="relative aspect-square h-[72px] w-full lg:h-[84px]">
                      <video autoPlay src={slide.url} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-hidden />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="size-7 text-white drop-shadow-md" strokeWidth={1.5} />
                      </div>
                    </div>
                  ) : (
                    <Image src={slide.url} alt="" width={92} height={92} className="aspect-square h-[85px] object-cover" draggable={false} sizes="92px" />
                  )}
                </button>
              ))}
            </div>
          )}

               <div className="relative min-w-0 flex-1">
        <div
          role="region"
          aria-label={
            currentSlide
              ? `${slideAlt(productName, currentSlide, safeIndex, gallerySlides.length)}. Листайте стрелками, свайпами или перетаскиванием, Enter или пробел — на весь экран.`
              : 'Галерея товара'
          }
          tabIndex={0}
          onKeyDown={(e) => {
            if (showGalleryNav) {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
                return;
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
                return;
              }
            }
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (gallerySlides.length > 0) setLightboxOpen(true);
            }
          }}
          className="relative w-full h-full overflow-hidden bg-gray-50 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-zinc-900"
        >
          {mainImageShowsLoader && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600 motion-reduce:animate-none motion-reduce:border-2 motion-reduce:border-purple-600/40" />
            </div>
          )}
          {gallerySlides.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-gray-500 dark:text-zinc-400">Нет фото</div>
          ) : (
            <>
              <div
                ref={emblaRef}
                className="h-full relative group"
                onDragStart={allowEmblaCarouselDrag}
                onTouchStart={(e) => {
                  const t = e.target;
                  if (!(t instanceof Element)) return;
                  if (t.closest('video') || t.closest('.plyr')) {
                    e.stopPropagation();
                  }
                }}
              >
                <div className="flex">
                  {gallerySlides.map((slide, index) => (
                    <div
                      key={`${slide.type}-${index}-${slide.url}`}
                      className="relative min-h-0 min-w-0 flex-[0_0_100%]"
                    >
                      <div className="group relative w-full h-full flex items-center justify-center">
                        {slide.type === 'video' ? (
                          index === safeIndex ? (
                            <div
                              className="absolute inset-0 z-10 cursor-pointer md:rounded-2xl flex min-h-0 flex-col bg-black overflow-hidden pointer-events-auto"
                              onClick={() => setLightboxOpen(true)}
                            >
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <Play className="text-white text-6xl drop-shadow-lg opacity-70" />
                              </div>
                              <ProductVideoPlyr
                                key={slide.url}
                                src={slide.url}
                                title={slideAlt(productName, slide, index, gallerySlides.length)}
                                className="flex-1 pointer-events-auto"
                                autoplay
                                startMutedForAutoplayPolicy
                                onPlayerReady={(p: PlyrLike) => {
                                  mainPlyrRef.current = p;
                                }}
                                onPlayerDestroy={() => {
                                  mainPlyrRef.current = null;
                                }}
                              />
                            </div>
                          ) : null
                        ) : (
                          <img
                            src={slide.url}
                            alt={slideAlt(productName, slide, index, gallerySlides.length)}
                            className="md:rounded-2xl cursor-pointer object-contain max-h-[80vh] max-w-full"
                            onClick={() => setLightboxOpen(true)}
                            draggable={false}
                            ref={(el) => {
                              if (el?.complete && el.naturalHeight > 0) {
                                markImageUrlLoaded(slide.url);
                              }
                            }}
                            onLoad={() => markImageUrlLoaded(slide.url)}
                            onError={() => markImageUrlLoaded(slide.url)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {showGalleryNav && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      className="absolute top-1/2 left-4 z-21 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Предыдущий слайд"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      className="absolute top-1/2 right-4 z-21 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Следующий слайд"
                    >
                      <ArrowRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {!inStock && (
            <div className="absolute rounded-2xl inset-0 z-[15] flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="px-4 py-2 bg-red-500 text-base font-roboto">Нет в наличии</Badge>
            </div>
          )}

          {showGalleryNav && (
            <p
              className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 -translate-y-1/3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm md:block"
              aria-live="polite"
            >
              {safeIndex + 1} / {gallerySlides.length}
            </p>
          )}

          <Link 
           href={'/products'}
            role="button" 
            tabIndex={0}
            className="cursor-pointer md:hidden top-3 left-3 absolute rounded-md bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:bg-zinc-900/80 z-30"
            aria-label="Назад к товарам"
          >
            <FaAngleLeft size={24}/>
          </Link>
          
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 md:hidden">
            <button
              type="button"
              onClick={onWishlistClick}
              className="cursor-pointer rounded-md bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:bg-zinc-900/80"
              aria-label={isWishlisted ? 'Убрать из избранного' : 'В избранное'}
            >
              <Heart
                className={cn(
                  'h-6 w-6 transition',
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-900 hover:text-indigo-500 dark:text-zinc-100',
                )}
              />
            </button>
            <button
              type="button"
              onClick={onShareClick}
              className="cursor-pointer rounded-md bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:bg-zinc-900/80"
              aria-label="Поделиться"
            >
              <Share2
                className={cn(
                  'h-6 w-6 transition',
                  copied ? 'text-green-600 dark:text-green-400' : 'text-gray-900 hover:text-indigo-500 dark:text-zinc-100',
                )}
              />
            </button>
          </div>
        </div>

        {showGalleryNav && (
          <div
            ref={thumbnailsRefHorizontal}
            className="hide-scrollbar bg-white rounded-b-3xl flex gap-2 overflow-x-auto p-3 md:hidden"
            aria-label="Листать фото"
          >
            {gallerySlides.map((slide, index) => (
              <button
                key={`m-${slide.type}-${index}-${slide.url}`}
                type="button"
                onClick={() => enterThumbnail(index)}
                className={cn(
                  'flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all',
                  selectedImage === index
                    ? 'border-indigo-500 dark:border-indigo-400 dark:ring-purple-900/30'
                    : 'border-gray-200 dark:border-zinc-700',
                )}
                aria-label={slide.type === 'video' ? `Видео ${index + 1}` : `Фото ${index + 1}`}
              >
                {slide.type === 'video' ? (
                  <div className="relative h-14 w-10">
                    <video autoPlay src={slide.url} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="size-6 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                ) : (
                  <Image src={slide.url} alt="" width={88} height={88} className="aspect-square h-14 w-10 object-cover" draggable={false} sizes="88px" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </section>

  <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
    <DialogContent
      showCloseButton={false}
      overlayClassName="z-[200] bg-black/95 backdrop-blur-sm"
      className={cn(
        'fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full max-w-none',
        'translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-transparent p-0 shadow-none',
        'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
      )}
      aria-describedby={undefined}
    >
      <DialogTitle className="sr-only">Просмотр галереи: {productName}</DialogTitle>
      <div className="flex h-full min-h-0 bg-[#222222] flex-col">
        <div className="flex shrink-0 items-center justify-end px-3 pb-2">
          <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white hover:bg-white/10 hover:text-white" onClick={() => setLightboxOpen(false)} aria-label="Закрыть">
            <X className="size-7" />
          </Button>
        </div>
        <div ref={lightboxScrollRef} className="relative flex min-h-0 flex-1 overflow-auto px-4 pb-6">
          {currentSlide?.type === 'video' ? (
            <div className="relative flex min-h-full w-full touch-manipulation items-center justify-center">
              <div className="w-full max-w-[100vw] px-1">
                <ProductVideoPlyr
                  key={currentSlide.url}
                  src={currentSlide.url}
                  title={slideAlt(productName, currentSlide, safeIndex, gallerySlides.length)}
                  className="max-h-[min(88dvh,100vw)]"
                  autoplay
                  startMutedForAutoplayPolicy
                />
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-full w-full touch-pan-x touch-pan-y items-center justify-center">
              {currentSlide ? (
                <div
                  role="presentation"
                  className={cn(
                    'origin-center transition-transform duration-200 ease-out motion-reduce:transition-none',
                    lightboxZoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in',
                  )}
                  style={{ transform: `scale(${lightboxZoom})` }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    setLightboxZoom((z) => (z > 1 ? 1 : 2));
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      skipLightboxDoubleTapRef.current = true;
                      pinchRef.current = { d0: touchDistance(e.touches[0], e.touches[1]), z0: lightboxZoomRef.current };
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 2 && pinchRef.current && e.cancelable) {
                      e.preventDefault();
                      const d = touchDistance(e.touches[0], e.touches[1]);
                      const ratio = d / pinchRef.current.d0;
                      setLightboxZoom(clampZoom(pinchRef.current.z0 * ratio));
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (e.touches.length < 2) pinchRef.current = null;
                    if (e.touches.length > 0) return;
                    if (skipLightboxDoubleTapRef.current) {
                      skipLightboxDoubleTapRef.current = false;
                      return;
                    }
                    const now = Date.now();
                    if (now - lastLightboxTapRef.current < 280) {
                      e.preventDefault();
                      setLightboxZoom((z) => (z > 1 ? 1 : 2));
                      lastLightboxTapRef.current = 0;
                    } else {
                      lastLightboxTapRef.current = now;
                    }
                  }}
                >
                  <img src={currentSlide.url} alt={slideAlt(productName, currentSlide, safeIndex, gallerySlides.length)} className="md:w-[600px] object-contain rounded-2xl" draggable={false} />
                </div>
              ) : null}

              {showGalleryNav && currentSlide && (
                <div className="group/lb absolute inset-0">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute top-1/2 left-4 z-21 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/80 opacity-0 group-hover/lb:opacity-100 transition-opacity duration-200"
                    aria-label="Предыдущий слайд"
                  >
                    <ArrowLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute top-1/2 right-4 z-21 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/80 opacity-0 group-hover/lb:opacity-100 transition-opacity duration-200"
                    aria-label="Следующий слайд"
                  >
                    <ArrowRight className="size-6" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {currentSlide ? (
          <p className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-zinc-400">
            {showGalleryNav ? `${safeIndex + 1} / ${gallerySlides.length} · ` : ''}
            {currentSlide.type === 'video'
              ? 'Автостарт (звук можно включить в панели). Пауза — кнопка воспроизведения.'
              : lightboxZoom > 1
                ? 'Уменьшить: двойной клик, pinch, Ctrl+колёсико, −'
                : 'Увеличить: двойной клик, pinch, Ctrl+колёсико, + · сброс: 0'}
          </p>
        ) : null}
      </div>
    </DialogContent>
  </Dialog>
</>

  );
}