# План миграции: Express/MongoDB → NestJS/PostgreSQL/Prisma

## 📋 Обзор миграции

Этот документ содержит подробный план миграции бэкенда с текущей архитектуры (Express + MongoDB + Mongoose) на новую (NestJS + PostgreSQL + Prisma ORM).

### Цели миграции

- ✅ **Типобезопасность**: TypeScript + строгая типизация NestJS
- ✅ **Надёжность данных**: PostgreSQL с ACID-транзакциями и внешними ключами
- ✅ **Производительность**: Оптимизированные запросы через Prisma
- ✅ **Масштабируемость**: Модульная архитектура NestJS
- ✅ **Поддерживаемость**: Чёткая структура, dependency injection, тестирование
- ✅ **Современный стек**: Актуальные версии и лучшие практики

---

## 🎯 Архитектурные улучшения

### Текущая архитектура (Express)

```
┌─────────────────────────────────────────┐
│  index.js (монолитный entry point)      │
│  ├── Роуты подключены напрямую          │
│  ├── Middleware глобальные              │
│  └── Контроллеры без структуры          │
└─────────────────────────────────────────┘
```

**Проблемы:**
- Отсутствие модульности
- Сложность тестирования
- Нет единого стандарта кода
- Дублирование логики

### Новая архитектура (NestJS)

```
┌─────────────────────────────────────────────────────┐
│  NestJS Application                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │  Modules (feature-based)                     │    │
│  │  ├── UserModule                              │    │
│  │  │   ├── user.controller.ts                  │    │
│  │  │   ├── user.service.ts                     │    │
│  │  │   ├── user.module.ts                      │    │
│  │  │   ├── dto/ (validation)                   │    │
│  │  │   └── entities/ (Prisma)                  │    │
│  │  ├── ProductModule                           │    │
│  │  ├── OrderModule                             │    │
│  │  └── ...                                     │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Shared Infrastructure                       │    │
│  │  ├── Guards (Auth, Roles)                    │    │
│  │  ├── Interceptors (Transform, Logging)       │    │
│  │  ├── Filters (Exception Handling)            │    │
│  │  ├── Pipes (Validation)                      │    │
│  │  └── Middleware (CORS, Helmet, RateLimit)    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Преимущества:**
- Модульность по функциональности
- Dependency Injection для тестируемости
- Встроенная валидация через DTO
- Единый стандарт обработки ошибок
- Легкое добавление новых фич

---

## 📦 Технологический стек

### Backend Framework
| Было | Станет |
|------|--------|
| Express.js 4.x | **NestJS 10.x** |
| JavaScript (ESM) | **TypeScript 5.x** |
| Ручная обработка ошибок | **Exception Filters** |
| Ручная валидация | **Class Validator + Pipes** |

### Database
| Было | Станет |
|------|--------|
| MongoDB | **PostgreSQL 16** |
| Mongoose ODM | **Prisma ORM 5.x** |
| Документо-ориентированная | **Реляционная с внешними ключами** |
| Гибкая схема | **Строгая схема с миграциями** |

### Authentication & Security
| Было | Станет |
|------|--------|
| jsonwebtoken | **@nestjs/jwt + Passport** |
| bcryptjs | **bcrypt** |
| Ручная проверка токена | **Guards + Strategies** |
| cookie-parser | **@nestjs/cookies** |

### Additional Tools
| Категория | Инструмент |
|-----------|-----------|
| Validation | class-validator, class-transformer |
| API Docs | @nestjs/swagger (автоматическая) |
| Testing | Jest + Supertest (встроено в NestJS) |
| Logging | Pino / Winston |
| Rate Limiting | @nestjs/throttler |
| File Upload | @nestjs/platform-express + multer |
| Email | @nestjs-modules/mailer + nodemailer |
| Config | @nestjs/config |
| Caching | @nestjs/cache-manager + Redis |

---

## 🗺️ Этапы миграции

### Этап 1: Подготовка (1-2 дня)

#### 1.1 Аудит текущего кода
- [ ] Составить список всех API эндпоинтов
- [ ] Документировать все модели данных
- [ ] Выявить бизнес-логику в контроллерах
- [ ] Зафиксировать текущее поведение API

#### 1.2 Проектирование новой схемы БД
- [ ] Спроектировать PostgreSQL схему
- [ ] Определить связи между таблицами
- [ ] Спланировать индексы для производительности
- [ ] Создать ER-диаграмму

#### 1.3 Настройка окружения
```bash
# Установить Node.js 20+ (если не установлен)
node --version

