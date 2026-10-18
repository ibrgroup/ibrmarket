'use client';

import { useTheme } from '@/shared/hooks';
import { Button } from '@/shared/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case 'system':
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Переключить на темную тему';
      case 'dark':
        return 'Переключить на системную тему';
      case 'system':
        return 'Переключить на светлую тему';
      default:
        return 'Переключить тему';
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme}>
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  );
}
