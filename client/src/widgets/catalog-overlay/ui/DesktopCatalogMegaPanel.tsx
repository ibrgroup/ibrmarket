'use client';

import { cn } from '@/shared/lib/utils';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DesktopCatalog } from './DesktopCatalog';

/** Высота панели каталога на десктопе — не на весь экран */
const MEGA_PANEL_MAX_HEIGHT_PX = 620;

/** Быстрое выплытие из‑под хедера */
const ENTER_MS = 140;

type ShellBox = {
  top: number;
  left: number;
  width: number;
};

type DesktopCatalogMegaPanelProps = {
  initialCategory?: string;
  onClose: () => void;
};

function measureShellBox(): ShellBox {
  if (typeof document === 'undefined') {
    return { top: 72, left: 16, width: Math.min(1416, window.innerWidth - 32) };
  }
  const shell = document.querySelector<HTMLElement>('[data-site-chrome-shell]');
  if (shell) {
    const r = shell.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return {
        // −1px: перекрытие шва, панель визуально выезжает из-под шапки
        top: Math.round(r.bottom) - 1,
        left: Math.round(r.left),
        width: Math.round(r.width),
      };
    }
  }

  // fallback: как max-container
  const pad = window.innerWidth >= 768 ? 24 : 16;
  const width = Math.min(1416, window.innerWidth - pad * 2);
  return {
    top: 72,
    left: Math.round((window.innerWidth - width) / 2),
    width,
  };
}

export function DesktopCatalogMegaPanel({
  initialCategory,
  onClose,
}: DesktopCatalogMegaPanelProps) {
  const [box, setBox] = useState<ShellBox>(() =>
    typeof window === 'undefined' ? { top: 72, left: 16, width: 1200 } : measureShellBox(),
  );

  const scheduleMeasure = useCallback(() => {
    requestAnimationFrame(() => {
      setBox(measureShellBox());
    });
  }, []);

  useLayoutEffect(() => {
    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, {
        capture: true,
      } as AddEventListenerOptions);
    };
  }, [scheduleMeasure]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const panelMaxHeight = Math.min(
    MEGA_PANEL_MAX_HEIGHT_PX,
    Math.max(240, window.innerHeight - box.top - 12),
  );

  return createPortal(
    <>
      {/* Полный scrim: затемняет поля вокруг «острова» шапки */}
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]',
          'motion-safe:animate-in motion-safe:fade-in-0',
        )}
        style={{ animationDuration: `${ENTER_MS}ms` }}
        aria-label="Закрыть каталог"
        onClick={onClose}
      />

      {/*
        Панель ровно по ширине shell, z ниже sticky-шапки (50),
        выезжает снизу — как продолжение одного блока.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-mega-title"
        className={cn(
          'pointer-events-auto fixed z-[45] flex flex-col overflow-hidden',
          'rounded-b-3xl border border-t-0 border-indigo-700/20 bg-background',
          'shadow-2xl shadow-indigo-950/25',
          'origin-top will-change-transform',
          'motion-safe:animate-in motion-safe:slide-in-from-top motion-safe:fill-mode-both',
          'motion-safe:ease-out',
        )}
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: panelMaxHeight,
          animationDuration: `${ENTER_MS}ms`,
        }}
      >
        <h2 id="catalog-mega-title" className="sr-only">
          Каталог
        </h2>

          <DesktopCatalog initialCategory={initialCategory} onClose={onClose} />
     
      </div>
    </>,
    document.body,
  );
}