# Установить PostgreSQL 16
# macOS: brew install postgresql@16
# Windows: скачать с postgresql.org

# Установить Prisma CLI глобально
npm install -g prisma
```

---

### Этап 2: Инициализация NestJS проекта (1 день)

#### 2.1 Создание проекта
```bash
# Установить NestJS CLI
npm install -g @nestjs/cli

# Создать новый проект
nest new ibr-nestjs-backend
cd ibr-nestjs-backend

# Выбрать: npm, TypeScript, ESLint, Jest, e2e testing
```

#### 2.2 Установка зависимостей
```bash
# Основные зависимости
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/throttler @nestjs/swagger
npm install @nestjs/mailer @nestjs/cache-manager

# Prisma
npm install prisma @prisma/client --save-dev
npm install @prisma/client

# PostgreSQL
npm install pg

# Authentication
npm install passport passport-jwt passport-local
npm install bcrypt class-validator class-transformer

# Utilities
npm install cookie-parser helmet cors morgan
npm install cloudinary multer nodemailer
```

#### 2.3 Инициализация Prisma
```bash
# Инициализировать Prisma
npx prisma init --datasource-provider postgresql

# Настроить .env
DATABASE_URL="postgresql://user:password@localhost:5432/ibr_db?schema=public"
```

---

### Этап 3: Проектирование схемы Prisma (2-3 дня)

#### 3.1 Схема данных (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== USERS & AUTHENTICATION =====

model User {
  id              String    @id @default(uuid())
  name            String
  email           String?   @unique
  mobile          String?   @unique
  avatar          String?   @default("")
  address         String?   @default("")
  verifyEmail     Boolean   @default(false)
  status          UserStatus @default(Active)
  role            Role      @default(USER)
  
  // Authentication (OTP)
  otp             String?
  otpExpires      DateTime?
  otpAttempts     Int       @default(0)
  otpMethod       OtpMethod?
  lastOtpSentAt   DateTime?
  
  // Tokens
  accessToken     String?
  refreshToken    String?
  lastLoginDate   DateTime?
  
  // Relations
  addresses       Address[]
  orders          Order[]
  cart            Cart?
  wishlist        Wishlist?
  reviews         Review[]
  notifications   Notification[]
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([mobile])
  @@index([status])
}

enum UserStatus {
  Active
  Inactive
  Suspended
}

enum Role {
  USER
  ADMIN
}

enum OtpMethod {
  email
  phone
}

// ===== PRODUCTS & CATEGORIES =====

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  
  products    Product[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([parentId])
  @@index([slug])
}

model Product {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique
  description       String
  brand             String?  @default("")
  price             Decimal  @default(0) @db.Decimal(10, 2)
  oldPrice          Decimal? @db.Decimal(10, 2)
  countInStock      Int      @default(0)
  rating            Float    @default(0)
  isFeatured        Boolean  @default(false)
  discount          Int      @default(0)
  sale              Int      @default(0)
  
  // Categorization
  categoryId        String
  category          Category @relation(fields: [categoryId], references: [id])
  
  // Variants (JSON для гибкости)
  productRam        String[] @default([])
  size              String[] @default([])
  productWeight     String[] @default([])
  
  // Images
  images            String[]
  bannerImages      String[]
  bannerTitleName   String?  @default("")
  isDisplayOnHomeBanner Boolean @default(false)
  
  // Relations
  cartItems         CartItem[]
  wishlistItems     WishlistItem[]
  reviews           Review[]
  orderItems        OrderItem[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([categoryId])
  @@index([slug])
  @@index([isFeatured])
  @@index([price])
}

// ===== SHOPPING =====

model Cart {
  id        String       @id @default(uuid())
  userId    String       @unique
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int      @default(1)
  
  // Выбранные варианты
  ram       String?
  size      String?
  weight    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productId, ram, size, weight])
  @@index([cartId])
}

model Wishlist {
  id        String         @id @default(uuid())
  userId    String         @unique
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model WishlistItem {
  id         String   @id @default(uuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([wishlistId, productId])
  @@index([wishlistId])
}

// ===== ORDERS =====

model Order {
  id              String        @id @default(uuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  orderNumber     String        @unique
  status          OrderStatus   @default(Pending)
  paymentMethod   PaymentMethod?
  paymentStatus   PaymentStatus @default(Pending)
  
  // Shipping
  shippingAddress Json
  shippingCost    Decimal       @default(0) @db.Decimal(10, 2)
  
  // Pricing
  subtotal        Decimal       @db.Decimal(10, 2)
  discount        Decimal       @default(0) @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  
  // Payment integration
  yookassaPaymentId String?
  yookassaPaid      Boolean     @default(false)
  
  items           OrderItem[]
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([orderNumber])
}

enum OrderStatus {
  Pending
  Confirmed
  Processing
  Shipped
  Delivered
  Cancelled
  Refunded
}

enum PaymentStatus {
  Pending
  Paid
  Failed
  Refunded
}

enum PaymentMethod {
  Card
  Cash
  YooKassa
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  
  // Snapshot на момент покупки
  ram       String?
  size      String?
  weight    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
}

// ===== REVIEWS =====

model Review {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  rating    Int
  text      String?
  
  // Moderation
  isApproved Boolean  @default(true)
  isFeatured Boolean  @default(false)
  
  // Social
  likes     String[] @default([]) // Array of userIds
  reports   Report[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@index([userId])
  @@index([rating])
}

model Report {
  id        String   @id @default(uuid())
  reviewId  String
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  userId    String
  reason    String
  
  createdAt DateTime @default(now())

  @@index([reviewId])
}

// ===== CONTENT MANAGEMENT =====

model Blog {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  content     String
  excerpt     String?
  image       String?
  authorId    String?
  isPublished Boolean  @default(false)
  views       Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([isPublished])
}

model Banner {
  id        String   @id @default(uuid())
  type      BannerType
  title     String?
  image     String
  link      String?
  isActive  Boolean  @default(true)
  order     Int      @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([isActive])
}

enum BannerType {
  HOME_SLIDE
  BANNER_V1
  BANNER_LIST_2
  LOGO
}

// ===== NOTIFICATIONS =====

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title     String
  message   String
  type      NotificationType
  data      Json?
  
  isRead    Boolean  @default(false)
  readAt    DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([isRead])
}

enum NotificationType {
  ORDER_UPDATE
  PROMOTION
  SYSTEM
  REVIEW_REPLY
}

model NotificationAnalytics {
  id              String   @id @default(uuid())
  notificationId  String?
  
  sentCount       Int      @default(0)
  deliveredCount  Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  
  // Device breakdown
  mobileCount     Int      @default(0)
  desktopCount    Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([notificationId])
}

// ===== ADDRESS =====

model Address {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String   // "Дом", "Работа"
  address   String
  city      String
  region    String?
  country   String   @default("Россия")
  postalCode String?
  phone     String?
  
  isDefault Boolean  @default(false)
  latitude  Decimal? @db.Decimal(10, 8)
  longitude Decimal? @db.Decimal(11, 8)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

#### 3.2 Генерация клиента Prisma
```bash
# Сгенерировать Prisma Client
npx prisma generate

