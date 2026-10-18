# IBR Client - E-commerce Application

Современное e-commerce приложение на Next.js 15 с React 19, TypeScript и OTP-аутентификацией.

## 🚀 Технологии

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** (глобальное состояние)
- **TanStack Query** (серверное состояние)
- **React Hook Form** + **Zod** (формы и валидация)

### Backend
- **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** (аутентификация)
- **Nodemailer** (email отправка)
- **SMS.RU API** (SMS отправка)
- **Cloudinary** (хранение изображений)

## 🔐 Аутентификация через OTP

Приложение использует современную систему аутентификации **без паролей** через одноразовые коды (OTP).

### Способы входа:
1. **По номеру телефона** - SMS через SMS.RU API
2. **По email** - отправка через SMTP (Nodemailer)

### Процесс:
1. Пользователь вводит контакт (телефон или email)
2. На контакт отправляется 6-значный код
3. Пользователь вводит код → автоматический вход
4. Refresh токен действует **60 дней**

## 📦 Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd ibr-client
```

### 2. Установка зависимостей

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Настройка переменных окружения

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (server/.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ibr-db

# JWT Secrets
SECRET_KEY_ACCESS_TOKEN=your_access_token_secret_key
SECRET_KEY_REFRESH_TOKEN=your_refresh_token_secret_key
JSON_WEB_TOKEN_SECRET_KEY=your_jwt_secret_key

# Email (SMTP)
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_USER=your-email@mail.ru
EMAIL_PASSWORD=your-email-password

# SMS.RU API
SMS_RU_API_ID=your_sms_ru_api_id

# Cloudinary
cloudinary_Config_Cloud_Name=your_cloud_name
cloudinary_Config_api_key=your_api_key
cloudinary_Config_api_secret=your_api_secret

# Server
PORT=8000
NODE_ENV=development
```

### 4. Получение API ключа SMS.RU

