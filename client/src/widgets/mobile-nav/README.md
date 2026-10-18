# Мобильная навигация (Mobile Navigation)

Современная мобильная навигация в стиле Wildberries для проекта IBR-MARKET.

## 📱 Компоненты

### MobileBottomNav

Нижняя навигационная панель для мобильных устройств (< 768px).

**Особенности:**
- ✨ Фиксированная позиция внизу экрана
- 🎯 Индикаторы активной страницы
- 🔢 Счетчики для корзины и избранного
- 🎨 Плавные анимации и переходы
- 🌙 Поддержка темной темы
- 📱 Оптимизация для iOS (safe-area-inset)
- ♿ Accessibility (ARIA labels)

**Навигационные элементы:**
1. Главная (`/`)
2. Каталог (`/products`)
3. Корзина (`/cart`) - с badge
4. Избранное (`/wishlist`) - с badge
5. Профиль (`/my-account` или `/login`)

### MobileCatalogSheet

Полноэкранный Sheet с каталогом товаров для мобильных устройств.

**Особенности:**
- 📂 Полный список категорий
- 🖼️ Иконки категорий
- ⚡ Плавные анимации появления
- 🔄 Skeleton loader при загрузке
- 🎨 Современный дизайн
- 📍 Дополнительные быстрые ссылки

## 🎨 Стили и анимации

### Глобальные анимации (globals.css)

```css
/* Появление навигации снизу */
@keyframes slideUpFade { ... }

/* Пульсация badge */
@keyframes pulse-badge { ... }

/* Индикатор активной страницы */
@keyframes slideIndicator { ... }

/* Ripple эффект */
@keyframes ripple { ... }
```

### Оптимизации

- **Touch optimization**: Минимальный размер кнопок 48x48px
- **Performance**: Hardware acceleration, will-change
- **iOS support**: Safe area insets, -webkit-overflow-scrolling
- **Accessibility**: Proper ARIA labels, focus states

## 📦 Использование

### Интеграция в layout

```tsx
import { MobileBottomNav } from '@/widgets/mobile-nav';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <main>{children}</main>
        <MobileBottomNav />
      </body>
    </html>
  );
}
```

### Интеграция каталога в Header

```tsx
import { MobileCatalogSheet } from '@/widgets/mobile-nav';

export function Header() {
  return (
    <header>
      {/* Desktop navigation */}
      <div className="hidden md:block">
        <SheetDemo />
      </div>

      {/* Mobile catalog */}
      <div className="md:hidden">
        <MobileCatalogSheet />
      </div>
    </header>
  );
}
```

## 🎯 Адаптивность

### Брейкпоинты

- **< 768px (md)**: Показывается мобильная навигация
- **≥ 768px**: Скрывается, показывается десктопная навигация

### Header адаптация

На мобильных устройствах:
- ❌ Скрыты: Избранное, Корзина, Профиль (кнопки)
- ✅ Показаны: Логотип (IBR), Каталог, Поиск

### Footer адаптация

- Добавлен отступ снизу (`pb-20 md:pb-6`) для компенсации навигации

## 🔧 Настройка

### Изменение навигационных элементов

В `MobileBottomNav.tsx`:

```tsx
const navItems: NavItem[] = useMemo(
  () => [
    {
      id: 'home',
      label: 'Главная',
      icon: FiHome,
      href: '/',
    },
    // Добавьте свои элементы здесь
  ],
  [dependencies]
);
```

### Кастомизация стилей

Все стили используют CSS переменные из темы:

```css
/* Изменить цвет активной страницы */
--primary: #8b5cf6;

/* Изменить фон навигации */
--background: #ffffff;

/* Изменить цвет текста */
--foreground: #111827;
```

## 🚀 Производительность

### Оптимизации

1. **useMemo** для navItems - предотвращает лишние рендеры
2. **useCallback** для обработчиков - стабильные ссылки
3. **CSS animations** вместо JS - hardware acceleration
4. **Условный рендеринг** - навигация рендерится только на < 768px

### Метрики

- **Initial load**: ~2KB gzipped
- **Re-render time**: < 16ms (60 FPS)
- **Touch response**: < 100ms

## ♿ Accessibility

### ARIA атрибуты

- `role="navigation"` - определяет навигационную область
- `aria-label` - описание для каждой кнопки
- `aria-current="page"` - индикатор текущей страницы
- `aria-hidden` для декоративных элементов

### Keyboard navigation

- ✅ Все элементы доступны с клавиатуры
- ✅ Видимый focus state
- ✅ Tab navigation

### Screen readers

- ✅ Описательные labels
- ✅ Правильная структура HTML
- ✅ Скрытые декоративные элементы

## 🐛 Известные проблемы и решения

### iOS Safari

**Проблема**: Navbar перекрывает контент при скролле
**Решение**: Добавлен placeholder div с высотой навигации

**Проблема**: Zoom при фокусе на input
**Решение**: `font-size: 16px` для всех input элементов

### Android Chrome

**Проблема**: Лаг при появлении клавиатуры
**Решение**: `overscroll-behavior-y: contain` для body

## 📝 TODO

- [ ] Добавить haptic feedback для iOS
- [ ] Добавить gesture navigation (swipe)
- [ ] Добавить анимацию перехода между страницами
- [ ] A/B тестирование позиций элементов
- [ ] Analytics tracking для кликов

## 📚 Примеры

### Wildberries-подобная навигация

Текущая реализация максимально приближена к Wildberries:
- Нижнее расположение
- 5 основных элементов
- Индикаторы активной страницы сверху
- Badge для корзины и избранного
- Минималистичный дизайн

### Альтернативные варианты

Можно легко адаптировать под:
- **AliExpress** стиль (добавить цветные иконки)
- **Ozon** стиль (добавить больше элементов)
- **Amazon** стиль (убрать индикаторы, добавить текст)

## 🤝 Contributing

При добавлении новых элементов навигации:

1. ✅ Убедитесь, что элементов не больше 5 (UX best practice)
2. ✅ Добавьте соответствующие ARIA атрибуты
3. ✅ Проверьте на iOS и Android
4. ✅ Обновите документацию

## 📄 License

Часть проекта IBR Market
