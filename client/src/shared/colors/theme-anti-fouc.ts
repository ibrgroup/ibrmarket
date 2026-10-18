/**
 * Совпадает с .dark { --app-background } в globals.css — для первого кадра до загрузки основого CSS.
 * Шрифтовые @import в начале globals откладывают правила темы; этот фрагмент встраивается в <head> из layout.
 */
export const THEME_DARK_SOLID_BG = '#0b1220';

/** Минимальный CSS в <head>, чтобы не было белой вспышки при тёмной теме. */
export function getThemeAntiFlashHeadCss(resolved: 'light' | 'dark'): string {
  if (resolved === 'dark') {
    return `html.dark{background-color:${THEME_DARK_SOLID_BG};color-scheme:dark}`;
  }
  return 'html.light{color-scheme:light;background-color:#f5f7fa}';
}