# Создать первую миграцию
npx prisma migrate dev --name init

# Открыть Prisma Studio (UI для БД)
npx prisma studio
```

---

### Этап 4: Создание модулей NestJS (5-7 дней)

#### 4.1 Структура проекта

```
src/
├── main.ts                    # Точка входа
├── app.module.ts              # Корневой модуль
├── app.controller.ts
├── app.service.ts
│
├── common/                    # Общие утилиты
│   ├── decorators/
│   │   ├── user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── prisma-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── parse-uuid.pipe.ts
│   └── middleware/
│       ├── helmet.middleware.ts
│       └── logger.middleware.ts
│
├── config/                    # Конфигурация
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── mailer.config.ts
│
├── modules/                   # Функциональные модули
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── dto/
│   │   │   ├── send-otp.dto.ts
│   │   │   ├── verify-otp.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── entities/
│   │       └── token-payload.entity.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   ├── update-product.dto.ts
│   │   │   └── filters-product.dto.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   │
│   ├── categories/
│   ├── orders/
│   ├── cart/
│   ├── wishlist/
│   ├── reviews/
│   ├── addresses/
│   ├── notifications/
│   ├── content/
│   │   ├── blogs/
│   │   ├── banners/
│   │   └── slides/
│   └── payments/
│       ├── payments.module.ts
│       ├── payments.controller.ts
│       ├── payments.service.ts
│       └── strategies/
│           └── yookassa.strategy.ts
│
└── prisma/
    ├── prisma.module.ts
    ├── prisma.service.ts
    └── schema.prisma
