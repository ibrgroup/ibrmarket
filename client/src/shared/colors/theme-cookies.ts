/**
 * Theme & color-scheme cookies: single source of truth for SSR-safe theming.
 *
 * Why cookies (not localStorage):
 * - Server can read cookies in layout and render <html> with correct class + data attributes.
 * - SSR and client then render identical HTML → no hydration mismatch, no white flash.
 *
 * Cookie names and validation are centralized here for server and client.
 */

import { THEME_DARK_SOLID_BG } from './theme-anti-fouc';

import type { ColorScheme, Theme } from './types';

/** Cookie key for theme (light | dark). */
export const THEME_COOKIE_NAME = 'ibr-market-theme';

/** Cookie key for color scheme. */
export const COLOR_SCHEME_COOKIE_NAME = 'ibr-market-color-scheme';

/** Max age for theme cookies (1 year). Non-httpOnly, so client can read/write. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const VALID_COLOR_SCHEMES: ColorScheme[] = [
  'violet',
  'blue',
  'green',
  'orange',
  'slate',
  'yellow',
  'pink',
  'teal',
  'indigo',
];

/**
 * Validates and normalizes theme from cookie/server. Ensures only 'light' | 'dark'.
 */
export function parseTheme(value: string | undefined): Theme {
  if (value === 'light' || value === 'dark') return value;
  return 'light';
}

/** Предпочтение пользователя из cookie: light | dark | system. */
export function parseStoredThemePreference(
  value: string | undefined,
  fallback: Theme = 'light',
): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return fallback;
}

/** Разрешённая тема для окраски UI (на сервере для system берите консервативный fallback). */
export function resolveActualTheme(stored: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (stored === 'system') return prefersDark ? 'dark' : 'light';
  return stored;
}

/**
 * Validates and normalizes color scheme from cookie/server.
 */
export function parseColorScheme(value: string | undefined): ColorScheme {
  if (VALID_COLOR_SCHEMES.includes(value as ColorScheme)) return value as ColorScheme;
  return 'violet';
}

/**
 * Client-only: set theme cookie and sync DOM. Called by ThemeProvider when user changes theme.
 * Cookie is the source of truth; next full reload will have server read it and inject into <html>.
 */
export function setThemeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = resolveActualTheme(theme, prefersDark);
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
  if (resolved === 'dark') {
    root.style.backgroundColor = THEME_DARK_SOLID_BG;
  } else {
    root.style.removeProperty('background-color');
  }
}

/**
 * Client-only: set color-scheme cookie and sync DOM.
 */
export function setColorSchemeCookie(scheme: ColorScheme): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COLOR_SCHEME_COOKIE_NAME}=${encodeURIComponent(scheme)}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  document.documentElement.setAttribute('data-color-scheme', scheme);
}
