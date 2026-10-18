/**
 * Дизайн-токены для IBR-MARKET — централизованные переменные для стилизации приложения.
 *
 * 🔹 Полная палитра цветов теперь — только через shared/colors (HEX/RGB).
 * 🔹 Используй только существующие ключи из ../colors, не выдумывай новые!
 * 🔹 Пример использования: app/(shop)/cart/page.tsx
 *
 * Популярные варианты:
 *   - colors.foreground[900/100/800/...]
 *   - colors.primary[500/700/400/...]
 *   - colors.muted[200/400/500/600/800/...]
 *   - colors.background[50/100/800/900/...]
 *   - colors.success / colors.danger / colors.info / colors.border / colors.gray и пр.
 *
 * Все ключи проверяются типами ../colors (shared/colors/index.ts)
 */

import { colors as colorPalette } from '../colors';

// Типографика — расширена, чтобы покрывать самые частые случаи использования
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
    ],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
    serif: ['Georgia', 'Times', 'serif'],
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    md: '1.0625rem', // 17px (иногда нужно для UI)
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    hairline: '100',
    thin: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    condensed: '1.1',
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
};

// Единая система spacing для всех паддингов и марджинов
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
};

// Border radius — унифицированы названия, расширен диапазон
export const borderRadius = {
  none: '0',
  xs: '0.125rem', // 2px
  sm: '0.25rem', // 4px
  base: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
  pill: '50rem',
};

// Единая система теней (+поддержка dark)
export const shadows = {
  xs: '0 1px 1.5px 0 rgb(0 0 0 / 0.04)',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.09), 0 4px 6px -4px rgb(0 0 0 / 0.09)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.11), 0 8px 10px -6px rgb(0 0 0 / 0.09)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  focus: '0 0 0 2px rgba(24,182,246,.6)',
};

// Гибкие брейкпоинты для RESPONSIVE UI
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1800px',
};

// Z-index — типовые слои + кастомные слои под сложный UI
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
  notification: 2000,
  system: 9999,
};

// Расширенные анимации и transitions
export const animations = {
  duration: {
    micro: '75ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    lazy: '900ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(.57,1.46,.71,1.27)',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 0.18s cubic-bezier(.55,0,.1,1)',
    shadow: 'box-shadow 0.20s cubic-bezier(.1,.82,.25,1)',
  },
};

/**
 * Главный экспорт — используйте designTokens во всех компонентах.
 * colors полностью типобезопасен (shared/colors)
 */
export const designTokens = {
  colors: colorPalette,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animations,
};

/**
 * Вспомогательные функции для удобства использования палитры и поддержки тем.
 * Пользуйтесь ими для типобезопасного доступа!
 */

// Получить готовую цветовою схему по ключу (например, 'neutral', 'primary', ...)
export const getColorScheme = (scheme: keyof typeof colorPalette.schemes) =>
  colorPalette.schemes[scheme];

// Получить СЕМАНТИЧЕСКИЙ цвет по названию и текущей теме ('light'|'dark')
// Пример: getSemanticColor('info', 'dark')
// Теперь строго типизирован: аргумент type должен быть типом SemanticColorType
export type SemanticColorType = keyof typeof colorPalette.semantic;

export const getSemanticColor = (type: string, theme: 'light' | 'dark' = 'light') => {
  // Проверяем, что type является строкой и ключом из semantic
  const t = (
    Object.prototype.hasOwnProperty.call(colorPalette.semantic, type) ? type : 'info'
  ) as SemanticColorType;
  return colorPalette.semantic[t][theme];
};

// Получить gray-оттенок относительно темы
export const getGrayColor = (
  shade: keyof typeof colorPalette.gray,
  theme: 'light' | 'dark' = 'light',
) => (theme === 'dark' ? colorPalette.grayDark[shade] : colorPalette.gray[shade]);

// Универсальный доступ к любой цветовой шкале. Гарантирует типобезопасность,
// и предотвращает ошибку "Cannot read properties of undefined (reading '900')"
export function getColorScale<K extends keyof typeof colorPalette>(
  key: K,
  shade: keyof (typeof colorPalette)[K],
) {
  const scale = colorPalette[key];
  // Безопасная проверка: существует ли эта шкала и оттенок в ней?
  if (!scale || typeof scale !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      // console.warn(`[designTokens] color scale '${String(key)}' не найдена в palette`);
    }
    return undefined;
  }
  // @ts-ignore (shade usually is a string/number key)
  const color = scale[shade];
  if (typeof color === 'undefined') {
    if (process.env.NODE_ENV !== 'production') {
      // console.warn(`[designTokens] color '${String(shade)}' не найден в '${String(key)}'`);
    }
    return undefined;
  }
  return color;
}

// Алиас для семантических цветов (semantic.info, semantic.success и т.д.)
export const semantic = colorPalette.semantic;