```

#### 4.2 Пример модуля Auth

**auth.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**auth.service.ts**
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRES_IN = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { email, mobile, method } = sendOtpDto;
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + this.OTP_EXPIRES_IN);

    // Find or create user
    let user = await this.findUserByEmailOrMobile(email, mobile);
    
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          mobile,
          name: email?.split('@')[0] || 'User',
        },
      });
    }

    // Update OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires,
        otpAttempts: 0,
        otpMethod: method,
        lastOtpSentAt: new Date(),
      },
    });

    // Send OTP
    if (method === 'email' && email) {
      await this.sendOtpEmail(email, otp);
    } else if (method === 'phone' && mobile) {
      // TODO: Implement SMS sending
      console.log(`SMS OTP for ${mobile}: ${otp}`);
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRES_IN / 1000,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, mobile, otp, method } = verifyOtpDto;

    const user = await this.findUserByEmailOrMobile(email, mobile);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check OTP attempts
    if (user.otpAttempts >= this.MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded');
    }

    // Check OTP expiration
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    // Verify OTP
    if (user.otp !== otp) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: user.otpAttempts + 1 },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP and update user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
        otpAttempts: 0,
        verifyEmail: method === 'email' ? true : user.verifyEmail,
        lastLoginDate: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(updatedUser);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.RefreshToken,
      user: this.sanitizeUser(updatedUser),
    };
  }

  private async generateTokens(user: any) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        { secret: this.configService.get('JWT_SECRET') },
      ),
      this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' },
        { 
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '60d',
        },
      ),
    ]);

    // Save tokens to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { accessToken, refreshToken },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { otp, otpExpires, otpAttempts, accessToken, refreshToken, ...result } = user;
    return result;
  }

  private async findUserByEmailOrMobile(email?: string, mobile?: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          mobile ? { mobile } : {},
        ].filter(Boolean),
      },
    });
  }

  private async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Ваш код подтверждения',
      html: `
        <h1>Код подтверждения</h1>
        <p>Ваш код: <strong>${otp}</strong></p>
        <p>Действует в течение 5 минут.</p>
      `,
    });
  }
}
```

#### 4.3 Пример DTO с валидацией

**send-otp.dto.ts**
```typescript
import { IsEmail, IsMobilePhone, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum OtpMethod {
  email = 'email',
  phone = 'phone',
}

export class SendOtpDto {
  @ApiPropertyOptional({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '79991234567' })
  @IsMobilePhone('ru-RU')
  @IsOptional()
  mobile?: string;

  @ApiProperty({ enum: OtpMethod, example: 'email' })
  @IsEnum(OtpMethod)
  @IsNotEmpty()
  method: OtpMethod;

  // Validate that either email or mobile is provided based on method
  validate() {
    if (this.method === 'email' && !this.email) {
      throw new Error('Email is required for email method');
    }
    if (this.method === 'phone' && !this.mobile) {
      throw new Error('Mobile is required for phone method');
    }
  }
}
```

---

### Этап 5: Миграция данных (2-3 дня)

#### 5.1 Скрипт миграции данных

**scripts/migrate-data.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const mongoClient = new MongoClient(process.env.MONGODB_URI!);