1. Зарегистрируйтесь на [SMS.RU](https://sms.ru/)
2. Пополните баланс (минимум 100₽)
3. Перейдите в раздел **API** → **HTTP API**
4. Скопируйте ваш **API ID**
5. Добавьте API ID в `server/.env`:
   ```env
   SMS_RU_API_ID=ваш_api_id
   ```

**Документация SMS.RU API:** https://sms.ru/api/send

### 5. Запуск приложения

#### Development режим

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

#### Production режим

```bash
# Frontend
npm run build
npm start

# Backend
cd server
npm start
```

## 📁 Структура проекта (Feature-Sliced Design)

```
app/                  # Next.js App Router (маршруты, layout, API routes)
src/
├── widgets/          # Комплексные UI-блоки
├── features/         # Бизнес-фичи
│   └── auth/         # OTP аутентификация
├── entities/         # Бизнес-сущности
├── shared/           # Переиспользуемый код
│   ├── ui/           # UI компоненты (shadcn/ui)
│   ├── api/          # API клиенты
│   └── lib/          # Утилиты

server/
├── controllers/      # Контроллеры
├── models/           # MongoDB модели
├── routes/           # API роуты
├── middlewares/      # Express middleware
├── config/           # Конфигурация (SMS, Email)
└── utils/            # Утилиты
```

## 🔧 Основные команды

```bash
# Frontend
npm run dev          # Запуск dev сервера
npm run build        # Production сборка
npm run start        # Запуск production
npm run lint         # ESLint проверка
npm run tscheck      # TypeScript проверка типов

# Backend (server/)
cd server
npm run lint         # ESLint проверка
npm run jscheck      # JavaScript проверка синтаксиса
npm run check        # Полная проверка (lint + jscheck)

# Или из корневой директории:
npm run server:lint      # ESLint проверка бэкенда
npm run server:jscheck   # Проверка синтаксиса бэкенда
npm run server:check     # Полная проверка бэкенда

# Backend
cd server
npm install          # Установка зависимостей (включая dev-зависимости для проверки кода)
npm run dev          # Запуск с nodemon
npm start            # Запуск production
npm run lint         # ESLint проверка
npm run jscheck      # JavaScript проверка синтаксиса
npm run check        # Полная проверка (lint + jscheck)
npm run seed         # Заполнение БД тестовыми данными
```

## 🔒 Безопасность

### Rate Limiting
- **Отправка OTP:** 5 запросов / 15 минут
- **Верификация OTP:** 10 попыток / 5 минут
- **Повторная отправка:** 3 запроса / 15 минут

### OTP защита
- Код действителен **5 минут**
- Максимум **5 попыток** ввода кода
- Cooldown **60 секунд** между отправками
- Коды хранятся в зашифрованном виде

### JWT токены
- **Access Token:** 24 часа
- **Refresh Token:** 60 дней (2 месяца)
- HttpOnly cookies с Secure флагом

## 📚 API Эндпоинты

### Аутентификация (OTP)

```http
POST /api/user/send-otp
Body: { contact: string, method: 'email' | 'phone', name?: string }

POST /api/user/verify-otp
Body: { contact: string, otp: string, method: 'email' | 'phone' }

POST /api/user/resend-otp
Body: { contact: string, method: 'email' | 'phone' }

GET /api/user/logout
Headers: Authorization: Bearer {token}

POST /api/user/refresh-token
Body: { refreshToken: string }

GET /api/user/user-details
Headers: Authorization: Bearer {token}
```

### Другие эндпоинты
См. документацию в `audit/docs/`

## 🧪 Тестирование OTP системы

### Тестирование Email OTP (локально)

1. Используйте ваш реальный email в форме входа
2. Проверьте почту на наличие кода
3. Введите код для входа

### Тестирование SMS OTP

**Development режим:**
- Коды логируются в консоль сервера
- Можно использовать тестовые номера

**Production режим:**
- Требуется реальный баланс на SMS.RU
- SMS отправляются на российские номера

## 📖 Документация

- [API Documentation](./audit/docs/)
- [Security Fixes](./SECURITY_FIXES.md)
- [Project Rules](./.cursor/rules/main.mdc)
- [🚀 Deployment Guide](./DEPLOYMENT.md) - Полная инструкция по деплою на бесплатных сервисах
- [⚡ Quick Deploy](./QUICK_DEPLOY.md) - Быстрый старт деплоя

## 🤝 Разработка

### Правила разработки

1. Следовать **Feature-Sliced Design** архитектуре
2. Использовать **абсолютные импорты** через `@/`
3. Строгая **типизация TypeScript**
4. **ESLint + Prettier** перед коммитом
5. Компоненты в **PascalCase**, файлы в **kebab-case**

### Git Workflow

```bash
# Перед коммитом
npm run lint        # ESLint проверка
npm run tscheck     # TypeScript проверка

# Backend проверка
npm run server:lint      # ESLint проверка бэкенда
npm run server:jscheck   # Проверка синтаксиса бэкенда
npm run server:check     # Полная проверка бэкенда

# Коммит (автоматически запустится Husky)
git add .
git commit -m "feat: добавлена новая фича"
git push
```

### Формат коммитов

```
feat: новая функциональность
fix: исправление бага
refactor: рефакторинг кода
style: изменения стилей
docs: обновление документации
test: добавление тестов
chore: обновление зависимостей
```

## 🐛 Troubleshooting

### Ошибка "SMS.RU API не настроен"

**Решение:** Добавьте `SMS_RU_API_ID` в `server/.env`

### Ошибка "Not enough funds" от SMS.RU

**Решение:** Пополните баланс на [sms.ru](https://sms.ru/)

### Email не отправляются

**Решение:** Проверьте настройки SMTP в `server/.env`

### MongoDB connection error

**Решение:** Убедитесь, что MongoDB запущена локально или укажите правильный `MONGODB_URI`

## 📝 Лицензия

ISC

## 👥 Контакты

Для вопросов и предложений создавайте Issue в репозитории.
