'use client';

import { cn } from '@/shared/lib/utils';
import { useEffect, useRef } from 'react';

/** Минимальный тип инстанса Plyr для паузы/destroy */
export type PlyrLike = { pause: () => void; destroy: () => void; play?: () => Promise<void>; volume?: number; muted?: boolean };

type PlyrInstance = PlyrLike & {
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  play: () => Promise<void>;
  get currentTime(): number;
  set currentTime(v: number);
  loop: boolean;
};

export type ProductVideoPlyrProps = {
  src: string;
  poster?: string;
  className?: string;
  onPlayerReady?: (player: PlyrLike) => void;
  onPlayerDestroy?: () => void;
  title?: string;
  /** Автовоспроизведение при появлении */
  autoplay?: boolean;
};

/**
 * Видео-плеер, у которого ЗВУК ПОЛНОСТЬЮ ОТКЛЮЧЕН НА УРОВНЕ КОДА.
 * Пользователь не сможет его включить через интерфейс.
 */
export function ProductVideoPlyr({
  src,
  poster,
  className,
  onPlayerReady,
  onPlayerDestroy,
  title,
  autoplay = true,
}: ProductVideoPlyrProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onReadyRef = useRef(onPlayerReady);
  const onDestroyRef = useRef(onPlayerDestroy);
  
  // Обновляем ссылки на колбэки
  onReadyRef.current = onPlayerReady;
  onDestroyRef.current = onPlayerDestroy;

  useEffect(() => {
    const wrap = wrapRef.current;
    const videoEl = videoRef.current;
    if (!wrap || !videoEl) return;

    let player: PlyrLike | null = null;
    let endedListener: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const [{ default: PlyrCtor }] = await Promise.all([
          import('plyr'),
          import('plyr/dist/plyr.css'),
        ]);
        
        if (cancelled || !videoEl.isConnected) return;

        // Инициализация Plyr
        const instance = new PlyrCtor(videoEl, {
          loop: { active: true },
          autoplay,
          
          // КРИТИЧЕСКИ ВАЖНО: Отключаем управление звуком в UI
          controls: ['play', 'progress', 'current-time', 'settings', 'fullscreen'],
          settings: [], // Скрываем настройки вообще (там можно выбрать трек)
          
          // Важно: скрываем ползунок громкости из панели
          i18n: {
            speed: 'Скорость',
          },
        }) as PlyrInstance;

        player = instance;
        instance.loop = true;

        /* === ГАРАНТИРОВАННОЕ ОТКЛЮЧЕНИЕ ЗВУКА === */
        // 1. HTML-атрибут (блокирует автовоспроизведение со звуком)
        videoEl.muted = true;
        
        // 2. Программная установка громкости в 0 
        // (на случай, если Plyr попытается сбросить mute)
        instance.volume = 0;

        // Plyr может переопределять свойства, поэтому ставим блокировку
        Object.defineProperty(videoEl, 'muted', {
          value: true,
          writable: false,
        });
        Object.defineProperty(instance, 'volume', {
          value: 0,
          writable: false,
        });

        // Слушатель события "ended" для зацикливания
        endedListener = () => {
          if (cancelled || !videoEl.isConnected) return;
          try {
            instance.currentTime = 0;
            void instance.play().catch(() => {});
          } catch {
            // ignore
          }
        };
        instance.on('ended', endedListener);

        onReadyRef.current?.(player);

        if (autoplay && videoEl.paused) {
          try {
            await instance.play();
          } catch {
            void videoEl.play().catch(() => {});
          }
        }
      } catch (error) {
        console.error('[ProductVideoPlyr] Failed to load Plyr:', error);
      }
    })();

    return () => {
      cancelled = true;
      if (player && endedListener) {
        try {
          (player as PlyrInstance).off('ended', endedListener);
        } catch {
          // ignore
        }
      }
      onDestroyRef.current?.();
      try {
        player?.destroy();
      } catch {
        // ignore
      }
      player = null;
      endedListener = null;
    };
  }, [src, autoplay]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        'product-video-plyr relative z-[1] h-full [&_.plyr]:h-full [&_.plyr]:max-h-full [&_.plyr__controls]:touch-auto [&_video]:h-full [&_video]:max-h-full',
        className,
      )}
    >
      {/* Не ставим нативный loop на <video>, чтобы работало событие ended */}
      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="auto"
        title={title}
        muted // Обязательно дублируем здесь
        autoPlay={autoplay}
        disablePictureInPicture // Запрещаем PIP (в нем иногда слетают блокировки)
        className="max-h-[min(88dvh,100vw)] object-contain"
      />
    </div>
  );
}