async function migrateData() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db();

    console.log('📦 Starting data migration...');

    // 1. Migrate Users
    console.log('📦 Migrating Users...');
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          avatar: user.avatar,
          address: user.address,
          verifyEmail: user.verify_email,
          status: user.status?.toUpperCase() || 'Active',
          role: user.role?.toUpperCase() || 'USER',
          otp: user.otp,
          otpExpires: user.otpExpires,
          otpAttempts: user.otpAttempts || 0,
          otpMethod: user.otpMethod,
          lastOtpSentAt: user.lastOtpSentAt,
          accessToken: user.access_token,
          refreshToken: user.refresh_token,
          lastLoginDate: user.last_login_date,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${users.length} users`);

    // 2. Migrate Categories
    console.log('📦 Migrating Categories...');
    const categories = await db.collection('categories').find({}).toArray();
    for (const cat of categories) {
      await prisma.category.create({
        data: {
          id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          description: cat.description,
          image: cat.image,
          parentId: cat.parentId?.toString(),
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${categories.length} categories`);

    // 3. Migrate Products
    console.log('📦 Migrating Products...');
    const products = await db.collection('products').find({}).toArray();
    for (const product of products) {
      await prisma.product.create({
        data: {
          id: product._id.toString(),
          name: product.name,
          slug: product.name.toLowerCase().replace(/\s+/g, '-'),
          description: product.description,
          brand: product.brand,
          price: product.price,
          oldPrice: product.oldPrice,
          countInStock: product.countInStock,
          rating: product.rating,
          isFeatured: product.isFeatured,
          discount: product.discount,
          sale: product.sale,
          categoryId: product.categoryId?.toString() || product.catId,
          productRam: product.productRam || [],
          size: product.size || [],
          productWeight: product.productWeight || [],
          images: product.images || [],
          bannerImages: product.bannerimages || [],
          bannerTitleName: product.bannerTitleName,
          isDisplayOnHomeBanner: product.isDisplayOnHomeBanner,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${products.length} products`);

    // Continue with other collections...
    // Orders, Cart, Wishlist, Reviews, etc.

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

migrateData();
```

#### 5.2 Запуск миграции
```bash
# Установить MongoDB driver
npm install mongodb

# Запустить скрипт миграции
npx ts-node scripts/migrate-data.ts
```

---

### Этап 6: Настройка инфраструктуры (1-2 дня)

#### 6.1 Docker Compose для разработки

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ibr-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ibr_user
      POSTGRES_PASSWORD: ibr_password
      POSTGRES_DB: ibr_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ibr_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ibr-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ibr-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ibr.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

#### 6.2 Конфигурация NestJS

**app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MailerModule } from '@nestjs-modules/mailer';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContentModule } from './modules/content/content.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL', 60),
        limit: config.get('THROTTLE_LIMIT', 10),
      }),
    }),

    // Caching
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
          ttl: 300, // 5 minutes
        }),
      }),
      inject: [ConfigService],
    }),

    // Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: config.get('MAIL_SECURE', false),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM', 'noreply@ibr.local'),
        },
      }),
    }),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    WishlistModule,
    ReviewsModule,
    CategoriesModule,
    NotificationsModule,
    ContentModule,
    PaymentsModule,
  ],
})
export class AppModule {}
```

#### 6.3 Main entry point

**main.ts**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Middleware
  app.use(cookieParser());
  app.use(morgan('dev'));

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('IBR API')
    .setDescription('E-commerce API documentation')
    .setVersion('2.0')
    .addBearerAuth()
    .addCookieAuth('accessToken')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('products', 'Product catalog')
    .addTag('orders', 'Order management')
    .addTag('cart', 'Shopping cart')
    .addTag('wishlist', 'Wishlist')
    .addTag('reviews', 'Product reviews')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
```

---

### Этап 7: Тестирование (2-3 дня)

#### 7.1 Unit тесты (Jest)

