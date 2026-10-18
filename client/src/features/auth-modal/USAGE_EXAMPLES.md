# Примеры использования Auth Modal

## 📋 Содержание
1. [Базовый логин](#1-базовый-логин)
2. [Защита страниц](#2-защита-страниц)
3. [Защита действий](#3-защита-действий)
4. [Защита кнопок](#4-защита-кнопок)
5. [Wishlist/Cart](#5-wishlistcart)
6. [Checkout](#6-checkout)
7. [Profile](#7-profile)
8. [Продвинутые примеры](#8-продвинутые-примеры)

---

## 1. Базовый логин

### Кнопка "Войти" в Header (уже реализовано)

```tsx
// src/widgets/header/ui/Header.tsx
import { useAuthModal } from '@/features/auth-modal';

export function Header() {
  const { openAuthModal } = useAuthModal();

  return (
    <Button onClick={() => openAuthModal()}>
      Войти
    </Button>
  );
}
```

### Кнопка "Войти" с intent

```tsx
import { useAuthModal } from '@/features/auth-modal';

export function LoginButton() {
  const { openAuthModal } = useAuthModal();

  return (
    <Button
      onClick={() => openAuthModal({ type: 'profile' })}
    >
      Войти в профиль
    </Button>
  );
}
```

---

## 2. Защита страниц

### Защита страницы checkout (рекомендуемый способ)

```tsx
// app/(shop)/checkout/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';
import { CheckoutPage } from '@/page-components/checkout/CheckoutPage';

export default function CheckoutPageRoute() {
  return (
    <ProtectedRoute intent={{ type: 'checkout' }}>
      <CheckoutPage />
    </ProtectedRoute>
  );
}
```

### Защита страницы профиля

```tsx
// app/profile/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';
import { ProfileContent } from './ProfileContent';

export default function ProfilePage() {
  return (
    <ProtectedRoute intent={{ type: 'profile' }}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

### Защита с редиректом на главную (альтернативный способ)

```tsx
// app/my-account/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';

export default function MyAccountPage() {
  return (
    <ProtectedRoute
      intent={{ type: 'profile' }}
      redirectTo="/"
      showLoading={true}
    >
      <AccountContent />
    </ProtectedRoute>
  );
}
```

---

## 3. Защита действий

### Добавление в wishlist

```tsx
// components/ProductCard.tsx
'use client';

import { useRequireAuth } from '@/features/auth-modal';
import { useWishlistStore } from '@/entities/wishlist';
import { toast } from 'sonner';

export function ProductCard({ product }) {
  const requireAuth = useRequireAuth();
  const { addToWishlist } = useWishlistStore();

  const handleAddToWishlist = async () => {
    // Если пользователь не авторизован → откроется модалка
    // После входа → выполнится callback
    await requireAuth(async () => {
      await addToWishlist(product.id);
      toast.success('Добавлено в избранное');
    });
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <Button onClick={handleAddToWishlist}>
        В избранное
      </Button>
    </div>
  );
}
```

### Оставить отзыв

```tsx
// components/ReviewForm.tsx
'use client';

import { useRequireAuth } from '@/features/auth-modal';
import { reviewsService } from '@/shared/api/services';

export function ReviewForm({ productId }) {
  const requireAuth = useRequireAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    await requireAuth(async () => {
      await reviewsService.createReview({
        productId,
        rating,
        comment,
      });
      toast.success('Отзыв отправлен!');
    }, { type: 'none' }); // Остаемся на текущей странице
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Форма отзыва */}
      <Button type="submit">Отправить отзыв</Button>
    </form>
  );
}
```

---

## 4. Защита кнопок

### Простая проверка с Auth Guard

```tsx
'use client';

import { useAuthGuard } from '@/features/auth-modal';

export function CheckoutButton() {
  const { checkAuth } = useAuthGuard();
  const router = useRouter();

  const handleCheckout = () => {
    // Если пользователь не авторизован → откроется модалка
    if (!checkAuth({ type: 'checkout' })) {
      return; // Ждем авторизации
    }

    // Пользователь авторизован → переходим в checkout
    router.push('/checkout');
  };

  return (
    <Button onClick={handleCheckout}>
      Оформить заказ
    </Button>
  );
}
```

### Кнопка с индикацией статуса авторизации

```tsx
'use client';

import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth-modal';

export function WishlistButton({ productId }) {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { addToWishlist } = useWishlistStore();

  const handleClick = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    await addToWishlist(productId);
  };

  return (
    <Button onClick={handleClick}>
      {isAuthenticated ? 'В избранное' : 'Войдите для сохранения'}
    </Button>
  );
}
```

---

## 5. Wishlist/Cart

### Синхронизация wishlist после логина (уже реализовано)

```tsx
// widgets/product-card/ui/WishlistButton.tsx
'use client';

import { useRequireAuth } from '@/features/auth-modal';
import { useWishlistStore } from '@/entities/wishlist';

export function WishlistButton({ productId }) {
  const requireAuth = useRequireAuth();
  const { addToWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(productId);

  const handleToggle = async () => {
    await requireAuth(async () => {
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    });
  };

  return (
    <Button
      variant={isWishlisted ? 'default' : 'outline'}
      onClick={handleToggle}
    >
      <Heart fill={isWishlisted ? 'currentColor' : 'none'} />
    </Button>
  );
}
```

### Checkout с проверкой авторизации

```tsx
// app/cart/page.tsx
'use client';

import { useAuthGuard } from '@/features/auth-modal';
import { useCartStore } from '@/entities/cart';

export function CartPage() {
  const { checkAuth } = useAuthGuard();
  const { items, totalPrice } = useCartStore();
  const router = useRouter();

  const handleCheckout = () => {
    if (!checkAuth({ type: 'checkout' })) {
      return; // Модалка откроется, после входа редирект на /checkout
    }

    router.push('/checkout');
  };

  return (
    <div>
      {/* Товары в корзине */}
      <Button onClick={handleCheckout}>
        Перейти к оформлению ({totalPrice} ₽)
      </Button>
    </div>
  );
}
```

---

## 6. Checkout

### Вариант 1: ProtectedRoute (Рекомендуется)

```tsx
// app/(shop)/checkout/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';
import { CheckoutPage } from '@/page-components/checkout/CheckoutPage';

export default function CheckoutPageRoute() {
  return (
    <ProtectedRoute intent={{ type: 'checkout' }}>
      <CheckoutPage />
    </ProtectedRoute>
  );
}
```

### Вариант 2: Проверка в useEffect

```tsx
// page-components/checkout/CheckoutPage.tsx
'use client';

import { useEffect } from 'react';
import { useAuthGuard } from '@/features/auth-modal';

export function CheckoutPage() {
  const { checkAuth } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию при монтировании
    if (!checkAuth({ type: 'checkout' })) {
      // Модалка откроется автоматически
      // После входа пользователь останется на /checkout
    }
  }, [checkAuth]);

  return (
    <div>
      {/* Checkout форма */}
    </div>
  );
}
```

---

## 7. Profile

### Защита профиля

```tsx
// app/profile/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';

export default function ProfilePage() {
  return (
    <ProtectedRoute intent={{ type: 'profile' }}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

### Защита страницы заказов

```tsx
// app/profile/orders/page.tsx
import { ProtectedRoute } from '@/features/auth-modal';

export default function OrdersPage() {
  return (
    <ProtectedRoute intent={{ type: 'orders' }}>
      <OrdersHistory />
    </ProtectedRoute>
  );
}
```

---

## 8. Продвинутые примеры

### Условная защита (Guest Checkout vs Auth Checkout)

```tsx
'use client';

import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth-modal';

export function CheckoutButton() {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

  const handleCheckout = () => {
    if (isAuthenticated) {
      // Авторизованный checkout с сохраненными адресами
      router.push('/checkout');
    } else {
      // Показываем выбор: войти или оформить как гость
      openAuthModal({ type: 'checkout' });
      // Или сразу гостевой checkout:
      // router.push('/checkout/guest');
    }
  };

  return (
    <Button onClick={handleCheckout}>
      Оформить заказ
    </Button>
  );
}
```

### Middleware для защиты роутов (опционально)

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/profile', '/my-account', '/my-orders'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем защищенные роуты
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('accessToken');

    if (!token) {
      // Редирект на главную, модалка откроется автоматически
      // через ProtectedRoute компонент
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/my-account/:path*', '/my-orders/:path*'],
};
```

### Кастомный Intent URL

```tsx
'use client';

import { useAuthModal } from '@/features/auth-modal';

export function SpecialOfferButton() {
  const { openAuthModal } = useAuthModal();

  const handleClick = () => {
    // После входа редирект на специальную страницу
    openAuthModal({
      type: 'custom',
      url: '/special-offer?promo=welcome'
    });
  };

  return (
    <Button onClick={handleClick}>
      Получить спецпредложение
    </Button>
  );
}
```

### Программное закрытие модалки

```tsx
'use client';

import { useAuthModalStore } from '@/features/auth-modal';

export function CustomAuthFlow() {
  const { close } = useAuthModalStore();

  const handleCustomLogin = async () => {
    // Кастомная логика авторизации
    await customAuthService.login();

    // Закрываем модалку вручную
    close();
  };

  return (
    <Button onClick={handleCustomLogin}>
      Войти через социальную сеть
    </Button>
  );
}
```

### Проверка состояния модалки

```tsx
'use client';

import { useAuthModalStore } from '@/features/auth-modal';

export function Header() {
  const { isOpen } = useAuthModalStore();

  return (
    <header>
      {isOpen && <div className="backdrop-blur-sm">Идет авторизация...</div>}
    </header>
  );
}
```

---

## 🎯 Рекомендации

### Для страниц
✅ Используйте `<ProtectedRoute>` - самый простой и надежный способ

### Для кнопок и действий
✅ Используйте `useRequireAuth()` - автоматически выполнит callback после входа

### Для простых проверок
✅ Используйте `useAuthGuard()` - быстрая проверка без callback

### Для сложной логики
✅ Используйте `useAuthModalStore()` напрямую - полный контроль

---

## ⚠️ Частые ошибки

### ❌ НЕ используйте router.push('/login')

```tsx
// ❌ Плохо - старый способ
onClick={() => router.push('/login')}

// ✅ Хорошо - модальное окно
onClick={() => openAuthModal()}
```

### ❌ НЕ дублируйте проверку авторизации

```tsx
// ❌ Плохо - лишняя проверка
if (!user) {
  openAuthModal();
  return;
}
await requireAuth(() => doSomething());

// ✅ Хорошо - одна проверка
await requireAuth(() => doSomething());
```

### ❌ НЕ забывайте про Intent

```tsx
// ❌ Плохо - пользователь не попадет на checkout после входа
openAuthModal();
router.push('/checkout');

// ✅ Хорошо - автоматический редирект после входа
openAuthModal({ type: 'checkout' });
```

---

**Последнее обновление:** Январь 2025
