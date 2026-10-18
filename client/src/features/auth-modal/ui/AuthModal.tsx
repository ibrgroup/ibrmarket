/**
 * Модальное окно авторизации — адаптивно: ПК справа, телефон снизу с высотой 50dvh
 * Desktop: панель справа, ширина 50vw, высота 100vh
 * Mobile: панель снизу (bottom sheet) высотой 50dvh
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { useAuthModalStore } from '../model/auth-modal.store';
import { AuthModalContent } from './AuthModalContent';
import { cn } from '@/shared/lib/utils';

export function AuthModal() {
  const { isOpen, close, resetIfNeeded } = useAuthModalStore();

  // Управление видимостью для анимаций закрытия
  const [renderPanel, setRenderPanel] = useState<boolean>(false);
  // Флаг, чтобы знать текущее состояние для десктопа/мобилки
  const [desktopOpen, setDesktopOpen] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Рефы для контента (необязательно, но оставлено на будущее)
  const panelDesktopRef = useRef<HTMLDivElement>(null);
  const panelMobileRef = useRef<HTMLDivElement>(null);

  // Блокируем прокрутку фона, когда модал открыт
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Управление анимациями входа/выхода
  useEffect(() => {
    if (isOpen) {
      setRenderPanel(true);
      // задержка перед активацией видимости (чтобы анимация сработала)
      const t = setTimeout(() => {
        setDesktopOpen(true);
        setMobileOpen(true);
      }, 20);
      return () => clearTimeout(t);
    } else {
      // закрытие: запускаем анимацию исчезновения, затем исчезаем из DOM
      setDesktopOpen(false);
      setMobileOpen(false);
      const t = setTimeout(() => {
        setRenderPanel(false);
        resetIfNeeded();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, resetIfNeeded]);

  // Закрытие по клавише Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // Закрытие по клике поBackdrop
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) close();
  };

  if (!renderPanel) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Авторизация" className="fixed inset-0 z-100">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Desktop: справа, панель 50vw, высота 100vh */}
      <div className="hidden md:flex md:fixed md:inset-0 md:justify-end" aria-hidden="false">
        <div
          ref={panelDesktopRef}
          className={cn(
            'h-full w-[25vw] bg-white shadow-xl overflow-hidden flex flex-col',
            'transform transition-transform duration-300',
            // slide-in справа: когда открыто — translate-x-0, закрыто — translate-x-full
            desktopOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>

           <div className="h-full overflow-auto pt-8 px-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md px-4">
              <AuthModalContent />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: снизу — 50dvh, плавное выдвижение */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 h-[155vw]">
        <div
          ref={panelMobileRef}
          className={cn(
            'h-full w-full bg-white/95 shadow-xl rounded-t-3xl overflow-hidden',
            'transform transition-transform duration-300',
            mobileOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-full overflow-auto pt-8 px-4" onClick={(e) => e.stopPropagation()}>
            <AuthModalContent />
          </div>
        </div>
      </div>
    </div>
  );
}