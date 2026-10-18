# IBR: API и админ-панель

Краткая карта **Express** (`server/index.js`). Полная спецификация: **Swagger** `GET /docs`, **OpenAPI** `GET /docs/openapi.json`.

Префикс API: **`/api`**. Аутентификация: cookie `accessToken` и/или `Authorization: Bearer`.

## `/api/admin` (auth + rate limit + `requireAdmin`)

| Метод | Путь | Назначение |
|--------|------|------------|
| GET | `/metrics` | Сводка заказов/пользователей/товаров, выручка PAID |
| GET | `/settings` | Публичные флаги окружения (без секретов) |
| GET | `/users` | Пагинация + `q`; сортировка `sort` = `createdAt` \| `name` \| `role` \| `email`, `order` = `asc` \| `desc` |
| PATCH | `/users/:id/role` | Роль `USER` \| `ADMIN` |
| DELETE | `/users/:id` | Удаление (не себя) |
| GET | `/products` | Пагинация + `q`; `sort` = `createdAt` \| `price` \| `name` \| `countInStock` \| `brand`, `order` = `asc` \| `desc` |
| GET | `/categories` | Плоский список категорий для админ-UI |
| GET | `/audit-logs` | Журнал аудита, пагинация + фильтр `q` по `action` (regex); `sort` = `createdAt` \| `action`, `order` = `asc` \| `desc` |
| GET | `/orders` | Пагинация; `status`; поиск `q` (ObjectId заказа/пользователя, подстрока в paymentId, названии товара в заказе, имя/email/телефон клиента); `sort` = `createdAt` \| `totalAmount` \| `order_status`, `order` = `asc` \| `desc` |
| GET | `/orders/export` | CSV |
| PATCH | `/orders/:id/status` | Смена статуса (`order_status` в теле); Zod-валидация |
| DELETE | `/orders/:id` | Удаление заказа |
| GET | `/orders/:id` | Деталь заказа |

## `/api/order` (часть маршрутов — `requireAdmin`)

Отчётные **GET** и оформление заказов — см. `server/route/order.route.js`. **Смена статуса и удаление** для админки предпочтительно через **`/api/admin/orders/*`** выше; **`PUT /order-status/:id`** и **`DELETE /deleteOrder/:id`** оставлены для обратной совместимости.

## `/api/product`

- Публичные **GET** (каталог, поиск, `/:id`).
- **Мутации только ADMIN:** `POST /create`, `PUT /updateProduct/:id` (тела проверяются **Zod** на сервере), `DELETE /:id`, **`POST /uploadImages`** (multipart `images`), удаление картинки, `DELETE /deleteMultiple`, CRUD RAM / Size / Weight.

Товар: **`images[]` в JSON** или загрузка файлов, затем URL в форме. Аудит: `product.*`.

## `/api/category`

- Публичные **GET** (дерево, счётчики, `/:id`).
- **Мутации только ADMIN:** `POST /create`, `PUT /:id` (тела — **Zod**), `DELETE /:id`, **`POST /uploadImages`**, delete image. Аудит: `category.*`.

## Контент и медиа (мутации — `requireAdmin`)

`bannerV1`, `bannerList2`, `blog`, `homeSlides`, `logo` — см. `server/route/*.js`.

## Админ UI (маршруты Next.js `/dashboard/*`)

| Раздел | API |
|--------|-----|
| Обзор | `/api/admin/metrics` |
| Каталог | Товары и категории + multipart upload в формах |
| Заказы | list + `status`, статус, деталь, CSV |
| Пользователи | роли, удаление |
| Журнал | `/api/admin/audit-logs` |
| Настройки | `/api/admin/settings`, ссылка на Swagger |

## Дальнейшие улучшения

- E2E с тестовой БД на создание сущностей.

При расхождении с этим файлом приоритет у кода в `server/route/*.js`.
