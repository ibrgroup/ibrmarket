import type { HeaderMode } from '@/widgets/site-chrome/lib/chrome-config';

export type HeaderVariant = 'default' | 'embedded' | 'mobile-only';

export interface HeaderProps {
  className?: string;
  /** Режим мобильного хедера; на десктопе (md+) всегда полная навигация. */
  mode?: HeaderMode;
  /** default — самостоятельный sticky; embedded — внутри DesktopHeaderShell; mobile-only — только мобилка */
  variant?: HeaderVariant;
  /** Мобильная строка города над поиском (главная) */
  showTopBar?: boolean;
}
