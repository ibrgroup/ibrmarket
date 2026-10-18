'use client';

import { useLayoutEffect, useState, useSyncExternalStore } from 'react';

import { ThemeContext } from '../hooks';

import { resolveActualTheme, setColorSchemeCookie, setThemeCookie } from './theme-cookies';

import type {
  ActualTheme,
  ColorScheme,
  Theme,
  ThemeContextType,
  ThemeProviderProps,
} from './types';

const VALID_SCHEMES: ColorScheme[] = [
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

function subscribePreferredDark(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getPreferredDarkSnapshot() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getPreferredDarkServerSnapshot() {
  return false;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  defaultColorScheme = 'violet',
  initialTheme,
  initialColorScheme,
  themePreferenceFromCookie = false,
  colorSchemePreferenceFromCookie = false,
  storageKey = 'ibr-market-theme',
  colorSchemeStorageKey = 'ibr-market-color-scheme',
}: ThemeProviderProps) {
  const serverTheme = initialTheme ?? defaultTheme;
  const serverScheme = initialColorScheme ?? defaultColorScheme;

  const [theme, setTheme] = useState<Theme>(serverTheme);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(serverScheme);

  const systemPrefersDark = useSyncExternalStore(
    subscribePreferredDark,
    getPreferredDarkSnapshot,
    getPreferredDarkServerSnapshot,
  );

  const actualTheme: ActualTheme = resolveActualTheme(theme, systemPrefersDark);

  useLayoutEffect(() => {
    let pref: Theme = serverTheme;
    if (!themePreferenceFromCookie) {
      try {
        const fromLs = localStorage.getItem(storageKey) as Theme;
        if (fromLs && ['light', 'dark', 'system'].includes(fromLs)) pref = fromLs;
      } catch {
        /* ignore */
      }
    }

    let scheme: ColorScheme = serverScheme;
    if (!colorSchemePreferenceFromCookie) {
      try {
        const fromLs = localStorage.getItem(colorSchemeStorageKey) as ColorScheme;
        if (fromLs && VALID_SCHEMES.includes(fromLs)) scheme = fromLs;
      } catch {
        /* ignore */
      }
    }

    // Однократная миграция localStorage → state до paint (если cookie темы не было в запросе)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- миграция темы/схемы из localStorage
    if (pref !== serverTheme) setTheme(pref);
    if (scheme !== serverScheme) setColorScheme(scheme);
  }, [
    colorSchemePreferenceFromCookie,
    colorSchemeStorageKey,
    serverScheme,
    serverTheme,
    storageKey,
    themePreferenceFromCookie,
  ]);

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const resolvedTheme = resolveActualTheme(theme, systemPrefersDark);
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-color-scheme', colorScheme);
  }, [colorScheme, systemPrefersDark, theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      /* ignore */
    }
    setThemeCookie(newTheme);
  };

  const handleSetColorScheme = (newScheme: ColorScheme) => {
    setColorScheme(newScheme);
    try {
      localStorage.setItem(colorSchemeStorageKey, newScheme);
    } catch {
      /* ignore */
    }
    setColorSchemeCookie(newScheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
    colorScheme,
    setColorScheme: handleSetColorScheme,
    isLoading: false,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
