# Product Slider - Production-Ready Carousel

Полностью рефакторенный и оптимизированный компонент карусели продуктов.

## 📋 Оглавление

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Использование](#использование)
- [API](#api)
- [Производительность](#производительность)
- [Accessibility](#accessibility)
- [Кастомизация](#кастомизация)

## 🎯 Обзор

### Основные улучшения

✅ **Модульная архитектура** - разделение на переиспользуемые компоненты и hooks
✅ **Оптимизация производительности** - мемоизация, lazy loading, минимизация ре-рендеров
✅ **Типизация** - полная типизация TypeScript
✅ **Error Handling** - Error Boundary с graceful degradation
✅ **Accessibility** - ARIA attributes, keyboard navigation, screen reader support
✅ **Responsive** - адаптивные breakpoints с оптимизированным debounce
✅ **Clean Code** - DRY принципы, separation of concerns

### Метрики

| Метрика              | До         | После       |
| -------------------- | ---------- | ----------- |
| Размер компонента    | 392 строки | 140 строк   |
| Количество useState  | 8          | 2           |
| Количество useEffect | 6          | 0 (в hooks) |
| Re-renders           | Высокие    | Минимальные |

## 🏗️ Архитектура

```
src/features/product-slider/
├── model/                      # Типы, конфигурация, данные
│   ├── types.ts               # TypeScript типы и интерфейсы
│   ├── config.ts              # Конфигурация (breakpoints, transitions, etc.)
│   └── slides.const.ts        # Данные слайдов
├── lib/
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCarouselBreakpoints.ts  # Responsive breakpoints
│   │   ├── useCarouselSync.ts         # Store ↔ Embla синхронизация
│   │   ├── useCarouselAutoplay.ts     # Автопроигрывание
│   │   ├── useCarouselNavigation.ts   # Навигация (prev/next/goto)
│   │   └── useCarouselKeyboard.ts     # Клавиатурная навигация
│   └── utils/                 # Утилиты
│       ├── slide-calculator.ts        # Вычисление состояний и стилей
│       └── validators.ts              # Валидация данных
├── ui/                        # React компоненты
│   ├── ProductSlider.tsx      # Главный контейнер
│   ├── CarouselSlide.tsx      # Мемоизированный слайд
│   ├── CarouselControls.tsx   # Кнопки навигации
│   ├── CarouselIndicators.tsx # Индикаторы (точки)
│   └── CarouselErrorBoundary.tsx  # Error boundary
└── index.ts                   # Экспорты модуля
```

## 🚀 Использование

### Базовое использование

```tsx
import { ProductSlider } from '@/features/product-slider';

export default function HomePage() {
  return (
    <div>
      <ProductSlider />
    </div>
  );
}
```

### Использование с кастомными слайдами

```tsx
import { ProductSlider, type Slide } from '@/features/product-slider';

const customSlides: Slide[] = [
  {
    id: 1,
    image: 'https://example.com/image1.jpg',
    title: 'Product 1',
    priceCurrent: '1000 ₽',
    priceOld: '1500 ₽',
    discount: '-33%',
  },
  // ...
];

// Обновите slides.const.ts или создайте свою версию компонента
```

### Работа с Store

```tsx
import { useCarouselStore } from '@/shared/store/carousel.store';

function MyComponent() {
  const currentIndex = useCarouselStore(state => state.currentIndex);
  const toggleAutoplay = useCarouselStore(state => state.toggleAutoplay);

  return (
    <button onClick={toggleAutoplay}>
      {currentIndex + 1} / 5
    </button>
  );
}
```

## 📚 API

### Custom Hooks

#### `useCarouselBreakpoints()`

Отслеживает breakpoints и вычисляет количество видимых слайдов.

```tsx
const { slidesToShow, currentBreakpoint, mounted } = useCarouselBreakpoints();
```

**Returns:**
- `slidesToShow: number` - количество одновременно видимых слайдов
- `currentBreakpoint: 'mobile' | 'tablet' | 'desktop'` - текущий breakpoint
- `mounted: boolean` - состояние монтирования (SSR-safe)

#### `useCarouselSync(api, totalSlides)`

Синхронизирует состояние Store с Embla API.

```tsx
useCarouselSync(api, slides.length);
```

**Params:**
- `api: CarouselApi | null` - Embla Carousel API instance
- `totalSlides: number` - общее количество слайдов

#### `useCarouselAutoplay(api, totalSlides, isPaused)`

Управляет автопроигрыванием карусели.

```tsx
useCarouselAutoplay(api, slides.length, isHovered);
```

**Params:**
- `api: CarouselApi | null` - Embla Carousel API instance
- `totalSlides: number` - общее количество слайдов
- `isPaused: boolean` - внешнее состояние паузы

#### `useCarouselNavigation(api, totalSlides)`

Предоставляет функции навигации (DRY).

```tsx
const { handlePrev, handleNext, handleGoTo, canNavigate, getTargetIndex } =
  useCarouselNavigation(api, slides.length);
```

**Returns:**
- `handlePrev: () => void` - переход к предыдущему слайду
- `handleNext: () => void` - переход к следующему слайду
- `handleGoTo: (index: number) => void` - переход к конкретному слайду
- `canNavigate: () => boolean` - проверка возможности навигации
- `getTargetIndex: (direction) => number` - получение целевого индекса

#### `useCarouselKeyboard(onPrev, onNext)`

Обработчик клавиатурной навигации.

```tsx
const handleKeyDown = useCarouselKeyboard(handlePrev, handleNext);
```

**Keyboard shortcuts:**
- `←` / `→` - навигация
- `Space` - переключение autoplay

### Store

#### State

```tsx
interface CarouselState {
  currentIndex: number;      // Текущий индекс слайда
  isAutoplay: boolean;       // Состояние autoplay
  autoplayInterval: number;  // Интервал в миллисекундах
}
```

#### Actions

```tsx
setIndex(index: number): void          // Установить индекс
next(slidesCount: number): void        // Следующий слайд
prev(slidesCount: number): void        // Предыдущий слайд
toggleAutoplay(): void                 // Переключить autoplay
setAutoplayInterval(interval: number): void  // Установить интервал
reset(): void                          // Сброс к начальным значениям
```

### Конфигурация

```tsx
import { CAROUSEL_CONFIG, CAROUSEL_CONSTANTS } from '@/features/product-slider';

// Кастомизация через config.ts
CAROUSEL_CONFIG.autoplay.interval = 5000;  // Изменить интервал
CAROUSEL_CONFIG.slideStyles.center.scale = 1.1;  // Изменить масштаб
```

## ⚡ Производительность

### Оптимизации

1. **React.memo** - Все UI компоненты мемоизированы с custom comparison
2. **useMemo** - Состояния слайдов вычисляются один раз за рендер
3. **useCallback** - Все callback функции мемоизированы
4. **Debounce** - Resize listener с RAF для плавности
5. **Lazy loading** - Изображения загружаются по требованию
6. **Skeleton loaders** - Показываются до загрузки изображений

### Bundle Size

- Tree-shaking friendly экспорты
- Минимальные зависимости
- Оптимизированные imports

## ♿ Accessibility

### ARIA Support

- `role="region"` и `aria-label` для карусели
- `role="button"` для интерактивных элементов
- `aria-live="polite"` для анонсов изменений
- `aria-selected` для индикаторов
- Screen reader announcements

### Keyboard Navigation

- `←` / `→` - навигация между слайдами
- `Space` - пауза/воспроизведение autoplay
- `Tab` - фокус на контролы
- `Enter` - активация кнопок

### Focus Management

- Видимые элементы: `tabIndex={0}`
- Скрытые элементы: `tabIndex={-1}`
- Четкие focus indicators

## 🎨 Кастомизация

### Изменение breakpoints

```tsx
// model/config.ts
export const CAROUSEL_CONFIG: CarouselConfig = {
  breakpoints: {
    mobile: 640,   // было 768
    tablet: 1024,  // было 1200
    desktop: 1536, // было 1920
  },
  // ...
};
```

### Изменение стилей слайдов

```tsx
// model/config.ts
slideStyles: {
  center: {
    scale: 1.15,    // увеличить масштаб
    opacity: 1,
    zIndex: 4,
  },
  // ...
}
```

### Изменение transitions

```tsx
// model/config.ts
transitions: {
  default: 'all 0.6s ease-out',  // более медленная анимация
  smooth: 'all 0.4s ease-in-out',
  fast: 'all 0.15s ease-out',
}
```

## 🐛 Error Handling

### Error Boundary

Компонент автоматически обернут в Error Boundary:

```tsx
<CarouselErrorBoundary>
  <ProductSliderCore />
</CarouselErrorBoundary>
```

### Кастомный Fallback

```tsx
<CarouselErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>{error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
>
  <ProductSlider />
</CarouselErrorBoundary>
```

### Обработка ошибок изображений

Автоматический fallback при ошибке загрузки изображения.

## 📊 Мониторинг

### DevTools

В development режиме доступны Redux DevTools для отладки store.

### Логирование

Все критические операции логируются в консоль с префиксом `[CarouselX]`.

## 🔄 Миграция со старой версии

### Изменения в импортах

```tsx
// До
import ProductSlider from '@/features/product-slider/ui/ProductSlider';

// После
import { ProductSlider } from '@/features/product-slider';
```

### Store остается прежним

API Store полностью обратно совместим:

```tsx
const { currentIndex, next, prev } = useCarouselStore();
```

## 📝 Примечания

- Компонент полностью SSR-safe
- Работает с Next.js 15 и React 19
- Минимальные внешние зависимости
- Production-ready код

## 🤝 Вклад в развитие

При добавлении новых функций следуйте архитектурным принципам:

1. Разделение concerns - логика в hooks, UI в компонентах
2. Типизация всех параметров и возвращаемых значений
3. Мемоизация для оптимизации производительности
4. Обработка ошибок и edge cases
5. Accessibility first подход
6. Документация всех публичных API

---

**Автор:** Kilo Code
**Версия:** 2.0.0
**Дата:** 2025-10-01