**auth.service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let mailerService: MailerService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should create new user and send OTP', async () => {
      const dto = { email: 'test@example.com', method: 'email' as const };
      
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockPrisma.user.update.mockResolvedValue({});
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendOtp(dto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expiresIn');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException for invalid OTP', async () => {
      const dto = { email: 'test@example.com', otp: '123456', method: 'email' as const };
      
      mockPrisma.user.findFirst.mockResolvedValue({
        id: '1',
        otp: '654321',
        otpExpires: new Date(Date.now() + 300000),
        otpAttempts: 0,
      });

      await expect(service.verifyOtp(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

#### 7.2 E2E тесты

**auth.e2e-spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    
    // Clean database before tests
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/send-otp (POST)', () => {
    it('should send OTP for valid email', () => {
      return request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ email: 'test@example.com', method: 'email' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('expiresIn');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ email: 'invalid-email', method: 'email' })
        .expect(400);
    });
  });

  describe('/auth/verify-otp (POST)', () => {
    it('should return tokens for valid OTP', async () => {
      // First send OTP
      const sendResponse = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ email: 'verify@example.com', method: 'email' });

      // Get OTP from database (in real test, you'd mock this)
      const user = await prisma.user.findUnique({
        where: { email: 'verify@example.com' },
      });

      // Verify OTP
      return request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ 
          email: 'verify@example.com', 
          otp: user?.otp, 
          method: 'email' 
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body.user).toHaveProperty('email', 'verify@example.com');
        });
    });
  });
});
```

#### 7.3 Запуск тестов
```bash
# Unit тесты
npm run test

# Unit тесты с coverage
npm run test:cov

# E2E тесты
npm run test:e2e

# Тесты в watch режиме
npm run test:watch
```

---

### Этап 8: Деплой (1-2 дня)

#### 8.1 Dockerfile для production

**Dockerfile**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

#### 8.2 Docker Compose для production

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ibr-api
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://ibr_user:ibr_password@postgres:5432/ibr_db
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ibr-network

  postgres:
    image: postgres:16-alpine
    container_name: ibr-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ibr_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ibr_db
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ibr_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ibr-network

  redis:
    image: redis:7-alpine
    container_name: ibr-redis-prod
    restart: always
    volumes:
      - redis_prod_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ibr-network

  nginx:
    image: nginx:alpine
    container_name: ibr-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - ibr-network

volumes:
  postgres_prod_data:
  redis_prod_data:

networks:
  ibr-network:
    driver: bridge
```

#### 8.3 Nginx конфигурация

**nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server app:3000;
    }

    server {
        listen 80;
        server_name api.ibr.local;

        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /docs {
            proxy_pass http://api/docs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
    }
}
```

#### 8.4 CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/ibr-backend
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
            docker system prune -af
```

---

## 📊 Сравнение: До и После

### API Endpoints

| Характеристика | Express/MongoDB | NestJS/PostgreSQL |
|---------------|-----------------|-------------------|
| Роутинг | Ручной (`app.use()`) | Декораторы (`@Controller()`) |
| Валидация | Ручная в контроллере | Автоматическая (DTO + Pipes) |
| Обработка ошибок | Try-catch в каждом контроллере | Exception Filters (глобально) |
| Swagger | Ручное описание в JSDoc | Автоматическая из декораторов |
| Middleware | Функции | Guards, Interceptors, Pipes |
| DI | Отсутствует | Встроенный (Constructor injection) |

### Database

| Характеристика | MongoDB/Mongoose | PostgreSQL/Prisma |
|---------------|------------------|-------------------|
| Тип данных | Документный | Реляционный |
| Схема | Гибкая (schemaless) | Строгая (миграции) |
| Связи | Референсы вручную | Foreign Keys (CASCADE) |
| Транзакции | Ограниченные | Полная поддержка ACID |
| Типизация | Динамическая | Статическая (TypeScript) |
| Миграции | Отсутствуют | Prisma Migrate |
| Индексы | Ручные | Декларативные |

### Производительность

| Метрика | MongoDB | PostgreSQL | Улучшение |
|---------|---------|------------|-----------|
| Чтение (простые запросы) | Быстро | Очень быстро | +20-30% |
| Чтение (сложные JOIN) | Медленно (aggregation) | Быстро | +200-300% |
| Запись | Быстро | Быстро | ≈ |
| Транзакции | Ограниченные | Полные | Значительно лучше |
| Индексы | B-tree | B-tree, Hash, GiST, GIN | Больше возможностей |

---

## 🎯 Рекомендации по улучшению

### 1. CQRS Pattern для сложных операций

```typescript
// commands/create-order.command.ts
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItemDto[],
    public readonly shippingAddress: AddressDto,
  ) {}
}

// handlers/create-order.handler.ts
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private prisma: PrismaService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      // Create order with items in transaction
    });
  }
}
```

