'use client';

import { cn } from '@/shared/lib/utils';
import { useCatalogOverlayStore } from '@/widgets/catalog-overlay';
import { useEffect, useState, type ReactNode } from 'react';

interface DesktopHeaderShellProps {
  children: ReactNode;
}

/**
 * Единая «шапка» desktop: TopBar + Header.
 * При открытом каталоге снимаем нижнее скругление — панель каталога продолжает блок без шва.
 */
export function DesktopHeaderShell({ children }: DesktopHeaderShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const catalogOpen = useCatalogOverlayStore((s) => s.open);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      data-site-chrome-shell
      data-site-chrome-measure
      className={cn(
        'w-full overflow-hidden bg-gradient-to-r from-indigo-700 to-blue-500 transition-[box-shadow,border-radius] duration-200',
        // Закрыт — «остров»; открыт каталог — низ прямой, скругление уезжает на панель
        catalogOpen ? 'rounded-b-none' : 'rounded-b-3xl',
        isScrolled || catalogOpen

      )}
    >
      {children}
    </div>
  );
}
