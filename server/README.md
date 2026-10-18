# Server - Backend API

## Проверка кода

### Команды для проверки синтаксиса и качества кода

#### Базовая проверка синтаксиса
```bash
npm run jscheck
```
Проверяет баланс скобок и базовые синтаксические ошибки во всех `.js` файлах.

#### ESLint проверка
```bash
npm run lint
```
Проверяет код на соответствие правилам ESLint (стиль, потенциальные ошибки).

#### Автоматическое исправление ESLint ошибок
```bash
npm run lint:fix
```
Автоматически исправляет исправимые ошибки ESLint.

#### Полная проверка (ESLint + синтаксис)
```bash
npm run check
```
Запускает обе проверки: сначала ESLint, затем проверку синтаксиса.

### Из корневой директории проекта

Вы также можете запускать команды из корневой директории:

```bash
# Проверка синтаксиса
npm run server:jscheck

# ESLint проверка
npm run server:lint

# Полная проверка
npm run server:check
```

## Установка зависимостей

Перед первым использованием установите dev-зависимости:

```bash
npm install
```

Это установит ESLint и необходимые плагины для проверки кода.

## Структура проекта

```
server/
├── config/          # Конфигурационные файлы (DB, Email, SMS)
├── controllers/     # Контроллеры (бизнес-логика)
├── middlewares/     # Middleware (auth, rate limiting, anti-spam)
├── models/          # Mongoose модели
├── route/           # Express роуты
├── scripts/         # Вспомогательные скрипты
├── utils/           # Утилиты
└── index.js         # Точка входа
```

## Разработка

```bash
# Запуск в режиме разработки (с автоперезагрузкой)
npm run dev

# Запуск в production режиме
npm start
```

## Swagger (документация API)

После запуска сервера:

- **UI документации:** `http://localhost:8000/docs` (порт по умолчанию — 8000)
- **OpenAPI JSON (скачать):** `http://localhost:8000/docs/openapi.json` — просмотр в браузере; для скачивания файла добавьте `?download=1`: `http://localhost:8000/docs/openapi.json?download=1`

Описание эндпоинтов задаётся в JSDoc-комментариях `@swagger` в файлах в `route/*.js`. Схемы (User, Address, Product и т.д.) объявляются там же через блок `components/schemas`.