### 2. Event-Driven Architecture

```typescript
// events/order-created.event.ts
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly total: number,
  ) {}
}

// handlers/order-created.handler.ts
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(
    private mailerService: MailerService,
    private notificationService: NotificationService,
  ) {}

  handle(event: OrderCreatedEvent) {
    // Send confirmation email
    // Create notification
    // Update analytics
  }
}
```

### 3. API Versioning

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// products.controller.ts
@Controller({ version: '1', path: 'products' })
export class ProductsControllerV1 {}

@Controller({ version: '2', path: 'products' })
export class ProductsControllerV2 {}
```

### 4. GraphQL (опционально)

```typescript
// products/products.resolver.ts
@Resolver(() => Product)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Product])
  async products(
    @Args('filters', { type: () => ProductFiltersInput }) filters: ProductFiltersInput,
  ): Promise<Product[]> {
    return this.productsService.findAll(filters);
  }

  @Mutation(() => Product)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<Product> {
    return this.productsService.create(input);
  }
}
```

---

## ⚠️ Потенциальные проблемы и решения

### 1. Потеря гибкости схемы

**Проблема**: MongoDB позволял хранить произвольные поля

**Решение**: Использовать JSON/JSONB типы в PostgreSQL для гибких данных

```prisma
model Product {
  // Строгие поля
  name          String
  price         Decimal
  
  // Гибкие атрибуты
  attributes    Json @default("{}")
  metadata      Json @default("{}")
}
```

### 2. Миграция вложенных структур

**Проблема**: Вложенные документы MongoDB сложно маппить на реляционную схему

**Решение**: 
- Нормализовать данные (разбить на связанные таблицы)
- Использовать JSONB для глубоко вложенных структур
- Применить паттерн EAV (Entity-Attribute-Value) для динамических атрибутов

### 3. Дowntime при миграции

**Решение**:
1. Запустить новый API параллельно со старым
2. Настроить dual-write (запись в обе БД)
3. Постепенно переключать трафик (canary deployment)
4. После полной миграции отключить старый API

### 4. Обратная совместимость API

**Решение**:
- Сохранить те же endpoint'ы и форматы ответов
- Использовать API versioning для breaking changes
- Документировать изменения в Swagger

---

## 📅 Временная оценка

| Этап | Длительность | Приоритет |
|------|-------------|-----------|
| 1. Подготовка | 1-2 дня | Критичный |
| 2. Инициализация NestJS | 1 день | Критичный |
| 3. Схема Prisma | 2-3 дня | Критичный |
| 4. Создание модулей | 5-7 дней | Критичный |
| 5. Миграция данных | 2-3 дня | Критичный |
| 6. Инфраструктура | 1-2 дня | Высокий |
| 7. Тестирование | 2-3 дня | Критичный |
| 8. Деплой | 1-2 дня | Высокий |
| **Итого** | **15-23 дня** | |

**Рекомендуемый timeline**: 3-4 недели с учетом буфера на непредвиденные проблемы

---

## ✅ Чеклист готовности к продакшену

- [ ] Все эндпоинты перенесены и протестированы
- [ ] Данные мигрированы и проверены
- [ ] Unit тесты покрывают >80% кода
- [ ] E2E тесты проходят успешно
- [ ] Настроен CI/CD pipeline
- [ ] Настроен мониторинг и логирование
- [ ] Настроено резервное копирование БД
- [ ] Проведен load testing
- [ ] Документация API актуальна
- [ ] Настроены алерты на ошибки

---

## 📚 Дополнительные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS + Prisma Example](https://github.com/nestjs/nest/tree/master/sample/22-graphql-prisma)
- [Migration Best Practices](https://www.prisma.io/docs/guides/database/migrate-to-prisma)

---

## 🎉 Заключение

Миграция на NestJS/PostgreSQL/Prisma даст:

1. **Типобезопасность** на всех уровнях
2. **Надёжность** данных благодаря ACID
3. **Производительность** сложных запросов
4. **Масштабируемость** архитектуры
5. **Поддерживаемость** кодовой базы
6. **Развитие** команды (современные практики)

Это инвестиция в будущее проекта, которая окупится уменьшением багов, ускорением разработки и упрощением поддержки.
