# IBR Server - Backend API

## Project Overview

**IBR Server** is a Node.js/Express backend API for an e-commerce platform. The server provides RESTful endpoints for user management, product catalog, shopping cart, orders, payments, notifications, and content management (banners, blogs, etc.).

### Key Features

- **Authentication**: JWT-based authentication with access/refresh tokens, OTP login (email/phone), Google OAuth
- **E-commerce**: Products, categories, cart, wishlist, orders, reviews
- **Payments**: YooKassa integration
- **Content Management**: Banners, home slides, blogs, logos
- **Notifications**: Push notifications with analytics
- **File Upload**: Cloudinary integration for image storage
- **Security**: Helmet, CORS, rate limiting, anti-spam middleware

### Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), Google OAuth
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Deployment**: Railway, Render-compatible

---

## Project Structure

```
server/
├── config/              # Configuration files
│   └── connectDb.js     # MongoDB connection setup
├── constants/           # Application constants
├── controllers/         # Business logic (15 controllers)
│   ├── user.controller.js
│   ├── product.controller.js
│   ├── order.controller.js
│   ├── cart.controller.js
│   ├── wishlist.controller.js
│   ├── category.controller.js
│   ├── blog.controller.js
│   ├── address.controller.js
│   ├── banner*.controller.js
│   ├── notification*.controller.js
│   └── ...
├── middlewares/         # Express middlewares
│   ├── auth.js          # JWT authentication
│   ├── dbCheck.js       # Database connection check
│   ├── rateLimiter.js   # Rate limiting (OTP, API, addresses)
│   ├── antiSpam.js      # Anti-spam protection
│   └── multer.js        # File upload handling
├── models/              # Mongoose schemas (18 models)
│   ├── user.model.js
│   ├── product.model.js
│   ├── order.model.js
│   ├── cart.model.js
│   ├── wishlist.model.js
│   ├── category.model.js
│   ├── blog.model.js
│   ├── address.model.js
│   ├── notification.model.js
│   └── ...
├── route/               # API routes (16 route files)
│   ├── user.route.js
│   ├── product.route.js
│   ├── order.route.js
│   ├── cart.route.js
│   ├── wishlist.route.js
│   ├── category.route.js
│   ├── blog.route.js
│   ├── payment.route.js
│   └── ...
├── scripts/             # Utility scripts
│   └── check-syntax.js  # Syntax validation script
├── seeds/               # Database seeding
├── utils/               # Helper utilities
│   ├── cookie-config.js # Centralized cookie configuration
│   ├── generatedAccessToken.js
│   ├── generatedRefreshToken.js
│   ├── orderEmailTemplate.js
│   ├── verifyEmailTemplate.js
│   └── addressValidation.js
├── uploads/             # Local file uploads (temporary)
├── index.js             # Application entry point
├── seed.js              # Database seeder entry
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── railway.json         # Railway deployment config
```

---

## Building and Running

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/ibr

# JWT Secrets (generate secure random strings)
JSON_WEB_TOKEN_SECRET_KEY=""
SECRET_KEY_ACCESS_TOKEN=""
SECRET_KEY_REFRESH_TOKEN=""

# Email (for OTP and notifications)
EMAIL=your-email@example.com
EMAIL_PASS=your-app-password

# Cloudinary (for image storage)
cloudinary_Config_Cloud_Name=""
cloudinary_Config_api_key=""
cloudinary_Config_api_secret=""

# YooKassa (payments)
YOOKASSA_SHOP_ID=""
YOOKASSA_SECRET_KEY=""

# Optional: Cross-origin configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### Development

```bash
# Start development server with auto-reload
npm run dev
```

### Production

```bash
# Start production server
npm start
```

### Database Seeding

```bash
# Seed the database
npm run seed
# or
npm run seed:full
```

---

## API Documentation

After starting the server, access:

