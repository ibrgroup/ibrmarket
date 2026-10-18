# Дизайн-система IBR Market

## Обзор

Дизайн-система IBR Market построена на основе **Tailwind CSS v4** и **Shadcn UI** с использованием фиолетовой цветовой палитры.

## Структура

### 🎨 Цветовая палитра

Основана на **OKLCH** цветовом пространстве для лучшей доступности и поддержки темных режимов.

#### Основные цвета
- **Primary:** `oklch(0.606 0.25 292.717)` - Основной фиолетовый
- **Secondary:** `oklch(0.967 0.001 286.375)` - Светло-серый
- **Accent:** `oklch(0.967 0.001 286.375)` - Акцентный цвет

#### Семантические цвета
- **Success:** `oklch(0.65 0.15 142)` - Зеленый для успеха
- **Warning:** `oklch(0.75 0.12 85)` - Желтый для предупреждений
- **Error:** `oklch(0.577 0.245 27.325)` - Красный для ошибок
- **Info:** `oklch(0.6 0.15 240)` - Синий для информации

### 📝 Шрифтовая система

#### Шрифты
- **Основной:** Inter (с fallback на system-ui)
- **Моноширинный:** JetBrains Mono

#### Размеры текста
- **xs:** 0.75rem (12px)
- **sm:** 0.875rem (14px)
- **base:** 1rem (16px)
- **lg:** 1.125rem (18px)
- **xl:** 1.25rem (20px)
- **2xl:** 1.5rem (24px)
- **3xl:** 1.875rem (30px)
- **4xl:** 2.25rem (36px)
- **5xl:** 3rem (48px)

#### Начертания
- **Light:** 300
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### 📏 Система отступов

Используется 8px сетка:
- **1:** 0.25rem (4px)
- **2:** 0.5rem (8px)
- **3:** 0.75rem (12px)
- **4:** 1rem (16px)
- **5:** 1.25rem (20px)
- **6:** 1.5rem (24px)
- **8:** 2rem (32px)
- **10:** 2.5rem (40px)
- **12:** 3rem (48px)

### 🔲 Радиусы скругления

- **none:** 0
- **sm:** 0.25rem (4px)
- **base:** 0.375rem (6px)
- **md:** 0.5rem (8px)
- **lg:** 0.75rem (12px)
- **xl:** 1rem (16px)
- **2xl:** 1.5rem (24px)
- **full:** 9999px

## Компоненты

### Layout Container

Стандартизированные контейнеры для макетов:

```tsx
import { PageContainer, SectionContainer, ContentContainer } from '@/shared/ui/layout-container';

// Для целых страниц
<PageContainer>
  <h1>Заголовок страницы</h1>
</PageContainer>

// Для секций
<SectionContainer>
  <h2>Заголовок секции</h2>
</SectionContainer>

// Для контента
<ContentContainer>
  <p>Содержимое</p>
</ContentContainer>
```

### Loading компоненты

```tsx
import { Loading, PageLoading, ButtonLoading } from '@/shared/ui/loading';

// Простая загрузка
<Loading size="lg" text="Загрузка данных..." />

// Для целой страницы
<PageLoading />

// Внутри кнопки
<ButtonLoading />
```

### Переключатель темы

```tsx
import { ThemeToggle } from '@/shared/ui/theme-toggle';

<ThemeToggle />
```

## Использование

### В компонентах

```tsx
import { Button } from '@/shared/ui/button';
import { designTokens } from '@/shared/config/design-tokens';

function MyComponent() {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: designTokens.colors.primary[500],
        borderRadius: designTokens.borderRadius.lg,
      }}
    >
      <Button variant="secondary">
        Кнопка
      </Button>
    </div>
  );
}
```

### В страницах

```tsx
import { PageContainer } from '@/shared/ui/layout-container';
import { useTheme } from '@/shared/providers/theme-provider';

export default function MyPage() {
  const { theme, setTheme } = useTheme();

  return (
    <PageContainer>
      <h1>Моя страница</h1>
      <p>Текущая тема: {theme}</p>
    </PageContainer>
  );
}
```

## Темы

### Светлая тема (по умолчанию)
- Фон: белый
- Текст: темно-серый
- Акцент: фиолетовый

### Темная тема
- Фон: темно-серый
- Текст: светло-серый
- Акцент: светло-фиолетовый

### Системная тема
Автоматически подстраивается под настройки системы пользователя.

## Доступность

- Все цвета соответствуют WCAG 2.1 AA стандарту
- Минимальный контраст 4.5:1 для обычного текста
- Минимальный контраст 3:1 для крупного текста
- Поддержка клавиатурной навигации
- Семантическая разметка

## Расширение

Для добавления новых токенов:

1. Обновите `src/shared/config/design-tokens.ts`
2. Обновите CSS переменные в `app/globals.css`
3. Протестируйте в светлой и темной темах
4. Проверьте доступность

## Примеры

Посмотрите демо-страницу дизайн-системы:
```
/design-system
```

Там представлены все токены и компоненты в действии.