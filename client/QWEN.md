# IBR Client — контекст проекта

## 📋 Обзор проекта

**IBR Client** — современное e-commerce приложение (интернет-магазин) с OTP-аутентификацией. Построено на **Next.js 15** с **React 19** и **TypeScript**, использует архитектуру **Feature-Sliced Design** для модульности и поддерживаемости кода.

### Ключевые особенности
- 📱 **OTP-аутентификация** без паролей (SMS через SMS.RU API + Email через SMTP)
- 🛒 Полнофункциональный интернет-магазин с корзиной, заказами, избранным
- 🎨 UI-компоненты на базе **shadcn/ui** + **Tailwind CSS**
- 🔄 Оптимистичные обновления и кэширование через **TanStack Query**
- 📊 Глобальное состояние через **Zustand**
- 🔒 httpOnly cookies для безопасного хранения токенов

---

## 🏗️ Архитектура

### Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (new-york style) |
| **State Management** | Zustand (client state), TanStack Query (server state) |
| **Forms** | React Hook Form + Zod v4 |
| **HTTP Client** | Fetch API (нативный) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Notifications** | Sonner |

### Структура проекта (Feature-Sliced Design)

```
src/
├── app/                    # Next.js App Router (маршруты и страницы)
│   ├── (account)/         # Группа маршрутов: профиль, заказы
│   ├── (auth)/            # Группа маршрутов: вход, регистрация
│   ├── (home)/            # Главная страница
│   ├── (info)/            # Информационные страницы
│   ├── (shop)/            # Каталог товаров
│   ├── (wishlist)/        # Избранное
│   ├── api/               # API routes (Next.js)
│   └── settings/          # Настройки
│
├── entities/               # Бизнес-сущности (domain models)
│   ├── address/           # Адреса доставки
│   ├── brand/             # Бренды
│   ├── cart/              # Корзина
│   ├── category/          # Категории товаров
│   ├── order/             # Заказы
│   ├── product/           # Товары
│   ├── review/            # Отзывы
│   ├── user/              # Пользователь (Zustand store)
│   └── wishlist/          # Избранное
│
├── features/               # Бизнес-фичи (user actions)
│   ├── auth/              # OTP аутентификация
│   ├── auth-modal/        # Модальное окно входа
│   ├── checkout/          # Оформление заказа
│   ├── city-selector/     # Выбор города
│   ├── product-filters/   # Фильтры товаров
│   ├── product-search/    # Поиск товаров
│   ├── profile-edit/      # Редактирование профиля
│   └── ...
│
├── widgets/                # Комплексные UI-блоки (composite)
│   └── mobile-nav/        # Мобильная навигация
│
├── page-components/        # Страничные компоненты
│
└── shared/                 # Переиспользуемый код
    ├── api/               # API клиенты и endpoints
    ├── config/            # Константы и конфигурация
    ├── hooks/             # Переиспользуемые хуки
    ├── lib/               # Утилиты (auth, helpers)
    ├── providers/         # React провайдеры
    ├── store/             # Глобальные сторы
    ├── types/             # TypeScript типы
    └── ui/                # UI компоненты (shadcn/ui)
```

### Серверная часть (отдельно)

Бэкенд находится в отдельной директории `server/` (если существует) или развёрнут независимо:
- **Express.js** + **MongoDB** + **Mongoose**
- **JWT** аутентификация (accessToken + refreshToken)
- **SMS.RU API** для SMS-рассылки
- **Nodemailer** для Email-уведомлений
- **Cloudinary** для хранения изображений

---

## 🔐 Архитектура аутентификации

### Принципы безопасности

1. **Backend — единственный источник истины** для проверки токенов
2. **httpOnly cookies** для хранения токенов (защита от XSS)
3. **Zustand store** хранит только данные пользователя (не токены)
4. **refreshToken НИКОГДА не попадает в клиентский JS**

### Хранение токенов

| Токен | Расположение | Назначение |
|-------|--------------|------------|
| `accessToken` | httpOnly cookie + Zustand (для header) | Доступ к API (24 часа) |
| `refreshToken` | httpOnly cookie ТОЛЬКО | Обновление сессии (60 дней) |

### Поток аутентификации

```
1. Ввод контакта (телефон/email) → POST /send-otp
2. Получение 6-значного кода → POST /verify-otp
3. Backend устанавливает httpOnly cookies
4. Frontend сохраняет user в Zustand store
5. При перезагрузке: GET /profile → реитализация store
```

### API endpoints (аутентификация)

```typescript
POST /api/user/send-otp      // Отправка OTP кода
POST /api/user/verify-otp    // Верификация и вход
POST /api/user/resend-otp    // Повторная отправка
GET  /api/user/logout        // Выход
POST /api/user/refresh-token // Обновление токена
GET  /api/user/user-details  // Данные профиля
```

---

## 🛠️ Сборка и запуск

### Установка зависимостей

```bash
npm install
```

### Development режим

```bash
npm run dev          # Запуск на http://localhost:3000
```

### Production сборка

```bash
npm run build        # Создание production билда
npm run start        # Запуск production сервера
```

### Проверка кода