- **Swagger UI**: `http://localhost:8000/docs`
- **OpenAPI JSON**: `http://localhost:8000/docs/openapi.json`
- **Download OpenAPI**: `http://localhost:8000/docs/openapi.json?download=1`

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/user` | User authentication, profile, reviews, OTP |
| `/api/product` | Product catalog, search, filters |
| `/api/category` | Category management |
| `/api/cart` | Shopping cart operations |
| `/api/wishlist` | Wishlist management |
| `/api/order` | Order creation and history |
| `/api/address` | User addresses |
| `/api/payment/yookassa` | Payment processing |
| `/api/blog` | Blog posts |
| `/api/bannerV1`, `/api/bannerList2` | Banner management |
| `/api/homeSlides` | Homepage slides |
| `/api/notification` | Push notifications |
| `/api/notification-analytics` | Notification analytics |
| `/api/logo` | Logo management |

---

## Code Quality

### Available Scripts

```bash
# ESLint check
npm run lint

# Auto-fix ESLint errors
npm run lint:fix

# Syntax check (braces, parentheses, brackets balance)
npm run jscheck

# Full check (ESLint + syntax)
npm run check
```

### ESLint Configuration

The project uses ESLint v9 with the following rules:
- ES2022 syntax, ES modules
- Node.js globals enabled
- `no-unused-vars` with `^_` prefix exception
- `no-console` allows `warn`, `error`, `info`
- `prefer-const`, `no-var` enforced
- `no-use-before-define` for functions disabled, classes/variables enabled

### Development Conventions

- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Naming**: camelCase for variables/functions, PascalCase for models/classes
- **Error Handling**: Try-catch in controllers, proper HTTP status codes
- **Security**: JWT verification in `auth` middleware, rate limiting on sensitive endpoints
- **Logging**: Console logging with emoji prefixes for different contexts

---

## Key Architecture Patterns

### Authentication Flow

1. **OTP Login** (primary): User requests OTP → receives code → verifies → gets tokens
2. **Google OAuth**: User provides Google credential → backend verifies → returns tokens
3. **Token Management**: 
   - Access token: 24 hours (cookie + header support)
   - Refresh token: 60 days (cookie)
   - Dynamic `sameSite` cookie configuration based on environment

### Middleware Stack

```
Request → CORS → Helmet → JSON → CookieParser → DB Check → Route-specific middleware → Controller
```

### Rate Limiting

- **OTP Send**: 5 requests / 15 min
- **OTP Verify**: 10 attempts / 5 min
- **OTP Resend**: 3 requests / 15 min
- **Address Operations**: 20 operations / 15 min (per user)
- **Refresh Token**: 30 requests / 15 min
- **General API**: 100 requests / 15 min

*Rate limiting is disabled in development mode (`NODE_ENV !== 'production'`)*

### Database Connection

- Graceful connection handling with timeout configurations
- Connection state middleware on all `/api` routes
- Server startup blocked until DB connection succeeds
- Proper shutdown handling with SIGINT

---

## Testing

*No formal test suite configured. Manual testing via Swagger UI or tools like Postman is recommended.*

---

## Deployment

### Railway

The project includes `railway.json` for automatic deployment:

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables for Production

Ensure all variables from `.env.example` are set in your deployment platform's environment settings.

---

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable origin whitelist with credentials support
- **JWT**: Signature verification, expiration handling
- **Rate Limiting**: Brute-force and DoS protection
- **Anti-Spam**: Request throttling on sensitive endpoints
- **Cookie Security**: `httpOnly`, dynamic `sameSite`, `secure` in production
- **Input Validation**: Mongoose schema validation, custom validators

---

## Common Issues & Solutions

### MongoDB Connection Issues

If connection fails, check:
1. `MONGODB_URI` is correct
2. IP is whitelisted in MongoDB Atlas
3. Network/firewall settings
4. DNS configuration

### Cookie/Logout Issues

The server validates cookie configuration on startup. Check logs for:
```
✅ [CookieConfig] All cookie options validated successfully
```
If validation fails, check `FRONTEND_URL` and `BACKEND_URL` environment variables.

### CORS Issues

- Development: All origins allowed
- Production: Configure `FRONTEND_URL` and ensure origin matches

---

## Additional Notes

- **No Passwords**: The system uses OTP and Google OAuth only (no password-based auth)
- **Sparse Indexes**: Email and mobile fields use sparse unique indexes to allow null values
- **Cloudinary**: Images are uploaded to Cloudinary; local `uploads/` is temporary only
- **Swagger**: All routes include JSDoc `@swagger` annotations for auto-generated documentation
