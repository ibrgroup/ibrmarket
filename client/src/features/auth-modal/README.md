# Auth Modal - Модальное окно авторизации

Полноценная система модальной авторизации в стиле Wildberries / Ozon.

## 🎯 Особенности

- ✅ **Multi-step форма**: Контакт → OTP → Success
- ✅ **Адаптивный дизайн**: Desktop (centered modal) / Mobile (bottom sheet)
- ✅ **Плавные анимации**: Slide-up на мобильных, fade на десктопе
- ✅ **Авто-детект**: Email или телефон
- ✅ **OTP**: 4-значный код, paste support, auto-submit
- ✅ **Resend cooldown**: 60 секунд
- ✅ **Intent system**: Поддержка редиректа после успешного входа
- ✅ **Focus trap**: Автоматический фокус на инпутах
- ✅ **ESC / Backdrop close**: Закрытие модалки
- ✅ **Accessibility**: ARIA labels, keyboard navigation

## 📦 Архитектура (FSD)

```
features/auth-modal/
├── index.ts                      # Публичный API
├── model/
│   ├── types.ts                  # TypeScript типы
│   ├── constants.ts              # Константы
│   └── auth-modal.store.ts       # Zustand store
├── ui/
│   ├── AuthModal.tsx             # Wrapper компонент
│   ├── AuthModalContent.tsx      # Контент модалки (управляет шагами)
│   ├── LoginStep.tsx             # Шаг 1: Ввод контакта
│   ├── OtpStep.tsx               # Шаг 2: Ввод OTP
│   └── SuccessStep.tsx           # Шаг 3: Успех
└── lib/
    ├── utils.ts                  # Вспомогательные функции
    └── hooks/
        ├── useAuthModal.ts       # Hook для управления модалкой
        └── useRequireAuth.ts     # Hook для защиты действий
```

## 🚀 Использование

### 1. Базовое использование

```tsx
import { useAuthModal } from '@/features/auth-modal';

function LoginButton() {
  const { openAuthModal } = useAuthModal();

  return (
    <button onClick={() => openAuthModal()}>
      Войти
    </button>
  );
}
```

### 2. С Intent (редирект после входа)

```tsx
import { useAuthModal } from '@/features/auth-modal';

function CheckoutButton() {
  const { openAuthModal } = useAuthModal();

  const handleCheckout = () => {
    // Откроется модалка, после успешного входа → /checkout
    openAuthModal({ type: 'checkout' });
  };

  return <button onClick={handleCheckout}>Оформить заказ</button>;
}
```

**Доступные intent:**
- `{ type: 'none' }` - Просто логин (по умолчанию)
- `{ type: 'checkout' }` - Переход в checkout
- `{ type: 'profile' }` - Переход в профиль
- `{ type: 'orders' }` - Переход в заказы
- `{ type: 'custom', url: '/some-url' }` - Кастомный URL

### 3. Auth Guard - защита действий

```tsx
import { useRequireAuth } from '@/features/auth-modal';

function AddToWishlistButton({ productId }: { productId: string }) {
  const requireAuth = useRequireAuth();
  const { addToWishlist } = useWishlistStore();

  const handleAddToWishlist = async () => {
    // Если пользователь не авторизован → откроется модалка
    // После входа → выполнится callback
    await requireAuth(async () => {
      await addToWishlist(productId);
      toast.success('Добавлено в избранное');
    });
  };

  return (
    <button onClick={handleAddToWishlist}>
      В избранное
    </button>
  );
}
```

### 4. Auth Guard - простая проверка

```tsx
import { useAuthGuard } from '@/features/auth-modal';

function ProtectedAction() {
  const { checkAuth } = useAuthGuard();

  const handleAction = () => {
    if (!checkAuth({ type: 'checkout' })) {
      return; // Модалка открыта, ждем авторизации
    }

    // Пользователь авторизован - выполняем действие
    performAction();
  };

  return <button onClick={handleAction}>Защищенное действие</button>;
}
```