```bash
npm run lint         # ESLint проверка
npm run lint:fix     # ESLint с автоисправлением
npm run format       # Prettier форматирование
npm run format:check # Prettier проверка
npm run tscheck      # TypeScript проверка типов
```

### Проверка бэкенда (если доступен)

```bash
npm run server:lint      # ESLint проверка бэкенда
npm run server:jscheck   # Проверка синтаксиса бэкенда
npm run server:check     # Полная проверка бэкенда
```

### Переменные окружения

Создайте `.env.local` в корне проекта:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📝 Конвенции разработки

### Кодстайл

- **Компоненты:** PascalCase (`UserProfile.tsx`)
- **Файлы:** kebab-case (`user-profile.tsx`)
- **Импорты:** абсолютные через `@/` (`@/entities/user`)
- **Типизация:** строгая (strict mode в tsconfig.json)

### ESLint правила

- Запрещены неиспользуемые импорты (`unused-imports/no-unused-imports`)
- Требуется `const` вместо `let` где возможно (`prefer-const`)
- Разрешены только `console.error` и `console.info`
- React Hooks и Refresh правила включены

### Prettier конфигурация

- Плагин для организации импортов
- Плагин для Tailwind CSS классов
- Интеграция с ESLint

### Git workflow

```bash
# Перед коммитом (автоматически через Husky)
npm run lint && npm run tscheck

# Коммит
git add .
git commit -m "feat: добавлена новая фича"
```

### Формат коммитов (Conventional Commits)

```
feat: новая функциональность
fix: исправление бага
refactor: рефакторинг кода
style: изменения стилей/форматирования
docs: обновление документации
test: добавление тестов
chore: обновление зависимостей, настройка
```

### Feature-Sliced Design правила

1. **Слои не зависят от нижележащих** (widgets → features → entities → shared)
2. **Импорты только внутрь слоя** (нельзя импортировать из widgets в entities)
3. **Публичное API через index.ts** в каждой секции
4. **Бизнес-логика в entities/features**, UI в widgets/shared

---

## 🧪 Тестирование

### Доступные инструменты

- **Vitest** — unit-тесты
- **Playwright** — e2e тесты

### Запуск тестов (TODO)

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e
```

---

## 📁 Ключевые файлы конфигурации

| Файл | Назначение |
|------|------------|
| `package.json` | Зависимости, скрипты, engines |
| `tsconfig.json` | TypeScript конфигурация (strict mode, path aliases) |
| `next.config.ts` | Next.js настройки (proxy, image domains) |
| `eslint.config.js` | ESLint правила (Flat Config) |
| `components.json` | shadcn/ui конфигурация |
| `prettierrc` | Prettier настройки |
| `vercel.json` | Vercel deployment конфигурация |
| `render.yaml` | Render deployment конфигурация |

---

## 🚀 Деплой

### Vercel (рекомендуется для frontend)

Автоматический деплой при push в main ветку. Конфигурация в `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Render

Конфигурация в `render.yaml`. Поддерживает автоматический деплой.

### Переменные окружения для production

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

---

## 🔧 Утилиты и хелперы

### API клиент

Расположение: `src/shared/api/`

```typescript
import { api } from '@/shared/api';

// GET запрос
const data = await api.get('/products');

// POST запрос с телом
const result = await api.post('/orders', { items: [...] });

// Запрос с авторизацией (автоматически добавляет cookie)
const profile = await api.get('/user/user-details');
```

### Хуки

Расположение: `src/shared/hooks/`

- `useDebounce` — дебаунс значений
- `useMediaQuery` — адаптивные хуки
- `useLocalStorage` — синхронизация с localStorage

### Утилиты

Расположение: `src/shared/lib/`

- `auth.ts` — клиентская аутентификация (token management)
- `auth-server.ts` — серверная валидация сессий
- `utils.ts` — утилита `cn()` для классов (clsx + tailwind-merge)

---

## 📚 Документация

- [README.md](./README.md) — основная документация проекта
- [OTP_SETUP.md](./OTP_SETUP.md) — настройка OTP аутентификации
- [AUTH_ARCHITECTURE.md](./src/shared/lib/AUTH_ARCHITECTURE.md) — архитектура аутентификации
- [Design System](./app/(home)/_design-system/README.md) — дизайн-система

---

## ⚠️ Важные замечания

### Директория server/

В текущей конфигурации директория `server/` **исключена** из компиляции Next.js:
- Исключена из `tsconfig.json`
- Исключена из `eslint.config.js`
- Исключена из webpack/turbopack сборки

Это сделано для разделения frontend и backend кода.

### Rate Limiting

API endpoints защищены rate limiting:
- Отправка OTP: 5 запросов / 15 минут
- Верификация OTP: 10 попыток / 5 минут
- Повторная отправка: 3 запроса / 15 минут

### CORS

В development режиме настроен proxy в `next.config.ts`:
```typescript
async rewrites() {
  return {
    source: '/api/:path*',
    destination: 'http://localhost:8000/api/:path*'
  };
}
```

---

## 📞 Контакты и поддержка

Для вопросов по проекту:
- Создавайте Issue в репозитории
- Смотрите документацию в `/audit/docs/` (если доступна)
