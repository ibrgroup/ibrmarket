import { useEffect, useState } from 'react';
import type { ActualTheme } from '../colors';

// Хук для медиа-запросов системной темы
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<ActualTheme>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    requestAnimationFrame(() => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    });

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
}