## 🎨 Кастомизация

### Изменить время автозакрытия модалки

```ts
// src/features/auth-modal/model/constants.ts
export const SUCCESS_AUTO_CLOSE_DELAY = 1500; // миллисекунды
```

### Изменить длину OTP кода

```ts
// src/features/auth-modal/model/constants.ts
export const OTP_LENGTH = 4; // количество цифр
```

### Изменить время cooldown для resend

```ts
// src/features/auth-modal/model/constants.ts
export const OTP_RESEND_COOLDOWN = 60; // секунды
```

## 🔧 Интеграция

### 1. Layout (уже сделано)

```tsx
// app/layout.tsx
import { AuthModal } from '@/features/auth-modal';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* ... */}
        <AuthModal />
      </body>
    </html>
  );
}
```

### 2. Header (уже сделано)

```tsx
// src/widgets/header/ui/Header.tsx
import { useAuthModal } from '@/features/auth-modal';

export function Header() {
  const { openAuthModal } = useAuthModal();

  return (
    <button onClick={() => openAuthModal()}>
      Войти
    </button>
  );
}
```

## 📱 Mobile vs Desktop

**Desktop:**
- Центрированная модалка
- Стандартные анимации fade-in/out
- Размер: max-w-[440px]

**Mobile:**
- Bottom sheet (slide-up)
- Полная ширина экрана
- Закругленные углы сверху
- Swipe-to-close (опционально)

## 🎯 Примеры реальных кейсов

### Защита checkout

```tsx
// app/checkout/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuthGuard } from '@/features/auth-modal';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { checkAuth } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth({ type: 'checkout' })) {
      // Модалка откроется автоматически
      // После входа пользователь останется на /checkout
      router.push('/');
    }
  }, [checkAuth, router]);

  return <div>Checkout...</div>;
}
```

### Защита добавления в wishlist

```tsx
function ProductCard({ product }) {
  const requireAuth = useRequireAuth();
  const { addToWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuth();

  const handleWishlist = async () => {
    await requireAuth(async () => {
      await addToWishlist(product.id);
    });
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleWishlist}>
        {isAuthenticated ? 'В избранное' : 'Войдите для сохранения'}
      </button>
    </div>
  );
}
```

## 🔐 Безопасность

- **httpOnly cookies**: Токены хранятся в httpOnly cookies (backend)
- **CSRF protection**: Поддерживается на backend
- **Rate limiting**: Ограничение количества попыток OTP
- **No client tokens**: Токены НЕ хранятся в localStorage
- **Validation**: Строгая валидация email/phone/OTP

## 🐛 Troubleshooting

### Модалка не открывается

Убедитесь что:
1. `<AuthModal />` добавлен в Layout
2. Импорт корректный: `import { useAuthModal } from '@/features/auth-modal'`

### OTP не приходит

1. Проверьте backend логи
2. Проверьте настройки email/SMS провайдера
3. Убедитесь что contact нормализован правильно

### Редирект не работает после входа

Убедитесь что intent передан правильно:
```tsx
openAuthModal({ type: 'checkout' });
```

## 📚 API Reference

### useAuthModal()

```ts
const { openAuthModal, closeAuthModal, isAuthModalOpen } = useAuthModal();
```

- `openAuthModal(intent?: AuthIntent)` - Открыть модалку
- `closeAuthModal()` - Закрыть модалку
- `isAuthModalOpen: boolean` - Открыта ли модалка

### useRequireAuth()

```ts
const requireAuth = useRequireAuth();

await requireAuth(async () => {
  // Код выполнится только если пользователь авторизован
}, intent);
```

### useAuthGuard()

```ts
const { checkAuth, isAuthenticated } = useAuthGuard();

if (!checkAuth(intent)) {
  return; // Модалка открыта
}
// Пользователь авторизован
```

---

**Версия:** 1.0.0
**Дата:** Январь 2025
**Проект:** IBR-Client
